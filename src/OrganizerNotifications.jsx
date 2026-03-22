import { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

export default function OrganizerNotificationHistory() {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {

    const fetchData = async () => {

      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "Notifications"),
        where("receiverId", "==", user.uid),
        where("receiverRole", "==", "organizer"),
        where("seen", "==", true)   // 🔥 ONLY SEEN
      );

      const snap = await getDocs(q);

      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setNotifications(list);
    };

    fetchData();

  }, []);
  // 🔥 DELETE FUNCTION
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "Notifications", id));

      // remove from UI instantly
      setNotifications(prev => prev.filter(n => n.id !== id));

    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };


  return (
    <div>

      <h2> <i className="fas fa-bell"></i>Notification History</h2>

      {notifications.map(n => (
        <div key={n.id} style={{
          border: "1px solid #ccc",
          padding: 15,
          marginBottom: 10,
          borderRadius: 8,
          background: "#f3f4f6"
        }}>
          <h4>Event:{n.title}</h4>
          <p>Description:{n.description}</p>
          <b>{n.message}</b>

        <br /><br />
          <button
            onClick={() => handleDelete(n.id)}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Delete
          </button>


        </div>
      ))}

    </div>
  );
}