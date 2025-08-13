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
        if (!res.ok) throw new Error(`Error: ${res.statusText}`);
        const data = await res.json();
        setStudent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  if (loading) return <p>Loading student data...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!student) return <p>No student found.</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{student.name}</h2>
      <p className="mb-2">Role: {student.role}</p>

      {student.attendance.length === 0 ? (
        <p className="text-gray-400 italic">No attendance records found.</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Punch In</th>
              <th className="p-2 border">Punch Out</th>
            </tr>
          </thead>
          <tbody>
            {student.attendance.map((rec, idx) => (
              <tr key={idx} className="text-center border">
                <td className="p-2 border">{rec.date ? new Date(rec.date).toLocaleDateString() : "-"}</td>
                <td className="p-2 border">{rec.punchIn || "-"}</td>
                <td className="p-2 border">{rec.punchOut || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
