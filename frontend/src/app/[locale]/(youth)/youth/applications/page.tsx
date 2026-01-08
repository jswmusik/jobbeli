"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  ListOrdered,
} from "lucide-react";

interface Application {
  id: string;
  job: string;
  job_details?: {
    id: string;
    title: string;
    workplace_name?: string;
    workplace?: { name: string };
    municipality_name?: string;
    municipality?: { name: string };
    start_date: string;
    end_date: string;
  };
  status: string;
  priority_rank?: number;
  created_at: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Väntar",
    color: "bg-amber-100 text-amber-700",
    icon: <Clock className="h-3 w-3" />,
  },
  LOTTERY: {
    label: "I lotteriet",
    color: "bg-blue-100 text-blue-700",
    icon: <Trophy className="h-3 w-3" />,
  },
  OFFERED: {
    label: "Erbjuden",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  ACCEPTED: {
    label: "Accepterad",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Avvisad",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
  RESERVE: {
    label: "Reservlista",
    color: "bg-purple-100 text-purple-700",
    icon: <ListOrdered className="h-3 w-3" />,
  },
};

export default function YouthApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await apiClient.get("/applications/");
        setApplications(response.data.results || response.data || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const formatDate = (dateString: string) => {
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
      <h2 className="text-xl font-bold text-[#311B92]">Mina ansökningar</h2>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>Du har inga ansökningar än.</p>
            <p className="text-sm mt-2">
              Gå till &quot;Jobs&quot; för att bläddra bland tillgängliga jobb.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.PENDING;
            const job = app.job_details;

            return (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#311B92] truncate">
                        {job?.title || "Jobb"}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">
                          {job?.workplace_name ||
                            job?.workplace?.name ||
                            "Arbetsplats"}
                        </span>
                      </div>
                    </div>
                    <Badge className={`${status.color} flex-shrink-0`}>
                      {status.icon}
                      <span className="ml-1">{status.label}</span>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    {job?.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(job.start_date)} - {formatDate(job.end_date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Ansökt {formatDate(app.created_at)}
                    </span>
                  </div>

                  {app.priority_rank && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        Prioritet:{" "}
                        <span className="font-medium">#{app.priority_rank}</span>
                      </p>
                    </div>
                  )}

                  {app.status === "OFFERED" && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-green-600 font-medium">
                        Grattis! Du har blivit erbjuden detta jobb. Kontakta
                        arbetsplatsen för att bekräfta.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
