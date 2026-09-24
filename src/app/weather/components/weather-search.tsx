"use client";

import { useState, type FormEvent } from "react";

interface WeatherSearchProps {
  onSearch: (city: string | null) => void;
  isLoading: boolean;
  currentCity?: string;
}

const QUICK_CITIES = ["Delhi", "London", "Tokyo", "Mumbai", "New York"];

/**
 * Prominent search surface for the primary weather application.
 * Keyboard-friendly, accessible, mobile-friendly.
 */
export function WeatherSearch({ onSearch, isLoading, currentCity }: WeatherSearchProps) {
  const [inputVal, setInputVal] = useState(currentCity ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <div className="w-full space-y-3" role="search">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        {/* Search icon */}
        <div className="absolute left-4 pointer-events-none text-white/30" aria-hidden="true">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <label htmlFor="city-search-input" className="sr-only">
          Search city or place
        </label>
        <input
          type="search"
          id="city-search-input"
          name="city"
          autoComplete="off"
          aria-label="Search city or place"
          placeholder="Search city or place..."
          value={inputVal}
          disabled={isLoading}
          onChange={(e) => setInputVal(e.target.value)}
          className="
            w-full pl-11 pr-28 py-3.5
            bg-white/[0.04] border border-white/10 rounded-xl
            text-white placeholder-white/30 text-sm
            focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20
            transition-all duration-150
            disabled:opacity-50
          "
        />

        {/* Action buttons */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {inputVal && !isLoading && (
            <button
              type="button"
              onClick={() => setInputVal("")}
              className="p-1.5 text-white/30 hover:text-white/70 rounded-lg transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            aria-label="Search weather"
            className="
              px-3.5 py-1.5 rounded-lg text-xs font-medium
              bg-white text-[#090a0f]
              hover:bg-white/90
              disabled:bg-white/10 disabled:text-white/30
              transition-colors flex items-center gap-1.5
            "
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Loading</span>
              </>
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </form>

      {/* Popular city pills */}
      <div className="flex flex-wrap items-center gap-2" aria-label="Popular cities">
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setInputVal(city);
              onSearch(city);
            }}
            className="
              px-3 py-1 rounded-full text-xs
              text-white/50 hover:text-white/80
              border border-white/8 hover:border-white/15
              bg-transparent hover:bg-white/[0.04]
              transition-colors disabled:opacity-40
            "
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
