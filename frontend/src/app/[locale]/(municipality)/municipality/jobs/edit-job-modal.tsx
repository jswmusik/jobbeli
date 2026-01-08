"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { YouTubeInput } from "@/components/shared/youtube-embed";
import { Job, Workplace, JOB_STATUS_OPTIONS } from "./types";
import { Badge } from "@/components/ui/badge";
import { X, Briefcase, Trophy } from "lucide-react";
import { Label } from "@/components/ui/label";

// Custom field schema from municipality settings
interface CustomFieldSchema {
  key: string;
  label: string;
  type: "text" | "single_select" | "multi_select";
  options?: string[];
  required?: boolean;
}

interface Period {
  id: string;
  name: string;
}

interface JobGroup {
  id: string;
  name: string;
  period: string;
}

const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  qualifications: z.string().optional(),
  job_details: z.string().optional(),
  municipality_info: z.string().optional(),
  youtube_url: z.string().optional(),
  total_spots: z.number().min(1, "Must have at least 1 spot"),
  hourly_rate: z.number().nullable().optional(),
  workplace: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  min_grade: z.string().optional().nullable(),
  max_grade: z.string().optional().nullable(),
  job_type: z.enum(["NORMAL", "LOTTERY"]),
  lottery_group: z.string().optional().nullable(),
  custom_attributes: z.record(z.string(), z.any()).optional(),
}).refine(
  (data) => {
    // If job_type is LOTTERY, lottery_group is required
    if (data.job_type === "LOTTERY" && !data.lottery_group) {
      return false;
    }
    return true;
  },
  {
    message: "Lottery jobs must be assigned to a lottery group",
    path: ["lottery_group"],
  }
);

const GRADE_OPTIONS = [
  { value: "YEAR_1", label: "Årskurs 1" },
  { value: "YEAR_2", label: "Årskurs 2" },
  { value: "YEAR_3", label: "Årskurs 3" },
  { value: "YEAR_4", label: "Årskurs 4" },
  { value: "YEAR_5", label: "Årskurs 5" },
  { value: "YEAR_6", label: "Årskurs 6" },
  { value: "YEAR_7", label: "Årskurs 7" },
  { value: "YEAR_8", label: "Årskurs 8" },
  { value: "YEAR_9", label: "Årskurs 9" },
  { value: "GYM_1", label: "Gymnasiet år 1" },
  { value: "GYM_2", label: "Gymnasiet år 2" },
  { value: "GYM_3", label: "Gymnasiet år 3" },
  { value: "GYM_4", label: "Gymnasiet år 4" },
];

type JobFormData = z.infer<typeof jobSchema>;

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  job: Job | null;
}

// Helper to normalize options (handles both old comma-separated and new array format)
function normalizeOptions(options: string | string[] | undefined): string[] {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  return options.split(",").map((o) => o.trim()).filter(Boolean);
}

