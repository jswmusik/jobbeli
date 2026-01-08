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
import { Municipality } from "./types";

// Zod schema for municipality update
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

interface EditMunicipalityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  municipality: Municipality | null;
}

export function EditMunicipalityModal({
  open,
  onOpenChange,
  onSuccess,
  municipality,
}: EditMunicipalityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | string | null>(null);
  const [heroImage, setHeroImage] = useState<File | string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeHeroImage, setRemoveHeroImage] = useState(false);

  const form = useForm<MunicipalityFormData>({
    resolver: zodResolver(municipalitySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  // Reset form when municipality changes
  useEffect(() => {
    if (municipality && open) {
      form.reset({
        name: municipality.name,
        slug: municipality.slug,
        description: municipality.description || "",
      });
      setLogo(municipality.logo_url || null);
      setHeroImage(municipality.hero_image_url || null);
      setRemoveLogo(false);
      setRemoveHeroImage(false);
    }
  }, [municipality, open, form]);

  const onSubmit = async (data: MunicipalityFormData) => {
    if (!municipality) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Use FormData for multipart upload
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("slug", data.slug);
      formData.append("description", data.description || "");

      // Handle logo - only include if changed
      if (logo instanceof File) {
        formData.append("logo", logo);
      } else if (removeLogo) {
        // Send null to clear the image
        formData.append("logo", "null");
      }
      // If logo is an existing URL string and not being removed, don't include it

      // Handle hero image - only include if changed
      if (heroImage instanceof File) {
        formData.append("hero_image", heroImage);
      } else if (removeHeroImage) {
        // Send null to clear the image
        formData.append("hero_image", "null");
      }
      // If heroImage is an existing URL string and not being removed, don't include it

      await apiClient.patch(`/municipalities/${municipality.id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Municipality updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to update municipality", err);
      let errorMessage = "Failed to update municipality. Please try again.";

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
          } else if (errorObj.hero_image) {
            const heroErrors = Array.isArray(errorObj.hero_image) ? errorObj.hero_image : [errorObj.hero_image];
            errorMessage = `Hero image error: ${heroErrors.join(", ")}`;
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
      setRemoveLogo(false);
      setRemoveHeroImage(false);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const handleLogoChange = (file: File | null) => {
    setLogo(file);
    setRemoveLogo(false);
  };

  const handleLogoRemove = () => {
    setLogo(null);
    setRemoveLogo(true);
  };

  const handleHeroImageChange = (file: File | null) => {
    setHeroImage(file);
    setRemoveHeroImage(false);
  };

  const handleHeroImageRemove = () => {
    setHeroImage(null);
    setRemoveHeroImage(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Municipality</DialogTitle>
          <DialogDescription>
            Update the municipality details. Changes will be saved immediately.
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
                  onChange={handleLogoChange}
                  onRemove={handleLogoRemove}
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
                  onChange={handleHeroImageChange}
                  onRemove={handleHeroImageRemove}
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
