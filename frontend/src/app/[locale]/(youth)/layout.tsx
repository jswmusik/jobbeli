"use client";

import { useSyncExternalStore, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { Home, Search, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DecodedToken {
  role: string;
  exp: number;
}

function NavItem({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center text-xs transition-colors",
        isActive ? "text-[#311B92]" : "text-gray-500 hover:text-[#311B92]"
      )}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}

// Check auth synchronously
function checkAuth(): "authorized" | "unauthorized" | "loading" {
  if (typeof window === "undefined") return "loading";

  const token = localStorage.getItem("accessToken");
  if (!token) return "unauthorized";

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("accessToken");
      return "unauthorized";
    }

    // Check role - only YOUTH can access this section
    if (decoded.role !== "YOUTH") {
      return "unauthorized";
    }

    return "authorized";
  } catch {
    localStorage.removeItem("accessToken");
    return "unauthorized";
  }
}

// Get role from token for redirect
function getRoleFromToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.role;
  } catch {
    return null;
  }
}

export default function YouthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Use useSyncExternalStore to check auth without causing hydration issues
  const subscribe = useCallback(() => () => {}, []);
  const getSnapshot = useCallback(() => checkAuth(), []);
  const getServerSnapshot = useCallback(() => "loading" as const, []);

  const authState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Handle redirects
  if (authState === "unauthorized") {
    const role = getRoleFromToken();

    // Redirect based on role
    if (role === "SUPER_ADMIN") {
      router.push("/admin");
    } else if (role === "MUNICIPALITY_ADMIN") {
      router.push("/municipality");
    } else {
      router.push("/login");
    }

    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#311B92] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authorization
  if (authState === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#311B92] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const locale = localeMatch ? localeMatch[1] : "sv";

  // Navigation items
  const navItems = [
    { href: `/${locale}/youth`, icon: <Home size={24} />, label: "Home" },
    { href: `/${locale}/youth/jobs`, icon: <Search size={24} />, label: "Jobs" },
    {
      href: `/${locale}/youth/applications`,
      icon: <FileText size={24} />,
      label: "My Apps",
    },
    { href: `/${locale}/youth/profile`, icon: <User size={24} />, label: "Profile" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Top Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-[#311B92]">Feriearbete</h1>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 p-4">{children}</main>

      {/* Bottom Navigation (Mobile Style) */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 z-50 safe-area-inset-bottom">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </div>
  );
}
