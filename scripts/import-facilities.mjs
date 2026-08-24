#!/usr/bin/env node
/**
 * import-facilities.mjs — dependency-free CSV → JSON importer for the official
 * KMHFL health-facility directory.
 *
 * Reads the raw facilities CSV (default: data/health-facilities.csv) and writes
 * a bundled directory consumed by the app (default: public/facilities.json,
 * served as /facilities.json). Run via `npm run import:facilities`.
 *
 * Handles, with zero dependencies:
 *   - RFC-4180 CSV: quoted fields, embedded commas/quotes/newlines, CRLF, BOM.
 *   - Alias-priority header mapping: each canonical field resolves from the
 *     first matching column alias, in priority order. Unmapped columns are
 *     reported (FID, HMIS, Province, Division, LOCATION, Sub Location,
 *     Spatial_Re, GlobalID, x, y are expected leftovers for KMHFL exports).
 *   - Numeric facility type codes (1=Hospital, 3=Health Centre, 4=Dispensary,
 *     plus the other KMHFL codes) decoded to human labels.
 *   - Agency codes (MOH/MISS/NGO/MUN/…) decoded to labels.
 *   - Title-cased facility / district names.
 *   - Coordinates in decimal degrees or DMS (2°3'26.7"S, "2 3 26.7 S", …),
 *     validated against Kenya's bounding box; invalid coords are dropped.
 *   - Dedupe by normalized name+district (first occurrence wins).
 *   - Emergency flag: explicit column when present, else the hospital
 *     heuristic (decoded type or name says "hospital").
 *
 * Usage:
 *   npm run import:facilities -- --in data/health-facilities.csv --out public/facilities.json
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

// ---------------------------------------------------------------------------
// CSV parsing (RFC 4180)
// ---------------------------------------------------------------------------

/** Parse CSV text into an array of rows (arrays of strings). */
export function parseCsv(text) {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"'; // escaped quote
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch; // embedded commas / newlines / quotes stay in the field
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// ---------------------------------------------------------------------------
// Header mapping (alias priority)
// ---------------------------------------------------------------------------

/** Canonical field → candidate column names, highest priority first. */
const COLUMN_ALIASES = {
  id: ["Facility Number", "facility_number", "Facility Code", "Code"],
  name: ["Facility Name", "facility_name", "Facility", "Name", "name"],
  district: ["District", "district", "County", "county"],
  campus: ["campus", "Campus", "Region", "region"],
  facilityType: ["Facility Type", "facility_type", "Type", "type"],
  agency: ["Agency", "agency"],
  latitude: ["Latitude", "latitude", "LATITUDE", "lat", "Lat"],
  longitude: ["Longitude", "longitude", "LONGITUDE", "lon", "lng", "Lon", "Lng"],
  isEmergency: ["is_emergency", "emergency", "Emergency", "has_emergency", "24_7"],
};

/** Map CSV header row → { canonicalField: columnIndex } + unmapped columns. */
export function mapHeaders(headerRow) {
  const columns = {};
  const unmapped = [];
  const used = new Set();

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    const index = headerRow.findIndex(
      (header) => !used.has(header) && aliases.includes(header.trim()),
    );
    if (index !== -1) {
      columns[canonical] = index;
      used.add(headerRow[index]);
    }
  }
  headerRow.forEach((header, index) => {
    const label = header.trim();
    if (label && !used.has(headerRow[index])) unmapped.push(label);
  });
  return { columns, unmapped };
}

/** First non-empty value among the mapped column (by alias priority). */
function pick(row, columns, canonical) {
  const index = columns[canonical];
  if (index === undefined) return "";
  const value = row[index];
  const text = value === undefined || value === null ? "" : String(value).trim();
  return text;
}

// ---------------------------------------------------------------------------
// Value decoding
// ---------------------------------------------------------------------------

/** KMHFL numeric facility-type codes → labels. */
const FACILITY_TYPE_CODES = {
  1: "Hospital",
  2: "National Referral Hospital",
  3: "Health Centre",
  4: "Dispensary",
  5: "Private Hospital",
  6: "Medical Clinic",
  7: "Nursing & Maternity Home",
  8: "Specialised Clinic",
  9: "Institutional Dispensary",
};

