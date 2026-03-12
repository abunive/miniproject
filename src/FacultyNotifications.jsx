import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

export default function FacultyNotifications() {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {

    const q = query(
      collection(db, "Notifications"),
      where("receiverRole", "==", "faculty"),
      where("seen", "==", true)
    );

    const snap = await getDocs(q);

    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setNotifications(list);
  };

  return (
    <div>

      <h2>Notification History</h2>

      {notifications.map(n => (

        <div
          key={n.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            background: "#f3f4f6"
          }}
        >

          <b>{n.studentName}</b> uploaded proof

          <p><b>Purpose:</b> {n.purpose}</p>

          <p><b>Description:</b> {n.description}</p>

        </div>

      ))}

    </div>
  );
}