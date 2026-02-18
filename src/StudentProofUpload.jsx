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
  doc,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function StudentProofUpload() {

  const [user, setUser] = useState(null);
  const [myProofs, setMyProofs] = useState([]);
  const [editId, setEditId] = useState(null);

  // MAIN FORM STATES
  const [scheme, setScheme] = useState("");
  const [purpose, setPurpose] = useState("");

  // DUTY LEAVE
  const [dutyType, setDutyType] = useState("");
  const [dutyDate, setDutyDate] = useState("");

  // ACTIVITY POINTS
  const [activityHead, setActivityHead] = useState("");
  const [activity, setActivity] = useState("");
  const [level, setLevel] = useState("");
  const [duration, setDuration] = useState("");

  const [proofURL, setProofURL] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [professionalActivity, setProfessionalActivity] = useState("");



  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const loadProofs = async (uid) => {
    const q = query(collection(db, "ProofRequests"), where("studentId", "==", uid));
    const snap = await getDocs(q);
    setMyProofs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (user) loadProofs(user.uid);
  }, [user]);
  const calculatePoints = () => {

let total = 0;

// ---------- SPORTS / CULTURAL ----------
const levelPoints = {
college:8,
zonal:15,
state:25,
national:40,
international:60
};

if(activityHead==="sports" || activityHead==="cultural"){

let base = levelPoints[level] || 0;
let bonus = 0;

if(prize){

if(level==="college" || level==="zonal" || level==="state"){
if(prize==="1") bonus=10;
if(prize==="2") bonus=8;
if(prize==="3") bonus=5;
}
else{
if(prize==="1") bonus=20;
if(prize==="2") bonus=16;
if(prize==="3") bonus=12;
}
}

total = base + bonus;

// cap rule
let maxAllowed = (level==="national" || level==="international") ? 80 : 60;
total = Math.min(total,maxAllowed);
}

// ---------- NATIONAL ----------
if(activityHead==="national"){
total = 60;
}

// ---------- PROFESSIONAL ----------
if(activityHead==="professional"){

// Tech fest
if(professionalActivity==="tech"){
const map={1:10,2:20,3:30,4:40,5:50};
total = map[level] || 0;
total = Math.min(total,50);
}

// MOOC
if(professionalActivity==="mooc"){
total = 50;
}

// Society competitions
if(professionalActivity==="society"){
const map={1:10,2:15,3:20,4:30,5:40};
total = map[level] || 0;
total = Math.min(total,40);
}

// IIT/NIT workshops
if(professionalActivity==="iit"){
total = 20;
total = Math.min(total,40);
}
//papper
if(professionalActivity==="papper"){
total = 30;
total = Math.min(total,40);
}
//poster
if(professionalActivity==="poster presentation"){
total = 20;
total = Math.min(total,30);
}
 //internship
if(professionalActivity==="internship"){
total = 20;
}
//industrial visit
if(professionalActivity==="industrial"){
total = 5;
total = Math.min(total,10);
}
//foreign language
if(professionalActivity==="foreign language"){
total = 50;
}

return total;
};}

  // const calculatePoints = () => {

// let base = 0;
// let bonus = 0;

// const levelPoints = {
// college:8,
// zonal:15,
// state:25,
// national:40,
// international:60
// };

// if(level) base = levelPoints[level];

// if(prize){

// if(level==="college" || level==="zonal" || level==="state"){
// if(prize==="1") bonus=10;
// if(prize==="2") bonus=8;
// if(prize==="3") bonus=5;
// }
// else{
// if(prize==="1") bonus=20;
// if(prize==="2") bonus=16;
// if(prize==="3") bonus=12;
// }

// }

// let total = base + bonus;

// // MAX LIMIT BASED ON LEVEL
// if(activityHead==="national" || activityHead==="sports" || activityHead==="cultural"){

// let maxAllowed = 60;

// if(level==="national" || level==="international"){
// maxAllowed = 80;
// }

// total = Math.min(total, maxAllowed);
// }


