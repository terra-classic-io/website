import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useLocation } from 'react-router-dom';
import CategorySection from './components/CategorySection';
import FAQAccordion from './components/FAQAccordion';
import ThemeToggle from './components/ThemeToggle';
import { categories } from './data/projects';
import { Globe, BookOpen, ChevronDown, ExternalLink } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

// Define types for our application state
export type TokenInfo = {
  price: string;
  change: string;
  isPositive: boolean;
};

export type StakingInfo = {
  apr: string;
};

export type AppState = {
  tokens: {
    LUNC: TokenInfo;
    USTC: TokenInfo;
  };
  staking: StakingInfo;
  isMobile: boolean;
};

// Helper function to get initial state that works on both server and client
const getInitialState = (): AppState => ({
  tokens: {
    LUNC: {
      price: '$0.00023',
      change: '+5.6%',
      isPositive: true,
    },
    USTC: {
      price: '$0.016',
      change: '+2.3%',
      isPositive: true,
    },
  },
  staking: {
    apr: '7.01%',
  },
  // Default to false for SSR, will be updated on client
  isMobile: false,
});

// Default state for the application
const DEFAULT_STATE = getInitialState();

// Token data component - redesigned to match screenshot
const TokenInfo: React.FC<{
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  logoColor: string;
}> = ({ symbol, price, change, isPositive, logoColor }) => (
  <div className="flex items-center gap-3">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${logoColor}`}>
      {symbol === 'LUNC' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      )}
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">{symbol}</span>
        <span className="text-sm">{price}</span>
        <span className={`text-xs px-1 py-0.5 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <div className="text-xs text-gray-500">Native asset</div>
    </div>
  </div>
);

// Staking info component - redesigned to match screenshot
const StakingInfo: React.FC = () => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 9h6v13h4V9h6L12 2z" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-medium">Staking Protocol</h3>
        <p className="text-xs text-gray-500">Stake your LUNC using one of the available wallets</p>
      </div>
    </div>
    <div className="text-right">
      <div className="text-xl font-bold">7.01%</div>
      <div className="text-xs text-gray-500">APR</div>
    </div>
  </div>
);

