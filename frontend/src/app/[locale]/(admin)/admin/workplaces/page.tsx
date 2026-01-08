"use client";

import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { CreateWorkplaceModal } from "./create-modal";
import { EditWorkplaceModal } from "./edit-modal";
import { ViewWorkplaceModal } from "./view-modal";
import { DeleteWorkplaceDialog } from "./delete-dialog";
import { Workplace, Municipality } from "./types";

export default function WorkplacesPage() {
  const [data, setData] = useState<Workplace[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMunicipalityFilter, setSelectedMunicipalityFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null>(null);

  useEffect(() => {
    fetchMunicipalities();
  }, []);

  const fetchMunicipalities = async () => {
    try {
      const res = await apiClient.get("/municipalities/");
      setMunicipalities(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch municipalities", err);
    }
  };

  const fetchWorkplaces = useCallback(async () => {
    try {
      setLoading(true);
      const params = selectedMunicipalityFilter !== "all"
        ? { municipality: selectedMunicipalityFilter }
        : {};
      const res = await apiClient.get("/workplaces/", { params });
      setData(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch workplaces", err);
      setError("Failed to load workplaces");
    } finally {
      setLoading(false);
    }
  }, [selectedMunicipalityFilter]);

  useEffect(() => {
    fetchWorkplaces();
  }, [fetchWorkplaces]);

  const handleCreateSuccess = () => {
    fetchWorkplaces();
  };

  const handleEditSuccess = () => {
    fetchWorkplaces();
  };

  const handleDeleteSuccess = () => {
    fetchWorkplaces();
  };

  const openViewModal = (workplace: Workplace) => {
    setSelectedWorkplace(workplace);
    setIsViewModalOpen(true);
  };

  const openEditModal = (workplace: Workplace) => {
    setSelectedWorkplace(workplace);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (workplace: Workplace) => {
    setSelectedWorkplace(workplace);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Workplaces</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ Add New</Button>
      </div>

      {/* Modals */}
      <CreateWorkplaceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
        municipalities={municipalities}
      />

      <EditWorkplaceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
        workplace={selectedWorkplace}
        municipalities={municipalities}
      />

      <ViewWorkplaceModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        workplace={selectedWorkplace}
      />

      <DeleteWorkplaceDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
        workplace={selectedWorkplace}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Workplaces</CardTitle>
            <Select value={selectedMunicipalityFilter} onValueChange={setSelectedMunicipalityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by municipality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Municipalities</SelectItem>
                {municipalities.map((muni) => (
                  <SelectItem key={muni.id} value={muni.id}>
                    {muni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Municipality</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No workplaces found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((workplace) => (
                    <TableRow key={workplace.id}>
                      <TableCell>
                        {workplace.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={workplace.logo_url}
                            alt={workplace.name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{workplace.name}</TableCell>
                      <TableCell>{workplace.municipality_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {workplace.contact_email || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {workplace.contact_phone || "-"}
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
                            <DropdownMenuItem onClick={() => openViewModal(workplace)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(workplace)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(workplace)}
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
