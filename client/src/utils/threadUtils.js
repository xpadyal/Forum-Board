/**
 * Utility functions for thread-related operations
 */

/**
 * Separates attachments into image and non-image arrays
 * @param {Array} attachments - Array of attachment objects
 * @returns {Object} { imageAttachments, nonImageAttachments, hasImages }
 */
export function categorizeAttachments(attachments = []) {
  const imageAttachments = attachments.filter(
    (att) => att.mimeType?.startsWith("image/")
  );
  const nonImageAttachments = attachments.filter(
    (att) => !att.mimeType?.startsWith("image/")
  );
  const hasImages = imageAttachments.length > 0;

  return { imageAttachments, nonImageAttachments, hasImages };
}

/**
 * Formats a date to a readable string
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time (default: false)
 * @returns {string} Formatted date string
 */
export function formatDate(date, includeTime = false) {
  if (!date) return "";
  const dateObj = new Date(date);
  return includeTime
    ? dateObj.toLocaleString()
    : dateObj.toLocaleDateString();
}

