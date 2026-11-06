const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function getMediaUrl(path?: string | null) {
  if (!path) return "";

  // Keep normal/external URLs unchanged
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

    return `${SUPABASE_URL}/storage/v1/object/public/Media/website/${filename}`;
  }

  return path;
}