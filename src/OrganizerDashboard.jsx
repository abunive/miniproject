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
import OrganizerDashboardNotifications from "./OrganizerDashboardNotifications";
import OrganizerNotifications from "./OrganizerNotifications";
import "./organizerdas.css";



export default function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [posterURL, setPosterURL] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [organizerName, setLoggedInName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  
    const handleOpenEvent = (eventId) => {
  setActiveTab("events");
  setSelectedEventId(eventId);

  // 🔥 remove highlight after 3 seconds
  setTimeout(() => {
    setSelectedEventId(null);
  }, 3000);
};





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
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("event");

  if (eventId) {
    setActiveTab("events");
    setSelectedEventId(eventId);  setTimeout(() => {
      setSelectedEventId(null);
    }, 3000);// pass to event component

  }
}, []);


  
  // const loadEvents = async () => {
  // const q = query(
  //   collection(db, "Events"),
  //   orderBy("createdAt", "desc") // latest first
  // );
  const loadEvents = async () => {
  try {
    const q = query(collection(db, "Events"), orderBy("createdAt", "desc"));
  //  const q = query(
  // collection(db, "Notifications"),
  // where("receiverId", "==", auth.currentUser.uid),
  // orderBy("createdAt", "desc")
  //  );
    const snap = await getDocs(q);

    const list = [];

    for (const d of snap.docs) {
      const data = { id: d.id, ...d.data() };

      let interestCount = 0;

      try {
        const likeSnap = await getDocs(
          collection(db, "Events", d.id, "Likes")
        );
        interestCount = likeSnap.size;
      } catch (e) {
        console.log("likes skipped");
      }

      list.push({
        ...data,
        interestCount
      });
    }

    setEvents(list);
  } catch (err) {
    console.error(err);
  }
};

//   const snap = await getDocs(q);

