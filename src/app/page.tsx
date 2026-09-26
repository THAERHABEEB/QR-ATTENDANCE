/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import styles from "./page.module.css";

export default function StudentPortal() {
  const [studentId, setStudentId] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");

  // Get User Location on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError("");
        },
        (err) => {
          console.error(err);
          setLocationError("Location access is required for attendance.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setQrPayload(null);

    if (!location) {
      setError("Waiting for location access...");
      return;
    }

    if (!studentId.trim()) {
      setError("Please enter your Student ID.");
      return;
    }

    setLoading(true);
    try {
      // We will create this API route shortly
      const res = await fetch("/api/students/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, location }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setStudentName(data.name);
      
      // The payload will be scanned by the professor
      // Contains ID, timestamp to prevent reuse, and server signature (mocked here)
      const payload = JSON.stringify({
        studentId: data.id,
        timestamp: new Date().toISOString(),
      });
      setQrPayload(payload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>University Attendance</h1>
        <p className={styles.subtitle}>Verify your ID and Location to generate your QR Code</p>

        {locationError && (
          <div className={styles.locationWarning}>
            ⚠️ {locationError}
          </div>
        )}

        {!qrPayload ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="studentId" className={styles.label}>Student ID</label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 123456"
                className={styles.input}
                autoComplete="off"
              />
            </div>
            <button 
              type="submit" 
              className={styles.button}
              disabled={loading || !!locationError || !location}
            >
              {loading ? "Verifying..." : "Generate QR Code"}
            </button>
            {error && <p className={styles.errorMsg}>{error}</p>}
          </form>
        ) : (
          <div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Welcome, {studentName}</h2>
            <p className={styles.subtitle} style={{ marginBottom: "0.5rem" }}>
              Show this QR code to the scanner.
            </p>
            <div className={styles.qrContainer}>
              <QRCodeSVG value={qrPayload} size={200} level="H" />
            </div>
            <p className={styles.successMsg}>Attendance Ready!</p>
            <button 
              className={styles.button} 
              style={{ marginTop: "2rem", width: "100%" }}
              onClick={() => setQrPayload(null)}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
