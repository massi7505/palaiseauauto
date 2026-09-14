import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";

const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".svg"]);
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
]);

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop lourd (2 Mo max)." }, { status: 400 });
  }

  const ext = extname(file.name || "").toLowerCase();
  if ((ext && !ALLOWED_EXT.has(ext)) || (file.type && !ALLOWED_MIME.has(file.type))) {
    return NextResponse.json({ error: "Format d'image non accepté (png, jpg, webp, gif, ico, svg)." }, { status: 400 });
  }

  const safeExt = ALLOWED_EXT.has(ext) ? ext : ".png";
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${safeExt}`;
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
