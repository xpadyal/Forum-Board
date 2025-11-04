"use client";

/**
 * LoadingState component - Displays loading indicator
 */
export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-600 dark:text-gray-400">{message}</div>
    </div>
  );
}

