"use client";

import ThreadCard from "./ThreadCard";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

/**
 * ThreadList component - Displays a list of threads with loading/error/empty states
 */
export default function ThreadList({
  threads = [],
  isLoading = false,
  error = null,
  pagination = null,
  isAuth = false,
  onPageChange,
}) {
  if (isLoading) {
    return <LoadingState message="Loading threads..." />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        isAuth={isAuth}
        actionLink="/threads/new"
        actionText="Create the first thread"
      />
    );
  }

  return (
    <>
      <div className="space-y-4 mb-8">
        {threads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasMore={pagination.hasMore}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}

