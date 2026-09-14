"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";
import { DAY_KEYS, type DayKey } from "@/lib/settings";

interface Slot {
  open: string;
  close: string;
}

type DayValue = Slot[] | "closed";

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

const DEFAULT_WEEK: Record<DayKey, DayValue> = {
  lundi: [{ open: "08:00", close: "12:00" }, { open: "13:00", close: "17:00" }],
  mardi: [{ open: "08:00", close: "12:00" }, { open: "13:00", close: "17:00" }],
  mercredi: [{ open: "08:00", close: "12:00" }, { open: "13:00", close: "17:00" }],
  jeudi: [{ open: "08:00", close: "12:00" }],
  vendredi: [{ open: "08:00", close: "12:00" }, { open: "13:00", close: "17:00" }],
  samedi: [{ open: "08:00", close: "12:00" }],
  dimanche: "closed",
};

function parseInitial(raw: string): Record<DayKey, DayValue> {
  if (!raw.trim()) return DEFAULT_WEEK;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out = { ...DEFAULT_WEEK };
    for (const day of DAY_KEYS) {
      const v = parsed[day];
      if (v === "closed" || v === "ferme") {
        out[day] = "closed";
      } else if (Array.isArray(v)) {
        const slots = (v as Array<{ open?: unknown; close?: unknown }>)
          .filter((s) => typeof s?.open === "string" && typeof s?.close === "string")
          .map((s) => ({ open: s.open as string, close: s.close as string }));
        out[day] = slots;
      }
    }
    return out;
  } catch {
    return DEFAULT_WEEK;
  }
}

export function OpeningHoursForm({ initialJson, fallbackText }: { initialJson: string; fallbackText: string }) {
  const [days, setDays] = useState<Record<DayKey, DayValue>>(() => parseInitial(initialJson));
  const [legacy, setLegacy] = useState(fallbackText);
  const [saving, setSaving] = useState(false);

  function setClosed(day: DayKey, closed: boolean) {
    setDays((prev) => ({ ...prev, [day]: closed ? "closed" : [{ open: "08:00", close: "12:00" }] }));
  }

  function setSlot(day: DayKey, index: number, patch: Partial<Slot>) {
    setDays((prev) => {
      const cur = prev[day];
      if (cur === "closed") return prev;
      return { ...prev, [day]: cur.map((s, i) => (i === index ? { ...s, ...patch } : s)) };
    });
  }

  function addSlot(day: DayKey) {
    setDays((prev) => {
      const cur = prev[day];
      if (cur === "closed" || cur.length >= 3) return prev;
      return { ...prev, [day]: [...cur, { open: "13:00", close: "17:00" }] };
    });
  }

  function removeSlot(day: DayKey, index: number) {
    setDays((prev) => {
      const cur = prev[day];
      if (cur === "closed") return prev;
      return { ...prev, [day]: cur.filter((_, i) => i !== index) };
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await updateSettingsAction({
        opening_hours_json: JSON.stringify(days),
        opening_hours: legacy,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Erreur.");
        return;
      }
      toast.success("Horaires enregistrés.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {DAY_KEYS.map((day) => {
          const value = days[day];
          const closed = value === "closed";
          const label = day.charAt(0).toUpperCase() + day.slice(1);
          return (
            <li key={day} className="flex flex-col gap-2 border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="w-24 text-sm font-bold text-zinc-900">{label}</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <input type="checkbox" checked={closed} onChange={(e) => setClosed(day, e.target.checked)} />
                  Fermé
                </label>
              </div>
              {closed ? (
                <p className="text-xs text-zinc-500">Fermé toute la journée.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(value as Slot[]).map((slot, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                      <span>{i === 0 ? "Matin" : i === 1 ? "Après-midi" : `Créneau ${i + 1}`}</span>
                      <input type="time" value={slot.open} onChange={(e) => setSlot(day, i, { open: e.target.value })} className={inputClass} aria-label={`${label} ouverture ${i + 1}`} />
                      <span>à</span>
                      <input type="time" value={slot.close} onChange={(e) => setSlot(day, i, { close: e.target.value })} className={inputClass} aria-label={`${label} fermeture ${i + 1}`} />
                      {(value as Slot[]).length > 1 ? (
                        <button type="button" onClick={() => removeSlot(day, i)} className="rounded border border-zinc-300 px-2 py-1 font-semibold hover:bg-zinc-100">
                          Retirer
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {(value as Slot[]).length < 3 ? (
                    <button type="button" onClick={() => addSlot(day)} className="self-start rounded border border-zinc-300 px-2 py-1 text-xs font-semibold hover:bg-zinc-100">
                      + Ajouter un créneau (ex : 13h-17h)
                    </button>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="opening_hours_legacy" className="px-1 text-sm font-semibold text-zinc-700">
          Texte libre (secours)
        </label>
        <textarea
          id="opening_hours_legacy"
          value={legacy}
          onChange={(e) => setLegacy(e.target.value)}
          rows={2}
          placeholder="Lun-Ven : 08h-12h puis 13h-17h"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
      </div>
      <button type="button" onClick={save} disabled={saving} className="self-start rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60">
        {saving ? "Enregistrement…" : "Enregistrer les horaires"}
      </button>
    </div>
  );
}

