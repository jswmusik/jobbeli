export interface Job {
  id: string;
  municipality: string;
  municipality_name: string;
  workplace: string | null;
  workplace_name: string | null;
  title: string;
  description: string;
  qualifications: string;  // Rich text HTML
  job_details: string;  // Rich text HTML
  municipality_info: string;  // Rich text HTML
  youtube_url: string;
  total_spots: number;
  hourly_rate: string | null;
  min_grade: string | null;  // Grade requirements
  max_grade: string | null;  // Grade requirements
  custom_attributes: Record<string, unknown>;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
  updated_at: string;
}

export interface Workplace {
  id: string;
  name: string;
  municipality: string;
  municipality_name: string;
}

export const JOB_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
