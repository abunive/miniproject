
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

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [facultyName, setFacultyName] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const functions = getFunctions();

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

    return () => unsub();
  }, [isCreatingUser]);

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

      await signOut(auth);
      await signInWithEmailAndPassword(auth, facultyEmail, facultyPassword);

      alert("User created");
      setShowAddUser(false);
      loadUsers();
    } catch (e) {
      alert(e.message);
    } finally {
      setIsCreatingUser(false);
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
    let posterURL = newEvent.posterURL;

    if (posterFile) {
      const imgRef = ref(storage, `eventPosters/${Date.now()}`);
      await uploadBytes(imgRef, posterFile);
      posterURL = await getDownloadURL(imgRef);
    }

    await addDoc(collection(db, "Events"), {
      ...newEvent,
      posterURL,
      createdAt: new Date()
    });

    setShowAddEvent(false);
    setNewEvent({
      eventid: "",
      title: "",
      date: "",
      description: "",
      posterURL: "",
      status: "pending"
    });
    loadEvents();
  };

  const toggleApproval = async e => {
    await updateDoc(doc(db, "Events", e.id), {
      status: e.status === "approved" ? "pending" : "approved"
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

  /* ---------------- UI ---------------- */
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h3>Faculty Panel</h3>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("events")}>Events</button>
        <button onClick={() => setActiveTab("proofs")}>Proof Requests</button>
        <div style={{ flex: 1 }} />
        <button onClick={logout} style={{ background: "red", color: "#fff" }}>
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: 30 }}>
        {activeTab === "dashboard" && (
          <>
            <h1>Welcome {facultyName}</h1>
            <p>Faculty dashboard</p>
          </>
        )}
         


         {activeTab === "users" && (
  <>
    <h2>Manage Users</h2>

    {["faculty", "organizer", "student"].map(role => (
      <div key={role}>
        <h3>{role.toUpperCase()}</h3>

        {users
          .filter(u => (u.role || "student") === role)
          .map(u => (
            <div key={u.id} style={card}>
              <b>{String(u.name || "No Name")}</b>
              <br />
              Email: {String(u.username || "N/A")}
              <br />
              Active: {String(u.isActive)}
              <br />
              Role:
              <select
                value={u.role || "student"}
                onChange={e =>
                  updateDoc(doc(db, "Users", u.id), {
                    role: e.target.value
                  }).then(loadUsers)
                }
                style={{ marginLeft: 10 }}
              >
                <option value="student">Student</option>
                <option value="organizer">Organizer</option>
                <option value="faculty">Faculty</option>
              </select>

              <br /><br />

              <button
                onClick={() =>
                  updateDoc(doc(db, "Users", u.id), {
                    isActive: !u.isActive
                  }).then(loadUsers)
                }
              >
                {u.isActive ? "Deactivate" : "Activate"}
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

    {activeTab === "events" && (
  <>
    <h2>Manage Events</h2>

    <button onClick={() => setShowAddEvent(true)}>➕ Add Event</button>

    {showAddEvent && (
      <div style={modal}>
        <h3>Add Event</h3>

        <input placeholder="Event ID"
          onChange={e => setNewEvent({ ...newEvent, eventid: e.target.value })}
        />
        <input placeholder="Title"
          onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        <input placeholder="Date"
          onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
        />
        <textarea placeholder="Description"
          onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
        />

        <button onClick={createEvent}>Create</button>
        <button onClick={() => setShowAddEvent(false)}>Cancel</button>
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
            style={{
              width: "100%",
              maxWidth: 300,
              marginTop: 10,
              borderRadius: 6
            }}
          />
        )}

        <br /><br />

        <button onClick={() => toggleApproval(e)}>
          {e.status === "approved" ? "Unapprove" : "Approve"}
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


      

        {activeTab === "proofs" && <FacultyProofReview />}
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

const modal = {
  background: "#f1f5f9",
  padding: 20,
  marginTop: 20,
  borderRadius: 10
};
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: 20,
  marginTop: 20
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
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer"
};

const badge = value => ({
  display: "inline-block",
  padding: "4px 10px", 
  borderRadius: 20,
  fontSize: 12,
  marginBottom: 6,
  background:
    value === "approved"
      ? "#dcfce7"
      : value === "pending"
      ? "#fef9c3"
      : "#e0e7ff",
  color: "#111"
});
