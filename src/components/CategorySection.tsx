import React from 'react';
import { Category } from '../data/projects';
import LinkItem from './LinkItem';

interface SectionProps {
  category: Category;
}

const CategorySection: React.FC<SectionProps> = ({ category }) => (
  <section id={category.title.toLowerCase().replace(/\s+/g, '-')}
           className="pb-6 h-full">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-gray-800 dark:text-white">
        {category.title}
        {category.count && (
          <span className="text-xs font-normal text-gray-500 dark:text-gray-300 ml-1">({category.count})</span>
        )}
      </h2>
    </div>
    
    <ul className="space-y-0.5">
      {category.links.map(link => (
        <li key={link.url}>
          <LinkItem 
            name={link.name} 
            url={link.url} 
            description={link.description} 
          />
        </li>
      ))}
    </ul>
  </section>
);

export default CategorySection;
