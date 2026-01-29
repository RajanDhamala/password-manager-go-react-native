import { Platform } from "react-native";

// Attempt to use expo-clipboard if available; fallback to navigator.clipboard on web.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const Clipboard = await import("expo-clipboard");
    if (Clipboard?.setStringAsync) {
      await Clipboard.setStringAsync(text);
      return true;
    }
  } catch (e) {}
  if (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}
