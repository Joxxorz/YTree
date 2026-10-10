import { useState } from "react";
import type { Provider } from "./api";

export function ProviderPicker({
  providers,
  busy,
  onAdd,
  onCancel,
}: {
  providers: Provider[];
  busy: boolean;
  onAdd: (ids: string[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const matches = providers.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="picker" aria-label="Add providers">
      <h2>Add your providers</h2>
      <p>Choose all the providers you hold money with.</p>
      <label>
        Search providers
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search banks, pensions or investments"
          disabled={busy}
        />
      </label>
      <div className="provider-options">
        {matches.map((p) => (
          <label className="option" key={p.id}>
            <input
              type="checkbox"
              checked={ids.includes(p.id)}
              disabled={busy}
              onChange={(e) =>
                setIds(
                  e.target.checked
                    ? [...ids, p.id]
                    : ids.filter((id) => id !== p.id),
                )
              }
            />
            <span>
              {p.name}
              <small>{p.category}</small>
            </span>
          </label>
        ))}
      </div>
      {!matches.length && (
        <p>
          {providers.length
            ? "No matching providers. Try another search."
            : "All known providers have already been added."}
        </p>
      )}
      <div className="actions">
        <button disabled={busy || !ids.length} onClick={() => void onAdd(ids)}>
          Add selected ({ids.length})
        </button>
        <button className="secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}
