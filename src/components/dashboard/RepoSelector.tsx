"use client";

import { useEffect, useState } from "react";
import { GitHubRepository } from "@/lib/types";
import { Loading } from "@/components/ui/Loading";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface RepoSelectorProps {
  selectedRepos: string[];
  onSelectionChange: (repos: string[]) => void;
}

export function RepoSelector({
  selectedRepos,
  onSelectionChange,
}: RepoSelectorProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/repos");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch repositories");
      }

      const data = await response.json();
      setRepositories(data.repositories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleToggle = (fullName: string) => {
    if (selectedRepos.includes(fullName)) {
      onSelectionChange(selectedRepos.filter((r) => r !== fullName));
    } else {
      onSelectionChange([...selectedRepos, fullName]);
    }
  };

  const handleSelectAll = () => {
    const filtered = filteredRepos.map((r) => r.full_name);
    onSelectionChange([...new Set([...selectedRepos, ...filtered])]);
  };

  const handleDeselectAll = () => {
    const filtered = filteredRepos.map((r) => r.full_name);
    onSelectionChange(selectedRepos.filter((r) => !filtered.includes(r)));
  };

  const filteredRepos = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.description &&
        repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <Loading message="Loading repositories..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchRepos} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Repositories
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Select all
          </button>
          <span className="text-xs text-gray-400">•</span>
          <button
            onClick={handleDeselectAll}
            className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Deselect all
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search repositories..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        {filteredRepos.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            {searchTerm ? "No repositories found" : "No repositories available"}
          </p>
        ) : (
          filteredRepos.map((repo) => (
            <label
              key={repo.id}
              className="flex items-start gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedRepos.includes(repo.full_name)}
                onChange={() => handleToggle(repo.full_name)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {repo.name}
                  {repo.private && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (Private)
                    </span>
                  )}
                </div>
                {repo.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {repo.description}
                  </p>
                )}
              </div>
            </label>
          ))
        )}
      </div>

      {selectedRepos.length > 0 && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {selectedRepos.length} {selectedRepos.length === 1 ? "repository" : "repositories"} selected
        </p>
      )}
    </div>
  );
}
