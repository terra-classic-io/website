# Terra-Classic.io

This repository powers [terra-classic.io](https://terra-classic.io), an unofficial information and documentation page for the Terra Classic ecosystem.

## Features

- **Ecosystem directory** with applications, infrastructure providers, and analytics tools.
- **Documentation shell** that renders guides from the `src/docs/` tree.
- **Responsive UI** implemented with React, Vite, and Tailwind CSS for desktop and mobile visitors.
- **Server-side rendering (SSR)** support through Vite and Cloudflare Pages Workers for fast first paint.

## Getting started

```bash
yarn install
yarn dev
```

The development server runs on Vite with hot module replacement. Ensure you are using **Yarn 1.22.x** as pinned in `package.json`.

## Available scripts

- `yarn dev` – start the local development server.
- `yarn lint` – lint all TypeScript and TSX sources with ESLint.
- `yarn type-check` – perform a TypeScript type check without emitting output.
- `yarn build` – create production assets and SSR bundles for Node targets.
- `yarn build:pages` – generate static assets and worker bundles for Cloudflare Pages.
- `yarn deploy:pages` – run the Pages build and deploy using Wrangler.

## Deployment

1. Build the Pages artifacts locally with `yarn build:pages`.
2. Deploy via Wrangler:

   ```bash
   wrangler pages deploy dist --project-name terraclassic-io
   ```

3. Confirm the live deployment in the Cloudflare dashboard.

## Project structure

- `src/` – React components, documentation content, design system tokens, and routing.
- `public/` – Static assets served as-is (logos, etc.).
- `dist/` – Build output produced by `yarn build` or `yarn build:pages`.
- `wrangler.toml` – Cloudflare configuration, including the Pages output directory.

## Contributing

This project thrives on community collaboration. Documentation and site improvements live and grow through Terra Classic community effort. If you want to help:

- Open an issue describing bugs, missing content, or new ideas.
- Submit pull requests with improvements to components, docs, or data sources.
- Keep contributions scoped and follow the existing coding conventions (TypeScript types, descriptive naming, single-purpose components).
- Discuss larger proposals with the maintainers on the repository issues or community channels before implementation.

## Support & resources

- **Docs**: `/docs` route inside the site for validator, governance, and developer guides.
- **Network endpoints**: Curated LCD, RPC, gRPC, and FCD providers from PublicNode, Hexxagon, and BiNodes.
- **SDK**: Prefer the classic-focused `@goblinhunt/cosmes` JavaScript SDK when building integrations.

## License

This repository is maintained by the Terra Classic community. Submit questions via issues if clarification is needed.

## Hyperlane governance dashboard

The read-only dashboard is available at `/docs/develop/hyperlane/governance`, with an overview on the general Governance page. Its GET-only API (`/api/hyperlane/governance`) runs in Vite, the Node server, and the Cloudflare Pages worker. The server coalesces concurrent reads and caches a snapshot for one minute per running instance; the browser refreshes every two minutes.

For production, configure `SAFE_API_KEY` as a **server-side secret** in the Cloudflare Pages project (or as a process environment variable for Vite/Node). Do not use a `VITE_` prefix or commit the key. Safe's unauthenticated service is intended for exploration and has much lower quotas; see [Safe API authentication](https://docs.safe.global/core-api/how-to-use-api-keys). Public RPC membership and owner reads continue independently when the Safe indexer is unavailable. Cache instances and quotas are not shared between distributed workers.

Maintain the contract inventory in `src/data/hyperlane-governance.ts`. Source failures, bounded history, and unsupported authority reads are explicitly displayed; the dashboard must not convert them into a clean bill of health. The implementation covers selected authority roles rather than a complete audit of the deployment.

Run `yarn test:hyperlane-governance` to verify that unavailable sources are reported explicitly instead of appearing as empty activity. This test does not use recorded blockchain data.

## Hyperlane validator dashboard

The validator API (`/api/hyperlane/validators`) reuses live snapshots for 60 seconds and coalesces concurrent refreshes per instance. Cloudflare also stores responses in its data-center-local Cache API, with the remaining snapshot lifetime. Cache failures fall back to the bounded loader; there is no global cache or cross-instance lock. The browser refreshes every two minutes and shows the snapshot timestamp.

Each refresh allows at most 48 external requests (including fallbacks), six at a time, with an eight-second request timeout covering the response body and a 20-second overall deadline. Redirects are rejected and response bodies are limited to 1 MiB. Checkpoint reads cover at most 32 announced validators and the last three unique storage locations per validator. Unchecked or unavailable data stays unknown; an incomplete checkpoint search can confirm a current checkpoint but cannot establish that a validator is behind.

An unavailable announcement list produces `Unknown`, not `Not announced` or zero announced validators. Storage-location or Merkle-hook failures do not discard a successfully loaded announcement list. All displayed activity comes from live sources; no recorded blockchain data is used as a fallback.

Run `yarn test:hyperlane-validators` for regression checks of source failures, request limits, timeouts, and cache reuse. Tests generate synthetic responses only within the test process; they are not imported by the application.
