<?php

namespace App\Http\Controllers;

use App\Models\ImportReplacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
class AutocompleteController extends Controller
{
    public function importReplacements(Request $request): JsonResponse
    {

        $query = $this->normalizeQuery($request->query('query', ''));
        $softwareClasses = $this->normalizeSoftwareClasses($request->query('software_classes', []));

        if (mb_strlen($query) < 2) {
            return response()->json([]);
        }

        $cacheSoftwareClasses = $softwareClasses;
        sort($cacheSoftwareClasses);

        $cacheKey = 'autocomplete_import_replacements:'.sha1(json_encode([
            'query' => mb_strtolower($query, 'UTF-8'),
            'software_classes' => $cacheSoftwareClasses,
        ]));

        $matches = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($query, $softwareClasses): Collection {
            $containsLike = '%'.$this->escapeLike($query).'%';

            $containsMatches = $this->autocompleteQuery($softwareClasses)
                ->where('foreign_product_name', 'LIKE', $containsLike)
                ->orderByRaw('LOCATE(?, foreign_product_name)', [$query])
                ->orderByRaw('CHAR_LENGTH(foreign_product_name)')
                ->orderBy('foreign_product_name')
                ->limit(5)
                ->pluck('foreign_product_name');

            return $this->formatMatches($containsMatches);
        });

        return response()->json($matches);

    }

    private function normalizeQuery(mixed $query): string
    {
        return trim(preg_replace('/\s+/u', ' ', (string) $query));
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
            ->map(fn (mixed $softwareClass) => $this->normalizeQuery($softwareClass))
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

    private function autocompleteQuery(array $softwareClasses)
    {
        return ImportReplacement::query()
            ->select('foreign_product_name')
            ->replaceableByPartners()
            ->when($softwareClasses !== [], function ($query) use ($softwareClasses): void {
                $query->where(function ($query) use ($softwareClasses): void {
                    foreach ($softwareClasses as $softwareClass) {
                        $query->orWhereRaw(
                            'CONCAT("|", REPLACE(software_class, " | ", "|"), "|") LIKE ? ESCAPE "\\\\"',
                            ['%|'.$this->escapeLike($softwareClass).'|%']
                        );
                    }
                });
            })
            ->distinct();
    }

    private function formatMatches(Collection $matches): Collection
    {
        return $matches
            ->unique()
            ->take(5)
            ->map(fn (string $name) => [
                'label' => $name,
                'value' => $name,
            ])
            ->values();
    }
}
