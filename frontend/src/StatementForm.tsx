import { useState } from "react";
import type { Account } from "./api";

export function StatementForm({
  account,
  today,
  busy,
  onSave,
  onCancel,
}: {
  account: Account;
  today: string;
  busy: boolean;
  onSave: (filename: string, date: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [filename, setFilename] = useState(account.statement?.filename ?? "");
  const [date, setDate] = useState(account.statement?.date ?? "");
  return (
    <form
      className="statement-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(filename, date);
      }}
    >
      <label>
        Filename
        <input
          required
          maxLength={200}
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="statement.pdf"
          disabled={busy}
        />
      </label>
      <label>
        Statement date
        <input
          required
          type="date"
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={busy}
        />
      </label>
      <p className="hint">
        Demo upload: enter a filename and date. No file is transferred.
      </p>
      <div className="actions">
        <button disabled={busy || !filename.trim() || !date}>
          Save statement
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
