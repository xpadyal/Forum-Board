import apiClient from "./apiClient";

/**
 * Upload a file to the server
 * @param {File} file - File object to upload
 * @returns {Promise} API response with fileUrl and mimeType
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await apiClient.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  
  return response.data || response;
};
