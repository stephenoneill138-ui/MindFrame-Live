import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

const TrendArrow: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
    if (trend === 'up') return <span className="text-emerald-400 ml-2">↑</span>;
    if (trend === 'down') return <span className="text-red-400 ml-2">↓</span>;
    return <span className="text-gray-500 ml-2">→</span>;
};


const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, description }) => {
  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg flex flex-col justify-between h-full">
      <div>
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <p className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mt-2 flex items-center">
          {value}
          {trend && <TrendArrow trend={trend} />}
        </p>
      </div>
      {description && <p className="text-xs text-gray-500 mt-2 h-10">{description}</p>}
    </div>
  );
};

export default MetricCard;
