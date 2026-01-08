"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  ListOrdered,
} from "lucide-react";

interface Application {
  id: string;
  job: string;
  job_title: string;
  lottery_group_name: string | null;
  youth: string;
  youth_email: string;
  youth_name: string;
  youth_phone: string | null;
  youth_grade: string | null;
  status: string;
  priority_rank: number | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "Alla statusar" },
  { value: "PENDING", label: "Väntande" },
  { value: "OFFERED", label: "Erbjuden" },
  { value: "ACCEPTED", label: "Accepterad" },
  { value: "REJECTED", label: "Avvisad" },
  { value: "RESERVE", label: "Reservlista" },
];

const GRADE_LABELS: Record<string, string> = {
  YEAR_1: "Årskurs 1",
  YEAR_2: "Årskurs 2",
  YEAR_3: "Årskurs 3",
  YEAR_4: "Årskurs 4",
  YEAR_5: "Årskurs 5",
  YEAR_6: "Årskurs 6",
  YEAR_7: "Årskurs 7",
  YEAR_8: "Årskurs 8",
  YEAR_9: "Årskurs 9",
  GYM_1: "Gymnasiet år 1",
  GYM_2: "Gymnasiet år 2",
  GYM_3: "Gymnasiet år 3",
  GYM_4: "Gymnasiet år 4",
};

export default function UsersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchApplications = async () => {
    try {
      const response = await apiClient.get("/applications/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setApplications(data);
      setFilteredApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Filter applications when search or status changes
  useEffect(() => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Filter by search term (name, email, job title)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.youth_name.toLowerCase().includes(term) ||
          app.youth_email.toLowerCase().includes(term) ||
          app.job_title.toLowerCase().includes(term)
      );
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OFFERED":
        return (
          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Erbjuden
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepterad
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Avvisad
          </Badge>
        );
      case "RESERVE":
        return (
          <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1">
            <ListOrdered className="h-3 w-3" />
            Reservlista
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Väntande
          </Badge>
        );
    }
  };

  // Calculate stats
  const stats = {
    total: applications.length,
    offered: applications.filter((a) => a.status === "OFFERED").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
    reserve: applications.filter((a) => a.status === "RESERVE").length,
    pending: applications.filter((a) => a.status === "PENDING").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#311B92] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#311B92]">Sökande</h1>
        <p className="text-gray-500">
          Hantera jobbansökningar och se lotteriresultat.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-[#311B92]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Totalt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.offered}</p>
                <p className="text-sm text-gray-500">Erbjudna</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-sm text-gray-500">Accepterade</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ListOrdered className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.reserve}</p>
                <p className="text-sm text-gray-500">Reservlista</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-500">Väntande</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Sök på namn, e-post eller jobbtitel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrera status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchApplications}>
              Uppdatera
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Ansökningar ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Inga ansökningar hittades</p>
              <p className="text-sm">
                {applications.length === 0
                  ? "Det finns inga ansökningar ännu."
                  : "Prova att ändra dina filter."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sökande</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Årskurs</TableHead>
                  <TableHead>Jobb</TableHead>
                  <TableHead>Lotterigrupp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ansökningsdatum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.youth_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{app.youth_email}</div>
                        {app.youth_phone && (
                          <div className="text-gray-500">{app.youth_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.youth_grade
                        ? GRADE_LABELS[app.youth_grade] || app.youth_grade
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{app.job_title}</div>
                    </TableCell>
                    <TableCell>
                      {app.lottery_group_name ? (
                        <Badge variant="outline">{app.lottery_group_name}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
