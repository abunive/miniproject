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
import { Timestamp } from "firebase/firestore";
import { query, orderBy } from "firebase/firestore";





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


  // const loadEvents = async () => {
  //   const snap = await getDocs(collection(db, "Events"));
  //   setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  // };
  const loadEvents = async () => {
  const q = query(
    collection(db, "Events"),
    orderBy("createdAt", "desc") // latest first
  );

  const snap = await getDocs(q);

  setEvents(
    snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))
  );
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
      // date: newEvent.date,
      date: Timestamp.fromDate(new Date(newEvent.date)),

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

          <input
  style={inputStyle}
  placeholder="Event ID"
  onChange={e => setNewEvent({ ...newEvent, eventid: e.target.value })}
/>

<select
  style={selectStyle}
  value={newEvent.title}
  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
>
  <option value="">Select Event Type</option>
  <option value="Arts">Arts</option>
  <option value="Sports">Sports</option>
  <option value="Workshops">Workshops</option>
</select>

<input
  type="date"
  style={inputStyle}
  value={newEvent.date}
  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
/>

<input
  style={inputStyle}
  placeholder="Poster URL"
  onChange={e => setNewEvent({ ...newEvent, posterURL: e.target.value })}
/>

<textarea
  style={textareaStyle}
  placeholder="Description"
  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
/>

<button style={primaryBtn} onClick={createEvent}>Create Event</button>
<button style={secondaryBtn} onClick={() => setShowAddEvent(false)}>Cancel</button>




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

{/* 
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
  ))} */}

  {events.map(e => (
  <div key={e.id} style={eventCard}>
    <div style={eventHeader}>
      <h3 style={{ margin: 0 }}>{e.title}</h3>
      <span style={{
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: "bold",
        background:
          e.status === "approved" ? "#dcfce7" :
          e.status === "pending" ? "#fef3c7" : "#fee2e2",
        color:
          e.status === "approved" ? "#166534" :
          e.status === "pending" ? "#92400e" : "#991b1b"
      }}>
        {e.status}
      </span>
    </div>

    <p><b>Event ID:</b> {e.eventid}</p>

    <p>
      <b>Date:</b>{" "}
      {e.date?.toDate
        ? e.date.toDate().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })
        : "N/A"}
    </p>

    <p style={{ color: "#374151" }}>{e.description}</p>

    {/* {e.posterURL && (
      <img
        src={e.posterURL}
        alt="poster"
        style={{
          width: "100%",
          maxWidth: 320,
          borderRadius: 10,
          marginTop: 10
        }}
      />
    )} */}
    {e.posterURL && (
  <div style={imageWrapper}>
    <span style={{
      ...statusBadge,
      background:
        e.status === "approved" ? "#16a34a" :
        e.status === "pending" ? "#f59e0b" : "#dc2626"
    }}>
      {e.status.toUpperCase()}
    </span>

    <img
      src={e.posterURL}
      alt="poster"
      style={eventImage}
    />
  </div>
)}



    <div style={{ marginTop: 12 }}>
<div style={actionRow}>
  <button style={primaryBtn} onClick={() => setEditingEvent(e)}>
    Edit
  </button>

  <button style={dangerBtn} onClick={() => deleteEvent(e.id)}>
    Delete
  </button>
</div>

      
      {/* <button onClick={() => setEditingEvent(e)}>Edit</button>
      <button
        onClick={() => deleteEvent(e.id)}
        style={{ marginLeft: 10, background: "#dc2626", color: "#fff" }}
      >
        Delete
      </button> */}
    </div>
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
const eventCard = {
  border: "1px solid #e5e7eb",
  padding: 16,
  borderRadius: 14,
  marginBottom: 16,
  background: "#fff",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
};

const eventHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10
};
const imageWrapper = {
  position: "relative",
  marginTop: 12,
  width: "100%",
  maxWidth: 340
};

const eventImage = {
  width: "100%",
  borderRadius: 12,
  objectFit: "cover"
};

const statusBadge = {
  position: "absolute",
  top: 10,
  right: 10,
  padding: "6px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: "bold",
  color: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
};
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: 14,
  marginBottom: 12
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 80,
  resize: "vertical"
};

const selectStyle = {
  ...inputStyle,
  background: "#fff"
};

const primaryBtn = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer"
};

const secondaryBtn = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#f8fafc",
  fontWeight: "600",
  cursor: "pointer",
  marginLeft: 10
};

const dangerBtn = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#dc2626",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer"
};
const actionRow = {
  display: "flex",
  gap: 12,
  marginTop: 12
};
