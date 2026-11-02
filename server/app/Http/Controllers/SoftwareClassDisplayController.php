<?php

namespace App\Http\Controllers;

use App\Models\ImportReplacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SoftwareClassDisplayController extends Controller
{
    public function softwareClasses(): JsonResponse
    {
        $softwareClasses = Cache::remember('software_classes:replaceable', now()->addMinutes(30), function () {
            return ImportReplacement::query()
                ->whereNotNull('software_class')
                ->replaceableByPartners()
                ->distinct()
                ->pluck('software_class')
                ->flatMap(function (?string $softwareClass): array {
                    return collect(explode('|', $softwareClass ?? ''))
                        ->map(fn (string $class) => trim($class))
                        ->filter()
                        ->all();
                })
                ->unique()
                ->sort()
                ->values();
        });

        return response()->json($softwareClasses);
    }
}
