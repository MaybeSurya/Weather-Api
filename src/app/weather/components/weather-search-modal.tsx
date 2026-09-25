"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { SearchSuggestion } from "@/app/api/weather/search/route";
import { WeatherIcon } from "./weather-icon";

interface WeatherSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: string) => void;
  userCoords?: { latitude: number; longitude: number; country?: string } | null;
}

const RECENT_CHIPS = [
  { label: "Rudrapur, IN", city: "Rudrapur", temp: "24°" },
  { label: "Dehradun, IN", city: "Dehradun", temp: "22°" },
  { label: "New Delhi, IN", city: "New Delhi", temp: "28°" },
  { label: "London, UK", city: "London", temp: "14°" },
  { label: "Tokyo, JP", city: "Tokyo", temp: "18°" },
];

const DEFAULT_SUGGESTIONS = [
  {
    name: "Rudrapur",
    code: "IN",
    condition: "Sunny & Pleasant",
    meta: "Uttarakhand • Near you",
    temp: "24°",
    highLow: "H: 28° L: 19°",
    icon: "wb_sunny",
  },
  {
    name: "Dehradun",
    code: "IN",
    condition: "Partly Cloudy",
    meta: "Uttarakhand • 160 km",
    temp: "22°",
    highLow: "H: 25° L: 16°",
    icon: "partly_cloudy_day",
  },
  {
    name: "New Delhi",
    code: "IN",
    condition: "Hazy Sun",
    meta: "Delhi • 220 km",
    temp: "28°",
    highLow: "H: 32° L: 23°",
    icon: "wb_sunny",
  },
  {
    name: "London",
    code: "GB",
    condition: "Light Showers",
    meta: "England • Worldwide",
    temp: "14°",
    highLow: "H: 16° L: 10°",
    icon: "rainy",
  },
];

export function WeatherSearchModal({
  isOpen,
  onClose,
  onSelectCity,
  userCoords,
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

  const userLat = userCoords?.latitude;
  const userLon = userCoords?.longitude;
  const userCountry = userCoords?.country;

  // Debounced search query against /api/weather/search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let url = `/api/weather/search?q=${encodeURIComponent(trimmed)}`;
        if (userLat != null && userLon != null) {
          url += `&lat=${userLat}&lon=${userLon}`;
        }
        if (userCountry) {
          url += `&country=${encodeURIComponent(userCountry)}`;
        }

        const res = await fetch(url);
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
  }, [query, userLat, userLon, userCountry]);

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
          <WeatherIcon name="search" className="w-5 h-5 text-primary shrink-0" />
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
            placeholder="Search for any city, town, or place..."
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
              <WeatherIcon name="close" className="w-4 h-4" />
            </button>
          )}

          <kbd
            onClick={handleClose}
            className="px-1.5 py-0.5 rounded bg-surface-container-highest text-outline font-mono text-[10px] cursor-pointer hover:bg-surface-bright hover:text-on-surface transition-colors shrink-0"
          >
            ESC
          </kbd>
        </div>

        {/* Quick Picks & Recent Searches */}
        <div className="px-4 sm:px-6 py-2.5 bg-surface-container-low/70 flex flex-wrap items-center gap-2 border-b border-white/[0.04]">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider shrink-0 flex items-center gap-1">
            <WeatherIcon name="history" className="w-3.5 h-3.5 text-primary" />
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
                      <WeatherIcon name="location_on" className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-on-surface group-hover:text-primary">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-container-highest text-outline uppercase font-mono">
                          {countryCode}
                        </span>
                        {item.isNearby ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Nearby{item.distanceKm ? ` · ${item.distanceKm} km` : ""}
                          </span>
                        ) : item.distanceKm && item.distanceKm < 1500 ? (
                          <span className="text-[10px] text-outline px-1.5 py-0.2 rounded bg-surface-container/60 font-mono">
                            {item.distanceKm} km
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-on-surface-variant truncate mt-0.5">
                        {[item.region, item.country].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-outline hidden sm:inline-block">
                      Enter ↵
                    </span>
                    <WeatherIcon name="arrow_forward" className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })
          ) : query.trim().length >= 2 && !isSearching ? (
            <div className="px-4 py-8 text-center text-on-surface-variant text-sm">
              <WeatherIcon name="cloud_off" className="w-8 h-8 text-outline mb-2 mx-auto block" />
              No cities found matching &quot;{query}&quot;. Press Enter to search anyway.
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
                      <WeatherIcon name={item.icon} className="w-5 h-5" />
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
                    <WeatherIcon name="arrow_forward" className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Helpful Search Tip Banner */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-low/90 flex items-center justify-between border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <WeatherIcon name="globe" className="w-4 h-4 text-primary" />
            <span>Search any city, town, or country in the world</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelect(query.trim() || "Rudrapur")}
            className="text-xs font-semibold text-primary hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Show Weather</span>
            <WeatherIcon name="arrow_forward" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Friendly guidance bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-medium">↑</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-medium">↓</span>
            <span>Arrow keys to move</span>
            <span className="text-outline/40 mx-1">•</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-medium">Enter</span>
            <span>Choose</span>
            <span className="text-outline/40 mx-1">•</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-medium">Esc</span>
            <span>Exit</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live search ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
