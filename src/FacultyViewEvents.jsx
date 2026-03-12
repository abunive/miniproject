import { useEffect, useState } from "react";
import { db } from "./firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function FacultyViewEvents() {

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  /* 🔥 REALTIME EVENTS */
  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "Events"),
      snap => {

        const list = [];

        snap.docs.forEach(d => {

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

        });

        setEvents(list);
        setLoading(false);

      }
    );

    return () => unsubscribe();

  }, []);

  /* 📅 Approved Events */
  const approvedEvents = events.filter(e => e.status === "approved");

  /* 📅 Events for selected date */
  const eventsForSelectedDate = approvedEvents.filter(e => {
    if (!e.realDate) return false;

    return (
      e.realDate.getDate() === selectedDate.getDate() &&
      e.realDate.getMonth() === selectedDate.getMonth() &&
      e.realDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  /* 🔴 Highlight event dates */
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
            <p style={{textAlign:"center"}}>
              No approved events on this date
            </p>
          )}

          {eventsForSelectedDate.map(e => (

            <div key={e.id} style={card}>

              <h3>{e.title}</h3>

              <p><b>Date:</b> {e.eventDate}</p>

              <p><b>Description : </b>{e.description}</p>

              <p><b>Status:</b> {e.status}</p>
              <p><b>Interest Count:</b> {e.interestCount || 0}</p>

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
                <p style={{
                  marginTop:10,
                  color:"red",
                  fontWeight:"bold"
                }}>
                  No image for poster
                </p>
              )}

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