// return total;
// };

  const submitProof = async () => {

    if (!scheme || !purpose || !proofURL) {
      alert("All mandatory fields must be filled");
      return;
    }

    const data = {
      studentId: user.uid,
      studentName: user.email,
      scheme,
      purpose,

      dutyType,
      dutyDate,

      activityHead,
      activity,
      level,
      duration,
      professionalActivity,


      proofURL,
      description,
      prize,

      status: "pending",
      activityPoints: calculatePoints(),
      rejectReason: "",
      createdAt: serverTimestamp()
    };

    if (editId) {
      await updateDoc(doc(db, "ProofRequests", editId), data);
      setEditId(null);
    } else {
      await addDoc(collection(db, "ProofRequests"), data);
    }

    resetForm();
    loadProofs(user.uid);
  };

  const resetForm = () => {
    setScheme("");
    setPurpose("");
    setDutyType("");
    setDutyDate("");
    setActivityHead("");
    setActivity("");
    setLevel("");
    setDuration("");
    setProofURL("");
    setDescription("");
    setPrize("");
    setProfessionalActivity("");

  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setScheme(p.scheme);
    setPurpose(p.purpose);
    setDutyType(p.dutyType);
    setDutyDate(p.dutyDate);
    setActivityHead(p.activityHead);
    setActivity(p.activity);
    setLevel(p.level);
    setDuration(p.duration);
    setProofURL(p.proofURL);
    setDescription(p.description);
    setPrize(p.prize || "");
    setProfessionalActivity(p.professionalActivity || "");


  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "ProofRequests", id));
    loadProofs(user.uid);
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #ccc"
  };

  return (
    <div style={{ maxWidth: 650, margin: "auto", padding: 20 }}>

      <h2>KTU Activity & Duty Leave Upload</h2>

      {/* SCHEME */}
      <select style={inputStyle} value={scheme} onChange={e => setScheme(e.target.value)}>
        <option value="">Select Scheme</option>
        <option value="2019">2019 Scheme</option>
        <option value="2024">2024 Scheme</option>
      </select>

      {/* PURPOSE */}
      <select style={inputStyle} value={purpose} onChange={e => setPurpose(e.target.value)}>
        <option value="">Select Purpose</option>
        <option value="duty">Duty Leave</option>
        <option value="activity">Activity Point</option>
        <option value="both">Both</option>
      </select>

      {/* DUTY LEAVE SECTION */}
      {(purpose === "duty" || purpose === "both") && (
        <>
          <input
            style={inputStyle}
            placeholder="Duty Leave Purpose (sports/arts/workshop...)"
            value={dutyType}
            onChange={e => setDutyType(e.target.value)}
          />

          <input
            style={inputStyle}
            type="date"
            value={dutyDate}
            onChange={e => setDutyDate(e.target.value)}
          />
        </>
      )}

      {/* ACTIVITY SECTION */}
      {(purpose === "activity" || purpose === "both") && (
        <>
          <select style={inputStyle} value={activityHead}
            onChange={e => { setActivityHead(e.target.value); setActivity(""); }}>
            <option value="">Select Activity Head</option>
            <option value="national">National Initiatives Participation</option>
            <option value="sports">Sports & Games Participation</option>
            <option value="cultural">Cultural Activities Participation</option>
            <option value="professional">Professional Self Initiatives</option>
            <option value="entrepreneurship">Entrepreneurship & Innovation</option>
            <option value="leadership">Leadership & Management</option>
          </select>

          {/* NATIONAL */}
          {activityHead === "national" && (
            <>
              <select style={inputStyle} value={activity}
                onChange={e => setActivity(e.target.value)}>
                <option value="">Select</option>
                <option value="NSS">NSS</option>
                <option value="NCC">NCC</option>
              </select>

              <select style={inputStyle} value={duration}
                onChange={e => setDuration(e.target.value)}>
                <option value="">Completed Minimum 1 Year?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </>
          )}

          {/* SPORTS & ARTS LEVEL */}
          {(activityHead === "sports" || activityHead === "cultural") && (
            <>
              <select style={inputStyle} value={level}
                onChange={e => setLevel(e.target.value)}>
                <option value="">Select Level</option>
                <option value="college">Level I - College</option>
                <option value="zonal">Level II - Zonal</option>
                <option value="state">Level III - State</option>
                <option value="national">Level IV - National</option>
                <option value="international">Level V - International</option>
              </select>
              <select style={inputStyle} value={prize} onChange={e=>setPrize(e.target.value)}>
              <option value="">Select Prize (optional)</option>
              <option value="1">1st Prize</option>
              <option value="2">2nd Prize</option>
              <option value="3">3rd Prize</option>
              </select>

            </>
          )}
          {activityHead==="professional" && (
        <select
        style={inputStyle}
        value={professionalActivity}
        onChange={e=>setProfessionalActivity(e.target.value)}
        >
        <option value="">Select Event</option>

        <option value="tech">Tech Fest / Tech Quiz</option>
        <option value="mooc">MOOC with Final Assessment</option>
        <option value="society">Professional Society Competition</option>
        <option value="iit">IIT/NIT Conference/Workshop/STTP</option>
        <option value="papper">Paper Presentation / Publication at IIT's/NIT's</option>
        <option value="poster presentation">Poster Presentation at IIT's/NIT's</option>
        <option value="internship">Industrial Training / Internship(atlist for 5 full days)</option>
        <option value="industrial">Industrial/Exhibition Visit</option>
        <option value="foreign language">Foreign Language Skill(TOEFL/IELTS,BEC Exams etc..)</option>
        </select>
        )}
              {activityHead==="professional" &&
      (professionalActivity==="tech" || professionalActivity==="society") && (

      <select style={inputStyle} value={level}
      onChange={e=>setLevel(e.target.value)}>

      <option value="">Select Level</option>
      <option value="1">Level 1</option>
      <option value="2">Level 2</option>
      <option value="3">Level 3</option>
      <option value="4">Level 4</option>
      <option value="5">Level 5</option>

      </select>
      )}


        </>
      )}

      {/* PROOF */}
      <input
        style={inputStyle}
        placeholder="Upload Proof URL"
        value={proofURL}
        onChange={e => setProofURL(e.target.value)}
      />

      <textarea
        style={{ ...inputStyle, height: 80 }}
        placeholder="Description (Optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <button style={{
        width: "100%",
        padding: 12,
        background: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: 6
      }}
        onClick={submitProof}>
        {editId ? "Update" : "Submit"}
      </button>

      <hr />

      <h3>My Submissions</h3>

      {[...myProofs].reverse().map(p => (
        <div key={p.id} style={{
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12
        }}>
          <p><b>Scheme:</b> {p.scheme}</p>
          <p><b>Purpose:</b> {p.purpose}</p>
          <p><b>Status:</b> {p.status}</p>
          {p.activityPoints > 0 && <p><b>Points:</b> {p.activityPoints}</p>}

          {p.status === "pending" && (
            <>
              <button onClick={() => handleEdit(p)}>Edit</button>
              <button onClick={() => handleDelete(p.id)}>Delete</button>
            </>
          )}

          {p.rejectReason && <p style={{ color: "red" }}>{p.rejectReason}</p>}
        </div>
      ))}

    </div>
  );
}