import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);
const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

// 색상 팔레트
const COLORS = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  line: "#E6E9F2",
  text: "#1F2937",
  sub: "#6B7280",
  primary: "#2563EB",
  eventBg: "#1E3A8A", // 남색
  eventText: "#FFFFFF",
};

function App() {
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventImages, setSelectedEventImages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeParticipant, setActiveParticipant] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 화면 크기 감지 (반응형)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 참가자 목록 불러오기
  useEffect(() => {
    fetch(`${API_BASE}/api/participants`)
      .then((res) => res.json())
      .then((data) => setParticipants(data))
      .catch((err) => console.error("참가자 데이터 호출 실패", err));
  }, []);

  // 참가자 클릭 → 이미지 로드
  const handleParticipantClick = (name) => {
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

  // 이벤트 클릭 → 모달
  const handleEventClick = (event) => {
    setSelectedEventImages(event.images || []);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEventImages([]);
  };

  // 캘린더 스타일
  const calendarStyles = useMemo(
    () => ({
      style: {
        height: "90vh",
        borderRadius: 16,
        background: COLORS.card,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
      },
    }),
    []
  );

  // 툴바
  const Toolbar = (toolbar) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: `1px solid ${COLORS.line}`,
        background: COLORS.card,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>
          {moment(toolbar.date).format("YYYY. MM")}
        </div>
        <div style={{ fontSize: 12, color: COLORS.sub }}>
          {activeParticipant ? `· ${activeParticipant}` : "· 참가자 선택"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {["이전", "오늘", "다음"].map((label, i) => (
          <button
            key={i}
            onClick={() =>
              toolbar.onNavigate(["PREV", "TODAY", "NEXT"][i])
            }
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 10,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.bg,
              color: COLORS.text,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  // 이벤트 칩
  const EventChip = ({ event }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px",
        background: COLORS.eventBg,
        color: COLORS.eventText,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: COLORS.card,
        }}
      />
      <div>{event.title}</div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        width: "100vw",
        height: "100vh",
        background: COLORS.bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans KR", sans-serif',
      }}
    >
      {/* 좌측 (또는 상단) 참가자 패널 */}
      <aside
        style={{
          width: isMobile ? "100%" : 280,
          minWidth: isMobile ? "100%" : 260,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* 요약 */}
        <div
          style={{
            background: COLORS.card,
            borderRadius: 16,
            border: `1px solid ${COLORS.line}`,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.sub, marginBottom: 6 }}>
            활동 기간
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>
            {events.length}일
          </div>
          <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 6 }}>
            이벤트를 클릭하면 인증 이미지를 확인할 수 있어요.
          </div>
        </div>

        {/* 참가자 선택 */}
        {isMobile ? (
          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.line}`,
              borderRadius: 12,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 13, color: COLORS.sub, marginBottom: 6 }}>
              참가자 선택
            </div>
            <select
              value={activeParticipant}
              onChange={(e) => handleParticipantClick(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${COLORS.line}`,
                fontSize: 14,
              }}
            >
              <option value="">선택하세요</option>
              {participants.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div
            style={{
              background: COLORS.card,
              borderRadius: 16,
              border: `1px solid ${COLORS.line}`,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, color: COLORS.sub, padding: "2px 6px" }}>
              참가자
            </div>
            {participants.map((name) => {
              const active = name === activeParticipant;
              return (
                <button
                  key={name}
                  onClick={() => handleParticipantClick(name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${
                      active ? COLORS.primary : COLORS.line
                    }`,
                    background: active ? "#EFF6FF" : "#FAFBFF",
                    color: COLORS.text,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: active ? COLORS.primary : COLORS.sub,
                    }}
                  >
                    {active ? "선택됨" : "불러오기"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* 캘린더 */}
      <main style={{ flex: 1, padding: isMobile ? "0 8px 16px" : "16px 16px 16px 0" }}>
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
            onSelectEvent={handleEventClick}
          />
        </div>
      </main>

      {/* 팝업 모달 */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: COLORS.card,
              borderRadius: 16,
              padding: 16,
              maxWidth: "90vw",
              maxHeight: "80vh",
              overflowY: "auto",
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {selectedEventImages.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`이미지 ${idx + 1}`}
                style={{
                  maxHeight: "40vh",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.line}`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
