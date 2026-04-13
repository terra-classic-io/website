# Terra-Classic.io

This repository powers [terra-classic.io](https://terra-classic.io),
an unofficial information and documentation page for the
Terra Classic ecosystem.

## Features

- **Ecosystem directory** with applications, infrastructure,
  analytics tools, wallets, and markets.
- **Search-first discovery flow** with keyword search and
  featured-resource filtering.
- **Documentation shell** that renders guides from the `src/docs/` tree.
- **Responsive UI** built with React, Vite, and Tailwind CSS.
- **Server-side rendering (SSR)** support through Vite and
  Cloudflare Pages Workers.
- **SEO foundations** including titles, descriptions,
  canonical URLs, and social metadata.

## Getting started

```bash
yarn install
yarn dev
```

The development server runs on Vite with hot module replacement.
Use **Yarn 1.22.x** as pinned in `package.json`.

## Available scripts

- `yarn dev` – start the local development server.
- `yarn lint` – lint TypeScript, TSX, and markdown files.
- `yarn type-check` – run a TypeScript type check.
- `yarn check:projects` – validate project names and URLs.
- `yarn build` – create production assets and SSR bundles.
- `yarn build:pages` – generate static assets and worker bundles.
- `yarn deploy:pages` – build and deploy with Wrangler.

## Deployment

1. Build the Pages artifacts locally with `yarn build:pages`.
2. Deploy via Wrangler:

   ```bash
   wrangler pages deploy dist --project-name terraclassic-io
   ```

3. Confirm the live deployment in the Cloudflare dashboard.

## Project structure

- `src/` – React components, docs content, routing,
  design tokens, and discovery utilities.
- `public/` – static assets served as-is.
- `scripts/` – maintenance utilities such as project-link validation.
- `dist/` – build output from `yarn build` or `yarn build:pages`.
- `wrangler.toml` – Cloudflare configuration.

## Content maintenance

The ecosystem directory is curated and should be reviewed regularly.
A simple review loop:

1. Run `yarn check:projects` before opening a PR.
2. Confirm important links still resolve.
3. Make sure descriptions still match the live product.
4. Remove stale, rebranded, or deprecated entries quickly.

## Contributing

This project grows through Terra Classic community collaboration.
If you want to help:

- Open an issue for bugs, missing content, or new ideas.
- Submit pull requests for components, docs, or data updates.
- Keep changes scoped and follow the existing coding conventions.
- Discuss larger proposals with maintainers before implementation.

## Support and resources

- **Docs**: `/docs` route for validator, governance,
  and developer guides.
- **Network endpoints**: curated LCD, RPC, gRPC, and FCD providers.
- **SDK**: prefer the classic-focused `@goblinhunt/cosmes`
  JavaScript SDK for integrations.

## License

This repository is maintained by the Terra Classic community.
Submit questions via issues if clarification is needed.
