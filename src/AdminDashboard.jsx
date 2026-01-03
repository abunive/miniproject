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

  const loadEvents = async () => {
    const snap = await getDocs(collection(db, "Events"));
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

  await addDoc(collection(db, "Events"), {
    ...newEvent,
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
    loadEvents();
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
        <button onClick={() => setActiveTab("users")}>Manage Users</button>
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
            <h1>Admin Dashboard</h1>
             <h2>Welcome,<b>{adminName}</b></h2><br />
            <p>Total Users: {users.length}</p>
            <p>Total Events: {events.length}</p>
          </>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <>
            <h2>Manage Users</h2>
            <button onClick={() => setShowAddUser(true)}>
             ➕ Add User
              </button>
              {showAddUser && (
            <div style={modal}>
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
                placeholder="Password"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              />

              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="organizer">Organizer</option>
              </select>

              <br /><br />

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

              <br /><br />

              <button onClick={createUser}>Create User</button>
              <button onClick={() => setShowAddUser(false)}>Cancel</button>
            </div>
          )}


            {["faculty", "organizer", "student"].map(role => (
              <div key={role}>
                <h3>{role.toUpperCase()}</h3>

                {users
                  .filter(u => u.role === role)
                  .map(u => (
                    <div key={u.id} style={card}>
                      <b>{String(u.name || "No Name")}</b>
                      <br />
                      Uid: {String(u.username || "N/A")}
                      <br />
                      Active: {String(u.isActive)}
                      <br />
                      Role:

                      <select
                        value={u.role}
                        onChange={e => updateUserRole(u.id, e.target.value)}
                        style={{ marginLeft: 10 }}
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                      <br />
                      Can Add Event: {String(u.canAddEvent)}
                      <br /><br />

                      <button onClick={() => toggleActive(u)}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => toggleCanAddEvent(u)}
                        style={{ marginLeft: 10 }}
                      >
                        {u.canAddEvent ? "Revoke Event Access" : "Approve Event"}
                      </button>

                      <button
                        onClick={() => deleteUser(u.id)}
                        style={{ marginLeft: 10, background: "red", color: "#fff" }}
                      >
                        Remove
                      </button>
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
            <button onClick={() => setShowAddEvent(true)}>➕ Add Event</button>

            {showAddEvent && (
              <div style={modal}>
                <h3>Add Event</h3>

                <input placeholder="Event ID" onChange={e => setNewEvent({ ...newEvent, eventid: e.target.value })} />
                <input placeholder="Title" onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                <input placeholder="Date (Feb 2-10)" onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                <input placeholder="Poster URL" onChange={e => setNewEvent({ ...newEvent, posterURL: e.target.value })} />
                <textarea placeholder="Description" onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                <input type="file"accept="image/*"onChange={e => setPosterFile(e.target.files[0])}/>
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
{/* 
    <input
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
    <button onClick={() => toggleApproval(e)}>
      {String(e.status) === "approved" ? "Unapprove" : "Approve"}
    </button>
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
