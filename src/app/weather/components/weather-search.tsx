"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { SearchSuggestion } from "@/app/api/weather/search/route";

interface WeatherSearchProps {
  onSearch: (city: string | null) => void;
  isLoading: boolean;
  currentCity?: string;
  userCoords?: { latitude: number; longitude: number; country?: string } | null;
}

const QUICK_CITIES = ["Delhi", "London", "Tokyo", "Mumbai", "New York"];

/**
 * WeatherSearch with live location autocomplete index (Apple/Google Weather style).
 * Handles debounced suggestion fetching, keyboard navigation, and smart location relevance ranking.
 */
export function WeatherSearch({ onSearch, isLoading, currentCity, userCoords }: WeatherSearchProps) {
  const [inputVal, setInputVal] = useState(currentCity ?? "");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce (only triggers async fetch for query >= 2 chars)
  useEffect(() => {
    const trimmed = inputVal.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (userCoords?.latitude && userCoords?.longitude) {
          params.set("lat", String(userCoords.latitude));
          params.set("lon", String(userCoords.longitude));
        }
        if (userCoords?.country) {
          params.set("country", userCoords.country);
        }

        const res = await fetch(`/api/weather/search?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as { suggestions?: SearchSuggestion[] };
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setIsOpen(true);
            setSelectedIndex(-1);
          } else {
            setSuggestions([]);
            setIsOpen(false);
          }
        }
      } catch {
        // Silently swallow fetch errors for suggestions
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [inputVal, userCoords]);

  const handleSelect = (item: SearchSuggestion) => {
    setInputVal(item.name);
    setIsOpen(false);
    setSuggestions([]);
    onSearch(item.name);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
      return;
    }
    const trimmed = inputVal.trim();
    if (trimmed) {
      setIsOpen(false);
      onSearch(trimmed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    }
  };

  const handleClear = () => {
    setInputVal("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="w-full relative space-y-3" role="search">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        {/* Search magnifying icon */}
        <div className="absolute left-4 pointer-events-none text-white/40" aria-hidden="true">
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
          Search city or location
        </label>
        <input
          ref={inputRef}
          type="text"
          id="city-search-input"
          name="city"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="location-suggestions-list"
          aria-autocomplete="list"
          aria-label="Search city or location"
          placeholder="Search city (e.g. Rudrapur, London, Tokyo)..."
          value={inputVal}
          disabled={isLoading}
          onChange={(e) => {
            const nextVal = e.target.value;
            setInputVal(nextVal);
            if (nextVal.trim().length < 2) {
              setSuggestions([]);
              setIsOpen(false);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          className="
            w-full pl-11 pr-28 py-3.5
            bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-2xl
            text-white placeholder-white/35 text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400/40
            shadow-lg shadow-black/20
            transition-all duration-200
            disabled:opacity-50
          "
        />

        {/* Action icons / buttons */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {/* Loading indicator for suggestions */}
          {isSearchingSuggestions && (
            <div className="p-1.5 text-white/40 animate-spin" aria-hidden="true">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {/* SINGLE custom clear button (no native WebKit conflict) */}
          {inputVal && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all"
              aria-label="Clear search"
              title="Clear search"
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
              px-3.5 py-1.5 rounded-xl text-xs font-semibold
              bg-white text-[#090a0f]
              hover:bg-white/90 active:scale-95
              disabled:bg-white/10 disabled:text-white/30 disabled:scale-100
              transition-all flex items-center gap-1.5 shadow-sm
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

      {/* Live Autocomplete Suggestions Panel (Apple & Google Weather Style) */}
      {isOpen && suggestions.length > 0 && (
        <div
          id="location-suggestions-list"
          role="listbox"
          className="
            absolute top-full left-0 right-0 z-50 mt-2
            bg-[#11141d]/95 backdrop-blur-2xl border border-white/12 rounded-2xl
            shadow-2xl shadow-black/80 overflow-hidden divide-y divide-white/5
            animate-in fade-in slide-in-from-top-2 duration-150
          "
        >
          <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider text-white/30 bg-white/[0.02]">
            Suggested Locations
          </div>
          {suggestions.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.id}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`
                  w-full px-4 py-3 text-left flex items-center justify-between gap-3
                  transition-colors cursor-pointer
                  ${isSelected ? "bg-white/10 text-white" : "hover:bg-white/[0.06] text-white/90"}
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${isSelected ? "bg-sky-400/20 text-sky-300" : "bg-white/5 text-white/40"}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-sm text-white">{item.name}</span>
                    {(item.region || item.country) && (
                      <span className="text-xs text-white/50 ml-2">
                        {[item.region, item.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] text-white/40 hidden sm:inline-flex items-center gap-1 font-sans">
                  Enter ↵
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Popular quick city pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Popular cities">
        <span className="text-[11px] text-white/30 mr-1 hidden sm:inline">Quick pick:</span>
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setInputVal(city);
              setIsOpen(false);
              onSearch(city);
            }}
            className="
              px-3 py-1 rounded-full text-xs font-medium
              text-white/60 hover:text-white
              border border-white/8 hover:border-sky-400/30
              bg-white/[0.02] hover:bg-sky-500/10
              transition-all duration-200 hover:scale-105 active:scale-95
              disabled:opacity-40
            "
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
