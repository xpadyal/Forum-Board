"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAllThreads } from "@/lib/threadApi";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import ThreadList from "@/components/ThreadList";

const LIMIT = 10;

export default function HomePage() {
  const { isAuth } = useAuth();
  const { page, setPage } = usePagination(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["threads", page, LIMIT],
    queryFn: () => getAllThreads(page, LIMIT),
  });

  const threads = data?.threads || [];
  const pagination = data?.pagination || {};

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Forum Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A modern platform for discussions and community engagement
          </p>
        </div>
        {isAuth && (
          <Link
            href="/threads/new"
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Create Thread
          </Link>
        )}
      </div>

      {/* Show login prompt for non-authenticated users */}
      {!isAuth && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <Link
              href="/login"
              className="font-medium hover:underline mr-1"
            >
              Login
            </Link>
            or
            <Link
              href="/register"
              className="font-medium hover:underline ml-1"
            >
              Register
            </Link>
            to create new threads and participate in discussions.
          </p>
        </div>
      )}

      {/* Threads List */}
      <ThreadList
        threads={threads}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        isAuth={isAuth}
        onPageChange={setPage}
      />
    </div>
  );
}
