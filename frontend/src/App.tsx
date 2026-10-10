import { useEffect, useState } from "react";
import { api, type Provider, type Snapshot, type Status } from "./api";
import { StatementForm } from "./StatementForm";
import { ProviderPicker } from "./ProviderPicker";

export function App() {
  const [state, setState] = useState<Snapshot | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Status | "All">("All");
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const [accounts, catalogue] = await Promise.all([
        api.accounts(),
        api.providers(),
      ]);
      setState(accounts);
      setProviders(catalogue);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load accounts.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  // Refresh authoritative statuses on tab return and across midnight without discarding drafts.
  useEffect(() => {
    if (busy) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "visible")
        void api
          .accounts()
          .then((next) => {
            if (active) setState(next);
          })
          .catch(() => {});
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [busy]);
  async function mutate(
    action: () => Promise<Snapshot>,
    message: string,
    done?: () => void,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setState(await action());
      setNotice(message);
      done?.();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const receipt = await api.submit();
      setNotice(
        `Submitted successfully: ${receipt.providerCount} providers. Reference ${receipt.id}.`,
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Submission failed. Your statements have been kept.",
      );
    } finally {
      setBusy(false);
    }
  }
  const available = providers.filter(
    (p) => !state?.accounts.some((a) => a.provider.id === p.id),
  );
  const visible =
    state?.accounts.filter((a) => filter === "All" || a.status === filter) ??
    [];
  return (
    <main>
      <header className="masthead">
        <a className="brand" href="/">
          Y TREE<span>YOUR FINANCIAL LIFE, CONNECTED</span>
        </a>
        <span className="step">CLIENT ONBOARDING · STEP 1</span>
      </header>
      <section className="intro">
        <p className="eyebrow">LET’S GET THE FULL PICTURE</p>
        <h1>Connect your accounts</h1>
        <p>
          Add the providers you hold money with and share a recent statement for
          each. We’ll take it from there.
        </p>
      </section>
      {error && (
        <div role="alert" className="feedback error">
          {error} Your existing account data has been kept.
        </div>
      )}
      {notice && (
        <div role="status" className="feedback success">
          {notice}
        </div>
      )}
      {loading ? (
        <p role="status">Loading your accounts…</p>
      ) : !state ? (
        <button onClick={() => void load()}>Try again</button>
      ) : (
        <>
          <section
            className="accounts-panel"
            aria-label="Your accounts"
            aria-busy={busy}
          >
            <div className="panel-header">
              <div>
                <h2>Your providers</h2>
                <p className="readiness">
                  {state.readyCount} of {state.accounts.length} ready
                </p>
              </div>
              <label className="filter">
                Filter by status
                <select
                  value={filter}
                  disabled={busy}
                  onChange={(e) => setFilter(e.target.value as Status | "All")}
                >
                  <option value="All">All statuses</option>
                  <option>Missing</option>
                  <option>Uploaded</option>
                  <option>Outdated</option>
                </select>
              </label>
            </div>
            <progress
              value={state.readyCount}
              max={state.accounts.length || 1}
              aria-label="Statement readiness"
            />
            <p className="hint">
              Statements dated {state.cutoff} or later count as current. Dates
              are assessed in UTC.
            </p>
            <div className="account-list">
              {visible.map((account) => (
                <article className="account" key={account.provider.id}>
                  <div className="account-row">
                    <div className="provider-name">
                      <span className="monogram" aria-hidden="true">
                        {account.provider.name[0]}
                      </span>
                      <div>
                        <h3>{account.provider.name}</h3>
                        <small>{account.provider.category}</small>
                      </div>
                    </div>
                    <span className={`badge ${account.status.toLowerCase()}`}>
                      {account.status}
                    </span>
                    <div className="statement-info">
                      {account.statement ? (
                        <>
                          <span>{account.statement.filename}</span>
                          <small>{account.statement.date}</small>
                        </>
                      ) : (
                        <span>No statement yet</span>
                      )}
                    </div>
                    <div className="actions">
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditing(account.provider.id);
                          setError("");
                        }}
                        aria-expanded={editing === account.provider.id}
                      >
                        {account.statement ? "Replace" : "Upload"}
                      </button>
                      <button
                        className="remove"
                        aria-label={`Remove ${account.provider.name}`}
                        disabled={busy}
                        onClick={() =>
                          void mutate(
                            () => api.remove(account.provider.id),
                            `${account.provider.name} removed.`,
                            () => setEditing(null),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {editing === account.provider.id && (
                    <StatementForm
                      key={account.provider.id}
                      account={account}
                      today={state.today}
                      busy={busy}
                      onCancel={() => setEditing(null)}
                      onSave={(filename, date) =>
                        mutate(
                          () => api.upload(account.provider.id, filename, date),
                          `Statement saved for ${account.provider.name}.`,
                          () => setEditing(null),
                        )
                      }
                    />
                  )}
                </article>
              ))}
            </div>
            {!visible.length && (
              <div className="empty">
                <h3>
                  {state.accounts.length
                    ? "No providers with this status"
                    : "Start with your first provider"}
                </h3>
                <p>
                  {state.accounts.length
                    ? "Choose another filter to see your accounts."
                    : "Add a bank, pension or investment provider to get started."}
                </p>
              </div>
            )}
            <div className="panel-footer">
              <button
                className="secondary"
                disabled={busy || picker}
                onClick={() => setPicker(true)}
              >
                + Add provider
              </button>
              <span role="status">{busy ? "Saving…" : ""}</span>
            </div>
          </section>
          {picker && (
            <ProviderPicker
              providers={available}
              busy={busy}
              onCancel={() => setPicker(false)}
              onAdd={(ids) =>
                mutate(
                  () => api.add(ids),
                  "Providers added. Upload a statement for each.",
                  () => setPicker(false),
                )
              }
            />
          )}
          <section className="submit-bar">
            <div>
              <h2>
                {state.canSubmit
                  ? "You’re ready to submit"
                  : "A little more to connect"}
              </h2>
              <p>
                {state.canSubmit
                  ? "Every provider has a current statement."
                  : state.accounts.length
                    ? `${state.accounts.length - state.readyCount} providers still need a current statement.`
                    : "Add at least one provider and a current statement."}
              </p>
            </div>
            <button
              disabled={busy || !state.canSubmit}
              onClick={() => void submit()}
            >
              {busy ? "Please wait…" : "Submit statements →"}
            </button>
          </section>
        </>
      )}
      <footer>
        Statements stay in this demo’s memory only. Restarting the service
        restores the sample accounts.
      </footer>
    </main>
  );
}