//   setEvents(
//     snap.docs.map(d => ({
//       id: d.id,
//       ...d.data()
//     }))
//   );
// };


 

  const createEvent = async () => {
  try {
    let finalPosterURL = newEvent.posterURL || "";

    // Upload image if file selected
    if (posterFile) {
      const imgRef = ref(storage, `eventPosters/${Date.now()}_${posterFile.name}`);
      await uploadBytes(imgRef, posterFile);
      finalPosterURL = await getDownloadURL(imgRef);
    }

   

    const eventRef = await addDoc(collection(db, "Events"), {
  eventid: newEvent.eventid,
  title: newEvent.title,
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
// 🔔 Notify faculty and admin for verification
const usersSnap = await getDocs(collection(db, "Users"));

usersSnap.forEach(async (userDoc) => {
  const user = userDoc.data();

  if (user.role === "faculty" || user.role === "admin") {

    await addDoc(collection(db, "Notifications"), {
      receiverId: userDoc.id,
      receiverRole: user.role,
      type: "event_verification",
      message: `New event "${newEvent.title}" requires approval`,
      eventId: eventRef.id,
      seen: false,
      createdAt: Timestamp.now()
    });

  }
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
    <div className="layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h3>Organizer Panel</h3>
        <button onClick={() => setActiveTab("dashboard")}> <i className="fas fa-home"></i>Dashboard</button>
        <button onClick={() => setActiveTab("events")}> <i className="fas fa-calendar-alt"></i>Manage Events</button>
        <button onClick={() => setActiveTab("notifications")}> <i className="fas fa-bell"></i>Notifications</button>
        <div style={{ flex: 1 }}></div>
        <hr />
        
         <button
    onClick={handleLogout}
   
  >
     <i className="fas fa-sign-out-alt"></i>Logout
  </button>
      </div>
<div className="background" style={{background: ""}}>
      <div 
  className="full-container" 
  
>
      {/* CONTENT */}
       {activeTab === "dashboard" && (
         <>
    <h1>Organizer Dashboard</h1>
    <h2>Welcome, <b>{organizerName}</b></h2>

   
        <OrganizerDashboardNotifications 
  onOpenEvent={handleOpenEvent} 
/>
  </>
       
)}

        
        {/* EVENTS */}
        {activeTab === "events" && (
          <>
            <h2>Manage Events</h2>
<div className="page-container">
            <br />
            <button onClick={() => setShowAddEvent(true)}> <i className="fas fa-plus"></i> Add Event</button>

          

  {/* CREATE EVENT DIVISION */}
  <div
  className="create-event-division"
  style={{
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "18px",
    maxWidth: "520px",
    margin: "20px auto",
    boxShadow: "0 12px 40px rgba(0,0,0,0.1)"
  }}
>

    <h2 className="event-title" style={{color:"black"}}>Create Event</h2>
    <br />

    <div className="form-group">
      <label>Event ID</label>
      <input
        type="text"
        placeholder="Enter event ID"
        value={newEvent.eventid || ""}
        onChange={e => setNewEvent({ ...newEvent, eventid: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Event Type</label>
      <select
        value={newEvent.title || ""}
        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
      >
        <option value="">Select Event Type</option>
        <option value="Arts">Arts</option>
        <option value="Sports">Sports</option>
        <option value="Workshops">Workshops</option>
      </select>
    </div>

    <div className="form-group">
      <label>Date</label>
      <input
        type="date"
        value={newEvent.date || ""}
        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Poster URL</label>
      <input
        type="text"
        placeholder="Paste image URL"
        value={newEvent.posterURL || ""}
        onChange={e => setNewEvent({ ...newEvent, posterURL: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Description</label>
      <textarea
        placeholder="Write event details..."
        value={newEvent.description || ""}
        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
      />
    </div>

    <div className="button-group">
  <button className="btn primary" onClick={createEvent}>
    Create Event
  </button>
  <button className="btn secondary" onClick={() => setShowAddEvent(false)}>
    Cancel
  </button>
</div>

  </div>

</div>
<br />
<br />



            {editingEvent && (
    <div style={modal}>
      <h3>Edit Event</h3>

     <div className="form-container">

  <div className="form-group">
    <label>Title</label>
    <input
      className="input"
      value={editingEvent.title || ""}
      onChange={e =>
        setEditingEvent({ ...editingEvent, title: e.target.value })
      }
      placeholder="Enter event title"
    />
  </div>

  <div className="form-group">
    <label>Date</label>
    <input
      type="date"
      className="input"
      value={
        editingEvent.date?.toDate
          ? editingEvent.date.toDate().toISOString().split("T")[0]
          : editingEvent.date || ""
      }
      onChange={e =>
        setEditingEvent({
          ...editingEvent,
          date: e.target.value
        })
      }
    />
  </div>

  <div className="form-group">
    <label>Poster URL</label>
    <input
      className="input"
      value={editingEvent.posterURL || ""}
      onChange={e =>
        setEditingEvent({ ...editingEvent, posterURL: e.target.value })
      }
      placeholder="Paste image URL"
    />
  </div>

  <div className="form-group">
    <label>Description</label>
    <textarea
      className="textarea"
      value={editingEvent.description || ""}
      onChange={e =>
        setEditingEvent({ ...editingEvent, description: e.target.value })
      }
      placeholder="Write event details..."
    />
  </div>

</div>

        <br /><br />



      <br /><br />

     <div className="button-row">
  <button
    className="save-btn"
    onClick={async () => {
      await updateDoc(doc(db, "Events", editingEvent.id), editingEvent);
      setEditingEvent(null);
      loadEvents();
    }}
  >
    <i fontawesome="fa fa-save"></i> Save
  </button>

  <button
    className="cancel-btn"
    onClick={() => setEditingEvent(null)}
  >
    Cancel
  </button>
</div>
    </div>
  )}
  <br />
  <br />



 {events.map(e => (
  <div
    key={e.id}
    id={e.id} // 🔥 needed for scroll
    style={{
      ...eventCard,
      border: e.id === selectedEventId
        ? "2px solid #2563eb"
        : "1px solid #e5e7eb"
    }}
  >
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
<p>
  <b>Interested Students:</b> {e.interestCount || 0}
</p>
   
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

     {activeTab === "notifications" && <OrganizerNotifications onOpenEvent={handleOpenEvent} />}
      </div>
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


