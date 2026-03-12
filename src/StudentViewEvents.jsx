import { useEffect, useState } from "react";
import { db, auth } from "./firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  updateDoc
} from "firebase/firestore";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function StudentViewEvents() {

  const [events, setEvents] = useState([]);
  const [likedEvents, setLikedEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  /* 🔥 REALTIME EVENTS LISTENER */
  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "Events"),
      async snap => {

        const uid = auth.currentUser ? auth.currentUser.uid : null;
        const list = [];

        for (const d of snap.docs) {

          const data = d.data();

          let eventDate = "N/A";
          let realDate = null;

          if (data.date?.toDate) {
            realDate = data.date.toDate();
            eventDate = realDate.toLocaleDateString();
          } else if (typeof data.date === "string") {
            realDate = new Date(data.date);
            eventDate = data.date;
          }

          list.push({
            id: d.id,
            ...data,
            eventDate,
            realDate
          });
        }

        setEvents(list);
        setLoading(false);

        /* ⭐ Check liked status */
        if (uid) {

          const results = await Promise.all(
            list.map(async ev => {

              const likeRef = doc(db, "Events", ev.id, "Likes", uid);
              const likeSnap = await getDoc(likeRef);

              return { id: ev.id, liked: likeSnap.exists() };

            })
          );

          const likedMap = {};
          results.forEach(r => {
            likedMap[r.id] = r.liked;
          });

          setLikedEvents(likedMap);
        }

      }
    );

    return () => unsubscribe();

  }, []);

  /* 👍 TOGGLE INTEREST (0 ↔ 1) */
const toggleLike = async (eventId) => {
  const user = auth.currentUser;

  if (!user) {
    alert("Login required");
    return;
  }

  const likeRef = doc(db, "Events", eventId, "Likes", user.uid);
  const likesCollection = collection(db, "Events", eventId, "Likes");

  const alreadyLiked = likedEvents[eventId];

  try {
    if (alreadyLiked) {
      // remove like
      await deleteDoc(likeRef);

      setLikedEvents(prev => ({
        ...prev,
        [eventId]: false
      }));
    } else {
      // add like
      await setDoc(likeRef, {
        studentId: user.uid,
        createdAt: new Date()
      });

      setLikedEvents(prev => ({
        ...prev,
        [eventId]: true
      }));
    }

    // 🔥 Count likes
    const snap = await getDocs(likesCollection);
    const interestCount = snap.size;

    // 🔥 Update event document
    await updateDoc(doc(db, "Events", eventId), {
      interestCount: interestCount
    });

  } catch (err) {
    console.error(err);
  }
};
  /* 📅 Filter events by selected date */
  const approvedEvents = events.filter(e => e.status === "approved");

  const eventsForSelectedDate = approvedEvents.filter(e => {
    if (!e.realDate) return false;
    return (
      e.realDate.getDate() === selectedDate.getDate() &&
      e.realDate.getMonth() === selectedDate.getMonth() &&
      e.realDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  /* 📌 Highlight dates that have events */
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const hasEvent = approvedEvents.some(e =>
        e.realDate &&
        e.realDate.getDate() === date.getDate() &&
        e.realDate.getMonth() === date.getMonth() &&
        e.realDate.getFullYear() === date.getFullYear()
      );

      if (hasEvent) {
        return (
          <div
            style={{
              marginTop: 2,
              height: 6,
              width: 6,
              borderRadius: "50%",
              background: "red",
              marginLeft: "auto",
              marginRight: "auto"
            }}
          />
        );
      }
    }
  };

  return (
    <>
     <h2 style={{
  textAlign:"center",
  color:"#be185d",
  fontWeight:"bold",
  marginBottom:"10px"
}}>
        Approved Events Calendar
      </h2>

      {loading && <p>Loading events...</p>}

      {!loading && (
        <>
         <div style={calendarWrapper}>
  <Calendar
    onChange={setSelectedDate}
    value={selectedDate}
    tileContent={tileContent}
  />
</div>
            <h3 style={{
  marginTop:30,
  textAlign:"center",
  color:"#374151"
}}>
          
            Events on {selectedDate.toLocaleDateString()}
          </h3>

          {eventsForSelectedDate.length === 0 && (
            <p>No approved events on this date</p>
          )}

          {eventsForSelectedDate.map(e => (
            <div key={e.id} style={card}>

              <h3>{e.title}</h3>

              <p><b>Date:</b> {e.eventDate}</p>

              <p>{e.description}</p>

              {e.posterURL ? (
                <img
                  src={e.posterURL}
                  alt="poster"
                  style={{
  width:"100%",
  marginTop:12,
  borderRadius:10,
  maxHeight:"220px",
  objectFit:"cover"
}}
                />
              ) : (
                <p
                  style={{
                    marginTop:10,
                    color:"red",
                    fontWeight:"bold"
                  }}
                >
                  No image for poster
                </p>
              )}

              <button
                onClick={()=>toggleLike(e.id)}
                style={{
                  marginTop:10,
                  padding:"8px 14px",
                  border:"none",
                  borderRadius:8,
                  cursor:"pointer",
                  transition:"0.3s",
                  transform: likedEvents[e.id] ? "scale(1.1)" : "scale(1)",
                  background: likedEvents[e.id] ? "#be185d" : "#f9a8d4",
                  color:"#fff",
                  fontWeight:"bold",
                  display:"block"
                }}
              >
                👍 {likedEvents[e.id] ? 1 : 0}
              </button>

            </div>
          ))}
        </>
      )}
    </>
  );
}

const card = {
  border: "1px solid #e5e7eb",
  padding: "18px",
  marginTop: "20px",
  borderRadius: "12px",
  background: "#ffffff",
  boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
  maxWidth: "420px",
  marginLeft: "auto",
  marginRight: "auto"
};
const calendarWrapper = {
  width: "320px",
  margin: "20px auto",
  border: "2px solid #e5e7eb",
  borderRadius: "12px",
  padding: "10px",
  background: "#ffffff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
};