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
    };
    loadModels();
  }, []);

  // Start webcam
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  // Handle PWA install prompt
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

        localStorage.setItem("uid", userId); // 🔐 Store UID for consistency

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
        console.warn("Face not recognized or no user data returned.");
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
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 overflow-hidden" style={{textAlign:"center"}}> 
      {showPopup && (
        <div className="popupOverlay">
          <div className="popupBox">
            <h2>Welcome!</h2>
            <p>
              You were not detected <br /> Please choose your option:
            </p>
            <div className="buttons">
              <Link href="/newStudent">
                <button>New Student</button>
              </Link>
              <button onClick={handleClose}>Already Registered</button>
            </div>
            <button onClick={handleClose} className="closeBtn">
              ✕
            </button>
          </div>
        </div>
      )}

      <img src="/logo.png" alt="Logo" className="logo" />

      <div className="camera-circle" >
        <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
      </div>

      <h1 className="heading">
        Welcome <br /> to <br /> MDCI
      </h1>

      <button className="attendance-btn" onClick={handleAttendance} disabled={loading}>
        {loading ? "Detecting..." : "Mark Your Daily Attendance"}
      </button>

      {!isInstalled && installPrompt && (
        <button onClick={handleInstall} className="install-btn">
          Install App
        </button>
      )}

      
    </main>
  );
}
