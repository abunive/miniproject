// import { useState } from "react";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/firebase";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import "./login.css";

function UserLogin() {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

const handleLogin = async () => {
  try {
 const res = await signInWithEmailAndPassword(auth, email, password);

    const uid = res.user.uid;

    const snap = await getDoc(doc(db, "Users", uid));

    if (!snap.exists()) {
      alert("User not registered");
      return;
    }

    if (!snap.data().isActive) {
      alert("Account is deactivated");
      return;
    }

    const role = snap.data().role;

    if (role === "admin") {
      alert("Admins must login from Admin Login page");
      return;
    }

    if (role === "faculty") navigate("/faculty-dashboard");
    else if (role === "organizer") navigate("/organizer-dashboard");
    else navigate("/student-dashboard");

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


  return (
    <div className="login-page " style={{backgroundImage:"https://www.ktuqbank.com/p/apj-ktu-university.html"}}>
      <h1 className="title">KTU Activity Point Management System</h1>

      <div className="login-card">
        <label>Email</label>
        <input
          type="email"
          placeholder="user@gmail.com"
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
        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

export default UserLogin;
