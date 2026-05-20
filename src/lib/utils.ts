/**
 * Combines multiple CSS class names.
 */
export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Generates a pre-filled WhatsApp link for user support.
 * @param message The pre-filled message text.
 * @returns A string URL to open WhatsApp.
 */
export function generateWhatsAppLink(message: string): string {
  // Support phone number (e.g. +52 for Mexico + 10-digit number)
  const SUPPORT_PHONE = "525512345678"; // Can be modified by the business owner
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${SUPPORT_PHONE}?text=${encodedText}`;
}

/**
 * Formats a date string into readable Spanish format.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * Gets a relative readable time string (e.g., "Hace 2 horas").
 */
export function getRelativeTime(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr${diffHours > 1 ? "s" : ""}`;
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  } catch (e) {
    return dateString;
  }
}
