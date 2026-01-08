"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

interface TokenPayload {
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

function getUserFromToken(): TokenPayload | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const t = useTranslations();
  const user = useMemo(() => getUserFromToken(), []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{t("admin.dashboard.title")}</h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.first_name} {user.last_name} ({user.role})
            </span>
          )}
          <LanguageSwitcher />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            {t("auth.logout")}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <h2 className="text-3xl font-bold mb-6">
          {user
            ? t("youth.dashboard.welcomeMessage", { name: user.first_name })
            : t("admin.dashboard.title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("municipalities.title")}</CardTitle>
              <CardDescription>
                {t("admin.dashboard.totalMunicipalities")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/municipalities">
                <Button variant="outline">{t("common.view")}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("users.title")}</CardTitle>
              <CardDescription>
                {t("admin.dashboard.totalUsers")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button variant="outline">{t("common.view")}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("navigation.settings")}</CardTitle>
              <CardDescription>Configure platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">{t("common.view")}</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
