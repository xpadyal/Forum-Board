import apiClient from "./apiClient";

/**
 * Upload a file to the server
 * @param {FormData} formData - FormData containing the file with key 'file'
 * @returns {Promise} API response with fileUrl and mimeType
 */
export const uploadFile = async (formData) => {
  const response = await apiClient.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
