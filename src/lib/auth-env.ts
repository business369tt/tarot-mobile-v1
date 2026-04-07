function hasAuthBaseConfig() {
  return Boolean(process.env.AUTH_SECRET);
}

export function isLineAuthConfigured() {
  return Boolean(
    hasAuthBaseConfig() &&
      process.env.AUTH_LINE_ID &&
      process.env.AUTH_LINE_SECRET,
  );
}

export function isGoogleAuthConfigured() {
  return Boolean(
    hasAuthBaseConfig() &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET,
  );
}
