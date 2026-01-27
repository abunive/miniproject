
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../src/firebase/firebase";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import "./login.css";


function AdminLogin() {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };
  const handleAdminLogin = async () => {
  try {
    // 1️⃣ Firebase Auth
    const res = await signInWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;

    // 2️⃣ Get admin data by UID (FIX)
    const snap = await getDoc(doc(db, "Admin", uid));

    if (!snap.exists()) {
      alert("Admin not registered");
      return;
    }

    if (!snap.data().isActive) {
      alert("Admin account is deactivated");
      return;
    }

    if (snap.data().role !== "admin") {
      alert("Access denied. Admin only.");
      return;
    }

    localStorage.setItem("role", "admin");
    navigate("/admin-dashboard");

  } catch (err) {
    console.error(err.code, err.message);
  alert(err.code);
   
  }
};

  // const handleAdminLogin = async () => {
  //   try {
  //     // 1️⃣ Authenticate admin
  //     const res = await signInWithEmailAndPassword(
  //       auth,
  //       email,
  //       password
  //     );

      
  //     const uid = res.user.uid;
  //     // 2️⃣ GET FROM users COLLECTION (FIXED)
  //     const snap = await getDoc(doc(db, "Admin", email));
  //     console.log("Admin snapshot exists:", snap.exists());
  //     console.log("Admin data:", snap.data());

  //     if (!snap.exists()) {
  //       alert("Admin not registered");
  //       return;
  //     }

  //     if (!snap.data().isActive) {
  //       alert("Admin account is deactivated");
  //       return;
  //     }
  //       console.log(snap.data().role);
        
  //     if (snap.data().role !== "admin") {
  //       alert("Access denied. Admin only.");
  //       return;
  //     }
  //     localStorage.setItem("role", "admin");  
  //     // 3️⃣ Success
  //     navigate("/admin-dashboard");

  //   } catch (err) {
  //     alert("Invalid email or password");
  //   }
  // };

  return (
    <div className="login-page">
      <h1 className="title">Admin Login</h1>

      <div className="login-card">
        <label>Admin Email</label>
        <input
          type="email"
          placeholder="admin@geci.ac.in"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label>Password</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />

          {/* <button
            type="button"
            className="toggle-password"
            onClick={togglePassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button> */}
          <button
  type="button"
  className="toggle-password"
  onClick={togglePassword}
>
  {showPassword ? <FaEyeSlash /> : <FaEye />}
</button>


        </div>
        <button className="login-btn" onClick={handleAdminLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;

