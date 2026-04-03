import type { Site, Balance, Payout } from "@tollgate/shared";

export interface AnalyticsData {
  totalRevenue: number;
  totalPayments: number;
  successRate: number;
  revenueByDay: { date: string; amount: number }[];
  topPages: { path: string; count: number; revenue: number }[];
  paymentsByBot: { userAgent: string; count: number; revenue: number }[];
}

export interface SiteWithBalance extends Site {
  balance: number;
  allowlist?: string[];
  exclusions?: string[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as Record<string, string>).error ?? `Request failed: ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

export function getSites() {
  return apiFetch<SiteWithBalance[]>("/api/v1/sites");
}

export function getSite(id: string) {
  return apiFetch<SiteWithBalance>(`/api/v1/sites/${id}`);
}

export function createSite(data: { domain: string }) {
  return apiFetch<Site>("/api/v1/sites", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteSite(id: string) {
  return apiFetch<{ ok: true }>(`/api/v1/sites/${id}`, { method: "DELETE" });
}

export function verifySiteDomain(id: string) {
  return apiFetch<{ verified: boolean }>(`/api/v1/sites/${id}/verify`, {
    method: "POST",
  });
}

export function updatePricing(id: string, data: { defaultPrice: number }) {
  return apiFetch<Site>(`/api/v1/sites/${id}/pricing`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateOrigin(
  id: string,
  data: {
    originMethod: string;
    originUrl?: string;
    originSecret?: string;
  }
) {
  return apiFetch<Site>(`/api/v1/sites/${id}/origin`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function rotateSecret(id: string) {
  return apiFetch<{ secret: string }>(`/api/v1/sites/${id}/secrets/rotate`, {
    method: "POST",
  });
}

export function updateAllowlist(
  id: string,
  entries: { userAgentPattern: string }[]
) {
  return apiFetch<{ ok: true }>(`/api/v1/sites/${id}/allowlist`, {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}

export function updateExclusions(id: string, entries: { pattern: string }[]) {
  return apiFetch<{ ok: true }>(`/api/v1/sites/${id}/exclusions`, {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}

export function getAnalytics(id: string) {
  return apiFetch<AnalyticsData>(`/api/v1/sites/${id}/analytics`);
}

export function getPayouts(id: string) {
  return apiFetch<Payout[]>(`/api/v1/sites/${id}/payouts`);
}

export function initiateStripeConnect(id: string) {
  return apiFetch<{ url: string }>(`/api/v1/sites/${id}/stripe/connect`, {
    method: "POST",
  });
}

export function updateSiteStatus(id: string, status: "active" | "paused") {
  return apiFetch<Site>(`/api/v1/sites/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
