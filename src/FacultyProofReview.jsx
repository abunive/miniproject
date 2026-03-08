import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import FacultyAddActivityPoints from "./FacultyAddActivityPoints";
import { addDoc } from "firebase/firestore";


export default function FacultyProofReview() {
  const [proofs, setProofs] = useState([]);
  const [reason, setReason] = useState({});
  const [allProofs, setAllProofs] = useState([]); // original copy
  const [selectedProof, setSelectedProof] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
const [confirmType, setConfirmType] = useState("");
const [confirmAction, setConfirmAction] = useState(null);
const [msgPopup, setMsgPopup] = useState("");

const [filters, setFilters] = useState({
  studentName: "",
  category: "",
  otherCategory: "",
  purpose: "",
  date: "",
  status: ""
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
   await addDoc(collection(db, "Notifications"), {
  receiverRole: "student",
  receiverId: p.studentId,
  proofName: proof.proofName,
  description: "Your proof has been approved",
  status: "approved",
  seen: false
});
  
    loadProofs();
  };

  const rejectProof = async p => {
    if (!reason[p.id]) {
      alert("Enter reject reason");
      return;
    }

  await addDoc(collection(db, "Notifications"), {
  receiverRole: "student",
  receiverId: proof.studentId,
  proofName: proof.proofName,
  description: "Your proof was rejected",
  status: "rejected",
  rejectReason: reason,
  seen: false
});

    loadProofs();
  };
  const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString();
};

// const applyFilter = () => {
//   let filtered = allProofs;

//   if (filters.studentName) {
//     filtered = filtered.filter(p =>
//       p.studentName?.toLowerCase().includes(filters.studentName.toLowerCase())
//     );
//   }

//   if (filters.category) {
//     filtered = filtered.filter(p =>
//       p.activityHead === filters.category
//     );
//   }
//   if (filters.date) {
//     filtered = filtered.filter(p =>
//       p.dutyDate === filters.date
//     );
//   }

//   setProofs(filtered);
// };
const applyFilter = () => {
  let filtered = allProofs;

  if (filters.studentName) {
    filtered = filtered.filter(p =>
      p.studentName?.toLowerCase().includes(filters.studentName.toLowerCase())
    );
  }

  // Category
  if (filters.category && filters.category !== "other") {
    filtered = filtered.filter(p =>
      p.activityHead === filters.category
    );
  }

  // Other category typed by faculty
  if (filters.category === "other" && filters.otherCategory) {
    filtered = filtered.filter(p =>
      p.activityHead?.toLowerCase().includes(filters.otherCategory.toLowerCase())
    );
  }

  // Status
  if (filters.status) {
    filtered = filtered.filter(p =>
      p.status === filters.status
    );
  }

  // Date
  if (filters.date) {
    filtered = filtered.filter(p =>
      p.dutyDate === filters.date
    );
  }

  setProofs(filtered);
};


// const resetFilter = () => {
//   setFilters({
//     studentName: "",
//     category: "",
//     purpose: "",
//     date: ""
//   });
//   setProofs(allProofs);
// };
const resetFilter = () => {
  setFilters({
    studentName: "",
    category: "",
    otherCategory: "",
    purpose: "",
    date: "",
    status: ""
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

const openConfirm = (type, action) => {
  setConfirmType(type);
  setConfirmAction(() => action);
  setConfirmOpen(true);
};


  return (
    <div>
      <h2>Faculty Proof Review</h2>
     
      {/* Filter Button */}

<div style={{ marginBottom: 20 }}>
  <button
    onClick={() => setShowFilter(true)}
    style={{
      padding: "10px 18px",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: "600",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
    }}
  >
    🔎 Open Filters
  </button>
</div>


{/* Background Overlay */}

{showFilter && (
  <>
    <div
      onClick={() => setShowFilter(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
        zIndex: 999
      }}
    />


    {/* Filter Panel */}

    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100%",
        width: 340,
        background: "#fff",
        boxShadow: "-4px 0 18px rgba(0,0,0,0.15)",
        padding: 24,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}
    >
      {/* Header */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #eee",
          paddingBottom: 10
        }}
      >
        <h3 style={{ margin: 0 }}>Filter Activities</h3>

        <button
          onClick={() => setShowFilter(false)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 18,
            cursor: "pointer"
          }}
        >
          ✕
        </button>
      </div>


      {/* Student Name */}

      <div>
        <label style={{ fontWeight: 500 }}>Student Name</label>
        <input
          value={filters.studentName}
          onChange={e =>
            setFilters({ ...filters, studentName: e.target.value })
          }
          placeholder="Search student..."
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            border: "1px solid #ddd",
            borderRadius: 8,
            outline: "none"
          }}
        />
      </div>


      {/* Category */}

      <div>
        <label style={{ fontWeight: 500 }}>Category</label>
        <select
          value={filters.category}
          onChange={e =>
            setFilters({ ...filters, category: e.target.value })
          }
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            borderRadius: 8,
            border: "1px solid #ddd"
          }}
        >
          <option value="">All Categories</option>
          <option value="national">National</option>
          <option value="sports">Sports</option>
          <option value="cultural">Cultural</option>
          <option value="professional">Professional</option>
          <option value="entrepreneurship">Entrepreneurship</option>
          <option value="leadership">Leadership</option>
           <option value="other">Other</option>

        </select>
      </div>
      {filters.category === "other" && (
  <input
    placeholder="Enter category..."
    value={filters.otherCategory}
    onChange={e =>
      setFilters({ ...filters, otherCategory: e.target.value })
    }
    style={{
      width: "100%",
      padding: 10,
      marginTop: 8,
      borderRadius: 8,
      border: "1px solid #ddd"
    }}
  />
)}


      {/* Date */}

      <div>
        <label style={{ fontWeight: 500 }}>Date</label>
        <input
          type="date"
          value={filters.date}
          onChange={e =>
            setFilters({ ...filters, date: e.target.value })
          }
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            borderRadius: 8,
            border: "1px solid #ddd"
          }}
        />
      </div>
      <div>
  <label style={{ fontWeight: 500 }}>Status</label>

  <select
    value={filters.status}
    onChange={e =>
      setFilters({ ...filters, status: e.target.value })
    }
    style={{
      width: "100%",
      padding: 10,
      marginTop: 6,
      borderRadius: 8,
      border: "1px solid #ddd"
    }}
  >
    <option value="">All Status</option>
    <option value="pending">Pending</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>
