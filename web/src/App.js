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
      {/* ===== 사이드바 ===== */}
      <aside className="sidebar">
        <div className="summary">
          <div className="label">기간 합계</div>
          <div className="value">{events.length}일 활동</div>
          <div className="desc">이벤트를 클릭하면 인증 이미지를 확인할 수 있어요.</div>
        </div>

        {/* 데스크톱 참가자 리스트 */}
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

        {/* 모바일 드롭다운 */}
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

      {/* ===== 메인 (캘린더) ===== */}
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

      {/* ===== 팝업 모달 ===== */}
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
        .app {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100vh;
          background: ${COLORS.bg};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans KR", sans-serif;
        }

        .sidebar {
          width: 280px;
          min-width: 240px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-right: 1px solid ${COLORS.line};
          background: ${COLORS.bg};
        }

        .main {
          flex: 1; /* ✅ 캘린더 더 넓게 */
          padding: 24px;
          overflow: hidden;
          min-width: 0;
        }

        .summary {
          background: ${COLORS.card};
          border-radius: 16px;
          border: 1px solid ${COLORS.line};
          padding: 16px;
        }
        .summary .label { font-size: 14px; color: ${COLORS.sub}; }
        .summary .value { font-size: 22px; font-weight: 800; margin-top: 4px; color: ${COLORS.text}; }
        .summary .desc { font-size: 12px; color: ${COLORS.sub}; margin-top: 8px; }

        .list {
          background: ${COLORS.card};
          border-radius: 16px;
          border: 1px solid ${COLORS.line};
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .list-title { font-size: 13px; color: ${COLORS.sub}; padding: 4px 8px 8px; }

        .participant {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid ${COLORS.line};
          background: #fafbff;
          color: ${COLORS.text};
          font-size: 14px;
        }
        .participant.active {
          background: #eff6ff;
          border-color: ${COLORS.primary};
        }
        .participant .load {
          font-size: 12px;
          color: ${COLORS.sub};
        }
        .participant.active .load {
          color: ${COLORS.primary};
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid ${COLORS.line};
          background: ${COLORS.card};
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
        }

        .toolbar-left {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .toolbar-title { font-size: 20px; font-weight: 700; color: ${COLORS.text}; }
        .toolbar-sub { font-size: 12px; color: ${COLORS.sub}; }
        .toolbar-right { display: flex; gap: 8px; }

        .nav-btn {
          height: 34px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid ${COLORS.line};
          background: #f0f4ff;
          color: ${COLORS.text};
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .nav-btn:hover {
          background: ${COLORS.primary};
          color: white;
          border-color: ${COLORS.primary};
        }

        .event-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: ${COLORS.primary};
          color: white;
          border-radius: 10px;
          padding: 5px 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: white;
        }

        /* ===== 모달 팝업 ===== */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .modal {
          background: ${COLORS.card};
          border-radius: 16px;
          border: 1px solid ${COLORS.line};
          padding: 16px;
          display: flex;
          gap: 8px;
          max-width: 90vw;
          max-height: 70vh;
          overflow-x: auto;
        }
        .modal img {
          max-height: 60vh;
          height: auto;
          width: auto;
          object-fit: contain;
          border-radius: 12px;
          border: 1px solid ${COLORS.line};
        }

        /* ===== 반응형 ===== */
        @media (max-width: 768px) {
          .app { flex-direction: column; }
          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid ${COLORS.line};
          }
          .main { padding: 8px; }
          .rbc-calendar { height: 70vh !important; }
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
