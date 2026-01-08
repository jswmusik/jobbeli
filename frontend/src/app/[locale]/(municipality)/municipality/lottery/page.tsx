"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Calendar, Users, Layers, History, Play, Loader2 } from "lucide-react";
import { CreatePeriodModal } from "./create-period-modal";
import { CreateGroupModal } from "./create-group-modal";

interface Period {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  application_open: string;
  application_close: string;
  groups_count: number;
}

interface JobGroup {
  id: string;
  name: string;
  description: string;
  period: string;
  period_name: string;
  min_age: number;
  max_age: number;
  jobs_count: number;
}

interface LotteryRun {
  id: string;
  group_name: string;
  status: string;
  executed_at: string;
  executed_by_email: string;
  candidates_count: number;
  matched_count: number;
  unmatched_count: number;
}

export default function LotteryPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [groups, setGroups] = useState<JobGroup[]>([]);
  const [runs, setRuns] = useState<LotteryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningLottery, setRunningLottery] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [periodsRes, groupsRes, runsRes] = await Promise.all([
        apiClient.get("/periods/"),
        apiClient.get("/groups/"),
        apiClient.get("/lottery-runs/"),
      ]);
      setPeriods(periodsRes.data.results || periodsRes.data || []);
      setGroups(groupsRes.data.results || groupsRes.data || []);
      setRuns(runsRes.data.results || runsRes.data || []);
    } catch (error) {
      console.error("Error fetching lottery data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("sv-SE");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-700">Slutförd</Badge>;
      case "RUNNING":
        return <Badge className="bg-blue-100 text-blue-700">Pågår</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700">Misslyckad</Badge>;
      default:
        return <Badge variant="secondary">Väntande</Badge>;
    }
  };

  const handleRunLottery = async (group: JobGroup) => {
    if (
      !confirm(
        `Är du säker på att du vill köra lotteriet för "${group.name}"?\n\nDetta kommer att:\n- Tilldela jobb till sökande\n- Sätta övriga på reservlista\n\nDenna åtgärd kan inte ångras.`
      )
    ) {
      return;
    }

    setRunningLottery(group.id);
    try {
      const response = await apiClient.post(`/groups/${group.id}/run_lottery/`);
      const data = response.data;
      alert(
        `Lotteri slutfört!\n\n` +
          `Matchade: ${data.matched}\n` +
          `Reservlista: ${data.reserves}\n` +
          `Totalt kandidater: ${data.candidates}`
      );
      fetchData();
    } catch (error: unknown) {
      console.error("Lottery failed:", error);
      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "error" in error.response.data
          ? String(error.response.data.error)
          : "Ett okänt fel uppstod";
      alert(`Lotteriet misslyckades: ${errorMessage}`);
    } finally {
      setRunningLottery(null);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#311B92]">Lotterimotor</h1>
          <p className="text-gray-500">
            Konfigurera perioder och kör matchningsalgoritmen.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-[#311B92]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{periods.length}</p>
                <p className="text-sm text-gray-500">Perioder</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-gray-500">Jobbgrupper</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {groups.reduce((acc, g) => acc + g.jobs_count, 0)}
                </p>
                <p className="text-sm text-gray-500">Jobb i lotteri</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <History className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runs.length}</p>
                <p className="text-sm text-gray-500">Körningar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">Perioder</TabsTrigger>
          <TabsTrigger value="groups">Jobbgrupper</TabsTrigger>
          <TabsTrigger value="runs">Körningshistorik</TabsTrigger>
        </TabsList>

        {/* Periods Tab */}
        <TabsContent value="periods" className="space-y-4">
          <div className="flex justify-end">
            <CreatePeriodModal onSuccess={fetchData} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Aktiva Perioder</CardTitle>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Inga perioder skapade ännu. Klicka på &quot;Ny Period&quot; för
                  att komma igång.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Namn</TableHead>
                      <TableHead>Jobbperiod</TableHead>
                      <TableHead>Ansökningsfönster</TableHead>
                      <TableHead>Grupper</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="font-bold">
                          {period.name}
                        </TableCell>
                        <TableCell>
                          {formatDate(period.start_date)} -{" "}
                          {formatDate(period.end_date)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(period.application_open)} -{" "}
                          {formatDateTime(period.application_close)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {period.groups_count} grupper
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <CreateGroupModal periods={periods} onSuccess={fetchData} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Jobbgrupper</CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Inga jobbgrupper skapade ännu. Skapa en period först, sedan
                  kan du lägga till grupper.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Namn</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Åldersintervall</TableHead>
                      <TableHead>Jobb</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <div>
                            <p className="font-bold">{group.name}</p>
                            {group.description && (
                              <p className="text-sm text-gray-500">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{group.period_name}</TableCell>
                        <TableCell>
                          {group.min_age} - {group.max_age} år
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {group.jobs_count} jobb
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleRunLottery(group)}
                            disabled={
                              runningLottery !== null || group.jobs_count === 0
                            }
                          >
                            {runningLottery === group.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Kör...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Kör lotteri
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Körningshistorik</CardTitle>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Inga lotterikörningar har utförts ännu.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupp</TableHead>
                      <TableHead>Utförd</TableHead>
                      <TableHead>Av</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resultat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-bold">
                          {run.group_name}
                        </TableCell>
                        <TableCell>{formatDateTime(run.executed_at)}</TableCell>
                        <TableCell>{run.executed_by_email}</TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell>
                          <span className="text-green-600">
                            {run.matched_count} matchade
                          </span>
                          {" / "}
                          <span className="text-gray-500">
                            {run.candidates_count} kandidater
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
