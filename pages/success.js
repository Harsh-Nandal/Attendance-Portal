"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [imageData, setImageData] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("userId");
    const uname = params.get("name");
    const urole = params.get("role");
    const img = params.get("imageData");

    console.log("🔍 Params:", { uid, uname, urole, img });

    if (uid && uname && urole && img) {
      setUserId(uid);
      setName(uname);
      setRole(urole);
      setImageData(img);
    } else {
      alert("⚠️ FRONTEND: Missing data. Please register again.");
      router.push("/");
    }

    setLoading(false);
  }, [router]);

  const handleSubmit = async () => {
    if (!userId) {
      alert("User ID missing!");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/submit-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const result = await res.json();

      router.push(
        `/attendance-result?userId=${userId}&name=${name}&role=${role}&imageData=${encodeURIComponent(
          imageData
        )}&message=${encodeURIComponent(result.message)}`
      );
    } catch (error) {
      console.error("Error submitting attendance:", error);
      alert("Something went wrong while submitting attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="success-page">
        <div className="card-container">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className=" h-screen w-screen flex flex-col items-center justify-center bg-gray-100 overflow-hidden">
      <div className="card-container">
        <h1 className="title">🎉 Attendance Details</h1>

        <div className="card">
          {imageData && (
            <img
              src={decodeURIComponent(imageData)}
              alt="Captured Face"
              className="captured-image"
            />
          )}

          <div className="info">
            <p>
              <span>Name:</span> {name}
            </p>
            <p>
              <span>ID:</span> {userId}
            </p>
            <p>
              <span>Role:</span> {role}
            </p>
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "⏳ Submitting..." : "📥 Submit Attendance"}
          </button>

          <Link href="/" className="home-link">
            🏠 Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
