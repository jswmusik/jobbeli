"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLES, User } from "./types";

// Zod schema for user update (no password required)
const userUpdateSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum([
    "SUPER_ADMIN",
    "MUNICIPALITY_ADMIN",
    "WORKPLACE_ADMIN",
    "COMPANY_ADMIN",
    "YOUTH",
    "GUARDIAN",
  ]),
  municipality: z.string().optional().nullable(),
  workplace: z.string().optional().nullable(),
  // Youth profile fields
  phone_number: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  grade: z.string().optional(),
  youth_municipality: z.string().optional().nullable(),
});

type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

interface Municipality {
  id: string;
  name: string;
}

interface Workplace {
  id: string;
  name: string;
  municipality: string;
  municipality_name: string;
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Man" },
  { value: "FEMALE", label: "Kvinna" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

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

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: User | null;
}

export function EditUserModal({
  open,
  onOpenChange,
  onSuccess,
  user,
}: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | undefined>(undefined);

  const form = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      role: "MUNICIPALITY_ADMIN",
      municipality: undefined,
      workplace: undefined,
      phone_number: "",
      gender: "",
      date_of_birth: "",
      grade: "",
      youth_municipality: undefined,
    },
  });

  const selectedRole = form.watch("role");

  // Reset form when user changes
  useEffect(() => {
    if (user && open) {
      const youthProfile = user.youth_profile as {
        phone_number?: string;
        gender?: string;
        date_of_birth?: string;
        grade?: string;
        municipality?: string;
      } | null;

      form.reset({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        municipality: user.municipality || undefined,
        workplace: user.workplace || undefined,
        phone_number: youthProfile?.phone_number || "",
        gender: youthProfile?.gender || "",
        date_of_birth: youthProfile?.date_of_birth || "",
        grade: youthProfile?.grade || "",
        youth_municipality: youthProfile?.municipality || undefined,
      });
      // Set selectedMunicipality for workplace admin
      if (user.role === "WORKPLACE_ADMIN" && user.municipality) {
        setSelectedMunicipality(user.municipality);
      } else {
        setSelectedMunicipality(undefined);
      }
    }
  }, [user, open, form]);

  // Fetch municipalities when modal opens
  useEffect(() => {
    if (open) {
      apiClient
        .get("/municipalities/")
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data.results || [];
          setMunicipalities(data);
        })
        .catch((err) => {
          console.error("Failed to fetch municipalities", err);
        });
    }
  }, [open]);

  // Fetch workplaces when municipality is selected for WORKPLACE_ADMIN
  useEffect(() => {
    if (selectedRole === "WORKPLACE_ADMIN" && selectedMunicipality) {
      apiClient
        .get("/workplaces/", { params: { municipality: selectedMunicipality } })
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data.results || [];
          setWorkplaces(data);
        })
        .catch((err) => {
          console.error("Failed to fetch workplaces", err);
        });
    } else {
      setWorkplaces([]);
    }
  }, [selectedRole, selectedMunicipality]);

  const onSubmit = async (data: UserUpdateFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Build submit data based on role
      const submitData: Record<string, unknown> = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
      };

      if (data.role === "MUNICIPALITY_ADMIN") {
        submitData.municipality = data.municipality || null;
        submitData.workplace = null;
      } else if (data.role === "WORKPLACE_ADMIN") {
        submitData.municipality = selectedMunicipality || null;
        submitData.workplace = data.workplace || null;
      } else if (data.role === "YOUTH") {
        submitData.municipality = null;
        submitData.workplace = null;
        // Add youth profile fields
        submitData.phone_number = data.phone_number || "";
        submitData.gender = data.gender || "";
        submitData.date_of_birth = data.date_of_birth || null;
        submitData.grade = data.grade || "";
        submitData.youth_municipality = data.youth_municipality || null;
      } else {
        submitData.municipality = null;
        submitData.workplace = null;
      }

      await apiClient.patch(`/users/${user.id}/`, submitData);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to update user", err);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const responseData = err.response.data as Record<string, string[]>;
        if (responseData.email) {
          setError(`Email error: ${responseData.email.join(", ")}`);
        } else {
          setError("Failed to update user. Please try again.");
        }
      } else {
        setError("Failed to update user. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError(null);
      setSelectedMunicipality(undefined);
      setWorkplaces([]);
    }
    onOpenChange(newOpen);
  };

  // Check if fields should be shown based on role
  const showMunicipalityField = selectedRole === "MUNICIPALITY_ADMIN" || selectedRole === "WORKPLACE_ADMIN";
  const showWorkplaceField = selectedRole === "WORKPLACE_ADMIN";
  const showYouthFields = selectedRole === "YOUTH";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update the user&apos;s information and role assignment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Johan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Svensson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="johan@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Select */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.filter((r) => r.value !== "GUARDIAN").map(
                        (role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Municipality Select (conditional) */}
            {showMunicipalityField && (
              <FormField
                control={form.control}
                name="municipality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedRole === "WORKPLACE_ADMIN"
                        ? "Select Municipality (for workplace)"
                        : "Assign to Municipality"}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (selectedRole === "WORKPLACE_ADMIN") {
                          setSelectedMunicipality(value);
                          form.setValue("workplace", undefined);
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={
                        selectedRole === "WORKPLACE_ADMIN"
                          ? selectedMunicipality
                          : field.value || undefined
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a municipality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {municipalities.map((muni) => (
                          <SelectItem key={muni.id} value={muni.id}>
                            {muni.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Workplace Select (conditional - only for WORKPLACE_ADMIN) */}
            {showWorkplaceField && selectedMunicipality && (
              <FormField
                control={form.control}
                name="workplace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Workplace</FormLabel>
                    {workplaces.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No workplaces found for this municipality. Please create a workplace first.
                      </p>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a workplace" />
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
            )}

            {/* Youth Profile Fields (conditional - only for YOUTH role) */}
            {showYouthFields && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Youth Profile Details</h4>
                </div>

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="07X-XXX XX XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDER_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade (Årskurs)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youth_municipality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipality</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select municipality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {municipalities.map((muni) => (
                            <SelectItem key={muni.id} value={muni.id}>
                              {muni.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
