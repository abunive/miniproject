import { useEffect, useState } from "react";
import { auth, db, storage } from "./firebase/firebase";
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
import {
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import FacultyProofReview from "./FacultyProofReview";
import FacultyNotifications from "./FacultyNotifications";
import FacultyDashboardNotifications from "./FacultyDashboardNotifications";
import FacultyViewEvents from "./FacultyViewEvents";
import { Timestamp } from "firebase/firestore";
import useConfirmBackNavigation from "./useConfirmBackNavigation";
import "./facultydas.css";

export default function FacultyDashboard() {
   useConfirmBackNavigation(
    "Do you really want to go back from Faculty Dashboard?"
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [facultyName, setFacultyName] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const functions = getFunctions();
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedProofId, setSelectedProofId] = useState(null);
  useEffect(() => {

  const params = new URLSearchParams(window.location.search);
  const proofId = params.get("proof");

  if (proofId) {
    setActiveTab("proofs");
    setSelectedProofId(proofId);
  }

}, []);

  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "student",
    isActive: true,
    canAddEvent: false
  });

  const [newEvent, setNewEvent] = useState({
    eventid: "",
    title: "",
    date: "",
    description: "",
    posterURL: "",
    status: "pending"
  });

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async user => {
      if (isCreatingUser) return;
      if (!user) return (window.location.href = "/");

      const snap = await getDoc(doc(db, "Users", user.uid));
      if (!snap.exists() || snap.data().isActive === false) {
        alert("Access denied");
        window.location.href = "/";
      }
      setFacultyName(snap.data().name);
    });

const getAllowedRoles = (role) => {
  if (role === "faculty") return ["student", "organizer", "faculty"];
  if (role === "student") return ["organizer"];
  if (role === "organizer") return ["student"];
  return [];
};



    return () => unsub();
  }, [isCreatingUser]);

  // useEffect(() => {
  //   loadUsers();
  //   loadEvents();
  // }, []);
  
  
  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "Users"));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };


    
    const loadEvents = async () => {
      const snap = await getDocs(collection(db, "Events"));
      
      const getTime = (t) => {
        if (!t) return 0;
        if (t.seconds) return t.seconds * 1000; // Firestore Timestamp
        if (t instanceof Date) return t.getTime(); // JS Date
        return 0;
      };
      
      const eventList = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
      
      console.log("Loaded events:", eventList.length);
      setEvents(eventList);
    };
    
  //   useEffect(() => {
  //   const unsub = auth.onAuthStateChanged(user => {
  //     if (user) {
  //       loadUsers();
  //       loadEvents();
  //     }
  //   });
  
  //   return () => unsub();
  // }, []);
useEffect(() => {
  const unsub = auth.onAuthStateChanged(async user => {
    if (isCreatingUser) return;

    if (!user) {
      window.location.href = "/";
      return;
    }

    const snap = await getDoc(doc(db, "Users", user.uid));

    if (!snap.exists() || snap.data().isActive === false) {
      alert("Access denied");
      window.location.href = "/";
      return;
    }

    setFacultyName(snap.data().name);

    // ✅ LOAD DATA HERE (ONCE)
    loadUsers();
    loadEvents();
  });

  return () => unsub();
}, [isCreatingUser]);



  /* ---------------- USERS ---------------- */
const createUser = async () => {
  setIsCreatingUser(true);

  try {
    const facultyEmail = auth.currentUser.email;
    const facultyPassword = prompt("Confirm your password");

    const cred = await createUserWithEmailAndPassword(
      auth,
      newUser.username,
      newUser.password
    );

    await setDoc(doc(db, "Users", cred.user.uid), {
      ...newUser,
      createdAt: new Date()
    });

    // 🔥 ADD DELAY (IMPORTANT)
    await signOut(auth);
    await new Promise(res => setTimeout(res, 300));

    await signInWithEmailAndPassword(auth, facultyEmail, facultyPassword);

    alert("User created");
    setShowAddUser(false);
    loadUsers();

  } catch (e) {
    console.error(e);
    alert(e.message);
  } finally {
    setTimeout(() => setIsCreatingUser(false), 500);
  }
};

  const deleteUser = async id => {
    if (!window.confirm("Delete user?")) return;
    const fn = httpsCallable(functions, "deleteUser");
    await fn({ userId: id });
    await deleteDoc(doc(db, "Users", id));
    loadUsers();
  };

  /* ---------------- EVENTS ---------------- */


