/** Extract a specific, human-readable message from a viem/wagmi error — never a generic fallback. */
export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const withShortMessage = error as { shortMessage?: string; message?: string };
    if (withShortMessage.shortMessage) return withShortMessage.shortMessage;
    if (withShortMessage.message) return withShortMessage.message;
  }
  return String(error);
}
