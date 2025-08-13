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

    if (uid && uname && urole && img) {
      setUserId(uid);
      setName(uname);
      setRole(urole);
      setImageData(img);
    } else {
      alert("⚠️ Missing data. Please register again.");
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
      <main className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg font-medium text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4 py-6">
      <div className="bg-white shadow-xl rounded-2xl max-w-md w-full p-6 text-center border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
          🎉 Attendance Details
        </h1>

        {imageData && (
          <div className="flex justify-center mb-4">
            <img
              src={decodeURIComponent(imageData)}
              alt="Captured Face"
              className="w-40 h-40 object-cover rounded-full border-4 border-blue-200 shadow-md"
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
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3 rounded-lg text-white font-medium shadow-md transition ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {submitting ? "⏳ Submitting..." : "📥 Submit Attendance"}
        </button>

        <Link
          href="/"
          className="mt-4 inline-block text-blue-500 hover:underline text-sm font-medium"
        >
          🏠 Back to Home
        </Link>
      </div>
    </main>
  );
}
