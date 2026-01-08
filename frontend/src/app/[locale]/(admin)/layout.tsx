"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { jwtDecode } from "jwt-decode";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface TokenPayload {
  role: string;
  email: string;
  first_name: string;
  last_name: string;
  exp: number;
}

type AuthState = "checking" | "authorized" | "unauthorized";

function checkAuthorization(): AuthState {
  if (typeof window === "undefined") return "checking";

  const token = localStorage.getItem("accessToken");
  if (!token) return "unauthorized";

  try {
    const decoded = jwtDecode<TokenPayload>(token);

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return "unauthorized";
    }

    // CHECK: Is this user actually an Admin?
    if (
      decoded.role !== "SUPER_ADMIN" &&
      decoded.role !== "MUNICIPALITY_ADMIN"
    ) {
      return "unauthorized";
    }

    return "authorized";
  } catch {
    localStorage.removeItem("accessToken");
    return "unauthorized";
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useLayoutEffect(() => {
    const state = checkAuthorization();
    if (state === "unauthorized") {
      router.push("/login");
    }
     
    setAuthState(state);
  }, [router]);

  if (authState !== "authorized") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">{t("admin.checkingAccess")}</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  // If authorized, show the Sidebar and the Page
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Feriearbete</h2>
        <p className="text-slate-400 text-xs mb-4 uppercase tracking-wider">
          Super Admin
        </p>
        <nav className="space-y-2 flex-1">
          <Link
            href="/admin"
            className="block p-2 bg-white/10 rounded hover:bg-white/20 transition"
          >
            {t("navigation.dashboard")}
          </Link>
          <Link
            href="/admin/municipalities"
            className="block p-2 hover:bg-white/10 rounded transition"
          >
            {t("navigation.municipalities")}
          </Link>
          <Link
            href="/admin/workplaces"
            className="block p-2 hover:bg-white/10 rounded transition"
          >
            {t("navigation.workplaces")}
          </Link>
          <Link
            href="/admin/users"
            className="block p-2 hover:bg-white/10 rounded transition"
          >
            {t("navigation.users")}
          </Link>
        </nav>
        <div className="pt-4 border-t border-slate-700">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut size={18} className="mr-2" />
            {t("auth.logout")}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
