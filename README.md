# www.crit-fumble.com

Crit-Fumble's marketing site — a Next.js static export served as plain files by
Cloudflare. The platform itself (app UI, API) lives in the sibling repos
[`cfg-core-browser`](https://github.com/Crit-Fumble/cfg-core-browser) and
[`cfg-core-server`](https://github.com/Crit-Fumble/cfg-core-server); this repo
is just the front door.

## Develop

You need **Node.js 24.x** (see `engines` in `package.json`). There are no
`@crit-fumble/*` dependencies, so `npm install` needs no GitHub Packages token
— a plain clone + install works.

```bash
npm install
npm run dev          # next dev on :3000
npm run type-check   # tsc --noEmit
npm run build        # static export into out/ (what gets deployed)
```

There is no database and no required environment variable for local dev.

## Static only

`next.config.js` sets `output: 'export'`: the site is plain files, and it stays
that way. Nothing here may need a server on `www.crit-fumble.com` — no route
handlers, no middleware, no server actions. This is a platform security rule, not
a hosting preference. Work that needs a server goes on another hostname.

- Response headers (CSP, HSTS) live in `public/_headers`, which the host applies.
  Keep the HSTS line as it is: the domain's preload entry depends on it.

## Deploy

A merge to `main` does not deploy. The platform's control plane builds a chosen
ref of this repo and publishes `out/`; this repo holds no deploy configuration and
no deploy credential.

The `pre-commit` hook runs a secret scan (`npm run security:scan`); CI runs
`type-check` and the build.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
