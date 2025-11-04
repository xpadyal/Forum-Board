"use client";

import Link from "next/link";
import { categorizeAttachments, formatDate } from "@/utils/threadUtils";
import ImagePreview from "./ImagePreview";
import FileAttachmentIndicator from "./FileAttachmentIndicator";

/**
 * ThreadCard component - Displays a single thread preview
 */
export default function ThreadCard({ thread }) {
  const { imageAttachments, nonImageAttachments, hasImages } =
    categorizeAttachments(thread.attachments);

  return (
    <Link
      href={`/threads/${thread.id}`}
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {thread.title}
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
            {thread.content}
          </p>

          {/* Non-image attachments indicator */}
          {nonImageAttachments.length > 0 && (
            <FileAttachmentIndicator count={nonImageAttachments.length} />
          )}

          {/* Thread Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>By {thread.author?.username || "Unknown"}</span>
            <span>{thread._count?.comments || 0} comments</span>
            <span>{formatDate(thread.createdAt)}</span>
          </div>
        </div>

        {/* Image Preview */}
        {hasImages && (
          <ImagePreview
            images={imageAttachments}
            alt={thread.title}
          />
        )}
      </div>
    </Link>
  );
}
