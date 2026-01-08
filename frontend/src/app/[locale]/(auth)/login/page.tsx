"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DecodedToken {
  role: string;
  exp: number;
}

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Call the Backend
      const res = await apiClient.post("/auth/login/", {
        email,
        password,
      });

      // 2. Save the Token (In localStorage for now)
      const { access, refresh } = res.data;
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      // 3. Decode token and redirect based on role
      const decoded: DecodedToken = jwtDecode(access);

      if (decoded.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else if (decoded.role === "MUNICIPALITY_ADMIN") {
        router.push("/municipality");
      } else if (decoded.role === "WORKPLACE_ADMIN") {
        router.push("/workplace");
      } else if (decoded.role === "YOUTH") {
        router.push("/youth");
      } else if (decoded.role === "GUARDIAN") {
        router.push("/guardian");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      console.error("Login Failed", err);
      setError(t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("auth.loginTitle")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("auth.email")}</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.password")}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
