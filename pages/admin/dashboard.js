import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
} from "react-icons/fa";

export default function AdminDashboard() {
  const [data, setData] = useState({ daily: [], weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("daily");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
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
            router.push("/admin/login");
            return;
          }
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }

        const json = await res.json();

        // ✅ Flexible mapping to support different API formats
        const daily =
          json.daily ||
          json.dailyAttendance ||
          json.data?.daily ||
          json.data?.dailyAttendance ||
          [];
        const weekly =
          json.weekly ||
          json.weeklyAttendance ||
          json.data?.weekly ||
          json.data?.weeklyAttendance ||
          [];
        const monthly =
          json.monthly ||
          json.monthlyAttendance ||
          json.data?.monthly ||
          json.data?.monthlyAttendance ||
          [];

        setData({ daily, weekly, monthly });
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
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
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const attendanceList = data?.[view] || [];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-900 via-blue-900 to-black text-white flex flex-col shadow-lg">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="bg-white p-2 rounded-lg shadow-md">
            <FaTachometerAlt className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">DESINERZ ACADEMY</h2>
            <p className="text-xs text-gray-300">Govt. Regd. & ISO Certified</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 transition text-white font-medium shadow-md">
            <FaTachometerAlt /> Dashboard
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-gradient-to-r from-white to-blue-50 shadow-sm p-4 flex justify-between items-center border-b border-blue-100">
          <h1 className="text-xl font-semibold capitalize text-gray-700">Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              router.push("/admin/login");
            }}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <FaSignOutAlt /> Logout
          </button>
        </header>

        {/* Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6">
          {[
            { type: "daily", icon: <FaCalendarDay />, color: "from-pink-500 to-red-500" },
            { type: "weekly", icon: <FaCalendarWeek />, color: "from-green-500 to-emerald-500" },
            { type: "monthly", icon: <FaCalendarAlt />, color: "from-purple-500 to-indigo-500" },
          ].map(({ type, icon, color }) => (
            <div
              key={type}
              onClick={() => setView(type)}
              className={`cursor-pointer flex items-center gap-3 p-6 rounded-xl shadow-lg transition hover:scale-105 ${
                view === type
                  ? `bg-gradient-to-r ${color} text-white`
                  : "bg-white hover:bg-blue-50 text-gray-700"
              }`}
            >
              <div
                className={`p-3 rounded-lg text-xl shadow-md ${
                  view === type ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium capitalize">{type}</p>
                <p className="text-lg font-bold">{data[type]?.length || 0} Records</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Punch In</th>
                    <th className="p-4 text-left">Punch Out</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-6 text-gray-500 italic">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    attendanceList.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-blue-50 transition">
                        <td className="p-4">{entry.name}</td>
                        <td className="p-4">{entry.role}</td>
                        <td className="p-4">
                          {entry.date
                            ? new Date(entry.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-4">{entry.punchIn || "-"}</td>
                        <td className="p-4">{entry.punchOut || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
