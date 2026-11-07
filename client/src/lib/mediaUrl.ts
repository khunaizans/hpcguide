const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

  // Convert old Manus Storage paths to Supabase Storage
  if (path.startsWith("/manus-storage/")) {
    const filename = path.replace("/manus-storage/", "");

    if (SUPABASE_URL) {
      return `${SUPABASE_URL}/storage/v1/object/public/Media/website/${filename}`;
    }

    return `${import.meta.env.BASE_URL}images/${filename}`;
  }

  // Fix local image paths for GitHub Pages
  if (path.startsWith("/images/")) {
    return `${import.meta.env.BASE_URL}${path.slice(1)}`;
  }

  // Keep other paths unchanged
  return path;
}