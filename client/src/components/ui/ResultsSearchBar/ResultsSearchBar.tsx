import React, { useState, useRef, useEffect } from 'react';
import './ResultsSearchBar.css';
import { fetchSoftwareClasses } from '../../../services/softwareClassesService';
import { useAutocomplete } from '../../../hooks/useAutocomplete';

interface ResultsSearchBarProps {
    initialSelectedTypes?: string[];
    initialSearchSubmitted?: boolean;
    onSearch?: (query: string, selectedTypes: string[]) => void;
    onTypeChange?: (types: string[]) => void;
}

export const ResultsSearchBar: React.FC<ResultsSearchBarProps> = ({
                                                                      initialSelectedTypes = [],
                                                                      initialSearchSubmitted = false,
                                                                      onSearch,
                                                                      onTypeChange
                                                                  }) => {
    const [selectedTypes, setSelectedTypes] = useState<string[]>(initialSelectedTypes);
    const { query, suggestions, handleQueryChange } = useAutocomplete(300, selectedTypes);

    const [softwareTypes, setSoftwareTypes] = useState<string[]>([]);
    const [sortedTypes, setSortedTypes] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isTypeSearchActive, setIsTypeSearchActive] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchSubmitted, setSearchSubmitted] = useState(initialSearchSubmitted);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchSoftwareClasses(controller.signal)
            .then(setSoftwareTypes)
            .catch((err) => {
                if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                    console.error('Не удалось загрузить типы ПО:', err);
                }
            });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        onTypeChange?.(selectedTypes);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTypes]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsTypeSearchActive(false);
                setTypeFilter('');
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Фикс №3: сортировка (выбранные наверх) только при ОТКРЫТИИ дропдауна,
    // а не при каждом клике по чекбоксу — список не "прыгает" под пальцем
    useEffect(() => {
        if (isOpen) {
            const sorted = [...softwareTypes].sort((a, b) => {
                const aSelected = selectedTypes.includes(a);
                const bSelected = selectedTypes.includes(b);
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
            });
            setSortedTypes(sorted);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, softwareTypes]);

    const handleArrowClick = () => {
        setIsOpen(prev => !prev);
        setIsTypeSearchActive(false);
        setShowSuggestions(false);
        setTypeFilter('');
    };

    const handleTypeFieldFocus = () => {
        setIsOpen(true);
        setIsTypeSearchActive(true);
        setShowSuggestions(false);
    };

    const handleCheckboxChange = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleResetTypes = () => {
        setSelectedTypes([]);
    };

    const handleSearch = () => {
        setShowSuggestions(false);
        setSearchSubmitted(true);
        if (query.trim() || selectedTypes.length > 0) {
            onSearch?.(query, selectedTypes);
            handleQueryChange('');
        }
    };

    const handleInputChange = (value: string) => {
        setSearchSubmitted(false);
        handleQueryChange(value);
        setShowSuggestions(true);
    };

    const handleInputFocus = () => {
        if (suggestions.length > 0) setShowSuggestions(true);
    };

    const handleSuggestionClick = (value: string) => {
        handleQueryChange(value);
        setShowSuggestions(false);
        onSearch?.(value, selectedTypes);
        handleQueryChange('');
    };

    const filteredTypes = sortedTypes.filter(type =>
        type.toLowerCase().includes(typeFilter.toLowerCase())
    );

    return (
        <div className="results-search-bar__wrapper" ref={wrapperRef}>
            <div className="results-search-bar__input-wrapper">
                <input
                    type="text"
                    className="results-search-bar__input"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={handleInputFocus}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={searchSubmitted ? '' : 'Введите название ПО...'}
                />

                {showSuggestions && suggestions.length > 0 && (
                    <div className="results-search-bar__suggestions">
                        {suggestions.map((item) => (
                            <div
                                key={item.value}
                                className="results-search-bar__suggestion-item"
                                onClick={() => handleSuggestionClick(item.value)}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="results-search-bar__dropdown-wrapper">
                <div
                    className={`results-search-bar__dropdown-trigger ${isOpen ? 'open' : ''}`}
                >
                    <svg className="results-search-bar__dropdown-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21L16.65 16.65" />
                    </svg>

                    <input
                        type="text"
                        className="results-search-bar__dropdown-search-input"
                        placeholder={isTypeSearchActive ? '' : 'Тип ПО'}
                        value={isOpen ? typeFilter : (selectedTypes.length > 0 ? `Тип ПО: ${selectedTypes.length}` : '')}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        onFocus={handleTypeFieldFocus}
                        onClick={handleTypeFieldFocus}
                        readOnly={!isTypeSearchActive}
                    />
                    <button
                        type="button"
                        className="results-search-bar__dropdown-arrow"
                        aria-label={isOpen ? 'Закрыть список типов ПО' : 'Открыть список типов ПО'}
                        aria-expanded={isOpen}
                        onClick={handleArrowClick}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d={isOpen ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
                        </svg>
                    </button>
                </div>

                {isOpen && (
                    <div className="results-search-bar__dropdown-panel">
                    <div className="results-search-bar__dropdown-menu open">
                        <div className="results-search-bar__dropdown-list">
                            {filteredTypes.map((type) => (
                                <label key={type} className="results-search-bar__dropdown-item">
                                    <span className="results-search-bar__dropdown-text">{type}</span>
                                    <input
                                        type="checkbox"
                                        className="results-search-bar__dropdown-checkbox"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => handleCheckboxChange(type)}
                                    />
                                </label>
                            ))}
                        </div>

                    </div>
                        {selectedTypes.length > 0 && (
                            <button
                                type="button"
                                className="results-search-bar__dropdown-reset"
                                onClick={handleResetTypes}
                            >
                                Сбросить всё
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <button className="results-search-bar__button" onClick={handleSearch}>
                Найти решения
            </button>
        </div>
    );
};
