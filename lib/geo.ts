/**
 * CivicLens Geospatial Utilities
 * 
 * - Haversine distance calculation in meters
 * - Default municipal center coordinates (Bengaluru, India)
 * - Safe OpenStreetMap Nominatim reverse geocoding with silent fallback
 */

export const BENGALURU_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
  address: "Bengaluru, Karnataka, India",
};

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula
 * @returns Distance in meters
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's mean radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Reverse geocodes lat/lng into a human-readable street/area name via OpenStreetMap Nominatim.
 * Called strictly on button click; handles network failures silently.
 */
export async function reverseGeocodeSafe(lat: number, lng: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CivicLens-Municipal-AI-Triage/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    // Fail silently without blocking UI
    return null;
  }
}
