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
import { ImageUpload } from "@/components/ui/image-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

// Zod schema for municipality creation
const municipalitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
});

type MunicipalityFormData = z.infer<typeof municipalitySchema>;

interface CreateMunicipalityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateMunicipalityModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateMunicipalityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [heroImage, setHeroImage] = useState<File | null>(null);

  const form = useForm<MunicipalityFormData>({
    resolver: zodResolver(municipalitySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  // Watch the name field to auto-generate slug
  const nameValue = form.watch("name");

  useEffect(() => {
    if (nameValue) {
      const generatedSlug = generateSlug(nameValue);
      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, form]);

  const onSubmit = async (data: MunicipalityFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Use FormData for multipart upload
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("slug", data.slug);
      formData.append("description", data.description || "");

      if (logo) {
        formData.append("logo", logo);
      }
      if (heroImage) {
        formData.append("hero_image", heroImage);
      }

      await apiClient.post("/municipalities/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      form.reset();
      setLogo(null);
      setHeroImage(null);
      toast.success("Municipality created successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to create municipality", err);
      let errorMessage = "Failed to create municipality. Please try again.";

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response
      ) {
        const responseData = err.response.data;
        console.error("API Error Response:", responseData);

        if (typeof responseData === "object" && responseData !== null) {
          const errorObj = responseData as Record<string, unknown>;
          if (errorObj.slug) {
            const slugErrors = Array.isArray(errorObj.slug) ? errorObj.slug : [errorObj.slug];
            errorMessage = `Slug error: ${slugErrors.join(", ")}`;
          } else if (errorObj.name) {
            const nameErrors = Array.isArray(errorObj.name) ? errorObj.name : [errorObj.name];
            errorMessage = `Name error: ${nameErrors.join(", ")}`;
          } else if (errorObj.logo) {
            const logoErrors = Array.isArray(errorObj.logo) ? errorObj.logo : [errorObj.logo];
            errorMessage = `Logo error: ${logoErrors.join(", ")}`;
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
      setHeroImage(null);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Municipality</DialogTitle>
          <DialogDescription>
            Add a new municipality to the platform. The slug will be used in
            URLs.
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
                      <Input placeholder="Stockholms kommun" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="stockholms-kommun" {...field} />
                    </FormControl>
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
                  Hero Image
                </label>
                <ImageUpload
                  value={heroImage}
                  onChange={setHeroImage}
                  aspectRatio="aspect-video"
                  hint="1920x400px recommended"
                  label="Upload Hero"
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
                      placeholder="Write a description for this municipality..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
