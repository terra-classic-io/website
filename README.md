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
