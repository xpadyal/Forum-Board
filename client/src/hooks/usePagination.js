"use client";

import { useState } from "react";

/**
 * Custom hook to manage pagination state
 * @param {number} initialPage - Initial page number (default: 1)
 * @returns {Object} { page, setPage, nextPage, prevPage, goToPage }
 */
export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToPage = (newPage) => setPage(Math.max(1, newPage));

  return { page, setPage, nextPage, prevPage, goToPage };
}

