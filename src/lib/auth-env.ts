export function isLineAuthConfigured() {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_LINE_ID &&
      process.env.AUTH_LINE_SECRET,
  );
}
