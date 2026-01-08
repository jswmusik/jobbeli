"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import apiClient from "@/lib/api/client";
import { Job } from "./types";

// Custom field schema from municipality settings
interface CustomFieldSchema {
  key: string;
  label: string;
  type: "text" | "single_select" | "multi_select";
  options?: string[];
}

interface ViewJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export function ViewJobModal({ open, onOpenChange, job }: ViewJobModalProps) {
  const [customSchema, setCustomSchema] = useState<CustomFieldSchema[]>([]);

  // Fetch custom schema when modal opens
  useEffect(() => {
    if (open) {
      apiClient
        .get("/municipalities/my-config/")
        .then((res) => {
          const schema = res.data.custom_fields_schema;
          setCustomSchema(Array.isArray(schema) ? schema : []);
        })
        .catch((err) => {
          console.error("Failed to fetch custom fields schema", err);
        });
    }
  }, [open]);

  if (!job) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "secondary";
    }
  };

  const hasContent = (html: string | undefined) => {
    if (!html) return false;
    // Check if it's not just empty tags
    const stripped = html.replace(/<[^>]*>/g, "").trim();
    return stripped.length > 0;
  };

  // Get label for a custom field key
  const getFieldLabel = (key: string): string => {
    const field = customSchema.find((f) => f.key === key);
    return field?.label || key;
  };

  // Get field type for a custom field key
  const getFieldType = (key: string): string => {
    const field = customSchema.find((f) => f.key === key);
    return field?.type || "text";
  };

  // Check if there are any custom attributes with values
  const hasCustomAttributes =
    job.custom_attributes &&
    Object.entries(job.custom_attributes).some(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });

  // Render value based on type
  const renderValue = (key: string, value: unknown) => {
    const fieldType = getFieldType(key);

    if (fieldType === "multi_select" && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v: string) => (
            <Badge key={v} variant="secondary" className="font-normal">
              {v}
            </Badge>
          ))}
        </div>
      );
    }

    return (
      <Badge variant="secondary" className="font-normal">
        {String(value)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {job.title}
            <Badge variant={getStatusBadgeVariant(job.status)}>{job.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Workplace
              </p>
              <p className="text-sm">
                {job.workplace_name || (
                  <span className="text-muted-foreground">General (Municipality-wide)</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Spots
              </p>
              <p className="text-sm">{job.total_spots}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Hourly Rate
              </p>
              <p className="text-sm">
                {job.hourly_rate ? `${job.hourly_rate} SEK` : "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Municipality
              </p>
              <p className="text-sm">{job.municipality_name}</p>
            </div>
          </div>

          {/* Matching Criteria (Custom Attributes) */}
          {hasCustomAttributes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Matching Criteria
              </p>
              <div className="border rounded-lg p-4 bg-purple-50/50 space-y-3">
                {Object.entries(job.custom_attributes).map(([key, value]) => {
                  if (value === undefined || value === null || value === "") {
                    return null;
                  }
                  if (Array.isArray(value) && value.length === 0) {
                    return null;
                  }
                  return (
                    <div key={key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600">
                        {getFieldLabel(key)}
                      </span>
                      {renderValue(key, value)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* YouTube Video */}
          {job.youtube_url && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Video
              </p>
              <YouTubeEmbed url={job.youtube_url} className="max-w-full" />
            </div>
          )}

          {/* Content Tabs */}
          {(hasContent(job.job_details) ||
            hasContent(job.qualifications) ||
            hasContent(job.municipality_info)) && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Job Details</TabsTrigger>
                <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                <TabsTrigger value="municipality">Municipality Info</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                {hasContent(job.job_details) ? (
                  <div
                    className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-4"
                    dangerouslySetInnerHTML={{ __html: job.job_details }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No job details provided.</p>
                )}
              </TabsContent>

              <TabsContent value="qualifications" className="mt-4">
                {hasContent(job.qualifications) ? (
                  <div
                    className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-4"
                    dangerouslySetInnerHTML={{ __html: job.qualifications }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No qualifications specified.</p>
                )}
              </TabsContent>

              <TabsContent value="municipality" className="mt-4">
                {hasContent(job.municipality_info) ? (
                  <div
                    className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-4"
                    dangerouslySetInnerHTML={{ __html: job.municipality_info }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No municipality information provided.</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Legacy Description (fallback) */}
          {job.description && !hasContent(job.job_details) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>
          )}

          {/* Skills & Tags Placeholder */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Skills & Tags
            </p>
            <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
              <p className="text-sm">
                Skills and tags will be displayed here once configured.
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created
              </p>
              <p className="text-sm">
                {new Date(job.created_at).toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Last Updated
              </p>
              <p className="text-sm">
                {new Date(job.updated_at).toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
