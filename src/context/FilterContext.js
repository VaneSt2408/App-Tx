import React, { createContext, useState, useContext } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
    const [filters, setFilters] = useState({
        categories: [],
        priceRange: { min: '', max: '' },
        location: ''
    });

    const applyFilters = (newFilters) => {
        setFilters(newFilters);
    };

    const clearFilters = () => {
        setFilters({
            categories: [],
            priceRange: { min: '', max: '' },
            location: ''
        });
    };

    return (
        <FilterContext.Provider value={{ filters, applyFilters, clearFilters }}>
            {children}
        </FilterContext.Provider>
    );
}; 
export const useFilter = () => useContext(FilterContext);

