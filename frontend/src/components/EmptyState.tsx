import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  actionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionLink?: string;
  variant?: 'default' | 'compact' | 'card';
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionLink,
  actionOnClick,
  secondaryActionLabel,
  secondaryActionLink,
  variant = 'default',
}: EmptyStateProps) {
  const padding =
    variant === 'compact'
      ? 'py-8 px-4'
      : variant === 'card'
      ? 'py-12 px-6'
      : 'py-16 px-6';

  const iconSize = variant === 'compact' ? 'text-4xl' : 'text-6xl';
  const titleSize = variant === 'compact' ? 'text-base' : 'text-lg';

  const renderAction = () => {
    if (!actionLabel) return null;

    const btnClass =
      'btn btn-primary btn-sm rounded-full px-6 shadow-sm';

    if (actionLink) {
      return (
        <Link to={actionLink} className={btnClass}>
          {actionLabel}
        </Link>
      );
    }
    if (actionOnClick) {
      return (
        <button onClick={actionOnClick} className={btnClass}>
          {actionLabel}
        </button>
      );
    }
    return null;
  };

  const renderSecondaryAction = () => {
    if (!secondaryActionLabel || !secondaryActionLink) return null;
    return (
      <Link
        to={secondaryActionLink}
        className="btn btn-ghost btn-sm"
      >
        {secondaryActionLabel}
      </Link>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${padding}`}
    >
      {/* Icon in a circle for a warmer look */}
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <span className={iconSize}>{icon}</span>
      </div>

      {/* Title */}
      <h3 className={`${titleSize} font-bold text-base-content mb-2`}>
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-base-content/60 max-w-md mb-6">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {renderAction()}
          {renderSecondaryAction()}
        </div>
      )}
    </div>
  );
}