import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-full shadow-md">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-full ${theme === 'light' ? 'bg-white text-yellow-500 shadow-inner' : 'text-gray-600 hover:text-gray-800 dark:text-gray-200 dark:hover:text-white'}`}
        aria-label="Light theme"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-blue-400 shadow-inner' : 'text-gray-600 hover:text-gray-800 dark:text-gray-200 dark:hover:text-white'}`}
        aria-label="Dark theme"
      >
        <Moon size={18} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-full ${theme === 'system' ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white shadow-inner' : 'text-gray-600 hover:text-gray-800 dark:text-gray-200 dark:hover:text-white'}`}
        aria-label="System theme"
      >
        <Monitor size={18} />
      </button>
    </div>
  );
};

export default ThemeToggle;
