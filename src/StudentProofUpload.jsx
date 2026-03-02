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
  const [leadershipRole, setLeadershipRole] = useState("");
  const [errorMsg, setErrorMsg] = useState("");



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


return total;
};
// ---------- ENTREPRENEURSHIP & INNOVATION ----------
if (activityHead === "entrepreneurship") {

  // Foreign Language
  if (activity === "foreign_language") {
    total = 50;
    total = Math.min(total, 50);
  }

  // Startup Registered
  if (activity === "startup_registered") {
    total = 60;
    total = Math.min(total, 60);
  }

  // Patent Filed
  if (activity === "patent_filed") {
    total = 30;
    total = Math.min(total, 60);
  }

  // Patent Published
  if (activity === "patent_published") {
    total = 35;
    total = Math.min(total, 60);
  }

  // Patent Approved
  if (activity === "patent_approved") {
    total = 50;
    total = Math.min(total, 60);
  }

  // Patent Licensed
  if (activity === "patent_licensed") {
    total = 80;
    total = Math.min(total, 80);
  }

  // Prototype Developed & Tested
  if (activity === "prototype_development") {
    total = 60;
    total = Math.min(total, 60);
  }

  // Award for Product
  if (activity === "award_product") {
    total = 60;
    total = Math.min(total, 60);
  }

  // Innovative Technology Used
  if (activity === "innovative_technology") {
    total = 60;
    total = Math.min(total, 60);
  }

  // Government Venture Funding
  if (activity === "venture_funding") {
    total = 80;
    total = Math.min(total, 80);
  }

  // Startup Employment
  if (activity === "startup_employment") {
    total = 80;
    total = Math.min(total, 80);
  }

  // Social Innovation
  if (activity === "social_innovation") {
    total = 50;
    total = Math.min(total, 50);
  }
};
// ---------- LEADERSHIP & MANAGEMENT ----------
if (activityHead === "leadership") {

  // First 4 categories (Max 40)
  const groupA = [
    "professional_society",
    "association_chapter",
    "festival_event",
    "hobby_club"
  ];

  if (groupA.includes(activity)) {
    if (leadershipRole === "core") total = 15;
    if (leadershipRole === "sub") total = 10;
    if (leadershipRole === "volunteer") total = 5;

    total = Math.min(total, 40);
  }

  // Elected Representatives (Different Max)
  if (activity === "elected_representative") {
    if (leadershipRole === "chairman") total = 30;
    if (leadershipRole === "secretary") total = 25;
    if (leadershipRole === "member") total = 15;

   
  }
}
}




  const submitProof = async () => {

    // if (!scheme || !purpose || !proofURL) {
    //   alert("All mandatory fields must be filled");
    //   return;
    // }
    // VALIDATION
if (
  !scheme ||
  !purpose ||
  !proofURL ||
  ((purpose === "duty" || purpose === "both") && (!dutyType || !dutyDate)) ||
  ((purpose === "activity" || purpose === "both") && (
    !activityHead ||
    (activityHead === "leadership" && !leadershipRole)
  ))
) {
  setErrorMsg("⚠ Please fill all required fields.");
  return;
}

setErrorMsg("");

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
    setLeadershipRole("");

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
      {errorMsg && (
  <div style={{
    background: "#fee2e2",
    color: "#b91c1c",
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    border: "1px solid #fca5a5",
    fontWeight: 500
  }}>
    {errorMsg}
  </div>
)}

      <h2>KTU Activity & Duty Leave Upload</h2>

      {/* SCHEME */}
    
    <label>
      Scheme <span style={{ color: "red" }}>*</span>
    </label>
      <select style={inputStyle} value={scheme} onChange={e => setScheme(e.target.value)}>
        <option value="">Select Scheme</option>
        <option value="2019">2019 Scheme</option>
        <option value="2024">2024 Scheme</option>
      </select>

      {/* PURPOSE */}
       <label>
      Purpose <span style={{ color: "red" }}>*</span>
    </label>
      <select style={inputStyle} value={purpose} onChange={e => setPurpose(e.target.value)}>
        <option value="">Select Purpose</option>
        <option value="duty">Duty Leave</option>
        <option value="activity">Activity Point</option>
        <option value="both">Both</option>
      </select>

      {/* DUTY LEAVE SECTION */}
       <label>
      Duty Leave purpose <span style={{ color: "red" }}>*</span>
    </label>
      {(purpose === "duty" || purpose === "both") && (
        <>
          <input
            style={inputStyle}
            placeholder="Duty Leave Purpose (sports/arts/workshop...)"
            value={dutyType}
            onChange={e => setDutyType(e.target.value)}
          />
           <label>
      Date <span style={{ color: "red" }}>*</span>
    </label>
          <input
          
            style={inputStyle}
            type="date"
            value={dutyDate}
            onChange={e => setDutyDate(e.target.value)}
          />
        </>
      )}

      {/* ACTIVITY SECTION */}
       <label>
      Activity Header <span style={{ color: "red" }}>*</span>
    </label>
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
             <label>
      Activity <span style={{ color: "red" }}>*</span>
    </label>
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
          
          {/* ENTREPRENEURSHIP & INNOVATION */}
{activityHead === "entrepreneurship" && (
  <select
    style={inputStyle}
    value={activity}
    onChange={e => setActivity(e.target.value)}
  >
    <option value="">Select Event</option>
    <option value="foreign_language">Foreign Language Skill (TOEFL/IELTS/BEC Exams etc) </option>
    <option value="startup_registered">Startup Company Registered Legally</option>
    <option value="patent_filed">Patent Filed</option>
    <option value="patent_published">Patent Published</option>
    <option value="patent_approved">Patent Approved </option>
    <option value="patent_licensed">Patent Licensed </option>
    <option value="prototype_development">Prototype Developed & Tested</option>
    <option value="award_product"> Award for Products Developed</option>
    <option value="innovative_technology">Innovative Technologies developed and  Used by Industries/users</option>
    <option value="venture_funding">Government Venture Capital Funding for Innovative ideas/products</option>
    <option value="startup_employment"> Startup Employment ( Offering jobs to 2 persons not less than  ₹15000/month) </option>
    <option value="social_innovation">Societal Innovations</option>

  </select>
)}
{/* LEADERSHIP & MANAGEMENT */}
{activityHead === "leadership" && (
  <>
    <select
      style={inputStyle}
      value={activity}
      onChange={e => {
        setActivity(e.target.value);
        setLeadershipRole("");
      }}
    >
      <option value="">Select Event</option>
      <option value="professional_society">
        Student Professional Societies (IEEE, IET, ASME, SAE, NASA)
      </option>
      <option value="association_chapter">
        College Association Chapters
      </option>
      <option value="festival_event">
        Festival & Technical Events (College Approved)
      </option>
      <option value="hobby_club">
        Hobby Clubs
      </option>
      <option value="elected_representative">
        Elected Student Representative
      </option>
    </select>

    {/* Role Dropdown */}
    {activity !== "" && activity !== "elected_representative" && (
      <select
        style={inputStyle}
        value={leadershipRole}
        onChange={e => setLeadershipRole(e.target.value)}
      >
        <option value="">Select Role</option>
        <option value="core">Core Coordinator</option>
        <option value="sub">Sub Coordinator</option>
        <option value="volunteer">Volunteer</option>
      </select>
    )}

    {activity === "elected_representative" && (
      <select
        style={inputStyle}
        value={leadershipRole}
        onChange={e => setLeadershipRole(e.target.value)}
      >
        <option value="">Select Position</option>
        <option value="chairman">Chairman</option>
        <option value="secretary">Secretary</option>
        <option value="member">Council Member</option>
      </select>
    )}
  </>
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