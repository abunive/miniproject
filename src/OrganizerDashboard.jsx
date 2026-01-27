import { useEffect, useState } from "react";
import { auth, db } from "./firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";

import { storage } from "./firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";



export default function organizerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [posterURL, setPosterURL] = useState("");

  const [organizerName, setLoggedInName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");






  const [newEvent, setNewEvent] = useState({
    uid: "",
    eventid: "",
    title: "",
    date: "",
    description: "",
    posterURL: "",
    status: "pending"
  });

  const handleLogout = async () => {
  try {
    await signOut(auth);
    alert("Logged out successfully");
    window.location.href = "/";
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
};




  // 🔐 Organizer CHECK
  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "/";
      return;
    }

    const snap = await getDoc(doc(db, "Users", user.uid));
    if (!snap.exists()) {
      alert("Access denied");
      window.location.href = "/";
      return;
    }

    if (snap.data().role !== "organizer") {
      alert("Unauthorized");
      window.location.href = "/";
      return;
    }

    if (snap.data().isActive === false) {
      alert("Account deactivated");
      window.location.href = "/";
      return;
    }
    setCurrentUserRole(snap.data().role)
    setLoggedInName(snap.data().name);
  });

  return () => unsubscribe();
}, []);


  useEffect(() => {
    loadEvents();
  }, []);


  const loadEvents = async () => {
    const snap = await getDocs(collection(db, "Events"));
    setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

 

  const createEvent = async () => {
  try {
    let finalPosterURL = newEvent.posterURL || "";

    // Upload image if file selected
    if (posterFile) {
      const imgRef = ref(storage, `eventPosters/${Date.now()}_${posterFile.name}`);
      await uploadBytes(imgRef, posterFile);
      finalPosterURL = await getDownloadURL(imgRef);
    }

    await addDoc(collection(db, "Events"), {
      eventid: newEvent.eventid,
      title: newEvent.title,
      date: newEvent.date,
      description: newEvent.description,
      posterURL: finalPosterURL,

      status: currentUserRole === "admin" || currentUserRole === "faculty"
        ? "approved"
        : "pending",

      createdBy: auth.currentUser.uid,
      createdByRole: currentUserRole,
      createdAt: new Date()
    });

    alert("Event submitted successfully");

    setShowAddEvent(false);
    setPosterFile(null);
    setPosterURL("");
    setNewEvent({
      eventid: "",
      title: "",
      date: "",
      description: "",
      posterURL: "",
      status: "pending"
    });

    loadEvents();
  } catch (error) {
    alert(error.message);
  }
};


 
  const deleteEvent = async id => {
    if (!window.confirm("Delete event?")) return;
    await deleteDoc(doc(db, "Events", id));
    loadEvents();
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h3>Admin Panel</h3>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("events")}>Manage Events</button>
        <div style={{ flex: 1 }}></div>
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
        {activeTab === "dashboard" && (
          <>
            <h1>Organizer Dashboard</h1>
            <h2>Welcome,<b>{organizerName}</b></h2><br />
            <p>notifications</p>
          </>
        )}

        
        {/* EVENTS */}
        {activeTab === "events" && (
          <>
            <h2>Manage Events</h2>
            <button onClick={() => setShowAddEvent(true)}>➕ Add Event</button>

            {showAddEvent && (
              <div style={modal}>
                <h3>Add Event</h3>

                <input placeholder="Event ID" onChange={e => setNewEvent({ ...newEvent, eventid: e.target.value })} />
                <select
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                >
                  <option value="">Select Event Type</option>
                  <option value="Arts">Arts</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshops">Workshops</option>
                </select>

                <input placeholder="Date (Feb 2-10)" onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                <input placeholder="Poster URL" onChange={e => setNewEvent({ ...newEvent, posterURL: e.target.value })} />
                <textarea placeholder="Description" onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                 {/* <input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files[0])} /> */}
                <br /><br />
                <button onClick={createEvent}>Create Event</button>
                <button onClick={() => setShowAddEvent(false)}>Cancel</button>
              </div>
            )}
            {editingEvent && (
    <div style={modal}>
      <h3>Edit Event</h3>

      <input
        value={editingEvent.title || ""}
        onChange={e =>
          setEditingEvent({ ...editingEvent, title: e.target.value })
        }
        placeholder="Title"
      />

      <input
        value={editingEvent.date || ""}
        onChange={e =>
          setEditingEvent({ ...editingEvent, date: e.target.value })
        }
        placeholder="Date"
      />

      <input
        value={editingEvent.posterURL || ""}
        onChange={e =>
          setEditingEvent({ ...editingEvent, posterURL: e.target.value })
        }
        placeholder="Poster URL"
      />

      <textarea
        value={editingEvent.description || ""}
        onChange={e =>
          setEditingEvent({ ...editingEvent, description: e.target.value })
        }
        placeholder="Description"
      />
      <input
      placeholder="Poster Image URL (optional)"
        value={posterURL}
    onChange={e => setPosterURL(e.target.value)}
      />

        <br /><br />

      {/* <input
      type="file"
      accept="image/*"
      onChange={e => setPosterFile(e.target.files[0])}
      /> */}


      <br /><br />

      <button
        onClick={async () => {
          await updateDoc(doc(db, "Events", editingEvent.id), editingEvent);
          setEditingEvent(null);
          loadEvents();
        }}
      >
        Save
      </button>

      <button
        onClick={() => setEditingEvent(null)}
        style={{ marginLeft: 10 }}
      >
        Cancel
      </button>
    </div>
  )}


      {events.map(e => (
    <div key={e.id} style={card}>
      <h3>{String(e.title || "No Title")}</h3>

      <p><b>Event ID:</b> {String(e.eventid || "N/A")}</p>
      <p><b>Date:</b> {String(e.date || "N/A")}</p>
      <p><b>Status:</b> {String(e.status || "pending")}</p>
      <p><b>Description:</b> {String(e.description || "No description")}</p>

      {e.posterURL && (
        <img
          src={e.posterURL}
          alt="poster"
          style={{ width: "100%", maxWidth: 300, marginTop: 10, borderRadius: 6 }}
        />
      )}

      <br /><br />
      <button onClick={() => setEditingEvent(e)} style={{ marginLeft: 10 }}>
        Edit
      </button>
      <button
        onClick={() => deleteEvent(e.id)}
        style={{ marginLeft: 10 }}
      >
        Delete
      </button>
    </div>
  ))}

          </>
        )}
      </div>
    </div>
  );
}

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
  marginBottom: 10
};

const modal = {
  background: "#f1f5f9",
  padding: 20,
  marginTop: 20,
  borderRadius: 10
};  