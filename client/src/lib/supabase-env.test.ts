import { describe, expect, it } from "vitest";

describe("Supabase environment", () => {
  it("can query the existing pages table with the publishable key", async () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();
    const response = await fetch(`${url}/rest/v1/pages?select=id&limit=1`, { headers: { apikey: key!, Authorization: `Bearer ${key}` } });
    expect(response.ok).toBe(true);
  }, 15000);
});
