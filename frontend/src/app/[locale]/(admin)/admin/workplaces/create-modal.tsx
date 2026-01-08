"use client";

import { useState } from "react";
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
import { Municipality } from "./types";

const workplaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  municipality: z.string().min(1, "Municipality is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
});

type WorkplaceFormData = z.infer<typeof workplaceSchema>;

interface CreateWorkplaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  municipalities: Municipality[];
}

export function CreateWorkplaceModal({
  open,
  onOpenChange,
  onSuccess,
  municipalities,
}: CreateWorkplaceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [promoImage, setPromoImage] = useState<File | null>(null);

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

  const onSubmit = async (data: WorkplaceFormData) => {
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

      if (logo) {
        formData.append("logo", logo);
      }
      if (promoImage) {
        formData.append("promo_image", promoImage);
      }

      await apiClient.post("/workplaces/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      form.reset();
      setLogo(null);
      setPromoImage(null);
      toast.success("Workplace created successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to create workplace", err);
      let errorMessage = "Failed to create workplace. Please try again.";

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
      form.reset();
      setLogo(null);
      setPromoImage(null);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workplace</DialogTitle>
          <DialogDescription>
            Add a new workplace/department within a municipality.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
