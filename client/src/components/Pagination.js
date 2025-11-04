"use client";

/**
 * Pagination component - Displays pagination controls
 */
export default function Pagination({ page, totalPages, hasMore, onPageChange }) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      onPageChange(page + 1);
    }
  };

  return (
    <div className="flex justify-center items-center gap-4 mt-8">
      <button
        onClick={handlePrev}
        disabled={page === 1}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Previous
      </button>
      <span className="text-gray-600 dark:text-gray-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={!hasMore}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

