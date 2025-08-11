"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Register.module.css";
import * as faceapi from "face-api.js";

export default function Register() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("student");
  const [imageData, setImageData] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState([]);
  const [loading, setLoading] = useState(false);
  const [faceNotFound, setFaceNotFound] = useState(false);
  const [detecting, setDetecting] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const retryCount = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const loadModelsAndStartCamera = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          tryAutoCapture();
        };
      }
    };

    loadModelsAndStartCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const tryAutoCapture = async () => {
    if (retryCount.current >= 5) {
      setDetecting(false);
      setFaceNotFound(true);
      return;
    }

    const success = await attemptCapture();
    if (!success) {
      retryCount.current += 1;
      setTimeout(tryAutoCapture, 2000);
    }
  };

  const attemptCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return false;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const image = canvas.toDataURL("image/png");
      const descriptor = Array.from(detection.descriptor);
      setImageData(image);
      setFaceDescriptor(descriptor);
      setFaceNotFound(false);
      setDetecting(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      return true;
    }
    return false;
  };

  const handleManualCapture = async () => {
    setFaceNotFound(false);
    const success = await attemptCapture();
    if (!success) {
      setFaceNotFound(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !userId || !imageData || !faceDescriptor?.length) {
      alert("⚠️ Please ensure all fields are filled and your face is detected.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId, role, imageData, faceDescriptor }),
      });

      const result = await res.json();

      if (res.status === 200) {
        router.push({
          pathname: "/success",
          query: { name, role, imageData, userId },
        });
      } else {
        alert("⚠️ BACKEND: " + result.message);
      }
    } catch (err) {
      console.error("🚨 FRONTEND: Network error", err);
      alert("🚨 Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 overflow-auto p-4">
      {loading ? (
        <div className={styles.loader}>Submitting...</div>
      ) : (
        <>
          <h2 className={styles.heading}>Register Student / Faculty</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="text"
              className={styles.inputField}
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="text"
              className={styles.inputField}
              placeholder="ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <select
              className={styles.inputField}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>

            <div className={styles.camera}>
              {!imageData && <video ref={videoRef} width="300" height="200" autoPlay muted />}
              <canvas ref={canvasRef} width="300" height="200" style={{ display: "none" }} />
            </div>

            {detecting && !imageData && (
              <p className="text-blue-500 text-sm mt-2">🔍 Trying to detect face automatically...</p>
            )}

            {faceNotFound && (
              <p className="text-red-600 text-sm mt-2">
                ⚠️ Face not detected. Click "Capture Image" again or adjust lighting.
              </p>
            )}

            {imageData && (
              <img src={imageData} alt="Captured" className={styles.preview} />
            )}

            {!imageData && (
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 mt-3 rounded"
                onClick={handleManualCapture}
              >
                📸 Capture Image
              </button>
            )}

            <button type="submit" className={styles.submitBtn}>
              Submit
            </button>
          </form>
        </>
      )}
    </div>
  );
}
