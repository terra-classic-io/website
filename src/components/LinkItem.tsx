import React from 'react';
import { 
  Wallet, BarChart2, Shuffle, Globe, Code, 
  Server, Rocket, Users, CircleDollarSign, Gamepad2, Newspaper,
  ShieldCheck,
  Link2
} from 'lucide-react';

interface LinkItemProps {
  name: string;
  url: string;
  description?: string;
}

// Function to determine which icon to use based on description
const getIconForType = (description?: string, name?: string): React.ReactNode => {
  if (!description) return <Globe size={16} />;
  
  const desc = description.toLowerCase();
  const nameStr = name?.toLowerCase() || '';

  // Check for specific types based on the description
  if (desc.includes('wallet')) return <Wallet size={16} />;
  if (desc.includes('exchange') || desc.includes('dex')) return <Shuffle size={16} />;
  if (desc.includes('analytics') || desc.includes('explorer')) return <BarChart2 size={16} />;
  if (desc.includes('game') || desc.includes('metaverse')) return <Gamepad2 size={16} />;
  if (desc.includes('endpoint') || desc.includes('rpc')) return <Server size={16} />;
  if (desc.includes('code') || desc.includes('repository')) return <Code size={16} />;
  if (desc.includes('bridge')) return <Link2 size={16} />;
  if (desc.includes('news') || desc.includes('website')) return <Newspaper size={16} />;
  if (desc.includes('validator') || desc.includes('nodes')) return <ShieldCheck size={16} />;
  if (desc.includes('community') || desc.includes('chat')) return <Users size={16} />;
  if (desc.includes('lending') || desc.includes('defi') || desc.includes('platform')) return <CircleDollarSign size={16} />;
  
  // Check for specific names if description didn't match
  if (nameStr.includes('finder') || nameStr.includes('analytics')) return <BarChart2 size={16} />;
  if (nameStr.includes('swap') || nameStr.includes('trade')) return <Shuffle size={16} />;
  
  // Default icon for other types
  return <Rocket size={16} />;
};

// Function to get a background color for the icon based on the description
const getIconBackground = (description?: string): string => {
  if (!description) return 'bg-gray-100 dark:bg-gray-700';
  
  const desc = description.toLowerCase();
  
  if (desc.includes('wallet')) return 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30';
  if (desc.includes('exchange')) return 'bg-purple-50 dark:bg-purple-900 dark:bg-opacity-30';
  if (desc.includes('dex')) return 'bg-green-50 dark:bg-green-900 dark:bg-opacity-30';
  if (desc.includes('analytics')) return 'bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-30';
  if (desc.includes('game')) return 'bg-red-50 dark:bg-red-900 dark:bg-opacity-30';
  if (desc.includes('endpoint') || desc.includes('rpc')) return 'bg-gray-100 dark:bg-gray-700';
  if (desc.includes('bridge')) return 'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30';
  if (desc.includes('lending') || desc.includes('defi')) return 'bg-emerald-50 dark:bg-emerald-900 dark:bg-opacity-30';
  
  // Default background
  return 'bg-gray-100 dark:bg-gray-700';
};

// Function to get icon color based on the description
const getIconColor = (description?: string): string => {
  if (!description) return 'text-gray-500';
  
  const desc = description.toLowerCase();
  
  if (desc.includes('wallet')) return 'text-blue-500';
  if (desc.includes('exchange')) return 'text-purple-500';
  if (desc.includes('dex')) return 'text-green-500';
  if (desc.includes('analytics')) return 'text-indigo-500';
  if (desc.includes('game')) return 'text-red-500';
  if (desc.includes('endpoint') || desc.includes('rpc')) return 'text-gray-500';
  if (desc.includes('bridge')) return 'text-yellow-500';
  if (desc.includes('lending') || desc.includes('defi')) return 'text-emerald-500';
  
  // Default color
  return 'text-gray-500';
};

const LinkItem: React.FC<LinkItemProps> = ({ name, url, description }) => {
  const bgColor = getIconBackground(description);
  const iconColor = getIconColor(description);
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
    >
      <div className="flex items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${bgColor} ${iconColor}`}>
          {getIconForType(description, name)}
        </div>
        <span className="font-medium text-gray-800 dark:text-white group-hover:text-terra-blue dark:group-hover:text-terra-green transition-colors">
          {name}
        </span>
      </div>
      {description && (
        <span className="text-xs text-gray-400 dark:text-gray-300 font-normal">
          {description}
        </span>
      )}
    </a>
  );
};

export default LinkItem;
