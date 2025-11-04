"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createThread } from "@/lib/threadApi";
import { uploadFile } from "@/lib/uploadApi";
import { isAuthenticated } from "@/lib/authApi";
import { useEffect } from "react";

export default function CreateThreadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect=/threads/create");
    }
  }, [router]);

  const createThreadMutation = useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      router.push("/");
    },
    onError: (error) => {
      setErrors({
        submit: error.message || "Failed to create thread. Please try again.",
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setErrors({ files: "You can upload a maximum of 5 files" });
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setErrors({
        files: `File size must be less than 10MB. ${oversizedFiles.map((f) => f.name).join(", ")} exceed the limit.`,
      });
      return;
    }
    setFiles((prev) => [...prev, ...selectedFiles]);
    if (errors.files) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.files;
        return newErrors;
      });
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.trim().length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    } else if (formData.content.trim().length > 10000) {
      newErrors.content = "Content must be less than 10,000 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) {
      return;
    }

    let attachments = [];
    if (files.length > 0) {
      setUploadingFiles(true);
      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadResults = await Promise.all(uploadPromises);
        attachments = uploadResults.map((result) => ({
          fileUrl: result.fileUrl,
          mimeType: result.mimeType,
        }));
      } catch (error) {
        setErrors({
          submit: error.message || "Failed to upload files. Please try again.",
        });
        setUploadingFiles(false);
        return;
      }
      setUploadingFiles(false);
    }

    createThreadMutation.mutate({
      title: formData.title.trim(),
      content: formData.content.trim(),
      attachments: attachments,
    });
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Thread
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start a new discussion with the community
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Thread Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.title
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors`}
                placeholder="Enter a descriptive title for your thread"
                disabled={createThreadMutation.isPending}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.title ? (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.title}
                  </p>
                ) : (
                  <span></span>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.title.length}/200
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Thread Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={12}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.content
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors resize-none`}
                placeholder="Share your thoughts, ask questions, or start a discussion..."
                disabled={createThreadMutation.isPending || uploadingFiles}
                maxLength={10000}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.content ? (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.content}
                  </p>
                ) : (
                  <span></span>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.content.length}/10,000
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="files"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Attachments (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <label
                  htmlFor="files"
                  className="flex-1 cursor-pointer px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center"
                >
                  <input
                    type="file"
                    id="files"
                    name="files"
                    multiple
                    onChange={handleFileChange}
                    disabled={createThreadMutation.isPending || uploadingFiles || files.length >= 5}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {files.length >= 5
                      ? "Maximum 5 files reached"
                      : "Choose Files (Max 5, 10MB each)"}
                  </span>
                </label>
              </div>
              {errors.files && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.files}
                </p>
              )}

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <svg
                          className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={createThreadMutation.isPending || uploadingFiles}
                        className="ml-3 p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.submit}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={createThreadMutation.isPending}
                className="px-6 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createThreadMutation.isPending || uploadingFiles}
                className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingFiles ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading files...
                  </span>
                ) : createThreadMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Thread"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

