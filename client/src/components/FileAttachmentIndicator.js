"use client";

/**
 * FileAttachmentIndicator component - Shows count of non-image attachments
 */
export default function FileAttachmentIndicator({ count }) {
  if (!count || count === 0) return null;

  return (
    <div className="mb-3 flex items-center gap-2 text-xs">
      <svg
        className="w-4 h-4 text-gray-500 dark:text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="text-gray-500 dark:text-gray-400">
        {count} file{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

