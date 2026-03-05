import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import FacultyAddActivityPoints from "./FacultyAddActivityPoints";



export default function FacultyProofReview() {
  const [proofs, setProofs] = useState([]);
  const [reason, setReason] = useState({});
  const [allProofs, setAllProofs] = useState([]); // original copy
  const [selectedProof, setSelectedProof] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

const [filters, setFilters] = useState({
  studentName: "",
  category: "",
  purpose: "",
  date: ""
});


  const loadProofs = async () => {
    const snap = await getDocs(collection(db, "ProofRequests"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setProofs(data);
setAllProofs(data);

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
  const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString();
};

const applyFilter = () => {
  let filtered = allProofs;

  if (filters.studentName) {
    filtered = filtered.filter(p =>
      p.studentName?.toLowerCase().includes(filters.studentName.toLowerCase())
    );
  }

  if (filters.category) {
    filtered = filtered.filter(p =>
      p.activityHead === filters.category
    );
  }

//   if (filters.purpose) {
//     filtered = filtered.filter(p =>
//       p.purpose === filters.purpose
//     );
//   }

  if (filters.date) {
    filtered = filtered.filter(p =>
      p.dutyDate === filters.date
    );
  }

  setProofs(filtered);
};

const resetFilter = () => {
  setFilters({
    studentName: "",
    category: "",
    purpose: "",
    date: ""
  });
  setProofs(allProofs);
};
const removePointsIfApproved = async proof => {
  if (proof.status !== "approved" || !proof.activityPoints) return;

  const ref = doc(db, "StudentPoints", proof.studentId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();
  const updatedPoints = data.points.filter(
    p => p.proofId !== proof.id
  );

  const removed = data.points.find(p => p.proofId === proof.id);

  await updateDoc(ref, {
    points: updatedPoints,
    totalPoints: data.totalPoints - (removed?.points || 0)
  });
};

const loadAllProofs = async () => {
  const snap = await getDocs(collection(db, "ProofRequests"));
  setProofs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};


  return (
    <div>
      <h2>Faculty Proof Review</h2>
     
      <div style={{ marginBottom: 20 }}>
  <button
    onClick={() => setShowFilter(true)}
    style={{
      padding: "10px 18px",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: "600"
    }}
  >
    Open Filters
  </button>
</div>

{showFilter && (
  <div
    style={{
      position: "fixed",
      right: 0,
      top: 0,
      height: "100%",
      width: 320,
      background: "#fff",
      borderLeft: "1px solid #ccc",
      boxShadow: "-3px 0 10px rgba(0,0,0,0.1)",
      padding: 20,
      zIndex: 1000
    }}
  >
    <h3>Filters</h3>

    {/* Student Name */}
    <label>Student Name</label>
    <input
      value={filters.studentName}
      onChange={e =>
        setFilters({ ...filters, studentName: e.target.value })
      }
      style={{
        width: "100%",
        padding: 8,
        marginBottom: 12,
        border: "1px solid #ccc",
        borderRadius: 6
      }}
    />

    {/* Category */}
    <label>Category</label>
    <select
      value={filters.category}
      onChange={e =>
        setFilters({ ...filters, category: e.target.value })
      }
      style={{
        width: "100%",
        padding: 8,
        marginBottom: 12,
        borderRadius: 6
      }}
    >
      <option value="">All</option>
      <option value="national">National</option>
      <option value="sports">Sports</option>
      <option value="cultural">Cultural</option>
      <option value="professional">Professional</option>
      <option value="entrepreneurship">Entrepreneurship</option>
      <option value="leadership">Leadership</option>
    </select>

    {/* Date */}
    <label>Date</label>
    <input
      type="date"
      value={filters.date}
      onChange={e =>
        setFilters({ ...filters, date: e.target.value })
      }
      style={{
        width: "100%",
        padding: 8,
        marginBottom: 12,
        borderRadius: 6
      }}
    />

    <div style={{ marginTop: 20 }}>
      <button
        onClick={() => {
          applyFilter();
          setShowFilter(false);
        }}
        style={{
          padding: "8px 14px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          marginRight: 10
        }}
      >
        Apply
      </button>

      <button
        onClick={() => {
          resetFilter();
          setShowFilter(false);
        }}
        style={{
          padding: "8px 14px",
          background: "#e5e7eb",
          border: "1px solid #ccc",
          borderRadius: 6
        }}
      >
        Clear
      </button>

      <button
        onClick={() => setShowFilter(false)}
        style={{
          marginLeft: 10,
          border: "none",
          background: "transparent",
          cursor: "pointer"
        }}
      >
        Close
      </button>
    </div>
  </div>
)}


     

    
{/* {[...proofs].reverse().map(p => ( */}
{[...proofs]
  .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
  .map(p => (
  <div key={p.id} style={{ border: "1px solid #aaa", padding: 12 }}>
    <p><b>{p.studentName}</b></p>
    {/* <p>{p.category} | {p.purpose}</p>
    <p>{p.description}</p>
    <p>Date: {formatDate(p.eventDate)}</p> */}
    <p><b>Student:</b> {p.studentName}</p>
<p><b>Scheme:</b> {p.scheme}</p>
<p><b>Purpose:</b> {p.purpose}</p>

{p.dutyType && <p><b>Duty Type:</b> {p.dutyType}</p>}
{p.dutyDate && <p><b>Duty Date:</b> {p.dutyDate}</p>}

{p.activityHead && <p><b>Activity Head:</b> {p.activityHead}</p>}
{p.activity && <p><b>Activity:</b> {p.activity}</p>}
{p.level && <p><b>Level:</b> {p.level}</p>}
{p.professionalActivity && <p><b>Professional:</b> {p.professionalActivity}</p>}
{p.leadershipRole && <p><b>Role:</b> {p.leadershipRole}</p>}

{p.prize && <p><b>Prize:</b> {p.prize}</p>}

<p><b>Description:</b> {p.description}</p>
<p><b>Points:</b> {p.activityPoints}</p>

    {p.proofURL && p.proofURL.match(/\.(jpeg|jpg|png|webp)$/i) && (
      <img
        src={p.proofURL}
        alt="Proof"
        width="250"
        style={{ display: "block", marginTop: 8 }}
      />
    )}

    {p.proofURL ? (
      <a href={p.proofURL} target="_blank" rel="noreferrer">
        Open Uploaded Proof
      </a>
    ) : (
      <p style={{ color: "red" }}>No proof uploaded</p>
    )}

    <p>Status: {p.status}</p>

    {p.status === "rejected" && p.rejectReason && (
      <p style={{ color: "red", fontWeight: "bold" }}>
        Rejection Reason: {p.rejectReason}
      </p>
    )}

    {p.status === "pending" && (
      <>
        <br />
        
        <button onClick={() => approveProof(p)}>
  Approve
</button>

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



      {/* {selectedProof && selectedProof.purpose === "Activity Point" && (
        <FacultyAddActivityPoints
          proof={selectedProof}
          onClose={() => setSelectedProof(null)}
          onDone={loadProofs}
        />
      )} */}
      {selectedProof && (
  <FacultyAddActivityPoints
    proof={selectedProof}
    onClose={() => setSelectedProof(null)}
    onDone={loadProofs}
  />
)}

    </div>
  );
} 