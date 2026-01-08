"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Ticket, AlertCircle } from "lucide-react";

export default function MunicipalityDashboard() {
  // In Phase 2, we will fetch these real stats from the backend.
  const stats = [
    {
      title: "Active Jobs",
      value: "12",
      icon: <Briefcase className="h-4 w-4 text-purple-600" />,
    },
    {
      title: "Total Applicants",
      value: "148",
      icon: <Users className="h-4 w-4 text-blue-500" />,
    },
    {
      title: "Lottery Status",
      value: "Pending",
      icon: <Ticket className="h-4 w-4 text-orange-500" />,
    },
    {
      title: "Pending Reviews",
      value: "5",
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back. Here is what is happening in your municipality.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Area */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity recorded.</p>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Lottery Engine Ready</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
