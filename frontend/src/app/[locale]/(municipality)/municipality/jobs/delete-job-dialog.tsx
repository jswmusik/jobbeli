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
import { Job } from "./types";

interface DeleteJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  job: Job | null;
}

export function DeleteJobDialog({
  open,
  onOpenChange,
  onSuccess,
  job,
}: DeleteJobDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!job) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/jobs/${job.id}/`);
      toast.success("Job deleted successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete job", err);
      toast.error("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!job) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Job</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{job.title}</strong>? This
            action cannot be undone.
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
