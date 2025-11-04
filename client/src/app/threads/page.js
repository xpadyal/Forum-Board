"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllThreads } from "@/lib/threadApi";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import ThreadList from "@/components/ThreadList";

const LIMIT = 10;

export default function ThreadsPage() {
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          All Threads
        </h1>
        {isAuth && (
          <Link
            href="/threads/new"
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Create Thread
          </Link>
        )}
      </div>

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

