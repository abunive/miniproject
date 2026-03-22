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
      return <div className="event-dot"></div>;
    }
  }
};

  return (
    <>
     <h2 >
        Approved Events Calendar
      </h2>

      {loading && <p>Loading events...</p>}

      {!loading && (
        <>
              <div className="calendar-wrapper">
  <Calendar
    onChange={setSelectedDate}
    value={selectedDate}
    tileContent={tileContent}
  />
</div>
          <h3 className="event-date-heading">
  Events on {selectedDate.toLocaleDateString()}
</h3>

        {eventsForSelectedDate.length === 0 && (
  <p className="no-events">No approved events on this date</p>
)}

          {eventsForSelectedDate.map(e => (
            <div key={e.id} className="event-card">

              <h3>{e.title}</h3>

              <p><b>Date:</b> {e.eventDate}</p>

              <p>{e.description}</p>

              {e.posterURL ? (
               <img src={e.posterURL} alt="poster" className="event-image" />
              ) : (
               
                <p className="no-image">No image for poster</p>
              )}

             <button
  onClick={() => toggleLike(e.id)}
  className={`like-btn ${likedEvents[e.id] ? "liked" : ""}`}
>
  <i className="fas fa-heart"></i> {likedEvents[e.id] ? 1 : 0}
</button>

            </div>
          ))}
        </>
      )}
    </>
  );
}
