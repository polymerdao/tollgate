import type { SiteConfig } from "./site-config";

export async function fetchOriginContent(path: string, config: SiteConfig): Promise<Response> {
  const url = buildOriginUrl(path, config);
  const headers: Record<string, string> = {};

  if (config.originMethod === "secret_header" && config.originSecret) {
    headers["X-Obul-Secret"] = config.originSecret;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (
      config.originMethod === "secret_header" &&
      config.originSecretPrev &&
      config.originSecretPrevExpiresAt &&
      new Date(config.originSecretPrevExpiresAt) > new Date()
    ) {
      const retry = await fetch(url, { headers: { "X-Obul-Secret": config.originSecretPrev } });
      if (retry.ok) return retry;
    }
    throw new Error(`Origin returned ${response.status}`);
  }
  return response;
}

function buildOriginUrl(path: string, config: SiteConfig): string {
  if (config.originMethod === "backend_api" && config.originUrl) {
    return `${config.originUrl.replace(/\/$/, "")}${path}`;
  }
  return `https://${config.domain}${path}`;
}
