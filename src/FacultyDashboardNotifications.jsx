import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

export default function FacultyDashboardNotifications() {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Fetch notifications for pending proofs only
    const q = query(
      collection(db, "Notifications"),
      where("receiverRole", "==", "faculty"),
      where("verified", "==", false) // Only pending proofs
    );

    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setNotifications(list);
  };

  // Mark notification as viewed and open proof review
  const openProof = async (n) => {
    // Mark notification as seen
    await updateDoc(doc(db, "Notifications", n.id), {
      seen: true,
      verified: true // Mark as verified so it moves to history
    });

    // Remove from dashboard state immediately
    setNotifications(notifications.filter(item => item.id !== n.id));

    // Go to proof review page (replace with your route)
    window.location.href = `/faculty-dashboard?proof=${n.proofId}`;
  };

  return (
    <div style={{ marginTop: 30 }}>
      <h2><i className="fas fa-bell"></i> New Proof Uploads</h2>

      {notifications.length === 0 && <p>No new notifications</p>}

      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => openProof(n)}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            background: "#e0f2fe",
            cursor: "pointer"
          }}
        >
          <b>{n.studentName}</b> uploaded a proof
          <p><b>Purpose:</b> {n.purpose}</p>
          <p><b>Description:</b> {n.description}</p>
          <small>Click to mark as viewed</small>
        </div>
      ))}
    </div>
  );
}