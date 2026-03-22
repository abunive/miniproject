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

export default function OrganizerDashboardNotifications({ onOpenEvent }) {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {

    const q = query(
      collection(db, "Notifications"),
      where("receiverRole", "==", "organizer"),
      where("seen", "==", false)
    );

    const snap = await getDocs(q);

    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setNotifications(list);
  };

  const openEvent = async (n) => {

  // ✅ mark as seen
  await updateDoc(doc(db, "Notifications", n.id), {
    seen: true
  });

  // ✅ remove from dashboard UI
  setNotifications(prev => prev.filter(item => item.id !== n.id));

  // ✅ open event details in dashboard
  onOpenEvent(n.eventId);
};

  return (
    <div style={{ marginTop: 30 }}>

      <h2 className="notification-heading"  > <i className="fas fa-bell"></i> Event Notifications</h2>

      {notifications.length === 0 && <p   style={{color:"#fff"}}>No new notifications</p>}

      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => openEvent(n)}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            background: "#e0f2fe",
            cursor: "pointer"
          }}
        >
          <b>{n.title}</b>

          <p><b>Description:</b> {n.description}</p>

          <small>Click to view event</small>
        </div>
      ))}
    </div>
  );
}