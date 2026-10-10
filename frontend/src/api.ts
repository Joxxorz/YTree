export type Status = "Missing" | "Uploaded" | "Outdated";
export interface Provider {
  id: string;
  name: string;
  category: string;
}
export interface Account {
  provider: Provider;
  statement: { filename: string; date: string } | null;
  status: Status;
}
export interface Snapshot {
  accounts: Account[];
  readyCount: number;
  canSubmit: boolean;
  today: string;
  cutoff: string;
}
export interface Receipt {
  id: string;
  providerCount: number;
  submittedAt: string;
}
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message ?? `Request failed (${response.status}). Please try again.`,
    );
  return data as T;
}
export const api = {
  providers: () => request<Provider[]>("/providers"),
  accounts: () => request<Snapshot>("/accounts"),
  add: (providerIds: string[]) =>
    request<Snapshot>("/accounts", "POST", { providerIds }),
  remove: (id: string) =>
    request<Snapshot>(`/accounts/${encodeURIComponent(id)}`, "DELETE"),
  upload: (id: string, filename: string, date: string) =>
    request<Snapshot>(`/accounts/${encodeURIComponent(id)}/statement`, "PUT", {
      filename,
      date,
    }),
  submit: () => request<Receipt>("/submissions", "POST"),
};
