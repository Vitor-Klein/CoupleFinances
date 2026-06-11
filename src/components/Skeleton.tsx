import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width, height, className }) => (
  <div
    className={`skeleton ${className ?? ''}`}
    style={{ width, height }}
    aria-hidden="true"
  />
);

/** Skeleton da tela inicial enquanto os dados do casal carregam */
export const DashboardSkeleton: React.FC = () => (
  <div className="page-content skeleton-page" aria-busy="true" aria-label="Carregando">
    <Skeleton height="44px" className="skeleton-rounded" />
    <Skeleton height="180px" className="skeleton-rounded" />
    <div className="skeleton-row">
      <Skeleton height="120px" className="skeleton-rounded" />
      <Skeleton height="120px" className="skeleton-rounded" />
    </div>
    <Skeleton height="220px" className="skeleton-rounded" />
  </div>
);

/** Skeleton de lista de transações */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="skeleton-page" aria-busy="true" aria-label="Carregando">
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} height="64px" className="skeleton-rounded" />
    ))}
  </div>
);
