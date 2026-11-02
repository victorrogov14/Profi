<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class ImportReplacement extends Model
{
    protected $fillable = [
        'foreign_product_name',
        'domestic_product_name',
        'registry_number',
        'software_classes',
    ];
    protected $casts = [
        'software_classes' => 'array',
    ];

    public function importBatch(){

        return $this->belongsTo(ImportBatch::class);

    }
    
    public function partnerReplacements(){

        return $this->hasMany(PartnerReplacement::class, 'registry_number', 'registry_number');

    }

    public function scopeReplaceableByPartners($query){

        return $query->whereHas('partnerReplacements', function ($q): void {
            $q->whereNotNull('partner_organisation_id');
        });
        
    }
}
