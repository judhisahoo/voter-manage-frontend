'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const StatCard = React.memo(
  ({ label, value, icon: Icon, color }: StatCardProps) => {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          </div>
          <div className={`${color} p-4 rounded-lg flex items-center justify-center`}>
            <Icon className="text-white text-2xl" />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if value or label changes
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label
    );
  }
);

StatCard.displayName = 'StatCard';

export default StatCard;