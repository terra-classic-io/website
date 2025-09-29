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
      question: "What is Terra Classic (LUNC) and how has it evolved by 2025?",
      answer: (
        <>
          <p>
            Terra Classic (LUNC) is the original Terra blockchain that continued after the ecosystem split following the May 2022 collapse. By 2025, Terra Classic has established itself as a resilient community-driven blockchain with substantial governance improvements and utility restoration. The network has implemented several key protocol upgrades including the Gravity Bridge integration, enabling seamless cross-chain functionality with Ethereum and Cosmos ecosystems.
          </p>
          <p>
            After the implementation of community-led burn mechanisms and validator reforms between 2022-2024, LUNC has successfully reduced its circulating supply by over 25%, addressing one of its primary challenges. The 2025 protocol enhancements focus on smart contract security, scalability improvements, and DeFi infrastructure revival, attracting developers back to the ecosystem.
          </p>
        </>
      ),
    },
    {
      question: "How has the Terra Classic staking ecosystem improved since 2023?",
      answer: (
        <>
          <p>
            The Terra Classic staking ecosystem has undergone significant transformations since 2023. The validator governance structure was reformed in late 2023, introducing a more robust slashing mechanism and reputational system that has effectively eliminated validator misbehavior that previously plagued the network. By 2025, staking APR has stabilized around 8-12%, providing predictable returns for long-term holders.
          </p>
          <p>
            The introduction of liquid staking derivatives in Q3 2024 has revolutionized the ecosystem, allowing LUNC holders to maintain staking rewards while utilizing their assets in DeFi protocols. This has increased staking participation to over 75% of circulating supply, significantly enhancing network security. The new delegation incentive program launched in early 2025 has further decentralized validator distribution, with no validator controlling more than 5% of staked tokens.
          </p>
        </>
      ),
    },
    {
      question: "What are the key LUNC burning mechanisms in place in 2025?",
      answer: (
        <>
          <p>
            By 2025, Terra Classic has implemented multiple sustainable LUNC burning mechanisms that have collectively reduced the hyperinflated supply without compromising ecosystem development. The on-chain transaction tax, refined in 2024 to a dynamic model of 0.2-0.5% based on network activity, continues to be a primary deflationary force, burning approximately 50-75 billion LUNC annually.
          </p>
          <p>
            The Gas Fee Repurposing Protocol, implemented in late 2024, redirects 80% of all gas fees to the burn address while allocating 20% to community development funds. Additionally, the Ecosystem Activity Program introduced in 2025 incentivizes dApp developers with rebates for implementing application-specific burn mechanisms. Major exchanges have also integrated automatic burning of trading fees for LUNC pairs, contributing approximately 20-30 billion LUNC burned quarterly across participating platforms.
          </p>
        </>
      ),
    },
    {
      question: "How has the Terra Classic governance system been reformed for 2025?",
      answer: (
        <>
          <p>
            The Terra Classic governance system underwent a complete overhaul between 2023-2025, now featuring a bicameral structure with a Technical Committee and Community Assembly. This new governance framework has successfully addressed previous issues of proposal quality and implementation delays. The Technical Committee, comprised of elected developers, focuses on protocol upgrades and technical implementations, while the Community Assembly handles ecosystem funding and policy decisions.
          </p>
          <p>
            A significant innovation introduced in early 2025 is the Governance Participation Protocol (GPP), which rewards consistent voters with governance tokens that enhance voting power without diluting LUNC. This has increased proposal participation from under 15% in 2023 to over 60% by mid-2025. The governance dashboard now features automated proposal impact assessments, helping stakeholders understand potential effects before voting, which has dramatically improved proposal quality and implementation success rates.
          </p>
        </>
      ),
    },
    {
      question: "What DeFi applications have returned to Terra Classic in 2025?",
      answer: (
        <>
          <p>
            The Terra Classic DeFi ecosystem has experienced a remarkable revival by 2025, with several next-generation applications building on lessons learned from the past. The relaunch of Astroport on Terra Classic in late 2024 brought modern AMM capabilities back to the ecosystem, featuring optimized capital efficiency mechanisms and cross-chain liquidity access through IBC protocols and the Gravity Bridge.
          </p>
          <p>
            New lending platforms like NovaTerra and Eclipse Finance have implemented over-collateralized lending models with robust oracle solutions and circuit breakers to prevent historical vulnerabilities. The stablecoin landscape has also evolved, with algorithm-backed stablecoins being replaced by fully-collateralized alternatives like USDC-c and EURC-c through official Circle integration completed in Q1 2025. The Terra Classic DeFi ecosystem now hosts over $500 million in Total Value Locked (TVL) across various protocols, showing steady growth since rebuilding began in earnest in 2024.
          </p>
        </>
      ),
    },
    {
      question: "How does the Terra Classic ecosystem integrate with USTC in 2025?",
      answer: (
        <>
          <p>
            By 2025, TerraClassicUSD (USTC) has been reimagined as a community-governed stablecoin with fundamentally different mechanics than its predecessor. Following the partial repeg initiative completed in 2024, USTC now maintains value through a hybrid model combining partial collateralization with controlled supply management. The USTC Reserve Fund, established in 2024 and grown to over $150 million by 2025, provides backing for a portion of the circulating supply.
          </p>
          <p>
            The integration between LUNC and USTC has been redesigned with a decoupled relationship that protects both assets from cascading failures. The new Terra Classic monetary policy committee, formed of elected economic experts, manages USTC supply adjustments on a quarterly basis. USTC has found a sustainable niche as an intra-ecosystem stablecoin, primarily used within Terra Classic dApps, while maintaining IBC connectivity to the broader Cosmos ecosystem for liquidity and utility. By mid-2025, USTC price stability has been maintained within a 5% band of its dollar peg for over six consecutive months.
          </p>
        </>
      ),
    },
    {
      question: "What new development initiatives are driving Terra Classic adoption in 2025?",
      answer: (
        <>
          <p>
            Terra Classic's renaissance in 2025 is largely driven by the Developer Incentive Program launched in late 2024, which allocates funding to promising projects building on the network. This initiative has attracted over 50 new development teams and resulted in more than 20 production-ready applications by mid-2025. The Terra Classic Labs incubator, funded by community pool allocations, provides technical resources, security auditing, and marketing support for ecosystem projects.
          </p>
          <p>
            The focus on real-world asset (RWA) tokenization has emerged as a unique strength for Terra Classic in 2025, with specialized infrastructure for compliant tokenized securities, real estate, and carbon credits. The Enterprise Adoption Working Group formed in early 2025 has successfully established partnerships with several traditional finance institutions exploring blockchain integration. Educational initiatives like the Terra Classic Developer Academy have trained over 1,000 developers in ecosystem-specific tools and best practices, ensuring a sustainable pipeline of technical talent committed to the ecosystem's long-term success.
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