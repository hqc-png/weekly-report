export function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-600 dark:border-t-white"></div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  );
}
