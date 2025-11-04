"use client";

import Link from "next/link";

/**
 * EmptyState component - Displays empty state message
 */
export default function EmptyState({ 
  message = "No threads yet.",
  isAuth,
  actionLink,
  actionText 
}) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
        {message}
      </p>
      {isAuth && actionLink && actionText ? (
        <Link
          href={actionLink}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {actionText}
        </Link>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-500">
          <Link
            href="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Register
          </Link>
          {" "}to create the first thread
        </p>
      )}
    </div>
  );
}