export function EditJobModal({
  open,
  onOpenChange,
  onSuccess,
  job,
}: EditJobModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [customSchema, setCustomSchema] = useState<CustomFieldSchema[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [jobGroups, setJobGroups] = useState<JobGroup[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      qualifications: "",
      job_details: "",
      municipality_info: "",
      youtube_url: "",
      total_spots: 1,
      hourly_rate: null,
      workplace: null,
      status: "DRAFT",
      min_grade: null,
      max_grade: null,
      job_type: "NORMAL",
      lottery_group: null,
      custom_attributes: {},
    },
  });

  const jobType = form.watch("job_type");

  // Filter job groups by selected period
  const filteredJobGroups = selectedPeriod
    ? jobGroups.filter((g) => g.period === selectedPeriod)
    : jobGroups;

  // Reset form when job changes
  useEffect(() => {
    if (job && open) {
      form.reset({
        title: job.title,
        description: job.description || "",
        qualifications: job.qualifications || "",
        job_details: job.job_details || "",
        municipality_info: job.municipality_info || "",
        youtube_url: job.youtube_url || "",
        total_spots: job.total_spots,
        hourly_rate: job.hourly_rate ? parseFloat(job.hourly_rate) : null,
        workplace: job.workplace || undefined,
        status: job.status,
        min_grade: job.min_grade || null,
        max_grade: job.max_grade || null,
        job_type: job.job_type || "NORMAL",
        lottery_group: job.lottery_group || null,
        custom_attributes: job.custom_attributes || {},
      });

      // Set the selected period based on the job's lottery_group
      if (job.lottery_group && jobGroups.length > 0) {
        const group = jobGroups.find((g) => g.id === job.lottery_group);
        if (group) {
          setSelectedPeriod(group.period);
        }
      }
    }
  }, [job, open, form, jobGroups]);

  // Fetch workplaces, custom fields schema, periods, and job groups when modal opens
  useEffect(() => {
    if (open) {
      // Fetch workplaces
      apiClient
        .get("/workplaces/")
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data.results || [];
          setWorkplaces(data);
        })
        .catch((err) => {
          console.error("Failed to fetch workplaces", err);
        });

      // Fetch municipality config for custom fields schema
      apiClient
        .get("/municipalities/my-config/")
        .then((res) => {
          const schema = res.data.custom_fields_schema;
          setCustomSchema(Array.isArray(schema) ? schema : []);
        })
        .catch((err) => {
          console.error("Failed to fetch custom fields schema", err);
        });

      // Fetch periods for lottery configuration
      apiClient
        .get("/periods/")
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data.results || [];
          setPeriods(data);
        })
        .catch((err) => {
          console.error("Failed to fetch periods", err);
        });

      // Fetch job groups for lottery configuration
      apiClient
        .get("/groups/")
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data.results || [];
          setJobGroups(data);
        })
        .catch((err) => {
          console.error("Failed to fetch job groups", err);
        });
    }
  }, [open]);

  const onSubmit = async (data: JobFormData) => {
    if (!job) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        ...data,
        workplace: data.workplace || null,
        hourly_rate: data.hourly_rate || null,
        youtube_url: data.youtube_url || "",
        min_grade: data.min_grade || null,
        max_grade: data.max_grade || null,
        lottery_group: data.job_type === "LOTTERY" ? data.lottery_group : null,
        custom_attributes: data.custom_attributes || {},
      };

      await apiClient.patch(`/jobs/${job.id}/`, submitData);

      toast.success("Job updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to update job", err);
      let errorMessage = "Failed to update job. Please try again.";

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const responseData = err.response.data as Record<string, unknown>;
        if (responseData.detail) {
          errorMessage = String(responseData.detail);
        } else if (responseData.lottery_group) {
          errorMessage = String(responseData.lottery_group);
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
      setSelectedPeriod("");
    }
    onOpenChange(newOpen);
  };

  // Render custom field based on type
  const renderCustomField = (customField: CustomFieldSchema) => {
    const options = normalizeOptions(customField.options);

    return (
      <FormField
        key={customField.key}
        control={form.control}
        name={`custom_attributes.${customField.key}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{customField.label}</FormLabel>
            {customField.type === "single_select" ? (
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${customField.label}...`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : customField.type === "multi_select" ? (
              <div className="space-y-3">
                {/* Selected values display */}
                {Array.isArray(field.value) && field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map((val: string) => (
                      <Badge
                        key={val}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 gap-1"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = field.value.filter(
                              (v: string) => v !== val
                            );
                            field.onChange(newValue);
                          }}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Checkbox options */}
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-white">
                  {options.map((opt) => {
                    const isChecked = Array.isArray(field.value)
                      ? field.value.includes(opt)
                      : false;
                    return (
                      <label
                        key={opt}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentValue = Array.isArray(field.value)
                              ? field.value
                              : [];
                            if (checked) {
                              field.onChange([...currentValue, opt]);
                            } else {
                              field.onChange(
                                currentValue.filter((v: string) => v !== opt)
                              );
                            }
                          }}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <FormControl>
                <Input
                  type="text"
                  placeholder={`Enter ${customField.label}...`}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>Update the job listing details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Type Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Job Type
              </h3>

              <FormField
                control={form.control}
                name="job_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear lottery_group when switching to NORMAL
                          if (value === "NORMAL") {
                            form.setValue("lottery_group", null);
                            setSelectedPeriod("");
                          }
                        }}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="NORMAL"
                            id="edit_job_type_normal"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="edit_job_type_normal"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Briefcase className="mb-3 h-6 w-6" />
                            <span className="font-semibold">Normal Jobb</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">
                              Tillgänglig för alla kvalificerade sökande
                            </span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="LOTTERY"
                            id="edit_job_type_lottery"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="edit_job_type_lottery"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Trophy className="mb-3 h-6 w-6" />
                            <span className="font-semibold">Lotterijobb</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">
                              Tilldelas via lotterisystemet
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lottery Configuration - Only shown when LOTTERY is selected */}
              {jobType === "LOTTERY" && (
                <div className="space-y-4 p-4 border rounded-lg bg-amber-50/50">
                  <h4 className="text-sm font-medium">Lotterikonfiguration</h4>

                  {/* Period Filter */}
                  <div className="space-y-2">
                    <Label>Filtrera per period (valfritt)</Label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedPeriod(value === "all" ? "" : value);
                        // Clear lottery_group when period changes
                        form.setValue("lottery_group", null);
                      }}
                      value={selectedPeriod || "all"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alla perioder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alla perioder</SelectItem>
                        {periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Job Group Selection */}
                  <FormField
                    control={form.control}
                    name="lottery_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lotterigrupp *</FormLabel>
                        {filteredJobGroups.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            Inga lotterigrupper tillgängliga
                            {selectedPeriod && " för den valda perioden"}. Skapa en
                            grupp först i Lotterihantering.
                          </p>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Välj lotterigrupp" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredJobGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormDescription>
                          Jobbet kommer att tilldelas via lotteriet för denna grupp
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Park Maintenance Assistant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workplace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workplace</FormLabel>
                      {workplaces.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No workplaces available
                        </p>
                      ) : (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select workplace (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workplaces.map((wp) => (
                              <SelectItem key={wp.id} value={wp.id}>
                                {wp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JOB_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="total_spots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Spots</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (SEK) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="120.00"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? parseFloat(val) : null);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty if hourly rate varies or is not applicable.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Grade Requirements */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Grade (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No minimum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Lowest grade allowed to apply
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Grade (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No maximum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Highest grade allowed to apply
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dynamic Custom Fields Section */}
            {customSchema.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Matching Criteria
                </h3>
                <div className="space-y-4 border rounded-lg p-4 bg-purple-50/50">
                  {customSchema.map((customField) => renderCustomField(customField))}
                </div>
              </div>
            )}

            {/* Content Section with Tabs */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Job Content
              </h3>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Job Details</TabsTrigger>
                  <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                  <TabsTrigger value="municipality">Municipality Info</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <Controller
                    name="job_details"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What will the applicant be doing?</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Describe daily tasks, responsibilities, and what the applicant will learn..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="qualifications" className="space-y-4 mt-4">
                  <Controller
                    name="qualifications"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Qualifications</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="List any required qualifications, skills, or prerequisites..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="municipality" className="space-y-4 mt-4">
                  <Controller
                    name="municipality_info"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Municipality Information</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Information about the municipality, benefits, or general employment terms..."
                          />
                        </FormControl>
                        <FormDescription>
                          This information can be pre-filled from municipality templates.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Media Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Media
              </h3>

              <Controller
                name="youtube_url"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Video (Optional)</FormLabel>
                    <FormControl>
                      <YouTubeInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </FormControl>
                    <FormDescription>
                      Add a video introducing the workplace or the job position.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Future: Skills & Tags Placeholder */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Skills & Tags
              </h3>
              <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                <p className="text-sm">
                  Skills required and tags for filtering will be available soon.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
