"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/DashboardLayout";
import Cookies from "js-cookie";
import {
  FaUsers,
  FaSearch,
  FaUser,
  FaShieldAlt,
} from "react-icons/fa";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const userData = Cookies.get("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Set stats based on role
      if (parsedUser.role === "admin") {
        setStats([
          {
            label: "Total Records",
            value: "12,458",
            icon: FaUsers,
            color: "bg-blue-500",
          },
          {
            label: "Today Searches",
            value: "342",
            icon: FaSearch,
            color: "bg-green-500",
          },
          {
            label: "Active Users",
            value: "28",
            icon: FaUser,
            color: "bg-purple-500",
          },
          {
            label: "API Calls",
            value: "1,247",
            icon: FaShieldAlt,
            color: "bg-orange-500",
          },
        ]);
      } else {
        setStats([
          {
            label: "My Searches",
            value: "84",
            icon: FaSearch,
            color: "bg-blue-500",
          },
          {
            label: "Records Found",
            value: "156",
            icon: FaUsers,
            color: "bg-green-500",
          },
        ]);
      }
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="text-gray-500 mt-1">Here's your overview for today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-4 rounded-lg`}>
                    <IconComponent className="text-white text-2xl" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <FaSearch className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      EPIC Search: XKQ557110{i}
                    </p>
                    <p className="text-sm text-gray-500">{i} minutes ago</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">
                  Success
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
