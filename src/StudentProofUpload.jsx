import { useEffect, useState } from "react";
import { auth, db } from "./firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function StudentProofUpload() {
  const [user, setUser] = useState(null);
  const [myProofs, setMyProofs] = useState([]);
  const [proofURL, setProofURL] = useState("");
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    category: "",
    otherEvent: "",
    date: "",
    purpose: "activity",
    description: ""
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const loadProofs = async uid => {
    const q = query(
      collection(db, "ProofRequests"),
      where("studentId", "==", uid)
    );
    const snap = await getDocs(q);
    setMyProofs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (user) loadProofs(user.uid);
  }, [user]);

  const submitProof = async () => {
    if (!proofURL || !form.category) {
      alert("Fill all required fields");
      return;
    }

    const data = {
      studentId: user.uid,
      studentName: user.email,
      category: form.category,
      otherEventName: form.otherEvent,
      eventDate: form.date,
      purpose: form.purpose,
      description: form.description,
      proofURL,
      status: "pending",
      rejectReason: "",
      activityPoints: 0,
      createdAt: new Date()
    };

    if (editId) {
      await updateDoc(doc(db, "ProofRequests", editId), data);
      setEditId(null);
    } else {
      await addDoc(collection(db, "ProofRequests"), data);
    }

    setProofURL("");
    setForm({
      category: "",
      otherEvent: "",
      date: "",
      purpose: "activity",
      description: ""
    });

    loadProofs(user.uid);
  };

  const handleEdit = p => {
    setEditId(p.id);
    setForm({
      category: p.category,
      otherEvent: p.otherEventName,
      date: p.eventDate,
      purpose: p.purpose,
      description: p.description
    });
    setProofURL(p.proofURL);
  };

  const handleDelete = async id => {
    if (window.confirm("Delete this proof?")) {
      await deleteDoc(doc(db, "ProofRequests", id));
      loadProofs(user.uid);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #ccc"
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>
        Upload Activity Proof
      </h2>

      <input
        style={inputStyle}
        placeholder="Proof URL"
        value={proofURL}
        onChange={e => setProofURL(e.target.value)}
      />

      <select
        style={inputStyle}
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
      >
        <option value="">Select Event</option>
        <option>Workshop</option>
        <option>Arts</option>
        <option>Sports</option>
        <option>Internship</option>
        <option>Other</option>
      </select>

      {form.category === "Other" && (
        <input
          style={inputStyle}
          placeholder="Other Event Name"
          value={form.otherEvent}
          onChange={e => setForm({ ...form, otherEvent: e.target.value })}
        />
      )}

      <input
        style={inputStyle}
        type="date"
        value={form.date}
        onChange={e => setForm({ ...form, date: e.target.value })}
      />

      <select
        style={inputStyle}
        value={form.purpose}
        onChange={e => setForm({ ...form, purpose: e.target.value })}
      >
        <option value="activity">Activity Proof</option>
        <option value="duty">Duty Leave</option>
        <option value="both">Activity + Duty Leave</option>
      </select>

      <textarea
        style={{ ...inputStyle, height: 80 }}
        placeholder="Description"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />

      <button
        style={{
          width: "100%",
          padding: 12,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: 10
        }}
        onClick={submitProof}
      >
        {editId ? "Update Proof" : "Submit Proof"}
      </button>

      <hr style={{ margin: "30px 0" }} />

      <h3>My Proofs</h3>

      {myProofs.map(p => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            borderRadius: 8,
            marginBottom: 15,
            background: "#f9fafb"
          }}
        >
          <p>
            <b>{p.category}</b> | Purpose: <b>{p.purpose}</b>
          </p>

          <p>{p.description}</p>
          <p>Status: <b>{p.status}</b></p>

          {p.proofURL && (
            <img
              src={p.proofURL}
              alt="Proof"
              width="220"
              style={{ marginTop: 8, borderRadius: 6 }}
              onError={e => (e.target.style.display = "none")}
            />
          )}

          <br />
          <a href={p.proofURL} target="_blank" rel="noreferrer">
            View Proof
          </a>

          {p.status === "pending" && (
            <div style={{ marginTop: 10 }}>
              <button style={{ marginRight: 10 }} onClick={() => handleEdit(p)}>
                Edit
              </button>
              <button onClick={() => handleDelete(p.id)}>Delete</button>
            </div>
          )}

          {p.rejectReason && (
            <p style={{ color: "red" }}>Reason: {p.rejectReason}</p>
          )}
        </div>
      ))}
    </div>
  );
}
