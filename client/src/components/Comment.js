"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment } from "@/lib/commentApi";
import { useAuth } from "@/hooks/useAuth";

export default function Comment({ comment, threadId, threadAuthorId, depth = 0, maxDepth = 5 }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const queryClient = useQueryClient();
  const { isAuth, user: currentUser } = useAuth();
  
  const currentUserId = currentUser?.id ? String(currentUser.id) : null;
  const commentAuthorId = comment.authorId ? String(comment.authorId) : null;
  const isAdmin = currentUser?.role === 'admin';
  
  // Check if user can delete this comment (comment owner OR thread owner OR admin)
  const canDelete = isAuth && currentUserId && (
    isAdmin ||
    currentUserId === commentAuthorId || 
    currentUserId === threadAuthorId
  );

  const createReplyMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      setReplyContent("");
      setReplyError("");
      setIsReplying(false);
      // Trigger a refetch after 3 seconds to catch ForumBot's reply if user replied to ForumBot
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      }, 3000);
    },
    onError: (error) => {
      setReplyError(error.message || "Failed to post reply. Please try again.");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
    },
    onError: (error) => {
      setReplyError(error.message || "Failed to delete comment. Please try again.");
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(comment.id);
    }
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    setReplyError("");

    // Prevent duplicate submissions
    if (createReplyMutation.isPending) {
      return;
    }

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
          {/* ForumBot Badge */}
          {(comment.author?.username === "ForumBot" || 
            comment.author?.username?.toLowerCase() === "forumbot") && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
              🤖 ForumBot
            </span>
          )}
          <span className={`text-gray-500 dark:text-gray-400 ${depth === 0 ? 'text-sm' : 'text-xs'}`}>
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${depth === 0 ? '' : 'text-sm'}`}>
          {comment.content}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-2">
          {canReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isReplying ? "Cancel" : "Reply"}
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleteCommentMutation.isPending}
              className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteCommentMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

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
                threadAuthorId={threadAuthorId}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
        </div>
      )}
    </div>
  );
}

