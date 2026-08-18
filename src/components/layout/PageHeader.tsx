import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        marginBottom: '1.5rem',
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted" style={{ marginBottom: '0.15rem' }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span style={{ color: '#cbd5e1' }}>/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-primary' : ''}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm" style={{ marginTop: '0.15rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
};
