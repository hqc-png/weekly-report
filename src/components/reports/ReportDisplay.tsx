"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportDisplayProps {
  markdown: string;
}

export function ReportDisplay({ markdown }: ReportDisplayProps) {
  return (
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:break-words prose-p:break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
