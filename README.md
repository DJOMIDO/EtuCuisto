# EtuCuisto

Vide ton frigo : des recettes rapides avec ce que tu as déjà, pensées pour les
cuisines d'étudiants. Le projet d'origine (2022, PHP/Python/jQuery) est archivé
dans [`legacy/`](legacy/).

## Stack

- Next.js 16 (App Router) + Tailwind v4
- Neon Postgres + Drizzle ORM, Neon Auth (Google, e-mail/mot de passe)
- IA au choix via `AI_PROVIDER` : Gemini (niveau gratuit, par défaut), Claude
  (Sonnet 5.5 / Haiku 4.5), ou `mock` pour développer hors ligne
- Déploiement : Netlify

## Démarrer

```bash
cp .env.example .env.local   # puis remplir les variables
npm install
npm run db:migrate           # crée les tables dans Neon
npm run dev
```

Après une modification de `src/db/schema.ts` : `npm run db:generate` puis
`npm run db:migrate`.

## API

| Route | Auth | Rôle |
| --- | --- | --- |
| `POST /api/ai/parse` | optionnelle | texte libre → ingrédients |
| `POST /api/ai/recognize` | optionnelle | photo (`image`, 5 Mo max) → ingrédients |
| `POST /api/ai/recipes` | optionnelle | 3 recettes ; invité : envoie `pantry` et `kitchen` |
| `GET/POST /api/pantry`, `PATCH/DELETE /api/pantry/[id]` | requise | frigo |
| `POST /api/pantry/consume` | requise | retire les ingrédients cuisinés |
| `GET/PUT /api/kitchen` | requise | ustensiles, budget, régime |
| `GET/POST /api/recipes`, `PATCH/DELETE /api/recipes/[id]` | requise | favoris et historique |

Quota IA par jour : 30 appels pour un compte, 3 pour un invité (par IP).
