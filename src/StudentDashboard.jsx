import { useEffect, useState } from "react";
import { auth, db } from "./firebase/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import StudentProofUpload from "./StudentProofUpload";
import StudentActivityPoints from "./StudentActivityPoints";
import useConfirmBackNavigation from "./useConfirmBackNavigation";
import StudentDashboardNotifications from "./StudentDashboardNotifications";
import StudentNotifications from "./StudentNotifications";
import StudentViewEvents from "./StudentViewEvents";
import "./studentdas.css";

export default function StudentDashboard() {
    useConfirmBackNavigation(
      "Do you really want to go back from Faculty Dashboard?"
    );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProofId, setSelectedProofId] = useState(null);

useEffect(() => {

  const params = new URLSearchParams(window.location.search);
  const proofId = params.get("proof");

  if (proofId) {
    setSelectedProofId(proofId);
  }

}, []);

  /* 🔐 AUTH CHECK */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        window.location.href = "/";
        return;
      }

      const snap = await getDoc(doc(db, "Users", user.uid));
      if (!snap.exists() || snap.data().role !== "student") {
        alert("Access denied");
        window.location.href = "/";
        return;
      }

      if (!snap.data().isActive) {
        alert("Account deactivated");
        window.location.href = "/";
        return;
      }

      setStudentName(snap.data().name);
    });

    return () => unsubscribe();
  }, []);

  /* 🔓 LOGOUT */
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  /* 📥 LOAD EVENTS (FIXED) */
  const loadEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const snap = await getDocs(collection(db, "Events"));

      const formatted = snap.docs.map(d => {
        const data = d.data();

        let eventDate = "N/A";
        if (data.date?.toDate) {
          eventDate = data.date.toDate().toLocaleDateString();
        } else if (typeof data.date === "string") {
          eventDate = data.date;
        }

        return {
          id: d.id,
          ...data,
          eventDate
        };
      });

      setEvents(formatted);
    } catch (err) {
      console.error(err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "events") loadEvents();
  }, [activeTab]);

  return (
  <div className="layout">
    {/* SIDEBAR */}
    <div className="sidebar">
      <h3 className="logo">Student Panel</h3>

      <button
       className={activeTab === "dashboard" ? "active" : ""}onClick={() => setActiveTab("dashboard")}>
        <i className="fas fa-home"></i> Dashboard
       </button>

      <button
        className={activeTab === "events" ? "active" : ""}
        onClick={() => setActiveTab("events")}
      >
       <i className="fas fa-calendar-alt"></i> Events
      </button>

      <button
        className={activeTab === "proof" ? "active" : ""}
        onClick={() => setActiveTab("proof")}
      >
        <i className="fas fa-upload"></i> Upload Proof
      </button>

      <button
        className={activeTab === "notifications" ? "active" : ""}
        onClick={() => setActiveTab("notifications")}
      >
        <i className="fas fa-bell"></i> Notifications
      </button>

      <div className="spacer"></div>
      <hr />

      <button onClick={handleLogout} className="logout-btn">
        <i className="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>

    {/* CONTENT */}
     <div className="main">
    <div className="content">
      {activeTab === "dashboard" && (
        <>
          <h1>Student Dashboard</h1>
          <h2>Welcome, <b>{studentName}</b></h2>

          {auth.currentUser && (
            <StudentActivityPoints studentId={auth.currentUser.uid} />
          )}

          {auth.currentUser && (
            <StudentDashboardNotifications studentId={auth.currentUser.uid} />
          )}
        </>
      )}

      {activeTab === "events" && <StudentViewEvents />}

      {activeTab === "events" && (
        <>
          <h2>Approved Events</h2>

          {loading && <p>Loading events...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && (
            <div className="events-container">
              {events
                .filter(e => e.status === "approved")
                .map(e => (
                  <div key={e.id} className="event-card">
                    <h3>{e.title}</h3>
                    <p><b>Date:</b> {e.eventDate}</p>
                    <p><b>Description:</b> {e.description}</p>

                    {e.posterURL && (
                      <img src={e.posterURL} alt="poster" />
                    )}
                  </div>
                ))}
            </div>
          )}

          {!loading &&
            events.filter(e => e.status === "approved").length === 0 && (
              <p>No approved events available</p>
            )}
        </>
      )}

      {activeTab === "proof" && (
        <StudentProofUpload user={auth.currentUser} />
      )}

      {activeTab === "notifications" && (
        auth.currentUser && (
          <StudentNotifications studentId={auth.currentUser.uid} />
        )
      )}
    </div>
  </div>
  </div>
);
}
  