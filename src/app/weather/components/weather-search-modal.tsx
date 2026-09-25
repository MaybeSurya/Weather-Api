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
  { label: "London, UK", city: "London", temp: "11°" },
  { label: "San Francisco, CA", city: "San Francisco", temp: "15°" },
  { label: "Tokyo, JP", city: "Tokyo", temp: "18°" },
  { label: "Delhi, IN", city: "Delhi", temp: "28°" },
];

const DEFAULT_SUGGESTIONS = [
  {
    name: "Tokyo",
    code: "JP",
    condition: "Light Rain",
    meta: "18:42 JST • 88% precip",
    temp: "14°",
    highLow: "H: 16° L: 12°",
    icon: "rainy",
  },
  {
    name: "Tokushima",
    code: "JP",
    condition: "Cloudy",
    meta: "18:42 JST • Wind 11 km/h",
    temp: "16°",
    highLow: "H: 17° L: 13°",
    icon: "cloud",
  },
  {
    name: "Tokat",
    code: "TR",
    condition: "Clear Sky",
    meta: "12:42 TRT • UV 4 Moderate",
    temp: "9°",
    highLow: "H: 11° L: 4°",
    icon: "wb_sunny",
  },
  {
    name: "Toledo, Ohio",
    code: "US",
    condition: "Sunny",
    meta: "05:42 EDT • Dew 10°",
    temp: "21°",
    highLow: "H: 26° L: 14°",
    icon: "wb_sunny",
  },
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
        handleSelect(DEFAULT_SUGGESTIONS[selectedIndex].name);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-8 bg-surface-container-lowest/80 backdrop-blur-md transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Location search"
    >
      <div
        ref={modalBoxRef}
        className="w-full max-w-2xl bg-surface-container-high/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10 transition-all transform animate-[fade-in_0.15s_ease-out]"
      >
        {/* Input Header Strip */}
        <div className="relative flex items-center px-4 sm:px-6 py-4 bg-surface-container-highest/50 gap-3 border-b border-white/[0.06]">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">
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
            placeholder="Search city, airport, or coordinates..."
            className="bg-transparent border-0 outline-none text-on-surface placeholder:text-outline font-display text-base w-full focus:ring-0 font-medium"
          />

          {isSearching && (
            <div className="animate-spin text-primary shrink-0">
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
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-primary font-mono text-[11px] shrink-0">
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
              className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0 cursor-pointer"
              aria-label="Clear input"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}

          <kbd
            onClick={handleClose}
            className="px-1.5 py-0.5 rounded bg-surface-container-highest text-outline font-mono text-[10px] cursor-pointer hover:bg-surface-bright hover:text-on-surface transition-colors shrink-0"
          >
            ESC
          </kbd>
        </div>

        {/* Quick Telemetry & Recent Searches Filter Row */}
        <div className="px-4 sm:px-6 py-2.5 bg-surface-container-low/70 flex flex-wrap items-center gap-2 border-b border-white/[0.04]">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-primary">history</span>
            Recent
          </span>
          <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            {RECENT_CHIPS.map((chip) => (
              <button
                key={chip.city}
                type="button"
                onClick={() => handleSelect(chip.city)}
                className="group flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="text-on-surface-variant group-hover:text-primary font-medium text-[11px]">
                  {chip.label}
                </span>
                <span className="text-outline group-hover:text-on-surface-variant text-[10px]">
                  {chip.temp}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="p-3 flex flex-col gap-1 max-h-80 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              const countryCode = item.country
                ? item.country.slice(0, 2).toUpperCase()
                : "IN";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.name)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all text-left group cursor-pointer ${
                    isSelected
                      ? "bg-surface-container-highest border border-primary/20 shadow-sm"
                      : "hover:bg-surface-container/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        location_on
                      </span>
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-on-surface group-hover:text-primary">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-container-highest text-outline uppercase font-mono">
                          {countryCode}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant truncate mt-0.5">
                        {[item.region, item.country].filter(Boolean).join(" · ")}
                        {item.latitude && item.longitude ? ` • ${item.latitude.toFixed(2)}°N, ${item.longitude.toFixed(2)}°E` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-outline hidden sm:inline-block">
                      Select ↵
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">
                      arrow_forward
                    </span>
                  </div>
                </button>
              );
            })
          ) : query.trim().length >= 2 && !isSearching ? (
            <div className="px-4 py-8 text-center text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-3xl text-outline mb-2 block">
                search_off
              </span>
              No matching locations found for &quot;{query}&quot;. Press Enter to query directly.
            </div>
          ) : (
            DEFAULT_SUGGESTIONS.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleSelect(item.name)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all text-left group cursor-pointer ${
                    isSelected
                      ? "bg-surface-container-highest border border-primary/20 shadow-sm"
                      : "hover:bg-surface-container/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-on-surface group-hover:text-primary">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-container-highest text-outline uppercase font-mono">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {item.condition} • {item.meta}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-on-surface font-mono">{item.temp}</div>
                      <div className="text-[10px] text-outline font-mono">{item.highLow}</div>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">
                      arrow_forward
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Global Synoptic Banner */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-low/90 flex items-center justify-between border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-primary">map</span>
            <span>Global Synoptic Layer · Explore interactive precipitation &amp; thermal vectors</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelect(query.trim() || "Rudrapur")}
            className="text-xs font-semibold text-primary hover:text-white flex items-center gap-0.5 cursor-pointer"
          >
            <span>Open Radar</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Keyboard navigation bar */}
        <div className="px-4 sm:px-6 py-2 bg-surface-container-lowest flex items-center justify-between text-[11px] text-outline font-mono border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <span>↑ ↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>GEMS SATELLITE LINK 904</span>
          </div>
        </div>
      </div>
    </div>
  );
}
