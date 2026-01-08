"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Workplace, Municipality } from "./types";

const workplaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  municipality: z.string().min(1, "Municipality is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
});

type WorkplaceFormData = z.infer<typeof workplaceSchema>;

interface EditWorkplaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  workplace: Workplace | null;
  municipalities: Municipality[];
}

export function EditWorkplaceModal({
  open,
  onOpenChange,
  onSuccess,
  workplace,
  municipalities,
}: EditWorkplaceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | string | null>(null);
  const [promoImage, setPromoImage] = useState<File | string | null>(null);

  const form = useForm<WorkplaceFormData>({
    resolver: zodResolver(workplaceSchema),
    defaultValues: {
      name: "",
      municipality: "",
      description: "",
      address: "",
      contact_email: "",
      contact_phone: "",
    },
  });

  useEffect(() => {
    if (workplace && open) {
      form.reset({
        name: workplace.name,
        municipality: workplace.municipality,
        description: workplace.description || "",
        address: workplace.address || "",
        contact_email: workplace.contact_email || "",
        contact_phone: workplace.contact_phone || "",
      });
      setLogo(workplace.logo_url || null);
      setPromoImage(workplace.promo_image_url || null);
    }
  }, [workplace, open, form]);

  const onSubmit = async (data: WorkplaceFormData) => {
    if (!workplace) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("municipality", data.municipality);
      formData.append("description", data.description || "");
      formData.append("address", data.address || "");
      formData.append("contact_email", data.contact_email || "");
      formData.append("contact_phone", data.contact_phone || "");

      // Only append image if it's a new file
      if (logo instanceof File) {
        formData.append("logo", logo);
      }
      if (promoImage instanceof File) {
        formData.append("promo_image", promoImage);
      }

      await apiClient.patch(`/workplaces/${workplace.id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Workplace updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to update workplace", err);
      let errorMessage = "Failed to update workplace. Please try again.";

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const responseData = err.response.data;
        if (typeof responseData === "object" && responseData !== null) {
          const errorObj = responseData as Record<string, unknown>;
          if (errorObj.name) {
            const nameErrors = Array.isArray(errorObj.name) ? errorObj.name : [errorObj.name];
            errorMessage = `Name error: ${nameErrors.join(", ")}`;
          } else if (errorObj.detail) {
            errorMessage = String(errorObj.detail);
          }
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
      setLogo(null);
      setPromoImage(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Workplace</DialogTitle>
          <DialogDescription>
            Update workplace information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Parkforvaltningen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="municipality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Municipality</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Logo</label>
                <ImageUpload
                  value={logo}
                  onChange={setLogo}
                  aspectRatio="aspect-square"
                  hint="200x200px recommended"
                  label="Upload Logo"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Promo Image
                </label>
                <ImageUpload
                  value={promoImage}
                  onChange={setPromoImage}
                  aspectRatio="aspect-video"
                  hint="1200x630px recommended"
                  label="Upload Promo"
                />
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Write a description for this workplace..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Storgatan 1, 123 45 Stockholm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@workplace.se" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+46 70 123 45 67" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
