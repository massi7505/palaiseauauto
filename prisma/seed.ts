import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const DEFAULT_SETTINGS: Array<[string, string]> = [
  ["brand_name", "PalpiAuto"],
  ["company_name", "Palaiseau Pièces Auto"],
  ["contact_email", "contact@palpiauto.com"],
  ["address", "5 Av. du Général de Gaulle, 91120 Palaiseau"],
  ["garage_phone", "06 01 63 99 59"],
  ["whatsapp_phone", "33601639959"],
  ["opening_hours_json", JSON.stringify({
    lundi: [{ open: "08:30", close: "12:00" }, { open: "14:00", close: "17:30" }],
    mardi: [{ open: "08:30", close: "12:00" }, { open: "14:00", close: "17:30" }],
    mercredi: [{ open: "08:30", close: "12:00" }, { open: "14:00", close: "17:30" }],
    jeudi: [{ open: "08:30", close: "12:00" }, { open: "14:00", close: "17:30" }],
    vendredi: [{ open: "08:30", close: "12:00" }, { open: "14:00", close: "17:30" }],
    samedi: [{ open: "08:30", close: "12:30" }],
    dimanche: "closed",
  })],
  ["ads_enabled", "false"],
  ["whatsapp_phone_id", "1286370141229167"],
  ["whatsapp_business_id", "1592890272109517"],
  ["whatsapp_mode", "test"],
  ["whatsapp_ai_enabled", "false"],
  ["whatsapp_ai_prompt", ""],
];

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "admin@palpiauto.fr")
    .toLowerCase()
    .trim();
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const name = process.env.ADMIN_NAME ?? "Administrateur";

  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { password: hash, name, role: "ADMIN" },
    create: { email, password: hash, name, role: "ADMIN" },
  });

  console.log(`Compte admin prêt : ${admin.email}`);

  for (const [key, value] of DEFAULT_SETTINGS) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing || !existing.value) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
  }
  console.log("Paramètres par défaut vérifiés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
