import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

export default function FacultyProofReview() {
  const [proofs, setProofs] = useState([]);
  const [reason, setReason] = useState({});

  const loadProofs = async () => {
    const snap = await getDocs(collection(db, "ProofRequests"));
    setProofs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    loadProofs();
  }, []);

  const approveProof = async p => {
    await updateDoc(doc(db, "ProofRequests", p.id), {
      status: "approved"
    });
    loadProofs();
  };

  const rejectProof = async p => {
    if (!reason[p.id]) {
      alert("Enter reject reason");
      return;
    }

    await updateDoc(doc(db, "ProofRequests", p.id), {
      status: "rejected",
      rejectReason: reason[p.id]
    });

    loadProofs();
  };

  return (
    <div>
      <h2>Faculty Proof Review</h2>

      {proofs.map(p => (
        <div key={p.id} style={{ border: "1px solid #aaa", padding: 12 }}>
          <p><b>{p.studentName}</b></p>
          <p>{p.category} | {p.purpose}</p>
          <p>{p.description}</p>

          {/* Image preview */}
          {p.proofURL.match(/\.(jpeg|jpg|png|webp)$/i) && (
            <img src={p.proofURL} alt="" width="250" />
          )}

          <br />
          <a href={p.proofURL} target="_blank" rel="noreferrer">
            Open Proof
          </a>

          <p>Status: {p.status}</p>

          {p.status === "pending" && (
            <>
              <br />
              <button onClick={() => approveProof(p)}>Approve</button>

              <br />
              <input
                placeholder="Reject reason"
                onChange={e =>
                  setReason({ ...reason, [p.id]: e.target.value })
                }
              />
              <button onClick={() => rejectProof(p)}>Reject</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