/** KMHFL agency codes → labels. */
const AGENCY_LABELS = {
  MOH: "Ministry of Health",
  MISS: "Faith-Based / Mission",
  NGO: "NGO",
  MUN: "Municipal / Local Authority",
  LA: "Local Authority",
  PRIV: "Private",
  "OTHER MIN": "Other Ministry",
  AF: "Armed Forces",
  "MINISTRY OF HEALTH": "Ministry of Health",
};

const ROMAN_NUMERALS = new Set(["ii", "iii", "iv", "vi", "ix"]);

/** Capitalize a single word, tolerating leading punctuation like "(" . */
function capitalizeWord(word) {
  if (ROMAN_NUMERALS.has(word)) return word.toUpperCase();
  return word.replace(/^([^a-z]*)([a-z])/, (_m, prefix, letter) => prefix + letter.toUpperCase());
}

/** "BARGONI HEALTH CENTRE" → "Bargon Health Centre". */
export function titleCase(value) {
  const lowered = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!lowered) return "";
  return lowered
    .split(/([-/(]|\s)/)
    .map((part) => (/^(?:[-/(]|\s)?$/.test(part) ? part : capitalizeWord(part)))
    .join("");
}

/** Decode a facility type cell (numeric code, label, or blank) to a label. */
export function decodeFacilityType(raw, name) {
  const code = String(raw ?? "").trim();
  if (FACILITY_TYPE_CODES[code] !== undefined) return FACILITY_TYPE_CODES[code];
  if (code) return titleCase(code);
  const sniffed = String(name ?? "").toLowerCase();
  if (/\bhosp(ital)?\b/.test(sniffed)) return "Hospital";
  if (sniffed.includes("health centr")) return "Health Centre";
  if (sniffed.includes("disp")) return "Dispensary";
  if (sniffed.includes("clinic")) return "Clinic";
  if (sniffed.includes("nursing home")) return "Nursing & Maternity Home";
  return "Health Facility";
}

/** Decode an agency cell (code or long form) to a label. */
export function decodeAgency(raw) {
  const code = String(raw ?? "").trim();
  if (!code) return "";
  const key = code.toUpperCase();
  return AGENCY_LABELS[key] ?? titleCase(code);
}

/**
 * Parse a coordinate in decimal degrees ("-2.057423") or DMS
 * ("2°3'26.7\"S", "2 3 26.7 S", "S 2 3 26.7"). Returns degrees or null.
 */
export function parseCoordinate(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
    const value = Number(text);
    return Number.isFinite(value) && value !== 0 ? value : null;
  }

  let sign = 1;
  let body = text.toUpperCase();
  const hemisphere = body.match(/[NSEW]/);
  if (hemisphere) {
    if (hemisphere[0] === "S" || hemisphere[0] === "W") sign = -1;
    body = body.replace(/[NSEW]/g, " ");
  }
  if (body.trimStart().startsWith("-")) sign = -1;

  const parts = body.match(/\d+(?:\.\d+)?/g);
  if (!parts || parts.length === 0 || parts.length > 3) return null;
  let seconds = 0;
  for (const part of parts) seconds = seconds * 60 + Number(part);
  const value = (seconds / 3600) * sign;
  return Number.isFinite(value) && value !== 0 ? value : null;
}

/** Generous bounding box for Kenya; anything outside is bad data. */
function withinKenya(lat, lon) {
  return lat >= -6 && lat <= 6 && lon >= 33 && lon <= 44;
}

/**
 * Emergency flag: an explicit column wins when present (truthy: 1/true/yes/y/t,
 * case-insensitive); otherwise the hospital heuristic (type label or name
 * mentions a hospital).
 */
export function decodeEmergency(explicit, facilityType, name) {
  const text = String(explicit ?? "").trim();
  if (text !== "") return /^(1|true|yes|y|t)$/i.test(text);
  return /hospital/i.test(facilityType) || /\bhosp(ital)?\b/i.test(String(name ?? ""));
}

