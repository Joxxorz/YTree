import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});
it("uses the deployed backend origin and preserves request payloads", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://ytree-api.example.com/");
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ accounts: [] }) });
  vi.stubGlobal("fetch", fetchMock);
  const { api } = await import("./api");
  await api.upload("hsbc", "statement.pdf", "2026-10-10");
  expect(fetchMock).toHaveBeenCalledWith(
    "https://ytree-api.example.com/api/accounts/hsbc/statement",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ filename: "statement.pdf", date: "2026-10-10" }),
    }),
  );
});
it("defaults to the local same-origin API and reports server errors", async () => {
  vi.stubEnv("VITE_API_BASE_URL", "");
  const fetchMock = vi
    .fn()
    .mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: "Current statements required" }),
    });
  vi.stubGlobal("fetch", fetchMock);
  const { api } = await import("./api");
  await expect(api.submit()).rejects.toThrow("Current statements required");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/submissions",
    expect.objectContaining({ method: "POST" }),
  );
});
