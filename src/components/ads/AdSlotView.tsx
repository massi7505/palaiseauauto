"use client";

import { useState } from "react";
import type { AdSlotData } from "@/lib/settings";

const HEIGHT_BY_SLOT: Record<string, string> = {
  leaderboard_top: "h-20 sm:h-24",
  sidebar_right: "h-64",
  in_feed: "h-32 sm:h-40",
  mobile_sticky: "h-14",
};

export function AdSlotView({ ad, className }: { ad: AdSlotData | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!ad || (!ad.imageUrl && !ad.title)) return null;
  // <img> simple : accepte /uploads/... et https://... sans passer par next/image
  // (pas de remotePatterns à maintenir, pas d'échec d'optimisation).
  // Si l'image distante ne charge pas (hotlink bloqué, URL morte), on affiche
  // le titre plutôt qu'une icône cassée.
  const showImg = Boolean(ad.imageUrl) && !failed;
  const inner = showImg ? (
    <span className={`block w-full overflow-hidden ${HEIGHT_BY_SLOT[ad.slot] ?? "h-28"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.imageUrl}
        alt={ad.title || "Publicité"}
        loading="lazy"
        onError={() => setFailed(true)}
        className="mx-auto h-full w-full object-contain"
      />
    </span>
  ) : (
    <span className="block px-4 py-3 text-center text-sm font-semibold text-zinc-700">{ad.title || "Publicité"}</span>
  );
  const box = `overflow-hidden border border-zinc-200 bg-white ${className ?? ""}`;
  const label = (
    <span className="block border-b border-zinc-100 px-2 py-1 text-center text-[10px] uppercase tracking-widest text-zinc-400">
      Publicité
    </span>
  );
  if (ad.linkUrl) {
    return (
      <aside aria-label={`Publicité : ${ad.title || ad.slot}`} className={box}>
        {label}
        <a href={ad.linkUrl} target="_blank" rel="sponsored noopener noreferrer">
          {inner}
        </a>
      </aside>
    );
  }
  return (
    <aside aria-label={`Publicité : ${ad.title || ad.slot}`} className={box}>
      {label}
      {inner}
    </aside>
  );
}