// ---------------------------------------------------------------------------
// Import pipeline
// ---------------------------------------------------------------------------

export function importFacilities(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) throw new Error("CSV has no data rows");

  const [headerRow, ...dataRows] = rows;
  const { columns, unmapped } = mapHeaders(headerRow);
  const missing = ["name", "latitude", "longitude"].filter((f) => columns[f] === undefined);
  if (missing.length > 0) {
    throw new Error(`CSV is missing required columns (mapped ${missing.join(", ")})`);
  }

  const stats = {
    rowsRead: dataRows.length,
    skipped: 0,
    deduped: 0,
    droppedCoordinates: 0,
  };

  const seen = new Set();
  const facilities = [];

  for (const row of dataRows) {
    const name = titleCase(pick(row, columns, "name"));
    if (!name) {
      stats.skipped += 1;
      continue;
    }
    const district = titleCase(pick(row, columns, "district")) || "Kenya";
    const dedupeKey = `${name.toLowerCase()}|${district.toLowerCase()}`;
    if (seen.has(dedupeKey)) {
      stats.deduped += 1;
      continue;
    }
    seen.add(dedupeKey);

    const facilityType = decodeFacilityType(pick(row, columns, "facilityType"), name);
    let latitude = parseCoordinate(pick(row, columns, "latitude"));
    let longitude = parseCoordinate(pick(row, columns, "longitude"));
    // Heal swapped coordinates (common in hand-keyed exports).
    if (latitude !== null && longitude !== null) {
      if (!withinKenya(latitude, longitude) && withinKenya(longitude, latitude)) {
        [latitude, longitude] = [longitude, latitude];
      }
    }
    if (latitude === null || longitude === null || !withinKenya(latitude, longitude)) {
      if (latitude !== null || longitude !== null) stats.droppedCoordinates += 1;
      latitude = 0;
      longitude = 0;
    }

    facilities.push({
      id: pick(row, columns, "id"),
      name,
      campus: titleCase(pick(row, columns, "campus")),
      district,
      facility_type: facilityType,
      agency: decodeAgency(pick(row, columns, "agency")),
      latitude: Math.round(latitude * 1e6) / 1e6,
      longitude: Math.round(longitude * 1e6) / 1e6,
      is_emergency: decodeEmergency(pick(row, columns, "isEmergency"), facilityType, name),
    });
  }

  return { facilities, unmapped, stats };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { in: undefined, out: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--in") args.in = argv[i + 1];
    else if (arg === "--out") args.out = argv[i + 1];
    else if (arg === "--help" || arg === "-h") args.help = true;
    i += arg === "--in" || arg === "--out" ? 1 : 0;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: npm run import:facilities -- [--in <csv>] [--out <json>]");
    return;
  }
  const input = resolve(repoRoot, args.in ?? "data/health-facilities.csv");
  const output = resolve(repoRoot, args.out ?? "public/facilities.json");

  const { facilities, unmapped, stats } = importFacilities(readFileSync(input, "utf8"));

  const withCoordinates = facilities.filter((f) => f.latitude !== 0 && f.longitude !== 0);
  const emergency = facilities.filter((f) => f.is_emergency);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "Kenya Master Health Facility List (KMHFL) — official facilities CSV",
    count: facilities.length,
    facilities,
  };

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(payload)}\n`, "utf8");

  console.log(`[import:facilities] ${input} → ${output}`);
  console.log(`  rows read            : ${stats.rowsRead}`);
  console.log(`  facilities imported  : ${facilities.length}`);
  console.log(`  skipped (no name)    : ${stats.skipped}`);
  console.log(`  deduped (name+district): ${stats.deduped}`);
  console.log(
    `  with coordinates     : ${withCoordinates.length} (${Math.round((withCoordinates.length / facilities.length) * 100)}%)`,
  );
  console.log(`  dropped bad coords   : ${stats.droppedCoordinates}`);
  console.log(`  emergency-capable    : ${emergency.length}`);
  console.log(`  unmapped CSV columns : ${unmapped.length ? unmapped.join(", ") : "(none)"}`);
}

main();
