"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, CheckCircle, Clock } from "lucide-react";

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
}

interface ApplicationStats {
  total: number;
  pending: number;
  offered: number;
}

export default function YouthHomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    offered: 0,
  });
  const [loading, setLoading] = useState(true);

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const locale = localeMatch ? localeMatch[1] : "sv";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await apiClient.get("/users/me/");
        setUser(userRes.data);

        // Fetch application stats
        const appsRes = await apiClient.get("/applications/");
        const apps = appsRes.data.results || appsRes.data || [];
        setStats({
          total: apps.length,
          pending: apps.filter(
            (a: { status: string }) =>
              a.status === "PENDING" || a.status === "LOTTERY"
          ).length,
          offered: apps.filter(
            (a: { status: string }) =>
              a.status === "OFFERED" || a.status === "ACCEPTED"
          ).length,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#311B92] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#311B92] to-[#5E35B1] rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">
          Hej{user?.first_name ? `, ${user.first_name}` : ""}!
        </h2>
        <p className="mt-2 text-white/80">
          Välkommen till Feriearbete. Hitta ditt sommarjobb här!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <FileText className="h-6 w-6 mx-auto text-[#311B92] mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Ansökningar</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <Clock className="h-6 w-6 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-gray-500">Väntar</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{stats.offered}</p>
            <p className="text-xs text-gray-500">Erbjudna</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full justify-start bg-[#311B92] hover:bg-[#4527A0]"
            onClick={() => router.push(`/${locale}/youth/jobs`)}
          >
            <Briefcase className="h-5 w-5 mr-3" />
            Bläddra bland jobb
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/${locale}/youth/applications`)}
          >
            <FileText className="h-5 w-5 mr-3" />
            Mina ansökningar
          </Button>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hur det fungerar</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#311B92] text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Bläddra bland tillgängliga sommarjobb</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#311B92] text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Ansök till de jobb som passar dig</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#311B92] text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Vänta på lotteriresultatet</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#311B92] text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Acceptera ditt erbjudna jobb</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
