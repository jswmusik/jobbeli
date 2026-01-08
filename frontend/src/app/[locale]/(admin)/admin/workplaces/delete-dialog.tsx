"use client";

import { useState } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Workplace } from "./types";

interface DeleteWorkplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  workplace: Workplace | null;
}

export function DeleteWorkplaceDialog({
  open,
  onOpenChange,
  onSuccess,
  workplace,
}: DeleteWorkplaceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!workplace) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/workplaces/${workplace.id}/`);
      toast.success("Workplace deleted successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete workplace", err);
      toast.error("Failed to delete workplace. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!workplace) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workplace</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{workplace.name}</strong>?
            This action cannot be undone. All associated jobs and data will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
