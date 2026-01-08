"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { CreateJobModal } from "./create-job-modal";
import { EditJobModal } from "./edit-job-modal";
import { ViewJobModal } from "./view-job-modal";
import { DeleteJobDialog } from "./delete-job-dialog";
import { Job } from "./types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/jobs/");
      setJobs(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSuccess = () => {
    fetchJobs();
  };

  const openViewModal = (job: Job) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (job: Job) => {
    setSelectedJob(job);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
          <p className="text-gray-500">Manage your summer job positions.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ New Job</Button>
      </div>

      {/* Modals */}
      <CreateJobModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleSuccess}
      />

      <EditJobModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleSuccess}
        job={selectedJob}
      />

      <ViewJobModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        job={selectedJob}
      />

      <DeleteJobDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleSuccess}
        job={selectedJob}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center">Loading...</p>
          ) : error ? (
            <p className="p-8 text-center text-red-500">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Workplace</TableHead>
                  <TableHead>Spots</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No jobs found. Create one!
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        {job.workplace_name || (
                          <span className="text-muted-foreground">General</span>
                        )}
                      </TableCell>
                      <TableCell>{job.total_spots}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewModal(job)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(job)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(job)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
