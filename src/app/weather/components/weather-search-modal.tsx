"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { SearchSuggestion } from "@/app/api/weather/search/route";

interface WeatherSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

const RECENT_CHIPS = [
  { label: "Rudrapur, IN", city: "Rudrapur", temp: "23°" },
  { label: "Delhi, IN", city: "Delhi", temp: "28°" },
  { label: "London, UK", city: "London", temp: "15°" },
  { label: "Tokyo, JP", city: "Tokyo", temp: "18°" },
  { label: "New York, US", city: "New York", temp: "20°" },
  { label: "Bengaluru, IN", city: "Bengaluru", temp: "24°" },
];

const DEFAULT_SUGGESTIONS: Array<{
  city: string;
  region: string;
  temp: string;
  icon: string;
}> = [
  { city: "Rudrapur", region: "Uttarakhand · India", temp: "23°", icon: "wb_sunny" },
  { city: "Delhi", region: "NCR · India", temp: "28°", icon: "wb_twilight" },
  { city: "London", region: "Greater London · United Kingdom", temp: "15°", icon: "cloud" },
  { city: "Tokyo", region: "Kanto · Japan", temp: "18°", icon: "rainy" },
  { city: "Mumbai", region: "Maharashtra · India", temp: "30°", icon: "wb_sunny" },
  { city: "New York", region: "New York · United States", temp: "20°", icon: "partly_cloudy_day" },
];

export function WeatherSearchModal({
  isOpen,
  onClose,
  onSelectCity,
}: WeatherSearchModalProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setSelectedIndex(-1);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback(
    (cityName: string) => {
      onSelectCity(cityName);
      handleClose();
    },
    [onSelectCity, handleClose]
  );

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Debounced search query against /api/weather/search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/weather/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = (await res.json()) as { suggestions?: SearchSuggestion[] };
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setSelectedIndex(-1);
          } else {
            setSuggestions([]);
          }
        }
      } catch {
        // Silently swallow search fetch errors
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const count = suggestions.length > 0 ? suggestions.length : DEFAULT_SUGGESTIONS.length;
      setSelectedIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const count = suggestions.length > 0 ? suggestions.length : DEFAULT_SUGGESTIONS.length;
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex].name);
      } else if (suggestions.length === 0 && selectedIndex >= 0 && DEFAULT_SUGGESTIONS[selectedIndex]) {
        handleSelect(DEFAULT_SUGGESTIONS[selectedIndex].city);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Location search"
    >
      <div
        ref={modalBoxRef}
        className="w-full max-w-xl rounded-2xl bg-[#0f172a]/95 border border-white/15 shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-200"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 bg-white/[0.04] gap-3 border-b border-white/10">
          <span className="material-symbols-outlined text-sky-400 text-[22px] shrink-0">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            id="modal-city-search-input"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.trim().length < 2) {
                setSuggestions([]);
              }
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search city, district, or airport (e.g. Rudrapur, Tokyo)..."
            className="bg-transparent border-0 outline-none text-white placeholder:text-slate-500 text-sm w-full focus:ring-0 font-medium"
          />

          {isSearching && (
            <div className="animate-spin text-sky-400 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {suggestions.length > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-[11px] shrink-0">
              {suggestions.length} match{suggestions.length > 1 ? "es" : ""}
            </span>
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors shrink-0"
              aria-label="Clear input"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          <kbd
            onClick={handleClose}
            className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-mono text-[10px] cursor-pointer hover:bg-white/20 transition-colors shrink-0"
          >
            ESC
          </kbd>
        </div>

        {/* Quick Recent Locations Ribbon */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-sky-400">history</span>
            Quick
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {RECENT_CHIPS.map((chip) => (
              <button
                key={chip.city}
                type="button"
                onClick={() => handleSelect(chip.city)}
                className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] transition-colors cursor-pointer"
              >
                <span className="text-slate-300 group-hover:text-sky-300 font-medium text-[11px]">
                  {chip.label}
                </span>
                <span className="text-slate-400 text-[10px]">{chip.temp}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="p-2 flex flex-col gap-1 max-h-80 overflow-y-auto">
          {suggestions.length > 0 ? (
            <>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Locations ({suggestions.length})
              </div>
              {suggestions.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.name)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors text-left group cursor-pointer ${
                      isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-sky-400 text-[18px]">
                          location_on
                        </span>
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-white group-hover:text-sky-300">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {[item.region, item.country].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                      Select ↵
                    </span>
                  </button>
                );
              })}
            </>
          ) : query.trim().length >= 2 && !isSearching ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              <span className="material-symbols-outlined text-3xl text-slate-500 mb-2 block">
                search_off
              </span>
              No matching locations found for &quot;{query}&quot;. Press Enter to query anyway.
            </div>
          ) : (
            <>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Suggested Observatories
              </div>
              {DEFAULT_SUGGESTIONS.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.city}
                    type="button"
                    onClick={() => handleSelect(item.city)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors text-left group cursor-pointer ${
                      isSelected ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-sky-400 text-[18px]">
                          location_on
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-sky-300">
                          {item.city}
                        </div>
                        <div className="text-xs text-slate-400">{item.region}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400 text-[18px]">
                        {item.icon}
                      </span>
                      <span className="text-sm font-semibold text-white font-mono">
                        {item.temp}
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
