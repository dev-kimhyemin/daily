import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);
const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const COLORS = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  line: "#E6E9F2",
  text: "#1F2937",
  sub: "#6B7280",
  primary: "#2563EB",
  eventBg: "#E0E7FF",
};

function App() {
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventImages, setSelectedEventImages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeParticipant, setActiveParticipant] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/participants`)
      .then((res) => res.json())
      .then(setParticipants)
      .catch((err) => console.error("참가자 데이터 호출 실패", err));
  }, []);

  const loadParticipantData = (name) => {
    setActiveParticipant(name);
    fetch(`${API_BASE}/api/participants/${encodeURIComponent(name)}/images`)
      .then((res) => res.json())
      .then((images) => {
        const grouped = {};
        images.forEach((img) => {
          const absoluteUrl = `${API_BASE}${img.url}`;
          const m = img.filename.match(/(\d{8})/);
          const date = m ? moment(m[1], "YYYYMMDD").toDate() : new Date();
          const key = moment(date).format("YYYY-MM-DD");
          if (!grouped[key]) {
            grouped[key] = {
              id: `${name}-${key}`,
              title: `${name} 활동`,
              start: date,
              end: date,
              allDay: true,
              images: [],
            };
          }
          grouped[key].images.push(absoluteUrl);
        });
        setEvents(Object.values(grouped));
      })
      .catch((err) => console.error("이미지 데이터 불러오기 실패", err));
  };

  const handleEventClick = (event) => {
    setSelectedEventImages(event.images || []);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEventImages([]);
  };

  const Toolbar = (toolbar) => {
    const label = moment(toolbar.date).format("YYYY. MM");
    return (
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-title">{label}</span>
          <span className="toolbar-sub">
            {activeParticipant ? `· ${activeParticipant}` : "· 참가자 선택"}
          </span>
        </div>
        <div className="toolbar-right">
          <button className="nav-btn" onClick={() => toolbar.onNavigate("PREV")}>이전</button>
          <button className="nav-btn" onClick={() => toolbar.onNavigate("TODAY")}>오늘</button>
          <button className="nav-btn" onClick={() => toolbar.onNavigate("NEXT")}>다음</button>
        </div>
      </div>
    );
  };

  const EventChip = ({ event }) => {
    const count = event.images?.length || 0;
    return (
      <div className="event-chip">
        <div className="dot" />
        <span className="title">{event.title}</span>
        {count > 0 && <span className="count">{count}장</span>}
      </div>
    );
  };

  const calendarStyles = useMemo(
    () => ({
      style: {
        height: "92vh",
        borderRadius: 16,
        background: COLORS.card,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
      },
    }),
    []
  );

  return (
    <div className="app">
      <aside className="sidebar">
        {/* ✅ 텍스트 수정 */}
        <div className="summary">
          <div className="label">활동 기간</div>
          <div className="value">{events.length}일</div>
          <div className="desc">이벤트를 클릭하면 인증 이미지를 확인할 수 있어요.</div>
        </div>

        {/* ✅ 데스크톱용만 버튼 표시 */}
        <div className="list desktop-only">
          <div className="list-title">참가자</div>
          {participants.map((name) => {
            const active = name === activeParticipant;
            return (
              <button
                key={name}
                onClick={() => loadParticipantData(name)}
                className={`participant ${active ? "active" : ""}`}
              >
                <span>{name}</span>
                <span className="load">{active ? "선택됨" : "불러오기"}</span>
              </button>
            );
          })}
        </div>

        {/* ✅ 모바일 전용 드롭다운 */}
        <div className="mobile-only">
          <label className="mobile-label">참가자 선택</label>
          <select
            value={activeParticipant || ""}
            onChange={(e) => loadParticipantData(e.target.value)}
            className="mobile-select"
          >
            <option value="" disabled>
              참가자 선택
            </option>
            {participants.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <main className="main">
        <div style={calendarStyles.style}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="month"
            defaultDate={new Date()}
            views={["month", "week", "day"]}
            components={{ toolbar: Toolbar, event: EventChip }}
            popup
            selectable
            onSelectEvent={handleEventClick}
          />
        </div>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {selectedEventImages.map((url, i) => (
              <img key={i} src={url} alt={`img-${i}`} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        /* ✅ 드롭다운 안 보이게 (웹) */
        .mobile-only {
          display: none;
        }

        /* ✅ 드롭다운은 모바일에서만 보이게 */
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only {
            display: flex !important;
            flex-direction: column;
            gap: 6px;
            padding: 10px;
            background: ${COLORS.card};
            border-radius: 12px;
            border: 1px solid ${COLORS.line};
          }
        }
      `}</style>
    </div>
  );
}

export default App;
