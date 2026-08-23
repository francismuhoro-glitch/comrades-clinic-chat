/**
 * Static local dataset of Kenyan hospitals / health facilities.
 *
 * This module is bundled into the app and is the SINGLE source of truth for
 * facility search, referral selection, and proximity sorting. It makes ZERO
 * network calls — no Supabase REST queries, no RLS, no PGRST205 schema-cache
 * errors — so facility lookup works instantly and fully offline.
 *
 * NOTE: The entries below are a placeholder seed. The full 1,438+ facility
 * directory (imported from the hospital CSV) will populate this array with the
 * same shape.
 */

export interface HospitalFacility {
  id: string;
  name: string;
  facility_type: string;
  district: string;
  county: string;
  latitude: number;
  longitude: number;
  level: string;
  agency: string;
  is_emergency: boolean;
}

export const KENYA_HOSPITALS: HospitalFacility[] = [
  {
    id: "1",
    name: "Kenyatta National Hospital (KNH)",
    facility_type: "National Referral Hospital",
    district: "Nairobi",
    county: "Nairobi",
    latitude: -1.3015,
    longitude: 36.8066,
    level: "Level 6",
    agency: "Ministry of Health",
    is_emergency: true,
  },
  {
    id: "2",
    name: "Moi Teaching and Referral Hospital (MTRH)",
    facility_type: "National Referral Hospital",
    district: "Eldoret",
    county: "Uasin Gishu",
    latitude: 0.5143,
    longitude: 35.2797,
    level: "Level 6",
    agency: "Ministry of Health",
    is_emergency: true,
  },
  {
    id: "3",
    name: "Jaramogi Oginga Odinga Teaching & Referral Hospital",
    facility_type: "County Referral Hospital",
    district: "Kisumu",
    county: "Kisumu",
    latitude: -0.0917,
    longitude: 34.7679,
    level: "Level 5",
    agency: "Ministry of Health",
    is_emergency: true,
  },
  {
    id: "4",
    name: "Nakuru Level 5 Teaching & Referral Hospital",
    facility_type: "County Referral Hospital",
    district: "Nakuru",
    county: "Nakuru",
    latitude: -0.2858,
    longitude: 36.0664,
    level: "Level 5",
    agency: "Ministry of Health",
    is_emergency: true,
  },
  {
    id: "5",
    name: "Coast General Teaching & Referral Hospital",
    facility_type: "County Referral Hospital",
    district: "Changamwe",
    county: "Kilifi",
    latitude: -3.9886,
    longitude: 39.9406,
    level: "Level 5",
    agency: "Ministry of Health",
    is_emergency: true,
  },
  {
    id: "6",
    name: "Moi University Teaching Hospital",
    facility_type: "Teaching Hospital",
    district: "Eldoret",
    county: "Uasin Gishu",
    latitude: 0.5161,
    longitude: 35.275,
    level: "Level 5",
    agency: "Ministry of Health",
    is_emergency: true,
  },
  {
    id: "7",
    name: "Nyahururu Level 4 Hospital",
    facility_type: "General Hospital",
    district: "Nyahururu",
    county: "Nyandarua",
    latitude: -0.4217,
    longitude: 36.8472,
    level: "Level 4",
    agency: "County Government",
    is_emergency: true,
  },
];
