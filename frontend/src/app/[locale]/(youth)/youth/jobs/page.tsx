"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  Building2,
  CheckCircle,
  Loader2,
  Clock,
  Trophy,
  Briefcase,
  GripVertical,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string;
  qualifications?: string;
  job_details?: string;
  municipality_info?: string;
  youtube_url?: string;
  municipality_name?: string;
  workplace_name?: string;
  total_spots: number;
  hourly_rate?: string;
  start_date: string | null;
  end_date: string | null;
  application_deadline?: string | null;
  status: string;
  job_type: "NORMAL" | "LOTTERY";
  lottery_group?: string;
  lottery_group_name?: string;
}

interface Application {
  id: string;
  job: string;
  status: string;
  priority_rank?: number;
}

export default function YouthJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Lottery ranking state
  const [rankedJobs, setRankedJobs] = useState<Job[]>([]);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [savingRanking, setSavingRanking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch published jobs
        const jobsRes = await apiClient.get("/jobs/");
        const jobsData = jobsRes.data.results || jobsRes.data || [];
        setJobs(jobsData);

        // Fetch user's applications
        const appsRes = await apiClient.get("/applications/");
        const appsData = appsRes.data.results || appsRes.data || [];
        setApplications(appsData);

        // Initialize ranked jobs from existing lottery applications
        const lotteryApps = appsData.filter((app: Application) => app.priority_rank);
        if (lotteryApps.length > 0) {
          // Sort by priority_rank and map to jobs
          const sortedApps = lotteryApps.sort((a: Application, b: Application) =>
            (a.priority_rank || 0) - (b.priority_rank || 0)
          );
          const rankedJobsList = sortedApps
            .map((app: Application) => jobsData.find((j: Job) => j.id === app.job))
            .filter(Boolean) as Job[];
          setRankedJobs(rankedJobsList);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Separate jobs by type
  const normalJobs = jobs.filter((job) => job.job_type === "NORMAL");
  const lotteryJobs = jobs.filter((job) => job.job_type === "LOTTERY");

  const filteredNormalJobs = normalJobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLotteryJobs = lotteryJobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasApplied = (jobId: string) => {
    return applications.some((app) => app.job === jobId);
  };

  const getApplicationStatus = (jobId: string) => {
    return applications.find((app) => app.job === jobId);
  };

  // Handle normal job application
  const handleApply = async () => {
    if (!selectedJob) return;

    setApplying(true);
    try {
      const response = await apiClient.post("/applications/", {
        job: selectedJob.id,
      });
      setApplications([...applications, response.data]);
      setApplySuccess(true);
      toast.success("Ansökan skickad!");
    } catch (error) {
      console.error("Error applying:", error);
      toast.error("Kunde inte skicka ansökan. Försök igen.");
    } finally {
      setApplying(false);
    }
  };

  // Handle adding job to lottery ranking
  const addToRanking = (job: Job) => {
    if (rankedJobs.find((j) => j.id === job.id)) {
      toast.error("Du har redan lagt till detta jobb i din rankning");
      return;
    }
    if (rankedJobs.length >= 10) {
      toast.error("Du kan max ranka 10 jobb");
      return;
    }
    setRankedJobs([...rankedJobs, job]);
    toast.success(`${job.title} tillagt som val #${rankedJobs.length + 1}`);
  };

  const removeFromRanking = (jobId: string) => {
    setRankedJobs(rankedJobs.filter((j) => j.id !== jobId));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newRanked = [...rankedJobs];
    [newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]];
    setRankedJobs(newRanked);
  };

  const moveDown = (index: number) => {
    if (index === rankedJobs.length - 1) return;
    const newRanked = [...rankedJobs];
    [newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]];
    setRankedJobs(newRanked);
  };

  // Save lottery ranking
  const saveRanking = async () => {
    if (rankedJobs.length === 0) {
      toast.error("Lägg till minst ett jobb i din rankning");
      return;
    }

    setSavingRanking(true);
    try {
      // Submit applications with priority ranks
      for (let i = 0; i < rankedJobs.length; i++) {
        const job = rankedJobs[i];
        const existingApp = applications.find((a) => a.job === job.id);

        if (existingApp) {
          // Update existing application with new rank
          await apiClient.patch(`/applications/${existingApp.id}/`, {
            priority_rank: i + 1,
          });
        } else {
          // Create new application with rank
          await apiClient.post("/applications/", {
            job: job.id,
            priority_rank: i + 1,
          });
        }
      }

      // Refresh applications
      const appsRes = await apiClient.get("/applications/");
      setApplications(appsRes.data.results || appsRes.data || []);

      toast.success("Din rankning har sparats!");
      setShowRankingModal(false);
    } catch (error) {
      console.error("Error saving ranking:", error);
      toast.error("Kunde inte spara rankningen. Försök igen.");
    } finally {
      setSavingRanking(false);
    }
  };

  const closeDialog = () => {
    setSelectedJob(null);
    setApplySuccess(false);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Ej angivet";
    return new Date(dateString).toLocaleDateString("sv-SE");
  };

  const isInRanking = (jobId: string) => {
    return rankedJobs.some((j) => j.id === jobId);
  };

  const getRankPosition = (jobId: string) => {
    const index = rankedJobs.findIndex((j) => j.id === jobId);
    return index >= 0 ? index + 1 : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#311B92] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Sök jobb..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Job Type Tabs */}
      <Tabs defaultValue="lottery" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lottery" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Lotterijobb ({filteredLotteryJobs.length})
          </TabsTrigger>
          <TabsTrigger value="normal" className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            Vanliga jobb ({filteredNormalJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Lottery Jobs Tab */}
        <TabsContent value="lottery" className="space-y-4 mt-4">
          {/* Ranking Summary Card */}
          {rankedJobs.length > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Din rankning ({rankedJobs.length}/10 jobb)
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      1: {rankedJobs[0]?.title}
                      {rankedJobs.length > 1 && `, 2: ${rankedJobs[1]?.title}`}
                      {rankedJobs.length > 2 && "..."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowRankingModal(true)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Hantera rankning
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info about lottery */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Så fungerar lotteriet
            </h3>
            <p className="text-sm text-blue-700 mt-2">
              Lägg till jobb du vill söka och ranka dem i ordning. Ditt förstahandsval
              prioriteras högst i lotteriet. Du kan ranka upp till 10 jobb.
            </p>
          </div>

          {/* Lottery Job List */}
          <div className="space-y-3">
            {filteredLotteryJobs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  {searchQuery
                    ? "Inga lotterijobb matchar din sökning"
                    : "Inga lotterijobb tillgängliga just nu"}
                </CardContent>
              </Card>
            ) : (
              filteredLotteryJobs.map((job) => {
                const rankPosition = getRankPosition(job.id);
                return (
                  <Card
                    key={job.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      rankPosition ? "border-amber-300 bg-amber-50/50" : ""
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {rankPosition && (
                              <Badge className="bg-amber-500 text-white">
                                #{rankPosition}
                              </Badge>
                            )}
                            <h3 className="font-semibold text-[#311B92] truncate">
                              {job.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">
                              {job.workplace_name || "Arbetsplats"}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 border-purple-300 text-purple-700">
                          <Trophy className="h-3 w-3 mr-1" />
                          Lotteri
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.municipality_name || "Kommun"}
                        </span>
                        {job.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(job.start_date)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {job.total_spots} platser
                        </span>
                        {job.lottery_group_name && (
                          <span className="text-purple-600">
                            {job.lottery_group_name}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Save Ranking Button */}
          {rankedJobs.length > 0 && (
            <Button
              onClick={saveRanking}
              disabled={savingRanking}
              className="w-full bg-[#311B92] hover:bg-[#4527A0]"
            >
              {savingRanking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Spara rankning ({rankedJobs.length} jobb)
                </>
              )}
            </Button>
          )}
        </TabsContent>

        {/* Normal Jobs Tab */}
        <TabsContent value="normal" className="space-y-4 mt-4">
          <div className="space-y-3">
            {filteredNormalJobs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  {searchQuery
                    ? "Inga vanliga jobb matchar din sökning"
                    : "Inga vanliga jobb tillgängliga just nu"}
                </CardContent>
              </Card>
            ) : (
              filteredNormalJobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#311B92] truncate">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">
                            {job.workplace_name || "Arbetsplats"}
                          </span>
                        </div>
                      </div>
                      {hasApplied(job.id) && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 flex-shrink-0"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ansökt
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.municipality_name || "Kommun"}
                      </span>
                      {job.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.start_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {job.total_spots} platser
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {selectedJob.job_type === "LOTTERY" ? (
                    <Badge variant="outline" className="border-purple-300 text-purple-700">
                      <Trophy className="h-3 w-3 mr-1" />
                      Lotterijobb
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Vanligt jobb
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-[#311B92]">
                  {selectedJob.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedJob.workplace_name || "Arbetsplats"} •{" "}
                  {selectedJob.municipality_name || "Kommun"}
                </DialogDescription>
              </DialogHeader>

              {applySuccess ? (
                <div className="py-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    Ansökan skickad!
                  </h3>
                  <p className="text-gray-500">
                    Du har ansökt till {selectedJob.title}. Du kan följa din
                    ansökan under &quot;Mina ansökningar&quot;.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* Job Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedJob.start_date && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Startdatum</p>
                          <p className="font-medium">
                            {formatDate(selectedJob.start_date)}
                          </p>
                        </div>
                      )}
                      {selectedJob.end_date && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Slutdatum</p>
                          <p className="font-medium">
                            {formatDate(selectedJob.end_date)}
                          </p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Platser</p>
                        <p className="font-medium">{selectedJob.total_spots}</p>
                      </div>
                      {selectedJob.hourly_rate && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Timlön</p>
                          <p className="font-medium">{selectedJob.hourly_rate} kr/h</p>
                        </div>
                      )}
                      {selectedJob.application_deadline && (
                        <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                          <p className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Sista ansökningsdag
                          </p>
                          <p className="font-medium">
                            {formatDate(selectedJob.application_deadline)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Job Details */}
                    {selectedJob.job_details && (
                      <div>
                        <h4 className="font-medium mb-2">Om jobbet</h4>
                        <div
                          className="text-sm text-gray-600 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: selectedJob.job_details,
                          }}
                        />
                      </div>
                    )}

                    {/* Qualifications */}
                    {selectedJob.qualifications && (
                      <div>
                        <h4 className="font-medium mb-2">Kvalifikationer</h4>
                        <div
                          className="text-sm text-gray-600 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: selectedJob.qualifications,
                          }}
                        />
                      </div>
                    )}

                    {/* Description (fallback if no job_details) */}
                    {!selectedJob.job_details && selectedJob.description && (
                      <div>
                        <h4 className="font-medium mb-2">Beskrivning</h4>
                        <div
                          className="text-sm text-gray-600 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: selectedJob.description,
                          }}
                        />
                      </div>
                    )}

                    {/* Municipality Info */}
                    {selectedJob.municipality_info && (
                      <div>
                        <h4 className="font-medium mb-2">Om kommunen</h4>
                        <div
                          className="text-sm text-gray-600 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: selectedJob.municipality_info,
                          }}
                        />
                      </div>
                    )}

                    {/* YouTube Video */}
                    {selectedJob.youtube_url && (
                      <div>
                        <h4 className="font-medium mb-2">Video</h4>
                        <div className="aspect-video">
                          <iframe
                            src={selectedJob.youtube_url.replace(
                              "watch?v=",
                              "embed/"
                            )}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="mt-4">
                    {selectedJob.job_type === "LOTTERY" ? (
                      // Lottery job - add to ranking
                      isInRanking(selectedJob.id) ? (
                        <div className="w-full space-y-2">
                          <Badge className="bg-amber-500 text-white w-full justify-center py-2">
                            <Trophy className="h-4 w-4 mr-2" />
                            Rankat som #{getRankPosition(selectedJob.id)}
                          </Badge>
                          <Button
                            variant="outline"
                            onClick={() => {
                              removeFromRanking(selectedJob.id);
                              toast.success("Borttaget från rankning");
                            }}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Ta bort från rankning
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            addToRanking(selectedJob);
                            closeDialog();
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Lägg till i rankning
                        </Button>
                      )
                    ) : (
                      // Normal job - direct apply
                      hasApplied(selectedJob.id) ? (
                        <Button disabled className="w-full">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Du har redan ansökt
                        </Button>
                      ) : (
                        <Button
                          onClick={handleApply}
                          disabled={applying}
                          className="w-full bg-[#311B92] hover:bg-[#4527A0]"
                        >
                          {applying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Skickar ansökan...
                            </>
                          ) : (
                            "Ansök nu"
                          )}
                        </Button>
                      )
                    )}
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Ranking Management Modal */}
      <Dialog open={showRankingModal} onOpenChange={setShowRankingModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              Hantera din rankning
            </DialogTitle>
            <DialogDescription>
              Dra och ordna jobben efter prioritet. #1 är ditt förstahandsval.
            </DialogDescription>
          </DialogHeader>

          {rankedJobs.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Du har inte lagt till några jobb ännu.</p>
              <p className="text-sm mt-2">
                Gå tillbaka och välj jobb att ranka.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankedJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <Badge className="bg-amber-500 text-white">
                    #{index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {job.workplace_name || job.municipality_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveDown(index)}
                      disabled={index === rankedJobs.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromRanking(job.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRankingModal(false)}>
              Stäng
            </Button>
            <Button
              onClick={saveRanking}
              disabled={savingRanking || rankedJobs.length === 0}
              className="bg-[#311B92] hover:bg-[#4527A0]"
            >
              {savingRanking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Spara rankning"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
