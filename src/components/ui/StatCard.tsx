import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = 'primary',
  trend,
  subtitle,
}) => {
  return (
    <div className={`stat-card stat-${variant} card-hover animate-fade-in`}>
      <div className="flex flex-col">
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
        {trend && (
          <div className="stat-trend">
            <span className={trend.isPositive ? 'trend-up' : 'trend-down'}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-muted text-xs">vs last week</span>
          </div>
        )}
      </div>
      <div className="stat-icon-wrapper">{icon}</div>
    </div>
  );
};
