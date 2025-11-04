"use client";

/**
 * ErrorState component - Displays error message
 */
export default function ErrorState({ message, error }) {
  const displayMessage = error?.message || message || "An error occurred";

  return (
    <div className="text-center py-12">
      <div className="text-red-600 dark:text-red-400">
        Error: {displayMessage}
      </div>
    </div>
  );
}

