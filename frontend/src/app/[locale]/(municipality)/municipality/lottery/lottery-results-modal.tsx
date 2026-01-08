"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ListOrdered, XCircle, Users, Briefcase, Hash } from "lucide-react";

interface LotteryRun {
  id: string;
  group: string;
  group_name: string;
  status: string;
  executed_at: string;
  executed_by_email: string;
  candidates_count: number;
  matched_count: number;
  unmatched_count: number;
  seed: number;
  audit_report: {
    matches?: Record<string, string>;
    reserves?: string[];
    job_status?: Record<string, number>;
    input_summary?: {
      total_applicants: number;
      total_jobs: number;
      total_spots: number;
    };
    output_summary?: {
      matched_count: number;
      reserve_count: number;
      remaining_spots: number;
    };
  };
}

interface Application {
  id: string;
  job_title: string;
  youth_name: string;
  youth_email: string;
  status: string;
}

interface LotteryResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  run: LotteryRun | null;
}

export function LotteryResultsModal({
  open,
  onOpenChange,
  run,
}: LotteryResultsModalProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch applications for this lottery group when modal opens
  useEffect(() => {
    if (open && run) {
      setLoading(true);
      apiClient
        .get("/applications/")
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data.results || [];
          // Filter to applications for jobs in this lottery group
          // We'll show all statuses to see the results
          setApplications(data);
        })
        .catch((err) => {
          console.error("Failed to fetch applications:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, run]);

  if (!run) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("sv-SE");
  };

  // Get applications by status
  const offeredApps = applications.filter((a) => a.status === "OFFERED");
  const reserveApps = applications.filter((a) => a.status === "RESERVE");
  const rejectedApps = applications.filter((a) => a.status === "REJECTED");

  const auditReport = run.audit_report || {};
  const inputSummary = (auditReport.input_summary || {}) as {
    total_jobs?: number;
    total_spots?: number;
    total_applicants?: number;
  };
  const outputSummary = (auditReport.output_summary || {}) as {
    matched_count?: number;
    reserve_count?: number;
    remaining_spots?: number;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            Lotteriresultat: {run.group_name}
          </DialogTitle>
          <DialogDescription>
            Utförd {formatDateTime(run.executed_at)} av {run.executed_by_email}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-lg font-bold">{run.candidates_count}</p>
                  <p className="text-xs text-gray-500">Kandidater</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {run.matched_count}
                  </p>
                  <p className="text-xs text-gray-500">Matchade</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-lg font-bold text-orange-600">
                    {run.unmatched_count}
                  </p>
                  <p className="text-xs text-gray-500">Reservlista</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-lg font-bold text-gray-600">{run.seed}</p>
                  <p className="text-xs text-gray-500">Seed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Details */}
        {Object.keys(inputSummary).length > 0 && (
          <Card className="mb-4 bg-gray-50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Totalt jobb:</span>{" "}
                  <strong>{inputSummary.total_jobs || "-"}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Totalt platser:</span>{" "}
                  <strong>{inputSummary.total_spots || "-"}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Kvarvarande platser:</span>{" "}
                  <strong>{outputSummary.remaining_spots || "-"}</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Tabs */}
        <Tabs defaultValue="offered" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="offered" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              Erbjudna ({offeredApps.length})
            </TabsTrigger>
            <TabsTrigger value="reserve" className="flex items-center gap-1">
              <ListOrdered className="h-4 w-4" />
              Reservlista ({reserveApps.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Avvisade ({rejectedApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="offered" className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : offeredApps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Inga erbjudna jobb ännu</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sökande</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Jobb</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offeredApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.youth_name}
                      </TableCell>
                      <TableCell>{app.youth_email}</TableCell>
                      <TableCell>{app.job_title}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">
                          Erbjuden
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="reserve" className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : reserveApps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ListOrdered className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Ingen på reservlistan</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sökande</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Jobb (önskat)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reserveApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.youth_name}
                      </TableCell>
                      <TableCell>{app.youth_email}</TableCell>
                      <TableCell>{app.job_title}</TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-700">
                          Reservlista
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : rejectedApps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Inga avvisade ansökningar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sökande</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Jobb (önskat)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.youth_name}
                      </TableCell>
                      <TableCell>{app.youth_email}</TableCell>
                      <TableCell>{app.job_title}</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-700">
                          Avvisad
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
