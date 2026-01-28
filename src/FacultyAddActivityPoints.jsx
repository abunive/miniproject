import { useState } from "react";
import { db } from "./firebase/firebase";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "firebase/firestore";

export default function FacultyAddActivityPoints({ proof, onClose, onDone }) {
  const [activityName, setActivityName] = useState("");
  const [points, setPoints] = useState("");


const approveWithPoints = async () => {
  try {
    if (!activityName || !points) {
      alert("Fill all fields");
      return;
    }

    if (!proof.studentId) {
      alert("Student ID missing in proof");
      return;
    }

    const pts = Number(points);

    // 1️⃣ Update Proof
    await updateDoc(doc(db, "ProofRequests", proof.id), {
      status: "approved",
      activityName,
      activityPoints: pts
    });

    // 2️⃣ Add points to student
    const studentRef = doc(db, "StudentPoints", proof.studentId);
    const snap = await getDoc(studentRef);

    if (snap.exists()) {
      const data = snap.data();
      await updateDoc(studentRef, {
        totalPoints: (data.totalPoints || 0) + pts,
        points: [
          ...(data.points || []),
          {
            proofId: proof.id,
            activityName,
            points: pts
          }
        ]
      });
    } else {
      await setDoc(studentRef, {
        totalPoints: pts,
        points: [
          {
            proofId: proof.id,
            activityName,
            points: pts
          }
        ]
      });
    }

    onDone();
    onClose();
  } catch (err) {
    console.error(err);
    alert("Approval failed. Check console.");
  }
};

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3>Add Activity Points</h3>

        <input
          placeholder="Activity / Proof Name"
          value={activityName}
          onChange={e => setActivityName(e.target.value)}
          style={input}
        />

        <input
          type="number"
          placeholder="Activity Points"
          value={points}
          onChange={e => setPoints(e.target.value)}
          style={input}
        />

        <div style={{ marginTop: 16 }}>
          <button onClick={approveWithPoints} style={approveBtn}>
            Approve
          </button>
          <button onClick={onClose} style={cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* styles */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 1000
};

const modal = {
  background: "#fff",
  width: 400,
  margin: "120px auto",
  padding: 20,
  borderRadius: 10
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ccc"
};

const approveBtn = {
  background: "#16a34a",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
  borderRadius: 6
};

const cancelBtn = {
  marginLeft: 10,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #ccc"
};
