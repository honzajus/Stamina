import { Share } from "@capacitor/share";
import { isNativePlatform } from "./nativeLocation";

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

function isCancelled(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return message.includes("cancel");
}

export async function shareLink(url: string, title: string): Promise<ShareResult> {
  if (isNativePlatform) {
    try {
      await Share.share({ title, url });
      return "shared";
    } catch (err) {
      if (isCancelled(err)) return "cancelled";
      // real failure (e.g. plugin unavailable) — fall through to clipboard
    }
  } else if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
