export function isVideoProviderAccessUnavailableError(
  message: string | null | undefined,
) {
  if (!message) {
    return false;
  }

  return /video route is unavailable for the current project or API key/i.test(
    message,
  );
}
