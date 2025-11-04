import apiClient from "./apiClient";

/**
 * Get all threads with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise} API response with threads and pagination
 */
export const getAllThreads = async (page = 1, limit = 10) => {
  const response = await apiClient.get("/threads", {
    params: { page, limit },
  });
  return response;
};

/**
 * Get a single thread by ID
 * @param {string|number} id - Thread ID
 * @returns {Promise} API response with thread data
 */
export const getThreadById = async (id) => {
  const response = await apiClient.get(`/threads/${id}`);
  return response;
};

/**
 * Create a new thread
 * @param {Object} threadData - Thread data
 * @param {string} threadData.title - Thread title
 * @param {string} threadData.content - Thread content
 * @param {Array} threadData.attachments - Array of attachment objects
 * @returns {Promise} API response with created thread
 */
export const createThread = async (threadData) => {
  const response = await apiClient.post("/threads", threadData);
  return response;
};

/**
 * Update a thread
 * @param {string|number} id - Thread ID
 * @param {Object} threadData - Updated thread data
 * @param {string} threadData.title - Thread title
 * @param {string} threadData.content - Thread content
 * @returns {Promise} API response with updated thread
 */
export const updateThread = async (id, threadData) => {
  const response = await apiClient.put(`/threads/${id}`, threadData);
  return response;
};

/**
 * Delete a thread
 * @param {string|number} id - Thread ID
 * @returns {Promise} API response
 */
export const deleteThread = async (id) => {
  const response = await apiClient.delete(`/threads/${id}`);
  return response;
};
