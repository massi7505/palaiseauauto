# PalpiAuto — Déploiement Vercel (prod)

## 1. Base Postgres (1 fois)
- Crée un Postgres : Vercel > Storage > Postgres (ou Neon / Supabase).
- Copie la `DATABASE_URL` (mode pooled si proposé, avec `?sslmode=require`).

## 2. Variables Vercel (Settings > Environment Variables, env Production)
| Clé | Valeur |
| --- | ------ |
| `DATABASE_URL` | URL Postgres |
| `AUTH_SECRET` | `openssl rand -base64 32` (min 32 caractères) |
| `AUTH_URL` | `https://TON-APP.vercel.app` (après le 1er déploiement, reviens la fixer) |
| `WHATSAPP_PHONE_NUMBER` | `33601639959` |
| `WHATSAPP_API_TOKEN` | Token Meta (test ou prod). Expire ~24h en test : régénère dans Meta Dashboard |
| `WHATSAPP_VERIFY_TOKEN` | Une phrase secrète à toi (ex : `openssl rand -hex 16`). La même dans Meta > Webhook |
| `WHATSAPP_APP_SECRET` | (recommandé) Clé secrète app Meta : Dashboard > Paramètres > De base |
| `ADMIN_EMAIL` | `admin@palpiauto.fr` |
| `ADMIN_PASSWORD` | Mot de passe admin prod (fort, unique) |
| `ADMIN_NAME` | `Administrateur` |

Ne committe JAMAIS le vrai token : uniquement dans Vercel (chiffré).

## 3. Push
```bash
git add -A
git commit -m "Ready for Vercel prod"
git push
```
Vercel build : `prisma generate && prisma db push && next build` (voir `vercel.json`).

## 4. Après le 1er déploiement
1. Fixe `AUTH_URL` = ton URL Vercel, redéploie (onglet Deployments > Redeploy).
2. Crée l'admin + réglages : en local `DATABASE_URL=<prod> npx tsx prisma/seed.ts`
   (le seed ne crée que s'il manque, sans écraser), ou ouvre `/admin/login` si déjà seedé.
3. Ouvre `https://TON-APP.vercel.app/commande` : logo, pubs, horaires OK.
4. Meta Dashboard > Webhook :
   - URL de rappel : `https://TON-APP.vercel.app/api/webhooks/whatsapp`
   - Verify token : celui de Vercel
   - Événement : `messages` → Vérifier et enregistrer.
5. `/admin/settings` §5 : Phone Number ID + Business ID (prod après vérification du numéro),
   coche le mode, active l'IA, teste avec Destinataire + Template `hello_world`.

## 5. Rappel Meta prod
- Numéro pro à vérifier dans WhatsApp Manager (2 numéros max avant vérification entreprise).
- Moyen de paiement requis pour les messages initiés (templates).
- 1er message vers un client = template approuvé ; texte libre uniquement dans les 24h après sa réponse.
- Publie l'app Meta pour sortir du mode test (sinon seuls les numéros testeurs reçoivent).
