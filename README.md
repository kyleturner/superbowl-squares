# Super Bowl Squares

Interactive NFL Super Bowl Squares game — mobile-responsive web app. No accounts required; players enter a name and claim squares. The first person to open a game link is the admin and can reset the board or populate numbers.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a game, share the link, and have players join and claim squares.

## Deploy to Netlify

1. Push the repo to GitHub, GitLab, or Bitbucket.
2. In [Netlify](https://app.netlify.com), click **Add new site** → **Import an existing project** and connect the repo.
3. Netlify will detect Next.js and use the OpenNext adapter. Build settings are in `netlify.toml` (Node 20.19.33, `npm run build`).
4. Deploy. Your site will be available at `https://<your-site>.netlify.app`.

**Note:** Game state is in-memory on the server. On Netlify, serverless functions are stateless, so game state will not persist across requests or deploys. For production you’ll need a persistent store (e.g. Redis, Upstash, or a database) and to replace the in-memory store in `src/lib/game-store.ts`.

## Tech

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Game state is stored in memory (per game ID). For persistence across restarts (or on serverless platforms like Netlify), swap the in-memory store for Redis, Vercel KV, or a database.

## Team logos and branding

- `public/nfl-shield.svg` — NFL shield (brand colors).
- `public/teams/seahawks.svg` and `public/teams/patriots.svg` — helmet-style team graphics in official colors. Replace with licensed NFL/team assets if needed.
