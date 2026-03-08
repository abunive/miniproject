import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function FacultyNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const q = query(
          collection(db, "Notifications"),
          where("receiverRole", "==", "faculty"),
          where("status", "==", "pending")
        );

        const snap = await getDocs(q);

        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setNotifications(list);
      } catch (err) {
        console.error(err);
      }
    };

    loadNotifications();
  }, []);

  return (
    <div>
      <h2>Pending Proof Notifications</h2>

      {notifications.length === 0 && <p>No pending notifications</p>}

      {notifications.map(n => (
        <div key={n.id} style={card}>
          <h3>{n.studentName}</h3>

          <p>
            <b>Purpose:</b> {n.purpose}
          </p>

          <p>{n.description}</p>

          <p style={{ color: "blue", fontWeight: "bold" }}>
            Status: Pending
          </p>
        </div>
      ))}
    </div>
  );
}

const card = {
  border: "1px solid #ccc",
  padding: 15,
  marginBottom: 10,
  borderRadius: 8,
  background: "#fff"
};