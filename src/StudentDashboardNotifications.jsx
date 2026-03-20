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

export default function StudentDashboardNotifications({ studentId }) {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {

    if (!studentId) return;

    const loadNotifications = async () => {

      const q = query(
        collection(db, "Notifications"),
        where("receiverRole", "==", "student"),
        where("receiverId", "==", studentId),
        where("seen", "==", false)
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



  const openNotification = async (n) => {

    await updateDoc(doc(db, "Notifications", n.id), {
      seen: true
    });

    window.location.href = `/student-dashboard?proof=${n.proofId}`;
  };



  return (

    <div style={{ marginBottom: 25 }}>

      <h2><i className="fas fa-bell"></i> New Notifications</h2>

    {notifications.length === 0 && (
  <p className="no-notifications">No new notifications</p>
)}

      {notifications.map(n => (

        <div
          key={n.id}
          onClick={() => openNotification(n)}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            cursor: "pointer",
            background: "#dbeafe"
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