const createEvent = async () => {
  if (!newEvent.eventid || !newEvent.title || !newEvent.date) {
    alert("Event ID, Title and Date are required");
    return;
  }

  let posterURL = newEvent.posterURL || "";

  if (posterFile) {
    const imgRef = ref(storage, `eventPosters/${Date.now()}`);
    await uploadBytes(imgRef, posterFile);
    posterURL = await getDownloadURL(imgRef);
  }

  await addDoc(collection(db, "Events"), {
    ...newEvent,
    posterURL,
    createdAt: Timestamp.now(), // 🔥 FIX
    status: "pending"
  });

  setShowAddEvent(false);
  setPosterFile(null);
  setNewEvent({
    eventid: "",
    title: "",
    date: "",
    description: "",
    posterURL: "",
    status: "pending"
  });

  loadEvents(); // 🔥 reload from Firestore
};


  

  const toggleApproval = async (event, action) => {
  let newStatus = "pending";
  let message = "";

  if (action === "approve") {
    newStatus = "approved";
    message = `Your event "${event.title}" was approved`;
  }

  if (action === "unapprove") {
    newStatus = "unapproved";
    message = `Your event "${event.title}" was unapproved`;
  }

  // ✅ Update event status
  await updateDoc(doc(db, "Events", event.id), {
    status: newStatus
  });

  // ❗ FIX: CHECK BEFORE USING
  if (!event.createdBy) {
    console.error("❌ createdBy missing for event:", event.id);
    alert("This event has no organizer (old data). Notification skipped.");
    return;
  }

  // 🔔 Send notification safely
  await addDoc(collection(db, "Notifications"), {
    receiverId: event.createdBy,
    receiverRole: "organizer",
    type: "event_status",
    message: message,
    eventId: event.id,
    title: event.title,
    description: event.description,
    seen: false,
    createdAt: Timestamp.now()
  });

  loadEvents();
};
  const deleteEvent = async id => {
    if (!window.confirm("Delete event?")) return;
    await deleteDoc(doc(db, "Events", id));
    loadEvents();
  };

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  const statusStyle = status => ({
    color:
      status === "approved"
        ? "#16a34a" // green
        : status === "unapproved"
        ? "#dc2626" // red
        : "#2563eb", // pending → blue
    fontWeight: "bold",
    textTransform: "capitalize"
  });

  const formatDate = (date) => {
  if (!date) return "N/A";
  if (date.toDate) return date.toDate().toLocaleDateString("en-IN");
  if (typeof date === "string") return date;
  return "N/A";
};

  /* ---------------- UI ---------------- */
  return (
    <div  style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div className="sidebar">
        <h3>Faculty Panel</h3>
        <button onClick={() => setActiveTab("dashboard")}> <i className="fas fa-home"></i>Dashboard</button>
        <button onClick={() => setActiveTab("users")}> <i className="fas fa-users"></i>Users</button>
        <button onClick={() => setActiveTab("events")}> <i className="fas fa-calendar-alt"></i>Events</button>
        <button onClick={() => setActiveTab("proofs")}> <i className="fas fa-file-alt"></i>Proof Requests</button>
        <button onClick={() => setActiveTab("notifications")}> <i className="fas fa-bell"></i>Notifications</button>
        <div style={{ flex: 1 }} />
        <hr />
        <button onClick={logout}
        >
         <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="full-container">
      
{activeTab === "dashboard" && (
  <>
    <h1>Welcome {facultyName}</h1>
    <p>Faculty dashboard</p>

    {/* 🔔 NEW PROOF UPLOAD NOTIFICATIONS */}
    <FacultyDashboardNotifications />
  </>
)}


         {/* USERS */}
        {activeTab === "users" && (
          <>
                <h2>Manage Users</h2>

<button
  className="add-user-btn"
  onClick={() => setShowAddUser(!showAddUser)}
>
  <i className="fa-solid fa-plus"></i>
  {showAddUser ? " Close" : " Add User"}
</button>

{/* ✅ INLINE FORM (NOT MODAL) */}
{showAddUser && (
  <div className="add-user-container">
    <h3>Add New User</h3>

    <div className="form-grid">
      <input
        placeholder="Name"
        value={newUser.name}
        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
      />
      <br />

      <input
        placeholder="Email"
        value={newUser.username}
        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={newUser.password}
        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
      />
      <br />

      <select
        value={newUser.role}
        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
      >
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
        <option value="organizer">Organizer</option>
      </select>
    </div>

    <div className="checkbox-row">
      <label>
        <input
          type="checkbox"
          checked={newUser.isActive}
          onChange={e =>
            setNewUser({ ...newUser, isActive: e.target.checked })
          }
        />
        Active
      </label>
      <br />
      <br />

      <label>
        <input
          type="checkbox"
          checked={newUser.canAddEvent}
          onChange={e =>
            setNewUser({ ...newUser, canAddEvent: e.target.checked })
          }
        />
        Can Add Event
      </label>
    </div>

    <div className="form-actions">
      <button className="create-btn" onClick={createUser}>
        Create User
      </button>
          <br />

      <button
        className="cancel-btn"
        onClick={() => setShowAddUser(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}


            {["faculty", "organizer", "student"].map(role => (
              <div key={role}>
               <h3 style={{ color: "#ffffff", marginBottom: "10px", textTransform: "uppercase" }}>
      {role}
    </h3>
                                  {users
                  .filter(u => u.role === role)
                  .map(u => (
                    <div key={u.id} className="user-card">
                      <b>{u.name || "No Name"}</b>

                      <div className="row">
                        <span>Uid: {u.username || "N/A"}</span>
                      
                      </div>
                      <div className="row">
                      
                        <span>Active: {u.isActive ? "Yes" : "No"}</span>
                      </div>

                      <div className="row">
                        <span>Role:</span>
                        <select
                          value={u.role}
                          onChange={e => updateUserRole(u.id, e.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div className="row">
                        <span>Can Add Event: {u.canAddEvent ? "Yes" : "No"}</span>
                      </div>

                      <div className="row">
                        <button
                          className={u.isActive ? "deactivate" : "activate"}
                          onClick={() => toggleActive(u)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          className="event-toggle"
                          onClick={() => toggleCanAddEvent(u)}
                        >
                          {u.canAddEvent ? "Revoke Event Access" : "Approve Event"}
                        </button>

                        <button
                          className="deactivate"
                          onClick={() => deleteUser(u.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                ))}
              
              </div>
            ))}
          </>
        )}
        

        {/* EVENTS */}
        {activeTab === "events" && <FacultyViewEvents/>}
        {activeTab === "events" && (
          <>
            <h2>Manage Events</h2>

            <button onClick={() => setShowAddEvent(true)}>  <i class="fa-solid fa-plus"></i> Add Event</button>

            {showAddEvent && (
              <div style={{ background: "#ffffff", padding: 24, marginTop: 20, borderRadius: 14, maxWidth: 420, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}>
                <h3> + Add  Event</h3>
                <div className="event-form">

  <div className="form-group">
    <label>Event ID</label>
    <input
      placeholder="Enter Event ID"
      value={newEvent.eventid}
      onChange={e =>
        setNewEvent({ ...newEvent, eventid: e.target.value })
      }
    />
  </div>

  <div className="form-group">
    <label>Event Title</label>
    <input
      placeholder="Enter Event Title"
      value={newEvent.title}
      onChange={e =>
        setNewEvent({ ...newEvent, title: e.target.value })
      }
    />
  </div>

  <div className="form-group">
    <label>Date</label>
    <input
      type="date"
      value={newEvent.date}
      onChange={e =>
        setNewEvent({ ...newEvent, date: e.target.value })
      }
    />
  </div>

  <div className="form-group">
    <label>Description</label>
    <textarea
      placeholder="Enter event description..."
      value={newEvent.description}
      onChange={e =>
        setNewEvent({ ...newEvent, description: e.target.value })
      }
    />
  </div>

  <div className="form-group">
    <label>Poster URL</label>
    <input
      placeholder="Paste image link"
      value={newEvent.posterURL}
      onChange={e =>
        setNewEvent({ ...newEvent, posterURL: e.target.value })
      }
    />
  </div>

</div>


   <div style={{ display: "flex", gap: "12px", marginTop: 12 }}>
  <button onClick={createEvent} style={primaryBtn}>
    Create Event
  </button>

  <button 
    onClick={() => {
      setShowAddEvent(false);
      setNewEvent({
        eventid: "",
        title: "",
        date: "",
        description: "",
        posterURL: "",
        status: "pending"
      });
    }}
    style={{ 
      ...dangerBtn, 
      background: "#f97316", 
      padding: "10px 18px", 
      borderRadius: 8, 
      fontWeight: "bold", 
      cursor: "pointer"
    }}
  >
    Cancel
  </button>
</div>






              </div>
          
            )}
            <br />
            <br />

            {editingEvent && (
  
  <div className="edit-event-box">
    <br />
    <h3>Edit Event</h3>


    <div className="edit-event-form">

  <div className="form-group">
    <label>Event Title</label>
    <input
      type="text"
      value={editingEvent.title || ""}
      onChange={e =>
        setEditingEvent({ ...editingEvent, title: e.target.value })
      }
      placeholder="Enter event title"
    />
  </div>

  <div className="form-group">
    <label>Event Date</label>
    <input
      type="date"
      value={editingEvent.date || ""}
      onChange={e =>
        setEditingEvent({ ...editingEvent, date: e.target.value })
      }
    />
  </div>

  <div className="form-group">
    <label>Description</label>
    <textarea
      value={editingEvent.description || ""}
      onChange={e =>
        setEditingEvent({
          ...editingEvent,
          description: e.target.value
        })
      }
      placeholder="Write event details..."
    />
  </div>

  <div className="form-group">
    <label>Poster URL</label>
    <input
      type="text"
      value={editingEvent.posterURL || ""}
      onChange={e =>
        setEditingEvent({
          ...editingEvent,
          posterURL: e.target.value
        })
      }
      placeholder="Paste image link"
    />
  </div>

</div>

    <div className="event-actions">
      <button
        className="btn-primary"
        onClick={async () => {
          await updateDoc(
            doc(db, "Events", editingEvent.id),
            editingEvent
          );
          setEditingEvent(null);
          loadEvents();
        }}
      >
        <i className="fas fa-save"></i> Save
      </button>

      <button
        className="btn-cancel"
        onClick={() => setEditingEvent(null)}
      >
        <i className="fas fa-times"></i> Cancel
      </button>
    </div>
  </div>
)}

            {/* EVENTS LIST */}
        <div className="events-grid">
  {events.map(e => (
    <div key={e.id} className="event-card">

      {/* HEADER */}
      <div className="event-header">
        <h3>{e.title || "No Title"}</h3>
        <span className={`status ${e.status}`}>
          {e.status || "pending"}
        </span>
      </div>

      {/* BODY */}
      <div className="event-body">
        <p><strong>ID:</strong> {e.eventid || "N/A"}</p>
        <p><strong>Date:</strong> {formatDate(e.date)}</p>
        <p><strong>Interested:</strong> {e.interestCount || 0}</p>
        <p> <strong>Description:</strong> {e.description || "No description"} </p>
      </div>

      {/* DESCRIPTION */}
      <p className="event-desc">
      
      </p>

      {/* IMAGE */}
      {e.posterURL && (
        <img src={e.posterURL} alt="poster" />
      )}

      {/* ACTIONS */}
      <div className="event-actions">

        {e.status !== "approved" && (
          <button
            className="btn-approve"
            onClick={() => toggleApproval(e, "approve")}
          >
            <i className="fas fa-check"></i> Approve
          </button>
        )}

        {e.status !== "unapproved" && (
          <button
            className="btn-unapprove"
            onClick={() => toggleApproval(e, "unapprove")}
          >
            <i className="fas fa-times"></i> Unapprove
          </button>
        )}
         {/* ✏️ EDIT BUTTON */}
  <button
    className="btn-edit"
    onClick={() => setEditingEvent(e)}
  >
    <i className="fas fa-edit"></i> Edit
  </button>

        <button
          className="btn-delete"
          onClick={() => deleteEvent(e.id)}
        >
          <i className="fas fa-trash"></i> Delete
        </button>
      </div>

    </div>
  ))}
</div>

          </>
        )}

        {/* PROOF REQUESTS */}
        {/* {activeTab === "proofs" && <FacultyProofReview />} */}
        {activeTab === "proofs" && (
  <FacultyProofReview selectedProofId={selectedProofId} />
)}
        {activeTab === "notifications" && <FacultyNotifications />}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
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

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #ccc"
};

const primaryBtn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: 6,
  cursor: "pointer"
};

const dangerBtn = {
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer"
};
const modal = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};