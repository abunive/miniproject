import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

export default function StudentNotifications({ studentId }) {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {

    if (!studentId) return;

    const loadNotifications = async () => {

      const q = query(
        collection(db, "Notifications"),
        where("receiverRole", "==", "student"),
        where("receiverId", "==", studentId),
        where("seen", "==", true)
      );

      const snap = await getDocs(q);

      setNotifications(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
      );

    };

    loadNotifications();

  }, [studentId]);



  return (

    <div>

      <h2><i className="fas fa-bell"></i> Notification History</h2>

      {notifications.length === 0 && (
        <p>No notifications</p>
      )}

      {notifications.map(n => (

        <div
          key={n.id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            background: "#f3f4f6"
          }}
        >

          <p><b>Purpose:</b> {n.purpose}</p>
          <p><b>Description:</b> {n.description}</p>
          <p><b>Status:</b> {n.status}</p>

        </div>

      ))}

    </div>

  );
}