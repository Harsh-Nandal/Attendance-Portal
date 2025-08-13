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

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

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
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
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
        setShowPopup(true);
      }
    } catch (err) {
      console.error("Error during face recognition:", err);
      alert("Error occurred during attendance.");
    } finally {
      setLoading(false);
    }
  };

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
        src="/DesinerzAcademy.png"
        alt="Logo"
        className="w-100 h-auto mb-4 drop-shadow-lg"
      />

      {/* Camera Feed */}
      <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 leading-snug">
        Welcome <br /> to <br /> MDCI
      </h1>

      {/* Attendance Button */}
      <button
        onClick={handleAttendance}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-green-700 transition disabled:bg-green-400 mb-4"
      >
        {loading ? "Detecting..." : "Mark Your Daily Attendance"}
      </button>

      {/* Install App Button */}
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
