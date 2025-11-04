import apiClient from "./apiClient";

/**
 * Create a comment on a thread
 * @param {Object} commentData - Comment data
 * @param {string|number} commentData.threadId - Thread ID
 * @param {string|number} commentData.parentId - Parent comment ID (optional, for replies)
 * @param {string} commentData.content - Comment content
 * @returns {Promise} API response with created comment
 */
export const createComment = async (commentData) => {
  const response = await apiClient.post("/comments", commentData);
  return response;
};

/**
 * Get comments for a thread
 * @param {string|number} threadId - Thread ID
 * @returns {Promise} API response with comments
 */
export const getCommentsByThread = async (threadId) => {
  const response = await apiClient.get(`/comments/thread/${threadId}`);
  return response;
};

/**
 * Delete a comment
 * @param {string|number} id - Comment ID
 * @returns {Promise} API response
 */
export const deleteComment = async (id) => {
  const response = await apiClient.delete(`/comments/${id}`);
  return response;
};

