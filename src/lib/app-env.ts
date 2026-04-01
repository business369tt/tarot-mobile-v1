function normalizeConfiguredUrl(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function parseConfiguredUrl() {
  const raw =
    normalizeConfiguredUrl(process.env.AUTH_URL) ??
    normalizeConfiguredUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (!raw) {
    return null;
  }

  return new URL(raw);
}

export function hasConfiguredPublicAppUrl() {
  return Boolean(parseConfiguredUrl());
}

export function getAppBaseUrl() {
  const configured = parseConfiguredUrl();

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_BASE_URL_MISSING");
    }

    return "http://localhost:3000";
  }

  if (
    process.env.NODE_ENV === "production" &&
    configured.protocol !== "https:"
  ) {
    throw new Error("APP_BASE_URL_HTTPS_REQUIRED");
  }

  return configured.toString().replace(/\/$/, "");
}