</div>

          <div
  style={{
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 10
  }}
>
  <button
    onClick={() => {
      resetFilter();
      setShowFilter(false);
    }}
    style={{
      flex: 1,
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #ccc",
      background: "#f3f4f6",
      cursor: "pointer",
      fontWeight: 500
    }}
  >
    Clear
  </button>

  <button
    onClick={() => {
      applyFilter();
      setShowFilter(false);
    }}
    style={{
      flex: 1,
      padding: "10px 14px",
      borderRadius: 8,
      border: "none",
      background: "#2563eb",
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer"
    }}
  >
    Apply
  </button>
</div>
    




    </div>
  </>
)}

{[...proofs]
  .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
  .map(p => (
    <div
      key={p.id}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 16,
        marginBottom: 18,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}
    >

      {/* Header */}

      <div style={{ marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>{p.studentName}</h3>
        <span
          style={{
            fontSize: 13,
            padding: "4px 8px",
            borderRadius: 6,
            background:
              p.status === "approved"
                ? "#dcfce7"
                : p.status === "rejected"
                ? "#fee2e2"
                : "#fef3c7",
            color:
              p.status === "approved"
                ? "#166534"
                : p.status === "rejected"
                ? "#991b1b"
                : "#92400e"
          }}
        >
          {p.status.toUpperCase()}
        </span>
      </div>

      {/* Details */}

      <div style={{ fontSize: 14, lineHeight: "1.6" }}>
        <p><b>Scheme:</b> {p.scheme}</p>
        <p><b>Purpose:</b> {p.purpose}</p>

        {p.dutyType && <p><b>Duty Type:</b> {p.dutyType}</p>}
        {p.dutyDate && <p><b>Duty Date:</b> {p.dutyDate}</p>}

        {p.activityHead && <p><b>Activity Head:</b> {p.activityHead}</p>}
        {p.activity && <p><b>Activity:</b> {p.activity}</p>}
        {p.level && <p><b>Level:</b> {p.level}</p>}
        {p.professionalActivity && (
          <p><b>Professional:</b> {p.professionalActivity}</p>
        )}
        {p.leadershipRole && <p><b>Role:</b> {p.leadershipRole}</p>}
        {p.prize && <p><b>Prize:</b> {p.prize}</p>}

        <p><b>Description:</b> {p.description}</p>
        <p><b>Points:</b> {p.activityPoints}</p>
      </div>

      {/* Proof Preview */}

      {p.proofURL && p.proofURL.match(/\.(jpeg|jpg|png|webp)$/i) && (
        <img
          src={p.proofURL}
          alt="Proof"
          style={{
            width: 250,
            marginTop: 10,
            borderRadius: 8,
            border: "1px solid #ddd"
          }}
        />
      )}

      {/* Proof Link */}

      <div style={{ marginTop: 8 }}>
        {p.proofURL ? (
          <a
            href={p.proofURL}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#2563eb",
              fontWeight: 500,
              textDecoration: "none"
            }}
          >
            🔗 Open Uploaded Proof
          </a>
        ) : (
          <p style={{ color: "red" }}>No proof uploaded</p>
        )}
      </div>

      {/* Rejection Reason */}

      {p.status === "rejected" && p.rejectReason && (
        <p
          style={{
            color: "#b91c1c",
            background: "#fee2e2",
            padding: 8,
            borderRadius: 6,
            marginTop: 10
          }}
        >
          <b>Rejection Reason:</b> {p.rejectReason}
        </p>
      )}

      {/* Actions */}

      {p.status === "pending" && (
        <div style={{ marginTop: 14 }}>

       

          <button
  onClick={() => openConfirm("approve", () => approveProof(p))}
  style={{
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
    marginRight: 10,
    fontWeight: 600
  }}
>
  Approve
</button>


          <input
  placeholder="Enter rejection reason..."
  value={reason[p.id] || ""}
  onChange={(e) =>
    setReason({ ...reason, [p.id]: e.target.value })
  }
  style={{
    width: "100%",
    padding: "8px",
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 6,
    border: "1px solid #ccc"
  }}
/>

        


{/* <button
  onClick={() => {
    if (!reason[p.id] || reason[p.id].trim() === "") {
      alert("Please enter a rejection reason first.");
      return;
    }

    openConfirm("reject", () => rejectProof(p));
  }}
  style={{
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
  }}
>
  Reject
</button> */}

<button
  onClick={() => {
    if (!reason[p.id] || reason[p.id].trim() === "") {
      setMsgPopup("Please enter a rejection reason first.");
      return;
    }

    openConfirm("reject", () => rejectProof(p));
  }}
  style={{
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
  }}
>
  Reject
</button>

        </div>
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

{confirmOpen && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 10,
        width: 320,
        boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
        textAlign: "center"
      }}
    >
      <p style={{ marginBottom: 20, fontWeight: 500 }}>
        Do you really want to {confirmType} this proof?
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={() => {
            if (confirmAction) confirmAction();
            setConfirmOpen(false);
          }}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Yes
        </button>

        <button
          onClick={() => setConfirmOpen(false)}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#f3f4f6",
            cursor: "pointer"
          }}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
{msgPopup && (
  <div
    style={{
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#ef4444",
      color: "#fff",
      padding: "10px 18px",
      borderRadius: 8,
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
      zIndex: 2000
    }}
  >
    {msgPopup}

    <div style={{ textAlign: "center", marginTop: 6 }}>
      <button
        onClick={() => setMsgPopup("")}
        style={{
          background: "#fff",
          color: "#ef4444",
          border: "none",
          padding: "4px 10px",
          borderRadius: 4,
          cursor: "pointer",
          fontWeight: 600
        }}
      >
        OK
      </button>
    </div>
  </div>
)}

    </div>
  );
} 