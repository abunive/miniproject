// import { Routes, Route } from "react-router-dom";
// //import Home from "./Home";
// import AdminLogin from "./AdminLogin";
// import UserLogin from "./UserLogin";
// import LoginSelector from "./LoginSelector";
// import AdminDashboard from "./AdminDashboard"; 


// import OrganizerDashboard from "./OrganizerDashboard";


// // export default App;

// function App() {
//   // return <LoginSelector />;
//   return (
//     <Routes>
//       <Route path="/" element={<LoginSelector />} />
//       <Route path="/admin-login" element={<AdminLogin />} />
//       <Route path="/user-login" element={<UserLogin />} />
//       <Route path="/admin-dashboard" element={<AdminDashboard/>}/>



//       <Route path="/organizer" element={<OrganizerDashboard />} />
//     </Routes>
//   );
// }

// export default App;             
// import { BrowserRouter,Routes, Route } from "react-router-dom";
// // import LoginSelector from "./LoginSelector";
// import AdminDashboard from "./AdminDashboard";
// import StudentDashboard from "./StudentDashboard";
// import FacultyDashboard from "./FacultyDashboard";
// import OrganizerDashboard from "./OrganizerDashboard";
// import FacultyNotifications from "./FacultyNotifications";
// import StudentNotifications from "./StudentNotifications";
// import UserLogin from "./UserLogin";
// // import Layout from "./Layout";
// import "./login.css";
// import AdminLogin from "./AdminLogin";

// function App() {
//   return (
//     <Routes>
//        <Route path="/admin-login" element={<AdminLogin />} />
//       <Route path="/user-login" element={<UserLogin />} />
//       {/* All logged-in users */}
//       {/* <Route element={<Layout />}> */}
//         <Route path="/admin-dashboard" element={<AdminDashboard />} />
//         <Route path="/student-dashboard" element={<StudentDashboard />} />
//         <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
//         <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
//         <Route path="/faculty-notifications" element={<FacultyNotifications />} />
// <Route path="/student-notifications" element={<StudentNotifications />} />
//       {/* </Route> */}
//     </Routes>
    
//   );
// }

// export default App;
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";
import FacultyDashboard from "./FacultyDashboard";
import OrganizerDashboard from "./OrganizerDashboard";
import FacultyNotifications from "./FacultyNotifications";
import StudentNotifications from "./StudentNotifications";
import UserLogin from "./UserLogin";
import AdminLogin from "./AdminLogin";
import "./login.css";

function App() {
  return (
      <Routes>
         <Route path="/" element={<UserLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/user-login" element={<UserLogin />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
        <Route path="/faculty-notifications" element={<FacultyNotifications />} />
        <Route path="/student-notifications" element={<StudentNotifications />} />
      </Routes>
  );
}

export default App;