import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        onClick={onClick}
        className="flex justify-between items-center w-full py-4 text-left font-medium text-gray-900 dark:text-white hover:text-terra-blue dark:hover:text-terra-green focus:outline-none transition-colors duration-200"
      >
        <span className="text-lg">{question}</span>
        {isOpen ? 
          <ChevronUp size={20} className="text-gray-600 dark:text-gray-300" /> : 
          <ChevronDown size={20} className="text-gray-600 dark:text-gray-300" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] pb-4' : 'max-h-0'}`}>
        <div className="text-gray-600 dark:text-gray-300 prose max-w-none dark:prose-invert">
          {answer}
        </div>
      </div>
    </div>
  );
};

const FAQAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is Terra Classic and how is it different from Terra?",
      answer: (
        <>
          <p>
            Terra Classic (LUNC) is the original Terra blockchain that stayed online after the 2022 collapse. The community kept maintaining the chain, validators, and governance. Terra 2.0 is a separate network launched by Terraform Labs without the algorithmic stablecoin. Both chains now evolve independently.
          </p>
          <p>
            Terra Classic relies on community proposals and open-source contributors, with no central ownership. If you hold LUNC or USTC, you are on Terra Classic. New apps, tooling, and community initiatives referenced on this site focus on Terra Classic.
          </p>
        </>
      ),
    },
    {
      question: "How can I stake LUNC today and what rewards should I expect?",
      answer: (
        <>
          <p>
            To stake LUNC, connect a wallet such as `Keplr`, `Galaxy Station`, or `Cosmostation`, choose a validator, and delegate tokens. Staking APR moves with governance parameters and network usage. As of 2025 it typically ranges between 6% and 8% annualized.
          </p>
          <p>
            Rewards stay in the distribution module until you claim them. Remember that staking comes with a 21-day unbonding period; undelegated tokens cannot be moved until that period ends and do not gain rewards. Diversifying among trustworthy validators reduces risk of slashing events.
          </p>
        </>
      ),
    },
    {
      question: "Where can I track burn progress and supply changes for LUNC?",
      answer: (
        <>
          <p>
            Burn activity is tracked by several community dashboards including `LUNC Burner`, `LUNC Metrics`, and `LuncDash`. They aggregate on-chain tax burns, community burn wallets, and exchange burns that are publicly disclosed.
          </p>
          <p>
            You can also verify supply changes directly on-chain using explorers such as `Galaxy Finder` or `AtomScan`. Look for the `Distribution` or `Supply` tabs to see current totals and burn transactions.
          </p>
        </>
      ),
    },
    {
      question: "What should I know before buying or trading USTC?",
      answer: (
        <>
          <p>
            USTC is no longer a collateral-backed stablecoin. Price fluctuates with speculation on repeg plans and treasury strategies. Always check the current market price and liquidity depth before trading.
          </p>
          <p>
            The community is exploring partial collateralization and treasury programs, but none guarantee a $1 peg. Treat USTC as a volatile asset and diversify risk. Use reputable exchanges listed in the `Markets` section and enable two-factor authentication for your accounts.
          </p>
        </>
      ),
    },
    {
      question: "How do I participate in Terra Classic governance proposals?",
      answer: (
        <>
          <p>
            Governance happens on-chain through text or parameter proposals. Visit `Validator.info`, `Common.xyz` or other blockchain information pages to read active proposals, discussion threads, and voting deadlines.
          </p>
          <p>
            Vote directly from your wallet interface. Delegators can override their validator’s vote anytime during the voting window. Review the proposal’s `Forum` discussion, check validator sentiment, and confirm you have a small amount of LUNC available to cover gas fees.
          </p>
        </>
      ),
    },
    {
      question: "What infrastructure should I use for running a node or building apps?",
      answer: (
        <>
          <p>
            The community recommends public endpoints from `PublicNode`, `Hexxagon`, and `BiNodes` for quick access. For production workloads, run your own full node using the latest `classic-core` release, keep snapshots updated, and monitor the `Terra Classic Validators` Discord for alerts.
          </p>
          <p>
            Builders can rely on the `@goblinhunt/cosmes` SDK, public APIs, and the `Community Discussions` linked in the docs. Testnet access is available on `rebel-2` with endpoints hosted by `luncblaze.com`.
          </p>
        </>
      ),
    },
    {
      question: "What are the safest wallets for holding LUNC right now?",
      answer: (
        <>
          <p>
            Hardware wallets such as `Ledger` paired with wallet sites like `Galaxy Station` interface provide strong security. For software wallets, the community frequently uses `Keplr`, `Galaxy Station` or legacy `Terra Station`.
          </p>
          <p>
            Always download wallets from official links, store recovery phrases offline, and beware of phishing sites. For large balances consider multi-signature solutions or smart-contract multisig wallets.
          </p>
        </>
      ),
    }
  ];

  return (
    <section className="py-12 mt-8 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Frequently Asked Questions</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8">Get answers to the most common questions about Terra Classic in 2025</p>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700 border-t border-b border-gray-200 dark:border-gray-700">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onClick={() => toggleFAQ(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default FAQAccordion;