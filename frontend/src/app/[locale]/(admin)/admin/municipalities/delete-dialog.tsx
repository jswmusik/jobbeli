"use client";

import { useState } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Municipality } from "./types";

interface DeleteMunicipalityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  municipality: Municipality | null;
}

export function DeleteMunicipalityDialog({
  open,
  onOpenChange,
  onSuccess,
  municipality,
}: DeleteMunicipalityDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!municipality) return;

    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.delete(`/municipalities/${municipality.id}/`);
      toast.success(`"${municipality.name}" deleted successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete municipality", err);
      const errorMessage = "Failed to delete municipality. It may have associated data.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Municipality</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>{municipality?.name}</strong>? This action cannot be undone.
            All associated data (users, jobs, applications) may be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
