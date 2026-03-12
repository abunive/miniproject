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

    const q = query(
      collection(db, "Notifications"),
      where("receiverRole", "==", "faculty"),
      where("verified", "==", false)
    );

    const snap = await getDocs(q);

    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setNotifications(list);
  };

  const markSeen = async (id) => {

    await updateDoc(doc(db, "Notifications", id), {
      seen: true
    });

    setNotifications(notifications.filter(n => n.id !== id));
  };
//   const openProof = async (n) => {

//   // mark as seen but NOT verified
//   await updateDoc(doc(db, "Notifications", n.id), {
//     seen: true
//   });

//   // redirect to proof review page
//   window.location.href = `/faculty-proof/${n.proofId}`;
// };

const openProof = async (n) => {

  // Mark notification as seen
  await updateDoc(doc(db, "Notifications", n.id), {
    seen: true
  });

  // Go to proof review page
  window.location.href = `/faculty-dashboard?proof=${n.proofId}`;
};

  return (
    <div style={{ marginTop: 30 }}>

      <h2>🔔 New Proof Uploads</h2>

      {notifications.length === 0 && (
        <p>No new notifications</p>
      )}

      {notifications.map(n => (

        <div
          key={n.id}
        //   onClick={() => markSeen(n.id)}
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
  <div
  key={n.id}
  onClick={() => openProof(n)}
  style={{
    border:"1px solid #ccc",
    padding:15,
    borderRadius:8,
    marginBottom:10,
    cursor:"pointer",
    background:"#e0f2fe"
  }}
></div>
}
