import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { api, type Snapshot } from "./api";
vi.mock("./api", () => ({
  api: {
    accounts: vi.fn(),
    providers: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    upload: vi.fn(),
    submit: vi.fn(),
  },
}));
const seed: Snapshot = {
  accounts: [
    {
      provider: { id: "barclays", name: "Barclays", category: "Bank" },
      statement: { filename: "current.pdf", date: "2026-05-01" },
      status: "Uploaded",
    },
    {
      provider: { id: "hsbc", name: "HSBC", category: "Bank" },
      statement: null,
      status: "Missing",
    },
    {
      provider: { id: "vanguard", name: "Vanguard", category: "Investments" },
      statement: { filename: "old.pdf", date: "2026-01-01" },
      status: "Outdated",
    },
  ],
  readyCount: 1,
  canSubmit: false,
  today: "2026-05-31",
  cutoff: "2026-02-28",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.accounts).mockResolvedValue(seed);
  vi.mocked(api.providers).mockResolvedValue([
    ...seed.accounts.map((a) => a.provider),
    { id: "aviva", name: "Aviva", category: "Pension" },
    { id: "fidelity", name: "Fidelity", category: "Investments" },
  ]);
});
describe("account workflow", () => {
  it("shows readiness, filters statuses, and prevents incomplete submit", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText("1 of 3 ready")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit statements →" }),
    ).toBeDisabled();
    await user.selectOptions(
      screen.getByLabelText("Filter by status"),
      "Missing",
    );
    expect(screen.getByRole("heading", { name: "HSBC" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Barclays" }),
    ).not.toBeInTheDocument();
  });
  it("excludes selected providers and allows a batch selection", async () => {
    const user = userEvent.setup();
    vi.mocked(api.add).mockResolvedValue(seed);
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "+ Add provider" }),
    );
    const picker = screen.getByRole("region", { name: "Add providers" });
    expect(within(picker).queryByText("Barclays")).not.toBeInTheDocument();
    await user.click(
      within(picker).getByRole("checkbox", { name: "Aviva Pension" }),
    );
    await user.click(
      within(picker).getByRole("checkbox", { name: "Fidelity Investments" }),
    );
    await user.click(screen.getByRole("button", { name: "Add selected (2)" }));
    await waitFor(() =>
      expect(api.add).toHaveBeenCalledWith(["aviva", "fidelity"]),
    );
  });
  it("retains an upload draft after a server validation failure", async () => {
    const user = userEvent.setup();
    vi.mocked(api.upload).mockRejectedValue(
      new Error("Statement date cannot be in the future."),
    );
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Upload" }));
    await user.type(screen.getByLabelText("Filename"), "hsbc.pdf");
    await user.type(screen.getByLabelText("Statement date"), "2026-05-01");
    await user.click(screen.getByRole("button", { name: "Save statement" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Statement date cannot be in the future.",
    );
    expect(screen.getByLabelText("Filename")).toHaveValue("hsbc.pdf");
    expect(screen.getByText("1 of 3 ready")).toBeInTheDocument();
  });
  it("preserves data after failed submission and supports retry", async () => {
    const user = userEvent.setup();
    vi.mocked(api.accounts).mockResolvedValue({
      ...seed,
      readyCount: 3,
      canSubmit: true,
      accounts: seed.accounts.map((a) => ({
        ...a,
        status: "Uploaded",
        statement: { filename: "current.pdf", date: "2026-05-01" },
      })),
    });
    vi.mocked(api.submit)
      .mockRejectedValueOnce(new Error("Service unavailable"))
      .mockResolvedValueOnce({
        id: "receipt-1",
        providerCount: 3,
        submittedAt: "2026-05-31T12:00:00Z",
      });
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "Submit statements →" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable",
    );
    expect(screen.getByText("3 of 3 ready")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Submit statements →" }),
    );
    expect(
      await screen.findByText(/Submitted successfully: 3 providers/),
    ).toBeInTheDocument();
  });
  it("shows an empty state and keeps empty submission disabled", async () => {
    vi.mocked(api.accounts).mockResolvedValue({
      ...seed,
      accounts: [],
      readyCount: 0,
      canSubmit: false,
    });
    render(<App />);
    expect(
      await screen.findByText("Start with your first provider"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit statements →" }),
    ).toBeDisabled();
  });
  it("reports load failure and retries", async () => {
    const user = userEvent.setup();
    vi.mocked(api.accounts)
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(seed);
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network unavailable",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("1 of 3 ready")).toBeInTheDocument();
  });
});
