"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const router = useRouter();

  const handleClose = () => setShowPopup(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log("✅ Face-api models loaded");
    };
    loadModels();
  }, []);

  // Start video stream
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleAppInstalled = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choice) => {
        if (choice.outcome === "accepted") {
          setInstallPrompt(null);
          setIsInstalled(true);
        }
      });
    }
  };

  const captureImage = () => {
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  const handleAttendance = async () => {
    setLoading(true);
    try {
      // Faster detection options
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 160, // smaller input = faster detection
        scoreThreshold: 0.5,
      });

      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.warn("⚠️ No face detected");
        setShowPopup(true);
        setLoading(false);
        return;
      }

      // Debug info
      console.log("🔹 Face detected!");
      console.log("Detection score:", detection.detection.score);
      console.log("Bounding box:", detection.detection.box);
      console.log("Descriptor length:", detection.descriptor.length);

      // Optional: minimum confidence check
      if (detection.detection.score < 0.6) {
        console.warn("⚠️ Face detected but confidence too low");
        setShowPopup(true);
        setLoading(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const imageData = captureImage();

      const res = await fetch("/api/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor }),
      });

      const result = await res.json();
      console.log("💻 Verification result:", result);

      if (result.success && result.user) {
        const { name, role, userId, imageUrl } = result.user;

        localStorage.setItem("uid", userId);

        await fetch("/api/send-telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, role, userId, imageData }),
        });

        router.push(
          `/success?name=${encodeURIComponent(name)}&role=${encodeURIComponent(
            role
          )}&userId=${encodeURIComponent(userId)}&image=${encodeURIComponent(
            imageUrl
          )}&imageData=${encodeURIComponent(imageData)}`
        );
      } else {
        console.warn("⚠️ User not recognized");
        setShowPopup(true);
      }
    } catch (err) {
      console.error("Error during face recognition:", err);
      alert("Error occurred during attendance.");
    } finally {
      setLoading(false);
    }
  };

  // Optional: auto-detect every 2 seconds for faster attendance
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) handleAttendance();
    }, 2000); // detect every 2s

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 p-6 text-center relative">
      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-80 relative">
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-lg"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-4">
              You were not detected <br /> Please choose your option:
            </p>
            <div className="flex gap-3">
              <Link href="/newStudent" className="flex-1">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  New Student
                </button>
              </Link>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Already Registered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logo */}
      <img
        src="/DesinerzAcademyDark.png"
        alt="Logo"
        className="w-100 h-auto mb-4 drop-shadow-lg"
      />

      {/* Camera Feed with Loader */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg mb-4 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-full"
        />

        {/* Loader */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-72 h-72 flex items-center justify-center">
              <span className="absolute w-64 h-64 rounded-full border-4 border-white animate-border-pulse"></span>
            </div>
          </div>
        )}
      </div>

      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 leading-snug">
        Welcome <br /> to <br /> MDCI
      </h1>

      <button
        onClick={handleAttendance}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-green-700 transition disabled:bg-green-400 mb-4"
      >
        {loading ? "Detecting..." : "Mark Your Daily Attendance"}
      </button>

      {!isInstalled && installPrompt && (
        <button
          onClick={handleInstall}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
        >
          Install App
        </button>
      )}
    </main>
  );
}
