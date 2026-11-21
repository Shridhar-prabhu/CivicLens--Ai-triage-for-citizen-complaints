import type { Category, Ticket } from "./schema";
import { haversineDistanceMeters } from "./geo";

/**
 * Duplicate Clustering & Similarity Engine
 * 
 * Requirements (Rule 3):
 * - If both tickets have GPS coordinates: treat as duplicate if same category and distance <= 75 m.
 * - Distance note format: "~30 m from #ID".
 * - If coordinates missing: fall back to location_hint / token similarity.
 * - Cluster priority rises with duplicate count.
 */

function tokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const cleanA = a.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  const cleanB = b.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  if (cleanA === cleanB) return 1.0;

  const setA = new Set(cleanA.split(/\s+/).filter((t) => t.length > 2));
  const setB = new Set(cleanB.split(/\s+/).filter((t) => t.length > 2));
  if (setA.size === 0 || setB.size === 0) return 0;

  const arrA = Array.from(setA);
  const arrB = Array.from(setB);

  const intersection = arrA.filter((x) => setB.has(x));
  const union = new Set(arrA.concat(arrB));

  return intersection.length / union.size;
}

export function findPossibleDuplicate(
  newComplaint: {
    category: Category;
    location_hint?: string;
    raw_text: string;
    lat?: number;
    lng?: number;
  },
  existingTickets: Ticket[]
): {
  isDuplicate: boolean;
  duplicateOfId?: string;
  clusterId?: string;
  clusterCount: number;
  distanceMeters?: number;
  duplicateNote?: string;
} {
  const newLocation = newComplaint.location_hint?.trim() || "";
  const newText = newComplaint.raw_text.toLowerCase();

  // Search existing unresolved tickets in the same category
  const candidates = existingTickets.filter(
    (t) => t.status !== "resolved" && t.category === newComplaint.category
  );

  for (const candidate of candidates) {
    const parentId = candidate.possible_duplicate_of || candidate.id;
    const clusterId = candidate.cluster_id || `cluster-${parentId}`;

    // 1. GEOSPATIAL DISTANCE CHECK (Primary: when both have coordinates)
    if (
      typeof newComplaint.lat === "number" &&
      typeof newComplaint.lng === "number" &&
      typeof candidate.lat === "number" &&
      typeof candidate.lng === "number"
    ) {
      const distMeters = haversineDistanceMeters(
        newComplaint.lat,
        newComplaint.lng,
        candidate.lat,
        candidate.lng
      );

      // Within 75 meters threshold
      if (distMeters <= 75) {
        const currentInCluster = existingTickets.filter(
          (t) => t.cluster_id === clusterId || t.id === parentId || t.possible_duplicate_of === parentId
        ).length;

        return {
          isDuplicate: true,
          duplicateOfId: parentId,
          clusterId,
          clusterCount: currentInCluster + 1,
          distanceMeters: distMeters,
          duplicateNote: `~${distMeters} m from #${parentId}`,
        };
      }
    }

    // 2. TEXTUAL SIMILARITY FALLBACK (When GPS is absent on either ticket)
    const candLocation = candidate.location_hint?.trim() || "";
    const locationOverlap =
      newLocation && candLocation ? tokenSimilarity(newLocation, candLocation) : 0;
    const textOverlap = tokenSimilarity(newText, candidate.raw_text.toLowerCase());

    if (locationOverlap > 0.4 || (locationOverlap > 0.2 && textOverlap > 0.3) || textOverlap > 0.6) {
      const currentInCluster = existingTickets.filter(
        (t) => t.cluster_id === clusterId || t.id === parentId || t.possible_duplicate_of === parentId
      ).length;

      return {
        isDuplicate: true,
        duplicateOfId: parentId,
        clusterId,
        clusterCount: currentInCluster + 1,
        duplicateNote: `Near landmark from #${parentId}`,
      };
    }
  }

  return {
    isDuplicate: false,
    clusterCount: 1,
  };
}
