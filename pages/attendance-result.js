// pages/Attendance-result.js
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AttendanceResult() {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [captured, setCaptured] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("userId") || "";
    setUserId(uid);
    setName(params.get("name") || "");
    setRole(params.get("role") || "");
    setCaptured(params.get("captured") || "");

    if (uid) {
      fetch("/api/submit-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            setStatus(data.status);
          } else {
            setStatus("Unknown");
          }
        })
        .catch(() => {
          setStatus("Error fetching status");
        });
    }
  }, []);

  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 px-4 py-6">
      <div className="bg-white shadow-xl rounded-2xl max-w-md w-full p-6 text-center border border-gray-200">
        <h1 className="text-2xl font-bold text-green-600 mb-6 flex items-center justify-center gap-2">
          ✅ Attendance Submitted
        </h1>

        {captured && (
          <div className="flex justify-center mb-4">
            <img
              src={decodeURIComponent(captured)}
              alt="Captured Face"
              className="w-40 h-40 object-cover rounded-lg border-4 border-green-200 shadow-md"
            />
          </div>
        )}

        <div className="space-y-2 text-gray-700 text-left mb-6">
          <p>
            <span className="font-semibold">Name:</span> {name}
          </p>
          <p>
            <span className="font-semibold">ID:</span> {userId}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {role}
          </p>
          <p>
            <span className="font-semibold">Date:</span> {date}
          </p>
          <p>
            <span className="font-semibold">Time:</span> {time}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded-full text-sm font-medium ${
                status.includes("In")
                  ? "bg-green-100 text-green-700"
                  : status.includes("Out")
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status}
            </span>
          </p>
        </div>

        <Link
          href="/"
          className="mt-4 inline-block w-full py-3 rounded-lg text-white font-medium bg-green-500 hover:bg-green-600 transition shadow-md"
        >
          🏠 Back to Home
        </Link>
      </div>
    </main>
  );
}
