import { useEffect, useRef, useState } from "react";

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

let mapsPromise: Promise<any> | null = null;

function loadMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if ((window as any).google?.maps?.importLibrary) return Promise.resolve((window as any).google);
  if (mapsPromise) return mapsPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("missing browser key"));

  mapsPromise = new Promise((resolve, reject) => {
    (window as any).__nestMapsInit = () => resolve((window as any).google);
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      v: "weekly",
      libraries: "places",
      loading: "async",
      callback: "__nestMapsInit",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

type Suggestion = {
  placeId: string;
  text: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function AddressAutocomplete({ value, onChange, placeholder, className, id }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const sessionTokenRef = useRef<any>(null);
  const placesLibRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(async (g: any) => {
        const lib = await g.maps.importLibrary("places");
        if (cancelled) return;
        placesLibRef.current = lib;
        sessionTokenRef.current = new (lib as any).AutocompleteSessionToken();
      })
      .catch((err) => console.warn("Maps load failed", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const lib = placesLibRef.current;
      if (!lib?.AutocompleteSuggestion) return;
      try {
        const { suggestions: results } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["au"],
        });
        const mapped: Suggestion[] = (results || [])
          .map((s: any) => {
            const p = s.placePrediction;
            if (!p) return null;
            return { placeId: p.placeId, text: p.text?.toString?.() ?? "" };
          })
          .filter(Boolean) as Suggestion[];
        setSuggestions(mapped);
        setOpen(mapped.length > 0);
        setActiveIdx(-1);
      } catch (err) {
        console.warn("Autocomplete fetch failed", err);
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  const select = (s: Suggestion) => {
    skipNextFetchRef.current = true;
    onChange(s.text);
    setOpen(false);
    setSuggestions([]);
    // new session after a selection
    const lib = placesLibRef.current;
    if (lib) sessionTokenRef.current = new lib.AutocompleteSessionToken();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      select(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                select(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`cursor-pointer px-4 py-3 text-sm ${
                i === activeIdx ? "bg-muted text-foreground" : "text-foreground/90"
              }`}
            >
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
