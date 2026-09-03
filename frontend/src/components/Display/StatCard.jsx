import React from 'react';

/**
 * StatCard Component
 * Displays a single statistic with title and value
 */
export default function StatCard({ title, value, icon, trend, onClick }) {
  return (
    <div className="stat-card" onClick={onClick}>
      {icon && <div className="stat-icon">{icon}</div>}

      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>

        {trend && (
          <p className={`stat-trend ${trend.positive ? 'positive' : 'negative'}`}>
            {trend.positive ? '↑' : '↓'} {trend.percentage}%
          </p>
        )}
      </div>
    </div>
  );
}
