"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "@/lib/commentApi";
import { isAuthenticated } from "@/lib/authApi";

export default function Comment({ comment, threadId, depth = 0, maxDepth = 5 }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const queryClient = useQueryClient();
  const isAuth = isAuthenticated();

  const createReplyMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      setReplyContent("");
      setReplyError("");
      setIsReplying(false);
    },
    onError: (error) => {
      setReplyError(error.message || "Failed to post reply. Please try again.");
    },
  });

  const handleReplySubmit = (e) => {
    e.preventDefault();
    setReplyError("");

    if (!replyContent.trim()) {
      setReplyError("Reply cannot be empty");
      return;
    }

    if (!isAuth) {
      setReplyError("Please login to reply");
      return;
    }

    createReplyMutation.mutate({
      threadId: threadId,
      parentId: comment.id,
      content: replyContent.trim(),
    });
  };

  const canReply = depth < maxDepth && isAuth;

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-semibold ${depth === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200 text-sm'}`}>
            {comment.author?.username || "Unknown"}
          </span>
          <span className={`text-gray-500 dark:text-gray-400 ${depth === 0 ? 'text-sm' : 'text-xs'}`}>
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${depth === 0 ? '' : 'text-sm'}`}>
          {comment.content}
        </p>

        {/* Reply Button */}
        {canReply && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isReplying ? "Cancel" : "Reply"}
          </button>
        )}

        {/* Reply Form */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />
            {replyError && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                {replyError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createReplyMutation.isPending}
                className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                  setReplyError("");
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              threadId={threadId}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

