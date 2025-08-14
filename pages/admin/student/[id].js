"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function StudentPage() {
  const router = useRouter();
  const { id } = router.query;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/student/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        setStudent(data);
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  if (loading) {
    return <p className="text-center p-4">Loading student data...</p>;
  }
  if (error) {
    return <p className="text-red-500 p-4">Error: {error}</p>;
  }
  if (!student) {
    return <p className="p-4">No student found.</p>;
  }

  const SummaryCard = ({ title, data }) => (
    <div className="bg-white shadow-lg rounded-lg p-6 border hover:shadow-xl transition">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <p className="text-sm text-gray-400 mb-2">
        From {data.start} to {data.end}
      </p>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-700">{data.present}</p>
          <p className="text-sm text-gray-500">Days Present</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-3xl font-bold text-red-700">{data.absent}</p>
          <p className="text-sm text-gray-500">Days Absent</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-700">{data.total}</p>
          <p className="text-sm text-gray-500">Total Days</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-1">{student.name}</h2>
      <p className="mb-6 text-gray-600">Role: {student.role}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard title="Weekly Attendance" data={student.weekly} />
        <SummaryCard title="Monthly Attendance" data={student.monthly} />
      </div>
    </div>
  );
}
