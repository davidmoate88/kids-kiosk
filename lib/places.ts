export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  date?: string;
  notes?: string;
};

/**
 * Auto-synced monthly from the family dashboard's places list — see
 * scripts/sync-places.mjs. Manual edits here get overwritten on the next
 * sync; add new trips at the source (family-dashboard) instead.
 */
export const PLACES: Place[] = [
  { id: "akureyri", name: "Akureyri", lat: 65.6839036, lon: -18.1121756 },
  { id: "amsterdam", name: "Amsterdam", lat: 52.3730796, lon: 4.8924534 },
  { id: "barmouth", name: "Barmouth", lat: 52.7210389, lon: -4.0535692 },
  { id: "bridgend", name: "Bridgend", lat: 51.5049859, lon: -3.5756674 },
  { id: "bruges", name: "Bruges", lat: 51.2085526, lon: 3.226772 },
  { id: "calais", name: "Calais", lat: 50.9524769, lon: 1.8538446 },
  { id: "dieppe", name: "Dieppe", lat: 49.9246182, lon: 1.0791444 },
  { id: "dorset", name: "Dorset", lat: 50.7968369, lon: -2.3447323 },
  { id: "dover", name: "Dover", lat: 51.1251275, lon: 1.3134228 },
  { id: "hull", name: "Hull", lat: 53.7623863, lon: -0.3301214 },
  { id: "kendal", name: "Kendal", lat: 54.3289795, lon: -2.747183 },
  { id: "lanaken", name: "Lanaken", lat: 50.8892784, lon: 5.6513208 },
  { id: "lechlade", name: "Lechlade", lat: 51.6944942, lon: -1.6922057 },
  { id: "london", name: "London", lat: 51.5074456, lon: -0.1277653 },
  { id: "lyon", name: "Lyon", lat: 45.7578137, lon: 4.8320114 },
  { id: "porthcawl", name: "Porthcawl", lat: 51.4795563, lon: -3.7040704 },
  { id: "saint-amour", name: "Saint-amour", lat: 46.4358751, lon: 5.3421832 },
  { id: "scarborough", name: "Scarborough", lat: 54.2820009, lon: -0.4011868 },
  { id: "suffolk", name: "Suffolk", lat: 52.2410014, lon: 1.0465716 },
  { id: "tilburg", name: "Tilburg", lat: 51.5856185, lon: 5.0660616 },
  { id: "troyes", name: "Troyes", lat: 48.2971626, lon: 4.0746257 },
  { id: "wellingborough", name: "Wellingborough", lat: 52.30189, lon: -0.6937309 },
  { id: "weybourne", name: "Weybourne", lat: 52.9371853, lon: 1.1478227 },
];
