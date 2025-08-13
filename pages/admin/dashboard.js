"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import DashboardTabs from "../../components/DashboardTabs";
import AttendanceTable from "../../components/AttendanceTable";

export default function AdminDashboard() {
  const [data, setData] = useState({ daily: [], weekly: [], monthly: [], absentDaily: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("daily");
  const [showAbsent, setShowAbsent] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("adminToken");
    if (!token) router.replace("/admin/login");
    else setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("adminToken");
        if (!token) throw new Error("Unauthorized: No token found");

        const res = await fetch("/api/admin/attendance", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("adminToken");
            router.replace("/admin/login");
            return;
          }
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }

        const json = await res.json();
        setData({
          daily: json.daily || [],
          weekly: json.weekly || [],
          monthly: json.monthly || [],
          absentDaily: json.absentDaily || [],
        });
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authChecked, router]);

  if (!authChecked || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-red-100 text-red-700 p-6">
        <h2 className="text-xl font-bold mb-4">Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-6 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const attendanceList = showAbsent ? data.absentDaily : data[view] || [];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar setView={setView} setShowAbsent={setShowAbsent} />
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <AdminHeader showAbsent={showAbsent} />
        {!showAbsent && <DashboardTabs view={view} setView={setView} data={data} />}
        <AttendanceTable attendanceList={attendanceList} />
      </div>
    </div>
  );
}
