import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductCard } from '../components/ui/ProductCard/ProductCard';
import { ConsultationForm } from '../components/ui/ConsultationForm/ConsultationForm';
import { ResultsSearchBar } from '../components/ui/ResultsSearchBar/ResultsSearchBar';
import { Header } from '../components/layout/Header/Header';
import { Footer } from '../components/layout/Footer/Footer';
import {fetchSearchResults, fetchSearchResultsByClasses} from '../services/partnerReplacementsService';
import type { EnrichedResult } from '../services/partnerReplacementsService';
import './ResultsPage.css';

interface SelectedProduct {
    partnerProductName: string;
}

export const ResultsPage = () => {
    const location = useLocation();
    const initialQuery = location.state?.query || '';
    const initialClasses = location.state?.softwareClasses || [];

    const [query, setQuery] = useState(
        initialQuery.trim() ? initialQuery : initialClasses.join(', ')
    );

    const MAX_CLASSES_SHOWN = 2;

    const formatQueryLabel = (q: string, classes: string[]): string => {
        if (q.trim()) return q;
        if (classes.length <= MAX_CLASSES_SHOWN) return classes.join(', ');
        return `${classes.slice(0, MAX_CLASSES_SHOWN).join(', ')} и другие`;
    };

    const [results, setResults] = useState<EnrichedResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

    const runSearch = useCallback(async (searchQuery: string, softwareClasses: string[] = []) => {
        const hasQuery = searchQuery.trim().length > 0;
        const hasClasses = softwareClasses.length > 0;

        if (!hasQuery && !hasClasses) return; // нечего искать

        setIsLoading(true);
        setError(null);
        try {
            const data = hasQuery
                ? await fetchSearchResults(searchQuery, softwareClasses)
                : await fetchSearchResultsByClasses(softwareClasses);
            setResults(data);
        } catch (err) {
            console.error(err);
            setError('Не удалось загрузить результаты. Попробуйте ещё раз.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        runSearch(initialQuery, initialClasses);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (newQuery: string, softwareClasses: string[] = []) => {
        setQuery(formatQueryLabel(newQuery, softwareClasses));
        setSelectedProduct(null);
        runSearch(newQuery, softwareClasses);
    };

    const groupedResults = Array.from(
        results.reduce((map, item) => {
            const list = map.get(item.softwareClass) ?? [];
            list.push(item);
            map.set(item.softwareClass, list);
            return map;
        }, new Map<string, EnrichedResult[]>())
    );

    const handleConsultationClick = (partnerProductName: string) => {
        setSelectedProduct({ partnerProductName });
        document.getElementById('consultation-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="results-page">
            <Header showShadow={false} showHomeButton={true} />

            <div className="results-page__blue-header">
                <div className="results-page__blue-container">
                    <h1 className="results-page__main-title">
                        Результаты поиска решений для:<br />
                        <span className="results-page__main-title--underline">{query}</span>
                    </h1>

                    <div className="results-page__search-wrapper">
                        <ResultsSearchBar
                            initialSelectedTypes={initialClasses}
                            onSearch={handleSearch}
                            onTypeChange={() => {}}
                        />
                    </div>
                </div>
            </div>

            <div className="results-page__main">
                {isLoading && <p>Загрузка...</p>}
                {error && <p>{error}</p>}
                {!isLoading && !error && groupedResults.length === 0 && (
                    <div className="results-page__empty">
                        <h2 className="results-page__empty-title">Не найдены подходящие решения</h2>
                        <p className="results-page__empty-subtitle">
                            Оставьте заявку, и мы подберем возможные варианты импортозамещения
                        </p>
                    </div>
                )}

                {groupedResults.map(([className, items]) => (
                    <div key={className} className="results-page__group">
                        <h2 className="results-page__group-title">{className}</h2>
                        <div className="results-page__grid">
                            {items.map((item) => (
                                <ProductCard
                                    key={`${item.partnerProductName}-${item.registryNumber}`}
                                    typeLabel={item.softwareClass}
                                    title={item.partnerProductName}
                                    registryNumber={item.registryNumber}
                                    replaces={item.replaces}
                                    onConsultationClick={() => handleConsultationClick(item.partnerProductName)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                <div className="results-page__form-wrapper">
                    <ConsultationForm
                        foreignProductName={query}
                        partnerReplacement={selectedProduct?.partnerProductName ?? ''}
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
};
