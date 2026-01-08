"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Ticket,
} from "lucide-react";

interface DecodedToken {
  role: string;
  municipality_name?: string;
  exp: number;
}

type AuthState = "authorized" | "unauthorized" | "loading";

interface AuthResult {
  state: AuthState;
  muniName: string;
}

function checkAuthSync(now: number): AuthResult {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return { state: "unauthorized", muniName: "Municipality" };
  }

  try {
    const decoded: DecodedToken = jwtDecode(token);

    // Check if token is expired
    if (decoded.exp * 1000 < now) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return { state: "unauthorized", muniName: "Municipality" };
    }

    // SECURITY CHECK: Must be MUNICIPALITY_ADMIN or SUPER_ADMIN
    if (
      decoded.role !== "MUNICIPALITY_ADMIN" &&
      decoded.role !== "SUPER_ADMIN"
    ) {
      return { state: "unauthorized", muniName: "Municipality" };
    }

    return {
      state: "authorized",
      muniName: decoded.municipality_name || "Municipality",
    };
  } catch {
    localStorage.removeItem("accessToken");
    return { state: "unauthorized", muniName: "Municipality" };
  }
}

export default function MunicipalityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authResult, setAuthResult] = useState<AuthResult>({
    state: "loading",
    muniName: "Municipality",
  });

  // Check auth on mount (client-side only)
  useEffect(() => {
    const result = checkAuthSync(Date.now());
    setAuthResult(result);
  }, []);

  // Handle redirect when unauthorized
  useEffect(() => {
    if (authResult.state === "unauthorized") {
      router.push("/login");
    }
  }, [authResult.state, router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  // Show loading state during SSR and initial client render
  if (authResult.state === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#311B92] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handle unauthorized - show redirecting message
  if (authResult.state === "unauthorized") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR - Purple 900 Background */}
      <aside className="w-64 bg-[#311B92] text-white flex flex-col fixed h-full shadow-xl z-50">
        <div className="p-6 border-b border-purple-800">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Feriearbete
          </h2>
          <p className="text-purple-200 text-xs mt-1 uppercase tracking-wider">
            {authResult.muniName}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            href="/municipality"
            icon={<LayoutDashboard size={20} />}
            label="Overview"
          />
          <SidebarItem
            href="/municipality/jobs"
            icon={<Briefcase size={20} />}
            label="Job Management"
          />
          <SidebarItem
            href="/municipality/lottery"
            icon={<Ticket size={20} />}
            label="Lottery Engine"
          />
          <SidebarItem
            href="/municipality/users"
            icon={<Users size={20} />}
            label="Applicants"
          />
          <SidebarItem
            href="/municipality/settings"
            icon={<Settings size={20} />}
            label="Settings"
          />
        </nav>

        <div className="p-4 border-t border-purple-800">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-300 hover:text-red-100 hover:bg-red-900/20"
          >
            <LogOut size={20} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-3 rounded-md text-purple-100 hover:bg-[#4527A0] hover:text-white transition-colors"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
