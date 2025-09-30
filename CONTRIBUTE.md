# Contribute to terra-classic.io

## Code style

- **Stay consistent**: follow the existing TypeScript style (explicit types, immutable data) and keep components focused.
- **Documentation**: use markdown for content.

## Where to update content

- **Documentation navigation (`src/data/docs.ts`)**: Import new markdown files at the top of the file, then add `DocPage` entries to the relevant section inside the exported `docSections` array. Every page needs a unique `slug`, human-readable `title`, concise `summary`, and the `markdown` reference pointing to a file under `src/docs/`. Child pages should be nested through the `children` property so that the sidebar and the prev/next footer render correctly.

  Example:

  ```ts
  import developerPlaybookGuide from "../docs/develop/playbook/developer-playbook.md";
  import developerPlaybookWalletGuide from "../docs/develop/playbook/wallet-testing.md";

  const developPlaybook: DocPage = {
    slug: "developer-playbook",
    title: "Developer playbook",
    summary: "Recommended tooling, endpoints, and deployment workflows for Terra Classic dApps.",
    markdown: developerPlaybookGuide,
    children: [
      {
        slug: "wallet-testing",
        title: "Wallet testing",
        summary: "Wire Keplr, Galaxy Station, and MnemonicWallet into your QA matrix.",
        markdown: developerPlaybookWalletGuide,
      },
    ],
  };

  export const docSections: readonly DocSection[] = [
    {
      slug: "develop",
      title: "Develop",
      description: "Build Terra Classic dApps, run localnets, and reference Terra Core modules.",
      pages: [developLocalnet, developBuilderTooling, developPlaybook],
    },
  ];
  ```

- **Markdown guides (`src/docs/`)**: Place end-user and developer content as Markdown files that mirror the slug structure used in `src/data/docs.ts`. Do NOT begin a file with a level-one `#` heading as this will be added from the title and summary you added in the `doc.ts`, surround lists with blank lines, and keep Terra Classic references up to date (public endpoints, tooling, wallets, …). When you add a new page, ensure the folder path matches the `slug` hierarchy configured in the navigation data.

  Example:

  ```markdown
  Connect to the rebased PublicNode RPC before running local scripts:

  1. Install `@goblinhunt/cosmes` with `yarn add @goblinhunt/cosmes`.
  2. Configure the client:

     \`\`\`ts
     const client = await createCosmesClient({
       rpcUrl: "https://terra-classic-rpc.publicnode.com",
     });
     \`\`\`

  3. Broadcast against `columbus-5`.
  ```

- **Ecosystem listings (`src/data/projects.ts`)**: Update links, names, descriptions, indicators, and logos here. Each entry in the category `links` array should provide `name`, `url`, `description`, an `indicator` (`onchain`, `hybrid`, `support`), and optionally a `logo` path. Keep indicators accurate and reuse existing logos when possible.

  Example:

  ```ts
  {
    name: "Classic Metrics",
    url: "https://classicmetrics.io",
    description: "Dashboards for validators, staking ratios, and burn analytics.",
    indicator: "support",
    logo: "/public/logos/tools/classic-metrics.png",
  }
  ```

- **Logos and static assets (`public/logos/`)**: Store PNG, JPG, or WebP assets referenced from `src/data/projects.ts`. Use lowercase, kebab-case filenames grouped by subdirectory (for example `public/logos/wallets/keplr.png`). Optimize images before committing to avoid bloating the bundle. Preferred size is 128x128 px to 256x256 px, PNG with transparent background.

  Example:

  ```text
  public/
    logos/
      tools/
        classic-metrics.png   # 256x256 transparent PNG (45 KB)
      wallets/
        galaxy-station.webp   # 180x180 optimized WebP (22 KB)
  ```

## Deployment

- **Create a pull request**: Open a pull request against the `main` branch.
- **Approval**: Wait for approval from at least two maintainers.
- **Merge**: After approval, the pull request is merged into the `main` branch.
- **Deploy**: The website update is deployed automatically.
