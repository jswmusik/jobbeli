"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Municipality } from "./types";

interface ViewMunicipalityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  municipality: Municipality | null;
}

export function ViewMunicipalityModal({
  open,
  onOpenChange,
  municipality,
}: ViewMunicipalityModalProps) {
  if (!municipality) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {municipality.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={municipality.logo_url}
                alt={municipality.name}
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            )}
            {municipality.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hero Image */}
          {municipality.hero_image_url && (
            <div className="relative aspect-[4/1] w-full rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={municipality.hero_image_url}
                alt={`${municipality.name} hero`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Slug</label>
              <p className="mt-1">
                <Badge variant="secondary" className="font-mono">
                  {municipality.slug}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">ID</label>
              <p className="mt-1 font-mono text-xs text-gray-600 break-all">
                {municipality.id}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Created At
              </label>
              <p className="mt-1 text-sm">{formatDate(municipality.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Updated At
              </label>
              <p className="mt-1 text-sm">{formatDate(municipality.updated_at)}</p>
            </div>
          </div>

          {/* Description */}
          {municipality.description && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Description
              </label>
              <div
                className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg"
                dangerouslySetInnerHTML={{ __html: municipality.description }}
              />
            </div>
          )}

          {/* Custom Fields Schema */}
          {Object.keys(municipality.custom_fields_schema).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Custom Fields Schema
              </label>
              <pre className="p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
                {JSON.stringify(municipality.custom_fields_schema, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
