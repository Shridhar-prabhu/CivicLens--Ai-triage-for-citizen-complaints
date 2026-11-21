import type { Category, Ticket } from "./schema";

/**
 * Duplicate Clustering & Similarity Engine
 * 
 * Requirements (Section 5):
 * - Group reports with the same category and a similar location hint into one cluster.
 * - Cluster priority rises with report count ("12 citizens reported this").
 * - Show a duplicate badge, "Possible duplicate of #ID" and a grouped view.
 */

// Normalized text token overlap calculation (Jaccard similarity on tokens)
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
  newComplaint: { category: Category; location_hint?: string; raw_text: string },
  existingTickets: Ticket[]
): {
  isDuplicate: boolean;
  duplicateOfId?: string;
  clusterId?: string;
  clusterCount: number;
} {
  const newLocation = newComplaint.location_hint?.trim() || "";
  const newText = newComplaint.raw_text.toLowerCase();

  // Search existing tickets in the same category
  const candidates = existingTickets.filter(
    (t) => t.status !== "resolved" && t.category === newComplaint.category
  );

  for (const candidate of candidates) {
    const candLocation = candidate.location_hint?.trim() || "";
    
    // 1. Direct location overlap
    const locationOverlap =
      newLocation && candLocation ? tokenSimilarity(newLocation, candLocation) : 0;

    // 2. Text similarity
    const textOverlap = tokenSimilarity(newText, candidate.raw_text.toLowerCase());

    // If both mention the exact same landmark/location or high textual resemblance
    if (locationOverlap > 0.4 || (locationOverlap > 0.2 && textOverlap > 0.3) || textOverlap > 0.6) {
      const parentId = candidate.possible_duplicate_of || candidate.id;
      const clusterId = candidate.cluster_id || `cluster-${parentId}`;
      
      // Count current items in this cluster
      const currentInCluster = existingTickets.filter(
        (t) => t.cluster_id === clusterId || t.id === parentId || t.possible_duplicate_of === parentId
      ).length;

      return {
        isDuplicate: true,
        duplicateOfId: parentId,
        clusterId,
        clusterCount: currentInCluster + 1,
      };
    }
  }

  return {
    isDuplicate: false,
    clusterCount: 1,
  };
}
