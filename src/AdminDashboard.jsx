import { useEffect, useState } from "react";
import { auth, db } from "./firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";

import { storage } from "./firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {createUserWithEmailAndPassword,signOut,signInWithEmailAndPassword} from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { query, orderBy } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./admindas.css";
import '@fortawesome/fontawesome-free/css/all.min.css';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [posterURL, setPosterURL] = useState("");
  const functions = getFunctions();


  const [showAddUser, setShowAddUser] = useState(false);
  const [adminName, setLoggedInName] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const facultyCount = users.filter(u => u.role === "faculty").length;
const studentCount = users.filter(u => u.role === "student").length;
const organizerCount = users.filter(u => u.role === "organizer").length;
const downloadUsersPDF = () => {

  if (!window.confirm("Download Users Report PDF?")) return;

  const doc = new jsPDF();

  doc.text("Users Report", 14, 15);

  const tableData = users.map(u => [
    u.name || "",
    u.username || "",
    u.role || "",
    u.isActive ? "Active" : "Inactive",
    u.canAddEvent ? "Yes" : "No"
  ]);

  autoTable(doc, {
    head: [["Name", "Email", "Role", "Status", "Can Add Event"]],
    body: tableData,
    startY: 25
  });

  doc.save("users-report.pdf");
};
const downloadEventsPDF = () => {

  if (!window.confirm("Download Events Report PDF?")) return;

  const doc = new jsPDF();

  doc.text("Events Report", 14, 15);

  const tableData = events.map(e => [
    e.eventid || "",
    e.title || "",
    e.date
      ? new Date(e.date.seconds * 1000).toLocaleDateString()
      : "",
    e.status || ""
  ]);

  autoTable(doc, {
    head: [["Event ID", "Title", "Date", "Status"]],
    body: tableData,
    startY: 25
  });

  doc.save("events-report.pdf");
};


const [newUser, setNewUser] = useState({
  name: "",
  username: "",
  role: "student",
  isActive: true,
  canAddEvent: false
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


  const [newEvent, setNewEvent] = useState({
    uid: "",
    eventid: "",
    title: "",
    date: "",
    description: "",
    posterURL: "",
    status: "pending"
  });

  const createUser = async () => {
  // Set flag BEFORE any async operations
  setIsCreatingUser(true);
  
  try {
    // Validate inputs first
    if (!newUser.name || !newUser.username || !newUser.password) {
      alert("Please fill all required fields");
      setIsCreatingUser(false);
      return;
    }

    if (newUser.password.length < 6) {
      alert("Password must be at least 6 characters");
      setIsCreatingUser(false);
      return;
    }

    const adminEmail = auth.currentUser.email;
    const adminPassword = prompt("Enter your Admin password to confirm");

    if (!adminPassword) {
      alert("Password required");
      setIsCreatingUser(false);
      return;
    }

    // 1️⃣ Create Auth Account
    const cred = await createUserWithEmailAndPassword(
      auth,
      newUser.username,
      newUser.password
    );

    // 2️⃣ Store Firestore Profile
    await setDoc(doc(db, "Users", cred.user.uid), {
      name: newUser.name,
      username: newUser.username,
      role: newUser.role,
      isActive: newUser.isActive,
      canAddEvent: newUser.canAddEvent,
      createdAt: new Date()
    });

    // 3️⃣ Restore Admin Login
    await signOut(auth);
    
    // Small delay to ensure flag is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    alert("User created successfully");

    // Reset form
    setNewUser({
      name: "",
      username: "",
      password: "",
      role: "student",
      isActive: true,
      canAddEvent: false
    });
    setShowAddUser(false);
    loadUsers();
  } catch (error) {
    console.error("User creation error:", error);
    alert(error.message);
  } finally {
    // Delay before resetting to ensure admin is logged back in
    setTimeout(() => {
      setIsCreatingUser(false);
    }, 500);
  }
};



  // 🔐 ADMIN CHECK
 useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    // ⭐ Skip auth check if we're creating a user
    if (isCreatingUser) return;

    if (!user) {
      alert("Please log in");
      window.location.href = "/";
      return;
    }

    try {
      const snap = await getDoc(doc(db, "Admin", user.uid));

      if (!snap.exists()) {
        alert("Access denied");
        window.location.href = "/";
        return;
      }

      if (snap.data().isActive === false) {
        alert("Admin account is deactivated");
        window.location.href = "/";
        return;
      }

      setLoggedInName(snap.data().name);
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  });

  return () => unsubscribe();
}, [isCreatingUser]); // ⭐ Add isCreatingUser to dependencies

  useEffect(() => {
    loadUsers();
    loadEvents();
  }, []);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "Users"));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // const loadEvents = async () => {
  //   const snap = await getDocs(collection(db, "Events"));
  //   setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  // };
