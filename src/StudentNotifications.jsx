import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

export default function StudentNotifications({ studentId }) {
  const [notifications, setNotifications] = useState([]);
useEffect(() => {
  if (!studentId) return;

  const loadNotifications = async () => {
    try {
      const q = query(
        collection(db, "Notifications"),
        where("receiverId", "==", studentId)
      );

      const snap = await getDocs(q);

      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setNotifications(list.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  loadNotifications();
}, [studentId]);



  const markSeen = async (id) => {
    await updateDoc(doc(db, "Notifications", id), {
      status: "seen"
    });

    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, status: "seen" } : n
      )
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🔔 My Notifications</h2>

      {notifications.length === 0 && <p>No notifications yet</p>}

      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => markSeen(n.id)}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            background: n.status === "unread" ? "#e0f2fe" : "#fff",
            cursor: "pointer"
          }}
        >
          <h3>{n.description}</h3>

          <p>
            <b>Purpose:</b> {n.purpose}
          </p>

          <p>
            <b>Status:</b> {n.verified ? "Approved" : "Pending"}
          </p>
        </div>
      ))}
    </div>
  );
}