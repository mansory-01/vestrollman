import React from "react";
import { EmptyStateIcon } from "@/../public/svg";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex items-center text-center flex-col w-fit mx-auto px-4 lg:py-8">
      <EmptyStateIcon />

      <p className="text-gray-600 dark:text-gray-150 font-semibold mb-1">
        {title}
      </p>

      <p className="text-xs font-medium text-gray-400">{description}</p>

      {action && (
        action.href ? (
          <a
            href={action.href}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#5E2A8C] rounded-full hover:bg-[#7C3AED] transition-colors"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#5E2A8C] rounded-full hover:bg-[#7C3AED] transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

export default EmptyState;