// Main App component
const App: React.FC<{ initialState?: Partial<AppState> }> = ({
  initialState = {},
}) => {
  // Merge default state with initial state from props
  const [state, setState] = useState<AppState>({
    ...DEFAULT_STATE,
    ...initialState,
    tokens: {
      ...DEFAULT_STATE.tokens,
      ...(initialState.tokens || {}),
    },
    staking: {
      ...DEFAULT_STATE.staking,
      ...(initialState.staking || {}),
    },
  });
  
  const location = useLocation();
  const appRef = useRef<HTMLDivElement>(null);
  
  // Set up mobile detection on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setState(prev => ({
        ...prev,
        isMobile
      }));
    }
  }, []);
  
  // Scroll to top on route change
  useEffect(() => {
    if (appRef.current) {
      appRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Debug logging for hydration issues
  if (typeof window === 'undefined') {
    // Server-side
    // eslint-disable-next-line no-console
    console.log('[SSR] initialState.isMobile:', initialState?.isMobile);
  } else {
    // Client-side
    // eslint-disable-next-line no-console
    console.log('[Client] initialState.isMobile:', initialState?.isMobile, 'window.innerWidth:', window.innerWidth);
  }

  // Use server's initial determination for first render to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState(initialState?.isMobile || false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.title || '');
  const [showMore, setShowMore] = useState(false);

  // Default token data
  const defaultTokens = {
    LUNC: { price: '$0.00021', change: '0.0%', isPositive: false },
    USTC: { price: '$0.015', change: '0.0%', isPositive: false }
  };

  // Extract token data from initial state or use defaults
  const tokens = initialState?.tokens || defaultTokens;
  const stakingData = initialState?.staking || { apr: '6.8%' };

  // Refs for category sections
  const categoryRefs = useRef<{[key: string]: HTMLElement | null}>({});
  const observer = useRef<IntersectionObserver | null>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Set up intersection observer for auto-selecting categories on scroll
  useEffect(() => {
    // Create intersection observer to track which category is in view
    observer.current = new IntersectionObserver(
      (entries) => {
        // Only update if not currently programmatically scrolling
        if (isScrolling.current) return;
        
        // Find the entry with the largest intersection ratio that's currently visible
        const visibleEntry = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          console.log(visibleEntry, isScrolling.current);
          
        if (visibleEntry) {
          // Extract category title from the element's id
          const categoryId = visibleEntry.target.id;
          if (categoryId.startsWith('category-')) {
            const title = categoryId.replace('category-', '').replace(/-/g, ' ');
            // Update active category
            setActiveCategory(title);
          }
        }
      },
      {
        root: null, // viewport
        rootMargin: '-40% 0px -50% 0px', // Adjust these values to control when the active state changes
        threshold: 0.1,
      }
    );

    // Get all category sections and observe them
    const categoryElements = Object.values(categoryRefs.current).filter(Boolean) as HTMLElement[];
    categoryElements.forEach(element => {
      observer.current?.observe(element);
    });

    // Cleanup
    return () => {
      observer.current?.disconnect();
    };
  }, [categories]);

  // Handle category navigation
  const handleCategoryClick = (title: string) => {
    setActiveCategory(title);
    const element = document.getElementById(`category-${title.toLowerCase().replace(/\s+/g, '-')}`);
    if (element) {
      // Set scrolling flag to prevent intersection observer from interfering
      isScrolling.current = true;
      
      // Clear any existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Scroll to the element
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Reset the scrolling flag after a delay
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    }
  };
  
  // Function to set ref for each category section
  const setCategoryRef = (element: HTMLElement | null, title: string) => {
    if (element) {
      categoryRefs.current[title] = element;
    }
  };

  // Handle mobile detection after hydration is complete
  useEffect(() => {
    // Mark component as hydrated
    setIsHydrated(true);
    
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Set initial mobile state based on window width
      const checkMobile = () => window.innerWidth < 768;
      setIsMobile(checkMobile());
      
      // Update mobile status on window resize
      const handleResize = () => {
        setIsMobile(checkMobile());
      };
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []); // Empty dependency array means this runs once on mount

  const { resolvedTheme } = useTheme();
  
  // Don't render until we've determined the theme to avoid flash of unstyled content
  if (!resolvedTheme) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Helmet>
        <meta name="theme-color" content={resolvedTheme === 'dark' ? '#111827' : '#2043B5'} />
      </Helmet>

      {isMobile ? (
        // Mobile Layout - Stacked with navigation at top
        <main className="flex-1">
          {/* Theme Toggle in upper area */}
          <div className="flex justify-end p-4">
            <ThemeToggle />
          </div>
          
          {/* Hero Section */}
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl transition-colors duration-200">
                  Terra Classic Ecosystem
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300 sm:mt-4 transition-colors duration-200">
                  Discover the best resources, tools, and communities in the Terra Classic (LUNC) ecosystem.
                </p>
              </div>
              <div className="flex items-center space-x-6 mt-4">
                <a href="https://www.terra.money/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-terra-blue transition-colors" title="Official Website">
                  <Globe size={20} />
                </a>
                <a href="https://docs.terra.money/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-terra-blue transition-colors" title="Documentation">
                  <BookOpen size={20} />
                </a>
                <a href="https://twitter.com/terrac_official" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-terra-blue transition-colors" title="X (formerly Twitter)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
                    <path d="M4 4l11.5 16h4.5l-11.5-16h-4.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 20l5-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 4l-4.5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
          </section>

          {/* Mobile Navigation */}
          <nav className="sticky top-0 z-10 bg-white bg-opacity-95 backdrop-blur-md shadow-sm py-2 mb-8 overflow-x-auto">
            <ul className="flex space-x-1 min-w-max">
              {categories.map(cat => (
                <li key={`nav-${cat.title}`} id={`nav-${cat.title}`}>
                  <button
                    onClick={() => handleCategoryClick(cat.title)}
                    className={`px-3 py-1 rounded-md transition-all duration-200 text-sm whitespace-nowrap ${
                      activeCategory === cat.title
                        ? 'bg-terra-blue text-white font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Token Info & Staking for Mobile */}
          <div className="mb-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3">
                <TokenInfo 
                  symbol="LUNC" 
                  price={tokens.LUNC?.price || defaultTokens.LUNC.price} 
                  change={tokens.LUNC?.change || defaultTokens.LUNC.change} 
                  isPositive={tokens.LUNC?.isPositive ?? defaultTokens.LUNC.isPositive} 
                  logoColor="text-yellow-600" 
                />
              </div>
              <div className="p-3">
                <TokenInfo 
                  symbol="USTC" 
                  price={tokens.USTC?.price || defaultTokens.USTC.price} 
                  change={tokens.USTC?.change || defaultTokens.USTC.change} 
                  isPositive={tokens.USTC?.isPositive ?? defaultTokens.USTC.isPositive} 
                  logoColor="text-blue-600" 
                />
              </div>
            </div>
            <div className="p-3">
              <StakingInfo />
            </div>
            <button onClick={() => setShowMore(!showMore)} className="w-full flex items-center justify-center py-2 text-xs text-gray-500">
              Show other native assets on Terra Classic
              <ChevronDown size={14} className="ml-1" />
            </button>
          </div>

          {/* Mobile Content */}
          <div className="grid grid-cols-1 gap-8 pt-4">
            {categories.map(cat => (
              <div 
                key={cat.title} 
                ref={(el) => setCategoryRef(el, cat.title)}
                id={`category-${cat.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="break-inside-avoid scroll-mt-4"
              >
                <CategorySection category={cat} />
              </div>
            ))}
            
            {/* FAQ Accordion for SEO */}
            <FAQAccordion />
          </div>

          {/* Mobile Footer */}
          <footer className="mt-16 py-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                Built with ❤️ by the Terra Classic community • Last updated: May 22, 2025
              </p>
            </div>
          </footer>
        </main>
      ) : (
        // Desktop Layout with Sidebar
        <div className="flex min-h-screen">
          {/* Modern and Professional Left Sidebar */}
          <div className="w-[300px] sticky top-0 h-screen overflow-auto flex flex-col">
            {/* Gradient background element */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent z-0"></div>
            
            {/* Header with brand identity */}
            <div className="relative z-10 pt-8 pb-6 px-6 border-b border-gray-100">
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-terra-blue via-blue-500 to-terra-green flex items-center justify-center text-white mr-3 shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Terra Classic</h1>
                  <div className="flex items-center mt-1">
                    <span className="text-terra-blue font-medium text-sm">Ecosystem</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-xs text-gray-500">May 22, 2025</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content area */}
            <div className="flex-1 relative z-10">
              {/* Navigation section */}
              <div className="p-6 pb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-4">Categories</h2>
                
                <div className="space-y-0.5 pl-1 mb-6">
                  {categories.map(cat => (
                    <button
                      key={`desktop-nav-${cat.title}`}
                      onClick={() => handleCategoryClick(cat.title)}
                      className={`block w-full text-left py-2 pl-3 pr-2 rounded-md transition-all duration-200 
                      ${activeCategory === cat.title
                        ? 'bg-terra-blue text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cat.title}</span>
                        {cat.count && 
                          <span className={`text-xs py-0.5 px-2 rounded-full ${
                            activeCategory === cat.title 
                              ? 'bg-white bg-opacity-20 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {cat.count}
                          </span>
                        }
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Quick links section */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 transition-colors duration-200">
                    Quick Links
                  </h3>
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    <a 
                      href="https://docs.terra.money/" 
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center text-sm text-gray-700 hover:text-terra-blue py-1"
                    >
                      <BookOpen size={14} className="mr-2" />
                      <span>Documentation</span>
                      <ExternalLink size={12} className="ml-1 opacity-70" />
                    </a>
                    <a 
                      href="https://www.terra.money/" 
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center text-sm text-gray-700 hover:text-terra-blue py-1"
                    >
                      <Globe size={14} className="mr-2" />
                      <span>Official Website</span>
                      <ExternalLink size={12} className="ml-1 opacity-70" />
                    </a>
                    <a 
                      href="https://twitter.com/terrac_official" 
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center text-sm text-gray-700 hover:text-terra-blue py-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                        <path d="M4 4l11.5 16h4.5l-11.5-16h-4.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 20l5-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 4l-4.5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>X (Twitter)</span>
                      <ExternalLink size={12} className="ml-1 opacity-70" />
                    </a>
                        <path d="M4 20l5-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 4l-4.5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>X (Twitter)</span>
                      <ExternalLink size={12} className="ml-1 opacity-70" />
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="px-6 pb-6">
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Disclaimer</h3>
                  <div className="text-xs text-gray-500 space-y-2">
                    <p>
                      Terra-Classic.money is not the official website of Terra Classic. Just as no one owns the technology behind email, no one owns the Terra Classic blockchain.
                    </p>
                    <p>
                      This website is provided for informational purposes only and does not constitute investment advice. Visitors are encouraged to conduct their own research before making any investment decisions.
                    </p>
                    <button 
                      className="text-terra-blue hover:underline flex items-center mt-1"
                      onClick={() => alert("Full disclaimer could be shown in a modal")}
                    >
                      Read full disclaimer
                      <ChevronDown size={12} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="relative z-10 p-6 pt-3 border-t border-gray-100 mt-auto">
                <div className="flex justify-center space-x-5 mb-3">
                  <a 
                    href="https://www.terra.money/" 
                    className="text-gray-400 hover:text-terra-blue transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe size={16} />
                  </a>
                  <a 
                    href="https://docs.terra.money/" 
                    className="text-gray-400 hover:text-terra-blue transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen size={16} />
                  </a>
                  <a 
                    href="https://twitter.com/terrac_official" 
                    className="text-gray-400 hover:text-terra-blue transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4l11.5 16h4.5l-11.5-16h-4.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 20l5-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 4l-4.5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
                <p className="text-gray-400 text-xs text-center">
                  Built with ❤️ by the Terra Classic community
                </p>
                </a>
              </div>
              <p className="text-gray-400 text-xs text-center">
                Built with ❤️ by the Terra Classic community
              </p>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-6 overflow-auto border-l border-gray-100">
            <div className="max-w-6xl mx-auto">
              {/* Token Info & Staking for Desktop - Flat design */}
              <div className="mb-8 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3">
                    <TokenInfo 
                      symbol="LUNC" 
                      price={tokens.LUNC?.price || defaultTokens.LUNC.price} 
                      change={tokens.LUNC?.change || defaultTokens.LUNC.change} 
                      isPositive={tokens.LUNC?.isPositive ?? defaultTokens.LUNC.isPositive} 
                      logoColor="text-yellow-600" 
                    />
                  </div>
                  <div className="p-3">
                    <TokenInfo 
                      symbol="USTC" 
                      price={tokens.USTC?.price || defaultTokens.USTC.price} 
                      change={tokens.USTC?.change || defaultTokens.USTC.change} 
                      isPositive={tokens.USTC?.isPositive ?? defaultTokens.USTC.isPositive} 
                      logoColor="text-blue-600" 
                    />
                  </div>
                </div>
                <div className="p-3">
                  <StakingInfo />
                </div>
                <button onClick={() => setShowMore(!showMore)} className="w-full flex items-center justify-center py-2 text-xs text-gray-500">
                  Show other native assets on Terra Classic
                  <ChevronDown size={14} className="ml-1" />
                </button>
              </div>

              {/* Auto-layout grid with 3 columns similar to screenshot */}
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <CategorySection 
                    key={category.title}
                    category={category} 
                  />
                ))}
              </div>
              
              {/* FAQ Accordion for SEO */}
              <FAQAccordion />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

