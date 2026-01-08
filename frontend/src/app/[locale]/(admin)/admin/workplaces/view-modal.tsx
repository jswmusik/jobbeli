"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { Workplace } from "./types";

interface ViewWorkplaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workplace: Workplace | null;
}

export function ViewWorkplaceModal({
  open,
  onOpenChange,
  workplace,
}: ViewWorkplaceModalProps) {
  if (!workplace) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {workplace.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Municipality */}
          <div>
            <Badge variant="secondary">{workplace.municipality_name}</Badge>
          </div>

          {/* Images */}
          {(workplace.logo_url || workplace.promo_image_url) && (
            <div className="grid grid-cols-2 gap-4">
              {workplace.logo_url && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Logo
                  </h4>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={workplace.logo_url}
                    alt={`${workplace.name} logo`}
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
              {workplace.promo_image_url && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Promo Image
                  </h4>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={workplace.promo_image_url}
                    alt={`${workplace.name} promo`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {workplace.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h4>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: workplace.description }}
              />
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workplace.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{workplace.address}</p>
                </div>
              </div>
            )}

            {workplace.contact_email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${workplace.contact_email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {workplace.contact_email}
                  </a>
                </div>
              </div>
            )}

            {workplace.contact_phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${workplace.contact_phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {workplace.contact_phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">ID:</span>{" "}
                <span className="font-mono">{workplace.id.substring(0, 8)}...</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(workplace.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
