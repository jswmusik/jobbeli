"use client";

import { useEffect, useState } from "react";
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
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { CreateMunicipalityModal } from "./create-modal";
import { EditMunicipalityModal } from "./edit-modal";
import { ViewMunicipalityModal } from "./view-modal";
import { DeleteMunicipalityDialog } from "./delete-dialog";
import { Municipality } from "./types";

export default function MunicipalitiesPage() {
  const [data, setData] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] =
    useState<Municipality | null>(null);

  useEffect(() => {
    fetchMunicipalities();
  }, []);

  const fetchMunicipalities = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/municipalities/");
      // Handle paginated or direct response
      setData(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch", err);
      setError("Failed to load municipalities");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchMunicipalities();
  };

  const handleEditSuccess = () => {
    fetchMunicipalities();
  };

  const handleDeleteSuccess = () => {
    fetchMunicipalities();
  };

  const openViewModal = (municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setIsViewModalOpen(true);
  };

  const openEditModal = (municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Municipalities</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ Add New</Button>
      </div>

      {/* Modals */}
      <CreateMunicipalityModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <EditMunicipalityModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
        municipality={selectedMunicipality}
      />

      <ViewMunicipalityModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        municipality={selectedMunicipality}
      />

      <DeleteMunicipalityDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
        municipality={selectedMunicipality}
      />

      <Card>
        <CardHeader>
          <CardTitle>Connected Organizations</CardTitle>
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
                  <TableHead>Slug</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No municipalities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((muni) => (
                    <TableRow key={muni.id}>
                      <TableCell>
                        {muni.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={muni.logo_url}
                            alt={muni.name}
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
                      <TableCell className="font-medium">{muni.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {muni.slug}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">
                        {muni.id.substring(0, 8)}...
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
                            <DropdownMenuItem
                              onClick={() => openViewModal(muni)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditModal(muni)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(muni)}
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
