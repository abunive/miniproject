import { useEffect, useState } from "react";
import { auth, db } from "./firebase/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import StudentProofUpload from "./StudentProofUpload";
import StudentActivityPoints from "./StudentActivityPoints";
import useConfirmBackNavigation from "./useConfirmBackNavigation";




export default function StudentDashboard() {
    useConfirmBackNavigation(
      "Do you really want to go back from Faculty Dashboard?"
    );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h3>Student Panel</h3>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("events")}>Events</button>
        <button onClick={() => setActiveTab("proof")}>Upload Proof</button>
<button onClick={() => setActiveTab("notifications")}>
  Notifications
</button>

        <div style={{ flex: 1 }} />

        <button onClick={handleLogout} style={logoutBtn}>
          🔓 Logout
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: 30 }}>
        {/* {activeTab === "dashboard" && (
          <>
            <h1>Student Dashboard</h1>
            <h2>Welcome, <b>{studentName}</b></h2>
            <p>Total Activity Points: 0</p>
          </>
        )} */}
        {activeTab === "dashboard" && (
  <>
    <h1>Student Dashboard</h1>
    <h2>Welcome, <b>{studentName}</b></h2>

    {/* ✅ SHOW ACTIVITY POINTS */}
    {auth.currentUser && (
      <StudentActivityPoints studentId={auth.currentUser.uid} />
    )}
  </>
)}


        {activeTab === "events" && (
          <>
            <h2>Approved Events</h2>

            {loading && <p>Loading events...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loading &&
              events
                .filter(e => e.status === "approved")
                .map(e => (
                  <div key={e.id} style={card}>
                    <h3>{e.title}</h3>
                    <p><b>Date:</b> {e.eventDate}</p>
                    <p>{e.description}</p>

                    {e.posterURL && (
                      <img
                        src={e.posterURL}
                        alt="poster"
                        style={{ width: 200, marginTop: 10 }}
                      />
                    )}
                  </div>
                ))}

            {!loading && events.filter(e => e.status === "approved").length === 0 && (
              <p>No approved events available</p>
            )}
          </>
        )}
       {activeTab === "proof" && <StudentProofUpload user={auth.currentUser} />}
        

      </div>
    </div>
  );
}

/* STYLES */
const sidebar = {
  width: 220,
  background: "#111",
  color: "#fff",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 10
};

const card = {
  border: "1px solid #ccc",
  padding: 15,
  marginBottom: 15,
  borderRadius: 8
};

const logoutBtn = {
  background: "#dc2626",
  color: "white",
  padding: 10,
  borderRadius: 6,
  border: "none",
  fontWeight: "bold"
};
