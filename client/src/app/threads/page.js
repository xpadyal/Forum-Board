"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllThreads } from "@/lib/threadApi";
import Link from "next/link";
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/lib/authApi";

export default function ThreadsPage() {
  const [page, setPage] = useState(1);
  const [isAuth, setIsAuth] = useState(false);
  const limit = 10;

  useEffect(() => {
    setIsAuth(isAuthenticated());

    // Listen for auth state changes
    const handleAuthStateChange = () => {
      setIsAuth(isAuthenticated());
    };

    window.addEventListener("authStateChange", handleAuthStateChange);
    window.addEventListener("storage", handleAuthStateChange);

    return () => {
      window.removeEventListener("authStateChange", handleAuthStateChange);
      window.removeEventListener("storage", handleAuthStateChange);
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["threads", page, limit],
    queryFn: () => getAllThreads(page, limit),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading threads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-600">
          Error loading threads: {error.message}
        </div>
      </div>
    );
  }

  const threads = data?.threads || [];
  const pagination = data?.pagination || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          All Threads
        </h1>
        {isAuth && (
          <Link
            href="/threads/new"
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Create Thread
          </Link>
        )}
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          <p className="text-lg mb-4">No threads yet.</p>
          {isAuth ? (
            <Link
              href="/threads/new"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create the first thread
            </Link>
          ) : (
            <p className="text-sm">
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
      ) : (
        <>
          <div className="space-y-4">
            {threads.map((thread) => {
              const imageAttachments = thread.attachments?.filter(
                (att) => att.mimeType?.startsWith("image/")
              ) || [];
              const nonImageAttachments = thread.attachments?.filter(
                (att) => !att.mimeType?.startsWith("image/")
              ) || [];
              const hasImages = imageAttachments.length > 0;

              return (
                <Link
                  key={thread.id}
                  href={`/threads/${thread.id}`}
                  className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Main Content */}
                    <div className={`flex-1 p-4 sm:p-6 ${hasImages ? 'sm:pr-0' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-2">
                          {thread.title}
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                        {thread.content}
                      </p>
                      
                      {/* Non-image attachments indicator */}
                      {nonImageAttachments.length > 0 && (
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
                            {nonImageAttachments.length} file{nonImageAttachments.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>By {thread.author?.username || "Unknown"}</span>
                        <span>{thread._count?.comments || 0} comments</span>
                      </div>
                    </div>

                    {/* Image Preview (Reddit-style) */}
                    {hasImages && (
                      <div className="sm:w-48 sm:min-w-[192px] w-full h-48 sm:h-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
                        {imageAttachments.length === 1 ? (
                          <img
                            src={imageAttachments[0].fileUrl}
                            alt={thread.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="p-4 text-center text-gray-400"><svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">Image</p></div>';
                            }}
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-1 w-full h-full p-1">
                            {imageAttachments.slice(0, 4).map((attachment, idx) => (
                              <div
                                key={attachment.id || idx}
                                className={`relative overflow-hidden ${
                                  idx === 0 && imageAttachments.length === 3
                                    ? 'col-span-2'
                                    : ''
                                }`}
                              >
                                <img
                                  src={attachment.fileUrl}
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                {idx === 3 && imageAttachments.length > 4 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                      +{imageAttachments.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasMore}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

