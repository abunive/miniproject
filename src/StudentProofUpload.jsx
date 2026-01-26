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

  return (
    <div>
      <h2>Upload Activity Proof</h2>

      <input
        placeholder="Proof URL"
        value={proofURL}
        onChange={e => setProofURL(e.target.value)}
      />

      <select
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
          placeholder="Other Event Name"
          value={form.otherEvent}
          onChange={e => setForm({ ...form, otherEvent: e.target.value })}
        />
      )}

      <input
        type="date"
        value={form.date}
        onChange={e => setForm({ ...form, date: e.target.value })}
      />

      {/* ✅ PURPOSE */}
      <select
        value={form.purpose}
        onChange={e => setForm({ ...form, purpose: e.target.value })}
      >
        <option value="activity">Activity Proof</option>
        <option value="duty">Duty Leave</option>
        <option value="both">Activity + Duty Leave</option>
      </select>

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />

      <button onClick={submitProof}>
        {editId ? "Update Proof" : "Submit Proof"}
      </button>

      <hr />

      <h3>My Proofs</h3>
      {myProofs.map(p => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 10 }}>
          <p>
            <b>{p.category}</b> | Purpose: <b>{p.purpose}</b>
          </p>
          <p>{p.description}</p>
          <p>Status: {p.status}</p>

          {/* ✅ IMAGE PREVIEW */}
          {p.proofURL && (
            <img
              src={p.proofURL}
              alt="Proof"
              width="220"
              onError={e => (e.target.style.display = "none")}
            />
          )}

          <br />
          <a href={p.proofURL} target="_blank" rel="noreferrer">
            View Proof
          </a>

          {p.status === "pending" && (
            <>
              <br />
              <button onClick={() => handleEdit(p)}>Edit</button>
              <button onClick={() => handleDelete(p.id)}>Delete</button>
            </>
          )}

          {p.rejectReason && (
            <p style={{ color: "red" }}>Reason: {p.rejectReason}</p>
          )}
        </div>
      ))}
    </div>
  );
}
