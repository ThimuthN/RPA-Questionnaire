"use client";

import { useMemo, useState } from "react";
import { LOCATION_COUNTRIES } from "@/lib/locations/locations";

const selectClassName =
  "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50";
const inputClassName =
  "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50";

/**
 * Best-effort parse of an existing free-form location string ("Area, City, Region, Country")
 * back into the cascading structure. Anything that doesn't match the dataset stays in the
 * free-text "area" field so nothing is lost.
 */
function parseInitial(value: string) {
  const empty = { countryCode: "", region: "", city: "", area: "" };
  const trimmed = value.trim();
  if (!trimmed) return empty;

  const tokens = trimmed.split(",").map((t) => t.trim()).filter(Boolean);

  // Match country by the last token.
  const country = LOCATION_COUNTRIES.find(
    (c) => c.name.toLowerCase() === tokens[tokens.length - 1]?.toLowerCase()
  );
  if (!country) return { ...empty, area: trimmed };

  const remaining = tokens.slice(0, -1);

  // Try to match a region among the remaining tokens.
  let region = "";
  let regionIndex = -1;
  for (let i = remaining.length - 1; i >= 0; i--) {
    const match = country.regions.find((r) => r.name.toLowerCase() === remaining[i]?.toLowerCase());
    if (match) {
      region = match.name;
      regionIndex = i;
      break;
    }
  }
  if (!region) {
    return { countryCode: country.code, region: "", city: "", area: remaining.join(", ") };
  }

  const regionData = country.regions.find((r) => r.name === region)!;
  const beforeRegion = remaining.slice(0, regionIndex);

  // City is the token immediately before the region, if it matches.
  let city = "";
  if (beforeRegion.length > 0) {
    const cityCandidate = beforeRegion[beforeRegion.length - 1]!;
    if (regionData.cities.some((c) => c.toLowerCase() === cityCandidate.toLowerCase())) {
      city = regionData.cities.find((c) => c.toLowerCase() === cityCandidate.toLowerCase())!;
    }
  }

  const areaTokens = city ? beforeRegion.slice(0, -1) : beforeRegion;
  return { countryCode: country.code, region, city, area: areaTokens.join(", ") };
}

export function LocationPicker({
  name,
  defaultValue,
  disabled
}: {
  name: string;
  defaultValue?: string | null;
  disabled?: boolean;
}) {
  const initial = useMemo(() => parseInitial(defaultValue ?? ""), [defaultValue]);
  const [countryCode, setCountryCode] = useState(initial.countryCode);
  const [region, setRegion] = useState(initial.region);
  const [city, setCity] = useState(initial.city);
  const [area, setArea] = useState(initial.area);

  const country = LOCATION_COUNTRIES.find((c) => c.code === countryCode) ?? null;
  const regionData = country?.regions.find((r) => r.name === region) ?? null;

  const composed = [area.trim(), city, region, country?.name]
    .filter((part) => part && part.length > 0)
    .join(", ");

  return (
    <div className="grid gap-2">
      <span className="text-sm text-[color:var(--app-text)]">Location</span>
      <input type="hidden" name={name} value={composed} />

      <div className="grid gap-2 sm:grid-cols-3">
        <select
          aria-label="Country"
          value={countryCode}
          disabled={disabled}
          onChange={(e) => {
            setCountryCode(e.target.value);
            setRegion("");
            setCity("");
          }}
          className={selectClassName}
        >
          <option value="">Country</option>
          {LOCATION_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>

        <select
          aria-label={country?.regionLabel ?? "Region"}
          value={region}
          disabled={disabled || !country}
          onChange={(e) => {
            setRegion(e.target.value);
            setCity("");
          }}
          className={selectClassName}
        >
          <option value="">{country ? country.regionLabel : "Region"}</option>
          {country?.regions.map((r) => (
            <option key={r.name} value={r.name}>{r.name}</option>
          ))}
        </select>

        <select
          aria-label={country?.cityLabel ?? "City"}
          value={city}
          disabled={disabled || !regionData}
          onChange={(e) => setCity(e.target.value)}
          className={selectClassName}
        >
          <option value="">{country ? country.cityLabel : "City"}</option>
          {regionData?.cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        aria-label="Area or street"
        value={area}
        disabled={disabled}
        onChange={(e) => setArea(e.target.value)}
        placeholder="Area / street (optional)"
        className={inputClassName}
      />
    </div>
  );
}
