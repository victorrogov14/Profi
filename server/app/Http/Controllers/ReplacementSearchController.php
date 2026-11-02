<?php

namespace App\Http\Controllers;

use App\Models\ImportReplacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReplacementSearchController extends Controller
{
    public function withPartnerReplacementsBySoftwareClass(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'software_class' => ['required', 'string', 'max:255'],
        ]);

        $softwareClass = $this->normalizeQuery($validated['software_class']);

        if ($softwareClass === '') {
            return response()->json([]);
        }

        $cacheKey = 'partner_replacements_by_software_class:'.sha1($softwareClass);

        $matches = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($softwareClass) {
            return ImportReplacement::query()
                ->select([
                    'foreign_product_name',
                    'domestic_product_name',
                    'registry_number',
                    'software_class',
                ])
                ->whereNotNull('software_class')
                ->where($this->softwareClassFilter($softwareClass))
                ->whereHas('partnerReplacements')
                ->orderBy('foreign_product_name')
                ->orderBy('domestic_product_name')
                ->get()
                ->map(fn (ImportReplacement $replacement): array => [
                    'foreign_product_name' => $replacement->foreign_product_name,
                    'domestic_product_name' => $replacement->domestic_product_name,
                    'registry_number' => $replacement->registry_number,
                    'software_class' => $replacement->software_class,
                ])
                ->values();
        });

        return response()->json($matches);
    }

    public function partnerReplacementsByForeignProductName(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'foreign_product_name' => ['required', 'string', 'max:500'],
        ]);

        $foreignProductName = $this->normalizeQuery($validated['foreign_product_name']);
        $softwareClasses = $this->normalizeSoftwareClasses($request->query('software_classes', []));

        if ($foreignProductName === '') {
            return response()->json([]);
        }

        $cacheSoftwareClasses = $softwareClasses;
        sort($cacheSoftwareClasses);

        $cacheKey = 'partner_replacements_by_foreign_product:'.sha1(json_encode([
            'foreign_product_name' => $foreignProductName,
            'software_classes' => $cacheSoftwareClasses,
        ]));

        $matches = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($foreignProductName, $softwareClasses) {
            $importReplacements = ImportReplacement::query()
                ->select([
                    'id',
                    'foreign_product_name',
                    'registry_number',
                    'software_class',
                ])
                ->with([
                    'partnerReplacements' => function ($query): void {
                        $query->select([
                            'id',
                            'partner_product_name',
                            'partner_organisation_name',
                            'registry_number',
                        ]);
                    },
                ])
                ->where('foreign_product_name', $foreignProductName)
                ->when($softwareClasses !== [], fn ($query) => $this->applySoftwareClassFilters($query, $softwareClasses))
                ->whereHas('partnerReplacements')
                ->orderBy('registry_number')
                ->get();

            $rows = $importReplacements
                ->flatMap(function (ImportReplacement $importReplacement): array {
                    return $importReplacement->partnerReplacements
                        ->map(fn ($partnerReplacement): array => [
                            'partner_product_name' => $partnerReplacement->partner_product_name,
                            'partner_organisation_name' => $partnerReplacement->partner_organisation_name,
                            'registry_number' => $partnerReplacement->registry_number,
                            'software_class' => $importReplacement->software_class,
                        ])
                        ->all();
                })
                ->values();

            if ($rows->isEmpty()) {
                return $rows;
            }

            $registryNumbers = $rows
                ->pluck('registry_number')
                ->filter()
                ->unique()
                ->values()
                ->all();

            $replacesByRegistryNumber = ImportReplacement::query()
                ->select(['foreign_product_name', 'registry_number'])
                ->whereIn('registry_number', $registryNumbers)
                ->when($softwareClasses !== [], fn ($query) => $this->applySoftwareClassFilters($query, $softwareClasses))
                ->get()
                ->groupBy('registry_number')
                ->map(fn ($items) => $items
                    ->pluck('foreign_product_name')
                    ->filter()
                    ->unique()
                    ->sort()
                    ->values()
                    ->all()
                );

            return $rows
                ->map(function (array $row) use ($replacesByRegistryNumber): array {
                    $row['replaces'] = $replacesByRegistryNumber->get($row['registry_number'], []);

                    return $row;
                })
                ->values();
        });

        return response()->json($matches);
    }

    private function applySoftwareClassFilters($query, array $softwareClasses): void
    {
        $query->where(function ($query) use ($softwareClasses): void {
            foreach ($softwareClasses as $softwareClass) {
                $query->orWhere($this->softwareClassFilter($softwareClass));
            }
        });
    }

    private function softwareClassFilter(string $softwareClass): \Closure
    {
        return function ($query) use ($softwareClass): void {
            $query->whereRaw(
                'CONCAT("|", REPLACE(software_class, " | ", "|"), "|") LIKE ? ESCAPE "\\\\"',
                ['%|'.$this->escapeLike($softwareClass).'|%']
            );
        };
    }

    private function normalizeQuery(string $query): string
    {
        return trim(preg_replace('/\s+/u', ' ', $query));
    }

    private function normalizeSoftwareClasses(mixed $softwareClasses): array
    {
        if (is_string($softwareClasses)) {
            $softwareClasses = explode(',', $softwareClasses);
        }

        if (! is_array($softwareClasses)) {
            return [];
        }

        return collect($softwareClasses)
            ->map(fn (mixed $softwareClass) => $this->normalizeQuery((string) $softwareClass))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function escapeLike(string $value): string
    {
        return str_replace(
            ['\\', '%', '_'],
            ['\\\\', '\\%', '\\_'],
            $value
        );
    }
}
