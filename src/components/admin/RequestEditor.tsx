"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateRequestAction } from "@/app/actions";
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
} from "@/lib/validations/order.schema";
import type { RequestStatusValue } from "@/lib/validations/order.schema";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

export function RequestEditor(p: {
  id: string;
  status: RequestStatusValue;
  visitDate: string | null;
  internalNote: string;
}) {
  const [status, setStatus] = useState(p.status);
  const [visitDate, setVisitDate] = useState(p.visitDate ?? "");
  const [note, setNote] = useState(p.internalNote ?? "");
  const [saving, setSaving] = useState(false);

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const res = await updateRequestAction({
        id: p.id,
        status,
        visitDate: visitDate ? visitDate : null,
        internalNote: note,
      });
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-bold text-zinc-900">Suivi garage</h2>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
        Statut
        <select value={status} onChange={(e) => setStatus(e.target.value as RequestStatusValue)} className={fieldClass} aria-label="Statut">
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
        Date de visite / rendez-vous
        <input type="datetime-local" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className={fieldClass} aria-label="Date de visite" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
        Note interne
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Note visible uniquement par le garage" className={fieldClass + " min-h-24 resize-y"} aria-label="Note interne" />
      </label>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-zinc-900 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

