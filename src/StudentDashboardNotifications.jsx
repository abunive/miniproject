import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";

export default function StudentDashboardNotifications({ studentId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!studentId) return;

    // Debugging log
    console.log("Listening notifications for studentId:", studentId);

    const notificationsRef = collection(db, "Notifications");

    // Query: unseen notifications for this student
    const q = query(
      notificationsRef,
      where("receiverRole", "==", "student"),
      where("receiverId", "==", studentId),
      where("seen", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const notifData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log("Notifications received:", notifData);
        setNotifications(notifData);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [studentId]);

  const openNotification = async (n) => {
    try {
      // Mark as seen
      await updateDoc(doc(db, "Notifications", n.id), { seen: true });

      // Redirect to proof if proofId exists
      if (n.proofId) {
        window.location.href = `/student-dashboard?proof=${n.proofId}`;
      }
    } catch (err) {
      console.error("Error updating notification:", err);
    }
  };

  return (
    <div style={{ marginBottom: 25 }}>
      <h2>
        <i className="fas fa-bell"></i> New Notifications
      </h2>

      {notifications.length === 0 && (
        <p className="no-notifications">No new notifications</p>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => openNotification(n)}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            cursor: "pointer",
            background: "#dbeafe",
          }}
        >
          <p>
            <b>Purpose:</b> {n.purpose}
          </p>
          <p>
            <b>Description:</b> {n.description}
          </p>
          <p>
            <b>Status:</b> {n.status}
          </p>
          {n.rejectReason && (
            <p>
              <b>Reject Reason:</b> {n.rejectReason}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}