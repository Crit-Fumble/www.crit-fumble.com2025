# www.crit-fumble.com

Crit-Fumble's marketing site — a static-content Next.js app deployed on
Vercel. The platform itself (app UI, API) lives in the sibling repos
[`cfg-core-browser`](https://github.com/Crit-Fumble/cfg-core-browser) and
[`cfg-core-server`](https://github.com/Crit-Fumble/cfg-core-server); this repo
is just the front door.

## Develop

You need **Node.js 22.x** (see `engines` in `package.json`). There are no
`@crit-fumble/*` dependencies, so `npm install` needs no GitHub Packages token
— a plain clone + install works.

```bash
npm install
npm run dev          # next dev on :3000
npm run type-check   # tsc --noEmit
npm run build        # production build (what Vercel runs)
```

There is no database and no required environment variable for local dev.

## Deploy

Pushes to `main` deploy automatically via Vercel. The `pre-commit` hook runs a
secret scan (`npm run security:scan`); CI runs `type-check`.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
