// GitHub Types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  updated_at: string;
}

export interface GitHubCommit {
  repository: string;
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

// Report Types
export interface ReportMetadata {
  generated_at: string;
  commit_count: number;
  repositories: string[];
  date_range: {
    start: string;
    end: string;
  };
  user: {
    username: string;
    email?: string;
  };
}

export interface Report {
  report_id: string;
  title: string;
  summary: string;
  markdown: string;
  metadata: ReportMetadata;
}

export interface ReportSummary {
  id: string;
  title: string;
  generated_at: string;
  commit_count: number;
  date_range: {
    start: string;
    end: string;
  };
}

// API Request/Response Types
export interface GenerateReportRequest {
  repositories: string[];
  since: string;
  until: string;
  title?: string;
}

export interface FetchCommitsRequest {
  repositories: string[];
  since: string;
  until: string;
}
