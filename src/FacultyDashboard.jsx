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

const getAllowedRoles = (currentRole) => {
  if (currentRole === "admin")
    return ["student", "organizer", "faculty", "admin"];

  if (currentRole === "faculty")
    return ["student", "organizer", "faculty"];

  if (currentRole === "organizer")
    return ["student", "organizer"];

  return [];
};

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

  // const loadEvents = async () => {
  //   const snap = await getDocs(collection(db, "Events"));

  //   const eventList = snap.docs
  //     .map(d => ({ id: d.id, ...d.data() }))
  //     .sort((a, b) => {
  //       const aTime = a.createdAt?.seconds || 0;
  //       const bTime = b.createdAt?.seconds || 0;
  //       return bTime - aTime; // newest first
  //     });

  //   setEvents(eventList);
  // };
const loadEvents = async () => {
  const snap = await getDocs(collection(db, "Events"));

  const eventList = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      // Make sure we get the timestamp correctly
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime; // newest first
    });

  setEvents(eventList);
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

  const docRef = await addDoc(collection(db, "Events"), {
    ...newEvent,
    posterURL,
    createdAt: new Date()
  });

  const newEventData = { id: docRef.id, ...newEvent, posterURL, createdAt: new Date() };

  // Prepend new event to top of state
  setEvents(prev => [newEventData, ...prev]);

  setShowAddEvent(false);
  setNewEvent({
    eventid: "",
    title: "",
    date: "",
    description: "",
    posterURL: "",
    status: "pending"
  });
};

  // const createEvent = async () => {
  //   let posterURL = newEvent.posterURL;

  //   if (posterFile) {
  //     const imgRef = ref(storage, `eventPosters/${Date.now()}`);
  //     await uploadBytes(imgRef, posterFile);
  //     posterURL = await getDownloadURL(imgRef);
  //   }

  //   await addDoc(collection(db, "Events"), {
  //     ...newEvent,
  //     posterURL,
  //     createdAt: new Date()
  //   });

  //   setShowAddEvent(false);
  //   setNewEvent({
  //     eventid: "",
  //     title: "",
  //     date: "",
  //     description: "",
  //     posterURL: "",
  //     status: "pending"
  //   });
  //   loadEvents();
  // };

  const toggleApproval = async (event, action) => {
    let newStatus = "pending";

    if (action === "approve") newStatus = "approved";
    if (action === "unapprove") newStatus = "unapproved";

    await updateDoc(doc(db, "Events", event.id), {
      status: newStatus
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

        {/* USERS */}
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

        {/* EVENTS */}
        {activeTab === "events" && (
          <>
            <h2>Manage Events</h2>

            <button onClick={() => setShowAddEvent(true)}> Add Event</button>

            {showAddEvent && (
              <div style={{ background: "#ffffff", padding: 24, marginTop: 20, borderRadius: 14, maxWidth: 420, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}>
                <h3> + Add  Event</h3>

                <input
                  placeholder="Event ID"
                  value={newEvent.eventid}
                  onChange={e =>
                    setNewEvent({ ...newEvent, eventid: e.target.value })
                  }
                  style={input}
                />

                <input
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={e =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  style={input}
                />

                <input
                  type="date"
                  value={newEvent.date}
                  onChange={e =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  style={input}
                />

                <textarea
                  placeholder="Event Description"
                  value={newEvent.description}
                  onChange={e =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  style={{ ...input, height: 90 }}
                />

                <input
                  placeholder="Poster Image URL"
                  value={newEvent.posterURL}
                  onChange={e =>
                    setNewEvent({ ...newEvent, posterURL: e.target.value })
                  }
                  style={input}
                />

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

            {/* EVENTS LIST */}
            {events.map(e => (
              <div key={e.id} style={card}>
                <h3>{e.title || "No Title"}</h3>

                <p><b>Event ID:</b> {e.eventid || "N/A"}</p>
                <p><b>Date:</b> {e.date || "N/A"}</p>

                <p>
                  <b>Status:</b>{" "}
                  <span style={statusStyle(e.status)}>
                    {e.status || "pending"}
                  </span>
                </p>

                <p><b>Description:</b> {e.description || "No description"}</p>

                {e.posterURL ? (
                  <img
                    src={e.posterURL}
                    alt="Event Poster"
                    style={{ width: "100%", maxWidth: 320, borderRadius: 8, marginTop: 10 }}
                  />
                ) : (
                  <p style={{ fontStyle: "italic" }}>No image uploaded</p>
                )}

                <br />

                {/* APPROVE / UNAPPROVE BUTTONS */}
                {e.status !== "approved" && (
                  <button
                    onClick={() => toggleApproval(e, "approve")}
                    style={primaryBtn}
                  >
                    Approve
                  </button>
                )}

                {e.status !== "unapproved" && (
                  <button
                    onClick={() => toggleApproval(e, "unapprove")}
                    style={{ ...dangerBtn, marginLeft: 10 }}
                  >
                    Unapprove
                  </button>
                )}

                <button
                  onClick={() => deleteEvent(e.id)}
                  style={{ ...dangerBtn, marginLeft: 10 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </>
        )}

        {/* PROOF REQUESTS */}
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
