const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BASE_URL = import.meta.env.BASE_URL;

export function getMediaUrl(path?: string | null): string {
  if (!path) return "";

  // Keep external URLs unchanged
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  // Avoid adding the base path twice
  if (path.startsWith(BASE_URL)) {
    return path;
  }

  // Convert old Manus storage links
  if (path.startsWith("/manus-storage/")) {
    const filename = path.replace("/manus-storage/", "");

    if (SUPABASE_URL) {
      return `${SUPABASE_URL}/storage/v1/object/public/Media/website/${filename}`;
    }

    return `${BASE_URL}images/${filename}`;
  }

  // Convert local image links for GitHub Pages
  if (path.startsWith("/images/")) {
    return `${BASE_URL}${path.slice(1)}`;
  }

  return path;
}