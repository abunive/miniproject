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


  // const toggleApproval = async (event, action) => {
  //   let newStatus = "pending";

  //   if (action === "approve") newStatus = "approved";
  //   if (action === "unapprove") newStatus = "unapproved";

  //   await updateDoc(doc(db, "Events", event.id), {
  //     status: newStatus
  //   });

  //   loadEvents();
  // };

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
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h3>Faculty Panel</h3>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("events")}>Events</button>
        <button onClick={() => setActiveTab("proofs")}>Proof Requests</button>
        <button onClick={() => setActiveTab("notifications")}>Notifications</button>
        <div style={{ flex: 1 }} />
        <button onClick={logout} style={{ background: "red", color: "#fff" }}>
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: 30 }}>
        {/* {activeTab === "dashboard" && (
          <>
            <h1>Welcome {facultyName}</h1>
            <p>Faculty dashboard</p>
          </>
        )} */}
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
                        {/* <select
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
                        </select> */}

                  <select
  value={u.role || "student"}
  onChange={e =>
    updateDoc(doc(db, "Users", u.id), {
      role: e.target.value
    }).then(loadUsers)
  }
  style={{
    marginLeft: 10,
    padding: "6px 8px",
    borderRadius: 6
  }}
>
  {/* STUDENT */}
  <option
    value="student"
    disabled={currentUserRole === "student"}
  >
    Student
  </option>

  {/* ORGANIZER */}
  <option
    value="organizer"
    disabled={currentUserRole === "student"}
  >
    Organizer
  </option>

  {/* FACULTY */}
  <option
    value="faculty"
    disabled={
      currentUserRole !== "faculty" ||   // not faculty anymore
      u.id === currentUserId              // cannot promote yourself back
    }
  >
    Faculty
  </option>
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
        {activeTab === "events" && <FacultyViewEvents/>}
        {activeTab === "events" && (
          <>
            <h2>Manage Events</h2>

            <button onClick={() => setShowAddEvent(true)}>  ➕ Add Event</button>

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
    <h3>{String(e.title || "No Title")}</h3>

    <p><b>Event ID:</b> {String(e.eventid || "N/A")}</p>

    <p>
      <b>Date:</b> {formatDate(e.date)}
    </p>
    <p>
  <b>Interested Students:</b> {e.interestCount || 0}
</p>

    <p>
      <b>Status:</b>{" "}
      <span style={statusStyle(e.status)}>
        {String(e.status || "pending")}
      </span>
    </p>

    <p>
      <b>Description:</b>{" "}
      {String(e.description || "No description")}
    </p>

    {typeof e.posterURL === "string" && e.posterURL && (
      <img
        src={e.posterURL}
        alt="Event Poster"
        style={{ width: "100%", maxWidth: 320, borderRadius: 8, marginTop: 10 }}
      />
    )}

    <br />

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
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer"
};