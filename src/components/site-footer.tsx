import { ArrowRight, Github, MessageCircle, Send } from "lucide-react";
import terraClassicLogoUrl from "../assets/terra-classic.svg";
import { siteLinks } from "../data/site-links";

type SiteFooterProps = {
  readonly lastUpdated?: string;
};

const footerGroups = [
  {
    title: "Learn",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Ecosystem directory", href: "/ecosystem" },
      { label: "Guides", href: "/docs/learn" },
      { label: "Brand assets", href: "/docs/learn/assets" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Forum", href: siteLinks.communityForum },
      { label: "Validator resources", href: "/ecosystem?cat=validators" },
      { label: "Blockchain information", href: "/ecosystem?cat=blockchain-information" },
      { label: "Wallets", href: "/ecosystem?cat=wallets" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Developer docs", href: "/docs/develop" },
      { label: "Network endpoints", href: "/docs/develop/endpoints" },
      { label: "Ecosystem directory", href: "/ecosystem" },
      { label: "Interactive project map", href: "/ecosystem" },
    ],
  },
] as const;

function SiteFooter({ lastUpdated }: SiteFooterProps): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/95 dark:border-white/10 dark:bg-[#020b19]">
      <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.3fr_repeat(3,0.75fr)_1.2fr] lg:px-10">
        <div>
          <a href="/" className="flex items-center gap-3">
            <img src={terraClassicLogoUrl} alt="" className="h-9 w-9" />
            <span className="text-lg font-semibold text-slate-950 dark:text-white">Terra Classic</span>
          </a>
          <p className="mt-4 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
            Community-owned. Built for everyone. A curated gateway to the original Terra network.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a href={siteLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="footer-social"><Github size={16} /></a>
            <a href={siteLinks.communityForum} target="_blank" rel="noopener noreferrer" aria-label="Community forum" className="footer-social"><MessageCircle size={16} /></a>
            <a href={siteLinks.communityDiscord} target="_blank" rel="noopener noreferrer" aria-label="Community Discord" className="footer-social">
              <img src="/logos/validators/discord.svg" alt="" className="h-4 w-4 object-contain dark:hidden" />
              <img src="/logos/validators/discord-dark.svg" alt="" className="hidden h-4 w-4 object-contain dark:block" />
            </a>
            <a href={siteLinks.communityTelegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="footer-social"><Send size={16} /></a>
          </div>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold text-slate-950 dark:text-white">{group.title}</h2>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-xs text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="text-xs font-semibold text-slate-950 dark:text-white">Stay updated</h2>
          <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Follow project updates and community conversations across the ecosystem.</p>
          <a
            href={siteLinks.communityForum}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
          >
            Join the community
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-white/10">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-2 px-5 py-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>© {currentYear} Terra-Classic.io. All rights reserved.</p>
          <p>{lastUpdated ? `Content updated ${lastUpdated}` : "Community-curated content"}</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
