/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        fetchStats();
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Import failed.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    window.open("/api/admin/export", "_blank");
  };

  // Mock Scanner 
  const handleSimulateScan = async () => {
    const studentId = prompt("Enter Student ID to mark attendance:");
    if (!studentId) return;
    const week = prompt("Enter Week Number (1-10):");
    if (!week) return;

    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, week }),
      });
      const result = await res.json();
      if (res.ok) {
        alert(`Attendance marked for ${result.studentName}!`);
        fetchStats();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Failed to mark attendance.");
    }
  };

  return (
    <div className={styles.adminMain}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className={styles.buttonSecondary} onClick={handleSimulateScan}>
            📷 Simulate Scanner
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{data?.totalStudents || 0}</div>
              <div className={styles.statLabel}>Total Students</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{data?.totalAttendances || 0}</div>
              <div className={styles.statLabel}>Total Attendances</div>
            </div>
          </div>

          <div className={styles.actionPanel}>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              style={{ display: "none" }} 
              ref={fileInputRef}
              onChange={handleImport}
            />
            <button 
              className={styles.button} 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? "Importing..." : "📥 Import Excel"}
            </button>
            <button className={styles.buttonSecondary} onClick={handleExport}>
              📤 Export Excel
            </button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => (
                    <th key={w} style={{textAlign: "center"}}>W{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.students?.map((student: any) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => {
                      const attended = student.attendances.some((a: any) => a.week === w);
                      return (
                        <td key={w} style={{textAlign: "center"}}>
                          {attended ? (
                            <span className={styles.statusAttended}>✓</span>
                          ) : (
                            <span className={styles.statusAbsent}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {(!data?.students || data.students.length === 0) && (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: "2rem" }}>
                      No students found. Please import an Excel file.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
