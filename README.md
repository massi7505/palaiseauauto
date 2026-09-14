# PalpiAuto — Application de commande de pièces auto

Application Next.js full stack : page publique de commande (mobile-first, HeroUI + Tailwind)
avec envoi WhatsApp, et espace admin protégé (dashboard, demandes, fiches clients, export CSV).

## Démarrage rapide (local, sans serveur SQL)

Prérequis : Node.js 20+.

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

- Page publique : http://localhost:3000/commande (la racine redirige vers /commande)
- Admin : http://localhost:3000/admin — seed : admin@palpiauto.fr / Admin123!

## Variables d'environnement

Voir `.env.example` : DATABASE_URL, AUTH_SECRET, AUTH_URL, WHATSAPP_PHONE_NUMBER,
ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.

## Production (Vercel + Neon/Supabase)

1. Créez une base PostgreSQL.
2. Dans prisma/schema.prisma, passez provider en "postgresql".
3. Renseignez DATABASE_URL Postgres sur Vercel.
4. Lancez `npx prisma migrate dev --name init` puis `npm run db:seed`.
5. Redéployez (AUTH_SECRET + AUTH_URL de prod requis).
