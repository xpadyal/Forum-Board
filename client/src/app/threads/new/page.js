"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createThread } from "@/lib/threadApi";
import { uploadFile } from "@/lib/uploadApi";
import { useAuth } from "@/hooks/useAuth";

export default function NewThreadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuth, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Only redirect if auth check is complete and user is not authenticated
    if (!authLoading && !isAuth) {
      router.push("/login?redirect=/threads/new");
    }
  }, [isAuth, authLoading, router]);

  const createThreadMutation = useMutation({
    mutationFn: createThread,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      // Redirect to the newly created thread detail page
      // The API response might be wrapped in a data property or directly contain the thread
      const threadId = data?.id || data?.data?.id;
      if (threadId) {
        router.push(`/threads/${threadId}`);
      } else {
        console.error("Thread creation response missing ID:", data);
        router.push("/threads");
      }
    },
    onError: (error) => {
      // Check if error is from moderation (400 status with inappropriate content message)
      const isModerationError = 
        error.status === 400 && 
        (error.message?.includes("inappropriate") || 
         error.message?.includes("unsafe") ||
         error.message?.includes("flagged"));
      
      setErrors({
        submit: isModerationError
          ? "Your post was flagged as inappropriate. Please revise your content and try again."
          : error.message || "Failed to create thread. Please try again.",
      });
    },
  });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) return [];

    setUploadingFiles(true);
    const attachments = [];

    try {
      for (const file of files) {
        const uploaded = await uploadFile(file);
        // Backend returns: { status: 'success', message: '...', data: { fileUrl, mimeType } }
        const fileData = uploaded.data || uploaded;
        attachments.push({
          fileUrl: fileData.fileUrl,
          mimeType: fileData.mimeType,
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    } finally {
      setUploadingFiles(false);
    }

    return attachments;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    if (!formData.content.trim()) {
      setErrors({ content: "Content is required" });
      return;
    }

    try {
      // Upload files first if any
      const attachments = await handleUploadFiles();

      // Create thread with attachments
      createThreadMutation.mutate({
        title: formData.title.trim(),
        content: formData.content.trim(),
        attachments,
      });
    } catch (error) {
      setErrors({
        submit: error.message || "Failed to upload files. Please try again.",
      });
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render form if not authenticated (will redirect)
  if (!isAuth) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Create New Thread
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter thread title..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Content
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your thread content..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.content}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="files"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Attachments (Optional)
          </label>
          <input
            type="file"
            id="files"
            multiple
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          {files.length > 0 && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {files.length} file(s) selected
            </p>
          )}
        </div>

        {errors.submit && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.submit}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createThreadMutation.isPending || uploadingFiles}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createThreadMutation.isPending || uploadingFiles
              ? "Creating..."
              : "Create Thread"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