const loadEvents = async () => {
  const q = query(
    collection(db, "Events"),
    orderBy("createdAt", "desc") // 👈 latest first
  );

  const snap = await getDocs(q);
  setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};


  // ---------------- USERS ----------------
  const toggleActive = async user => {
    await updateDoc(doc(db, "Users", user.id), {
      isActive: !user.isActive
    });
    loadUsers();
  };
  const updateUserRole = async (id, newRole) => {
  await updateDoc(doc(db, "Users", id), {
    role: newRole
  });
  loadUsers();
};


  const toggleCanAddEvent = async user => {
    await updateDoc(doc(db, "Users", user.id), {
      canAddEvent: !user.canAddEvent
    });
    loadUsers();
  };

 
  const deleteUser = async (id) => {
  if (!window.confirm("Delete user completely?")) return;
  const deleteUserFunction = httpsCallable(functions, 'deleteUser');
  await deleteUserFunction({ userId: id });
   await deleteDoc(doc(db, "Users", id));
  loadUsers();
};

  // ---------------- EVENTS ----------------
  // const createEvent = async () => {
  //   await addDoc(collection(db, "Events"), newEvent);
  //   setShowAddEvent(false);
  //   loadEvents();
  // };

  const createEvent = async () => {
  let finalPosterURL = posterURL;

  if (posterFile) {
    const imageRef = ref(storage, `eventPosters/${Date.now()}_${posterFile.name}`);
    await uploadBytes(imageRef, posterFile);
    finalPosterURL = await getDownloadURL(imageRef);
  }

  // await addDoc(collection(db, "Events"), {
  //   ...newEvent,
  //   posterURL: finalPosterURL,
  //   createdAt: new Date()
  // });
await addDoc(collection(db, "Events"), {
  ...newEvent,
  date: new Date(newEvent.date), // 👈 convert properly
  posterURL: finalPosterURL,
  createdAt: new Date()
});


  setShowAddEvent(false);
  setNewEvent({ title: "", description: "", status: "pending" });
  setPosterFile(null);
  setPosterURL("");

  loadEvents();
};


  const toggleApproval = async event => {
    await updateDoc(doc(db, "Events", event.id), {
      status: event.status === "approved" ? "pending" : "approved"
    });

    if (event.status !== "approved") {

  const usersSnap = await getDocs(collection(db, "Users"));

  usersSnap.forEach(async (userDoc) => {
    const user = userDoc.data();

    if (user.role === "student") {

      await addDoc(collection(db, "Notifications"), {
        receiverId: userDoc.id,
        receiverRole: "student",
        type: "new_event",
        message: `New event "${event.title}" approved`,
        eventId: event.id,
        seen: false,
        createdAt: Timestamp.now()
      });

    }
  });

}
    loadEvents();
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
  <div className="sidebar-top">
    <h3>Admin Panel</h3>

    <button onClick={() => setActiveTab("dashboard")}><i className="fa-solid fa-house"></i> Dashboard</button>
    <button onClick={() => setActiveTab("users")}> <i class="fa-solid fa-user"></i> Manage Users</button>
    <button onClick={() => setActiveTab("events")}> <i class="fa-solid fa-star"></i> Manage Events</button>
  </div>

  <div className="sidebar-bottom">
    <button className="logout-btn" onClick={handleLogout}>
      <i class="fa-solid fa-sign-out-alt"></i>Logout
    </button>
  </div>
</div>

      {/* CONTENT */}
      <div className="main">
        {activeTab === "dashboard" && (
          <>
           <>
  <h1>Admin Dashboard</h1>
  <h2>Welcome , <b>{adminName}</b></h2>

  <div style={{display:"flex", gap:30, marginTop:20}}>

    <div className="analytics-card">
      <h3> <i className="fa-solid fa-user-graduate"></i> Students</h3>
      <p>{studentCount}</p>
    </div>

    <div className="analytics-card">
      <h3> <i className="fa-solid fa-chalkboard-teacher"></i> Faculty</h3>
      <p>{facultyCount}</p> 
    </div>
    <div className="analytics-card">
      <h3> <i className="fa-solid fa-user-tie"></i> Organizer</h3>
      <p>{organizerCount}</p>
    </div>

    <div className="analytics-card">
      <h3> <i className="fa-solid fa-calendar-days"></i> Total Events</h3>
      <p>{events.length}</p>
    </div>

  </div>

  <div style={{marginTop:30}}>

    <button className="download-btn"
      onClick={downloadUsersPDF}
    >
      📄 Download Users Report
    </button>

    <button
    className="download-btn"
      onClick={downloadEventsPDF}
    >
      📄 Download Events Report
    </button>

  </div>
</>
          </>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <>
            <h2>Manage Users</h2>
            <button onClick={() => setShowAddUser(true)}>
             <i class="fa-solid fa-plus"></i> Add User
              </button>
              {showAddUser && (
            <div style={modal}>
             <div className="add-user-modal">
  <h3>Add User</h3>

  <input
    placeholder="Name"
    value={newUser.name}
    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
  />

  <input
    placeholder="Username / Email"
    value={newUser.username}
    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
  />

  <input
    type="password"
    placeholder="Password"
    value={newUser.password}
    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
  />

  <select
    value={newUser.role}
    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
  >
    <div className="select-options">
      <option value="student">Student</option>
      <option value="faculty">Faculty</option>
      <option value="organizer">Organizer</option>
   </div>
  </select>
</div>

              <br /><br />

             <div className="checkbox-group" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={newUser.isActive}
                  onChange={e =>
                    setNewUser({ ...newUser, isActive: e.target.checked })
                  }
                />
                <span className="checkmark"></span>
                Active
              </label>

              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={newUser.canAddEvent}
                  onChange={e =>
                    setNewUser({ ...newUser, canAddEvent: e.target.checked })
                  }
                />
                <span className="checkmark"></span>
                Can Add Event
              </label>

            </div>
  

              <br /><br />

             <div className="user-modal-buttons">
  <button className="create-btn" onClick={createUser}>
    Create User
  </button>
  <button className="cancel-btn" onClick={() => setShowAddUser(false)}>
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
        {activeTab === "events" && (
          <>
            <h2>Manage Events</h2>
            <button onClick={() => setShowAddEvent(true)}><i class="fa-solid fa-plus"></i> Add Event</button>
            <br /><br /><br />
{showAddEvent && (
  <div className="add-event-modal">
    <h3>Add Event</h3>

    <input
      placeholder="Event ID"
      onChange={e => setNewEvent({ ...newEvent, eventid: e.target.value })}
    />

    {/* <input
      placeholder="Title"
      onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
    /> */}
    <select
  value={newEvent.eventType || ""}
  onChange={e =>
    setNewEvent({ ...newEvent, eventType: e.target.value })
  }
>
  <option value="">Select Event Type</option>
  <option value="Arts">Arts</option>
  <option value="Sports">Sports</option>
  <option value="Workshops">Workshops</option>
</select>

    <input
      type="date"
      onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
    />

    <input
      placeholder="Poster URL"
      onChange={e => setNewEvent({ ...newEvent, posterURL: e.target.value })}
    />

    <textarea
      placeholder="Description"
      onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
    />

    <div style={{ display: "flex", gap: 12, marginTop: 15 }}>
      <div className="user-modal-buttons">
  <button className="create-btn" onClick={createEvent}>
    Create Event
  </button>
  <button className="event-cancel-btn" onClick={() => setShowAddEvent(false)}>
    Cancel
  </button>
</div>
    </div>
  </div>
)}



            {editingEvent && (
  <div style={modal}>
    <h3>Edit Event</h3>
    <input
  className="form-input"
  value={editingEvent.title || ""}
  onChange={e =>
    setEditingEvent({ ...editingEvent, title: e.target.value })
  }
  placeholder="Title"
/>
<br />
<input
  className="form-input"
  type="date"
  value={editingEvent.date || ""}
  onChange={e =>
    setEditingEvent({ ...editingEvent, date: e.target.value })
  }
/>
<br />

<input
  className="form-input"
  value={editingEvent.posterURL || ""}
  onChange={e =>
    setEditingEvent({ ...editingEvent, posterURL: e.target.value })
  }
  placeholder="Poster URL"
/>
<br />

<textarea
  className="form-textarea"
  value={editingEvent.description || ""}
  onChange={e =>
    setEditingEvent({ ...editingEvent, description: e.target.value })
  }
  placeholder="Description"
/>
<br />
<input
  className="form-input"
  value={posterURL}
  onChange={e => setPosterURL(e.target.value)}
  placeholder="Poster Image URL (optional)"
/>

      <br />
      <br />

    <button
  className="save-btn"
  onClick={async () => {
    await updateDoc(doc(db, "Events", editingEvent.id), editingEvent);
    setEditingEvent(null);
    loadEvents();
  }}
>
  Save
</button>

<button
  className="cancel-btn"
  onClick={() => setEditingEvent(null)}
>
  Cancel
</button>
  </div>
)}
<br /> <br />

{events.map(e => (
 <div key={e.id} className="event-card">
    <div style={eventHeader}>
      <h3>{e.title}</h3>
      <span
        style={{
          ...statusBadge,
          background:
            e.status === "approved" ? "#dcfce7" : "#fef3c7",
          color:
            e.status === "approved" ? "#166534" : "#92400e"
        }}
      >
        {e.status}
      </span>
    </div>

    <p><b>Event ID:</b> {e.eventid}</p>

    <p>
      <b>Date:</b>{" "}
      {e.date
        ? new Date(e.date.seconds * 1000).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })
        : "N/A"}
    </p>

    <p style={{ color: "#374151" }}>{e.description}</p>

    {e.posterURL && (
      <img
        src={e.posterURL}
        alt="poster"
        style={eventImage}
      />
    )}

    <div style={actionRow}>
     <div className="button-group">
  <button className="approveBtn" onClick={() => toggleApproval(e)}>
    {e.status === "approved" ? "Unapprove" : "Approve"}
  </button>

  <button className="primaryBtn" onClick={() => setEditingEvent(e)}>
    Edit
  </button>

  <button className="dangerBtn" onClick={() => deleteEvent(e.id)}>
    Delete
  </button>
</div>
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
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14
};

const primaryBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer"
};

const approveBtn = {
  background: "#16a34a",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: 8,
  border: "none"
};

const dangerBtn = {
  background: "#dc2626",
  color: "#fff",
  padding: "8px 14px",
  borderRadius: 8,
  border: "none"
};

const actionRow = {
  display: "flex",
  gap: 12,
  marginTop: 12
};

const eventCard = {
  border: "1px solid #e5e7eb",
  padding: 18,
  borderRadius: 14,
  marginBottom: 20,
  background: "#fff",
  boxShadow: "0 6px 15px rgba(0,0,0,0.05)"
};

const eventHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8
};

const statusBadge = {
  padding: "4px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: "bold",
  textTransform: "capitalize"
};

const eventImage = {
  width: "100%",
  maxWidth: 320,
  borderRadius: 10,
  marginTop: 10
};
const analyticsCard = {
  background: "#f9fafb",
  padding: 20,
  borderRadius: 12,
  width: 160,
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
};
