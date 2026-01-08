"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

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
}

interface Application {
  id: string;
  job: string;
  status: string;
}

export default function YouthJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch published jobs
        const jobsRes = await apiClient.get("/jobs/");
        setJobs(jobsRes.data.results || jobsRes.data || []);

        // Fetch user's applications
        const appsRes = await apiClient.get("/applications/");
        setApplications(appsRes.data.results || appsRes.data || []);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasApplied = (jobId: string) => {
    return applications.some((app) => app.job === jobId);
  };

  const handleApply = async () => {
    if (!selectedJob) return;

    setApplying(true);
    try {
      const response = await apiClient.post("/applications/", {
        job: selectedJob.id,
      });
      setApplications([...applications, response.data]);
      setApplySuccess(true);
    } catch (error) {
      console.error("Error applying:", error);
      alert("Kunde inte skicka ansökan. Försök igen.");
    } finally {
      setApplying(false);
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

      {/* Jobs Count */}
      <p className="text-sm text-gray-500">
        {filteredJobs.length} jobb tillgängliga
      </p>

      {/* Job List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {searchQuery
                ? "Inga jobb matchar din sökning"
                : "Inga jobb tillgängliga just nu"}
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
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

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
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
                    {hasApplied(selectedJob.id) ? (
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
                    )}
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
