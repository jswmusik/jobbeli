"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface HealthStatus {
  status: string;
  service: string;
  version: string;
}

export default function Home() {
  const t = useTranslations();
  const [apiStatus, setApiStatus] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkApiHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/v1/health/");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setApiStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setApiStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-8 dark:bg-zinc-900">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Feriearbete Platform
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Youth Summer Job Lottery System for Swedish Municipalities
        </p>

        <div className="mt-4 flex gap-4">
          <Link href="/login">
            <Button>{t("auth.login")}</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">{t("navigation.dashboard")}</Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Backend Connection Test
          </h2>

          <Button onClick={checkApiHealth} disabled={loading}>
            {loading ? t("common.loading") : "Check API Health"}
          </Button>

          {apiStatus && (
            <div className="mt-4 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
              <p className="font-medium">Connected Successfully!</p>
              <p className="text-sm">
                Service: {apiStatus.service} v{apiStatus.version}
              </p>
              <p className="text-sm">Status: {apiStatus.status}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
              <p className="font-medium">{t("common.error")}</p>
              <p className="text-sm">{error}</p>
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Make sure the Django server is running on port 8000
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-zinc-500 dark:text-zinc-500">
          <p>Phase 0 Setup Complete</p>
          <p className="mt-1">
            Django Backend (port 8000) + Next.js Frontend (port 3000)
          </p>
        </div>
      </main>
    </div>
  );
}
