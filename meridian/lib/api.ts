/**
 * Backend API configuration for MERIDIAN
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  ingestLive: () => `${API_BASE_URL}/ingest/live`,
  process: () => `${API_BASE_URL}/process`,
  events: (params?: { role?: string; tags?: string }) => {
    const url = new URL(`${API_BASE_URL}/events`);
    if (params?.role) url.searchParams.set("role", params.role);
    if (params?.tags) url.searchParams.set("tags", params.tags);
    return url.toString();
  },
  reset: () => `${API_BASE_URL}/reset`,
  chat: () => `${API_BASE_URL}/chat`,
  precedents: () => `${API_BASE_URL}/precedents`,
  analyticsSummary: () => `${API_BASE_URL}/analytics/summary`,
  debugEventSchema: () => `${API_BASE_URL}/debug/event-schema`,
  cleanupDuplicates: () => `${API_BASE_URL}/debug/cleanup-duplicates`,
};
