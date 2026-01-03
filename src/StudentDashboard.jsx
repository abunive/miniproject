import { useEffect, useState } from "react";
import { auth, db } from "./firebase/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [studentName, setStudentName] = useState("");

  // 🔐 STUDENT AUTH CHECK
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
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
  const handleLogout = async () => {
  try {
    await signOut(auth);
    alert("Logged out successfully");
    window.location.href = "/";
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
};


  // 📥 LOAD EVENTS
  const loadEvents = async () => {
    const snap = await getDocs(collection(db, "Events"));
    setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (activeTab === "events") {
      loadEvents();
    }
  }, [activeTab]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h3>Student Panel</h3>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("events")}>Events</button>
        <div style={{ flex: 1 }}></div> {/* pushes logout to bottom */}

  <button
    onClick={handleLogout}
    style={{
      background: "#dc2626",
      color: "white",
      marginTop: 20,
      padding: "10px",
      borderRadius: 6,
      fontWeight: "bold"
    }}
  >
    🔓 Logout
  </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: 30 }}>
        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <h1>Student Dashboard</h1>
            <h2>Welcome, <b>{studentName}</b></h2>
            <p>Total Activity Points: 0</p>
          </>
        )}

        {/* EVENTS */}
        {activeTab === "events" && (
          <>
            <h2>Events</h2>

            {events.length === 0 && <p>No events available</p>}

            {events
              .filter(e => e.status === "approved")
              .map(e => (
                <div key={e.id} style={card}>
                  <h3>{e.title}</h3>
                  <p><b>Date:</b> {e.date}</p>
                  <p>{e.description}</p>

                  {e.posterURL && (
                    <img
                      src={e.posterURL}
                      alt="poster"
                      style={{ width: "200px", marginTop: 10 }}
                    />
                  )}
                </div>
              ))}
          </>
        )}
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
