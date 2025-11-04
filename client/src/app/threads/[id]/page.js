"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThreadById } from "@/lib/threadApi";
import { createComment } from "@/lib/commentApi";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/lib/authApi";

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const threadId = params.id;
  const [isAuth, setIsAuth] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    setIsAuth(isAuthenticated());
    const handleAuthStateChange = () => {
      setIsAuth(isAuthenticated());
    };
    window.addEventListener("authStateChange", handleAuthStateChange);
    return () => {
      window.removeEventListener("authStateChange", handleAuthStateChange);
    };
  }, []);

  const { data: thread, isLoading, error } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThreadById(threadId),
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      setCommentContent("");
      setCommentError("");
    },
    onError: (error) => {
      setCommentError(error.message || "Failed to post comment. Please try again.");
    },
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    setCommentError("");

    if (!commentContent.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }

    if (!isAuth) {
      router.push(`/login?redirect=/threads/${threadId}`);
      return;
    }

    createCommentMutation.mutate({
      threadId: threadId,
      content: commentContent.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading thread...</div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Thread not found
          </h2>
          <Link
            href="/threads"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to threads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/threads"
        className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
      >
        ← Back to threads
      </Link>

      <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {thread.title}
          </h1>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span>By {thread.author?.username || "Unknown"}</span>
          <span>{new Date(thread.createdAt).toLocaleString()}</span>
          {thread.updatedAt !== thread.createdAt && (
            <span className="text-xs">(edited)</span>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none mb-6">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {thread.content}
          </p>
        </div>

        {thread.attachments && thread.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attachments ({thread.attachments.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {thread.attachments.map((attachment) => {
                const fileName = attachment.fileUrl?.split("/").pop() || "File";
                const isImage = attachment.mimeType?.startsWith("image/");
                
                return (
                  <a
                    key={attachment.id}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    {isImage ? (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                        <img
                          src={attachment.fileUrl}
                          alt={fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
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
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {attachment.mimeType || "File"}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </article>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Comments ({thread._count?.comments || 0})
        </h2>

        {/* Comment Form */}
        {isAuth ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />
            {commentError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {commentError}
              </p>
            )}
            <button
              type="submit"
              disabled={createCommentMutation.isPending}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <Link
                href={`/login?redirect=/threads/${threadId}`}
                className="font-medium hover:underline"
              >
                Login
              </Link>
              {" "}to post a comment
            </p>
          </div>
        )}

        {/* Comments List */}
        {thread.comments && thread.comments.length > 0 ? (
          <div className="space-y-4">
            {thread.comments.map((comment) => (
              <div
                key={comment.id}
                className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {comment.author?.username || "Unknown"}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="mb-3 last:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {reply.author?.username || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(reply.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}

