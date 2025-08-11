// pages/Attendance-result.js
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AttendanceResult() {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [captured, setCaptured] = useState("");
  const [status, setStatus] = useState(""); // store actual status

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("userId") || "";
    setUserId(uid);
    setName(params.get("name") || "");
    setRole(params.get("role") || "");
    setCaptured(params.get("captured") || "");

    // Fetch actual status from the API
    if (uid) {
      fetch("/api/submit-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            setStatus(data.status); // "Punched In" / "Punched Out" / "Not Punched In"
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
    <main className="result-page">
      <div className="card-container">
        <h1 className="title">✅ Attendance Submitted</h1>

        <div className="card">
          {captured && (
            <img
              src={decodeURIComponent(captured)}
              alt="Captured Face"
              style={{ borderRadius: "12px", maxWidth: "100%", marginBottom: "1rem" }}
            />
          )}
          <div className="info">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>ID:</strong> {userId}</p>
            <p><strong>Role:</strong> {role}</p>
            <p><strong>Date:</strong> {date}</p>
            <p><strong>Time:</strong> {time}</p>
            <p><strong>Status:</strong> {status}</p>
          </div>
        </div>
        <Link href={".."}>Home</Link>
      </div>
    </main>
  );
}
