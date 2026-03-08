import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function StudentActivityPoints({ studentId }) {
  const [proofs, setProofs] = useState([]);

  useEffect(() => {
    if (!studentId) return;

    const loadData = async () => {
      const q = query(
        collection(db, "ProofRequests"),
        where("studentId", "==", studentId),
        where("status", "==", "approved")
      );

      const snap = await getDocs(q);
      const list = snap.docs.map(doc => doc.data());
      setProofs(list);
    };

    loadData();
  }, [studentId]);

  if (proofs.length === 0) {
    return (
      <p
        style={{
          marginTop: "20px",
          color: "#777",
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        No activity points earned yet.
      </p>
    );
  }

  const totalPoints = proofs.reduce(
    (sum, p) => sum + (p.activityPoints || 0),
    0
  );

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "20px",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        maxWidth: "500px",
      }}
    >
      <h3
        style={{
          marginBottom: "15px",
          color: "#2c3e50",
          textAlign: "center",
        }}
      >
        Total Activity Points:{" "}
        <span style={{ color: "#27ae60" }}>{totalPoints}</span>
      </h3>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {proofs.map((p, i) => {

          const eventName =
            p.activity ||
            p.activityName ||
            p.professionalActivity ||
            p.leadershipRole ||
            p.dutyType ||
            p.purpose ||
            "Activity";

          return (
            <li
              key={i}
              style={{
                padding: "10px 12px",
                marginBottom: "8px",
                borderRadius: "6px",
                backgroundColor: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #eee",
              }}
            >
              <span style={{ fontWeight: "600", color: "#34495e" }}>
                {eventName}
              </span>

              <span
                style={{
                  fontWeight: "bold",
                  color: "#2980b9",
                }}
              >
                {p.activityPoints} pts
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}