// App.js
import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);
// ✅ URL 끝 슬래시 제거 (무조건 /api 앞에 하나만 붙게)
const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

// 팔레트 (파스텔)
const COLORS = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  line: "#E6E9F2",
  text: "#1F2937",
  sub: "#6B7280",
  primary: "#60A5FA",      // 파스텔 블루
  success: "#34D399",      // 파스텔 그린
  accent: "#FBCFE8",       // 파스텔 핑크
  eventBg: "#E5F0FF",      // 이벤트 칩 배경
};

function App() {
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventImages, setSelectedEventImages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeParticipant, setActiveParticipant] = useState("");

  // ===== 초기 참가자 로드 =====
  useEffect(() => {
    fetch(`${API_BASE}/api/participants`)
      .then((res) => res.json())
      .then((data) => setParticipants(data))
      .catch((err) => console.error("참가자 데이터 호출 실패", err));
  }, []);

  // ===== 참가자 클릭 → 이미지 로드 & 날짜별 그룹핑 =====
  const handleParticipantClick = (participantName) => {
    setActiveParticipant(participantName);

    fetch(`${API_BASE}/api/participants/${encodeURIComponent(participantName)}/images`)
      .then((res) => res.json())
      .then((images) => {
        const grouped = {};
        images.forEach((img) => {
          // 이미지 url 앞에 API_BASE 붙이기 (중요!)
          const absoluteUrl = `${API_BASE}${img.url}`;

          const m =
            img.filename.match(/KakaoTalk_(\d{8})/) ||
            img.filename.match(/(\d{8})/);
          const date = m ? moment(m[1], "YYYYMMDD").toDate() : new Date();
          const key = moment(date).format("YYYY-MM-DD");

          if (!grouped[key]) {
            grouped[key] = {
              id: `${participantName}-${key}`,
              title: `${participantName} 활동`,
              start: date,
              end: date,
              allDay: true,
              images: [],
            };
          }
          grouped[key].images.push(absoluteUrl); // ✅ 절대경로 저장
        });

        setEvents(Object.values(grouped));
      })
      .catch((error) => console.error("이미지 데이터 불러오기 실패", error));
  };

  // ===== 이벤트 클릭 → 갤러리 모달 =====
  const handleEventClick = (event) => {
    setSelectedEventImages(event.images || []);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedEventImages([]);
  };

  // ===== 커스텀 툴바 (업무 기록 서비스 느낌) =====
  const Toolbar = (toolbar) => {
    const label = moment(toolbar.date).format("YYYY. MM");
    return (
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
            {label}
          </div>
          <div style={{ fontSize: 12, color: COLORS.sub }}>
            {activeParticipant ? `· ${activeParticipant}` : "· 참가자 선택"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ToolButton onClick={() => toolbar.onNavigate("PREV")}>이전</ToolButton>
          <ToolButton onClick={() => toolbar.onNavigate("TODAY")}>오늘</ToolButton>
          <ToolButton onClick={() => toolbar.onNavigate("NEXT")}>다음</ToolButton>
        </div>
      </div>
    );
  };

  const ToolButton = ({ onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        height: 36,
        padding: "0 14px",
        borderRadius: 12,
        border: `1px solid ${COLORS.line}`,
        background: "#F8FAFF",
        color: COLORS.text,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );

  // ===== 이벤트 칩 렌더러 (모바일 카드 느낌) =====
  const EventChip = ({ event }) => {
    const count = event.images?.length || 0;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 8px",
          background: COLORS.eventBg,
          color: COLORS.text,
          borderRadius: 10,
          border: `1px solid ${COLORS.line}`,
          fontSize: 12,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: COLORS.primary,
          }}
        />
        <div style={{ fontWeight: 600 }}>{event.title}</div>
        {count > 0 && (
          <span
            style={{
              marginLeft: "auto",
              background: COLORS.card,
              border: `1px solid ${COLORS.line}`,
              padding: "2px 6px",
              borderRadius: 999,
              fontSize: 11,
              color: COLORS.sub,
            }}
          >
            {count}장
          </span>
        )}
      </div>
    );
  };

  // ===== 캘린더 스타일 최적화 =====
  const calendarStyles = useMemo(
    () => ({
      style: {
        height: "92vh",
        borderRadius: 16,
        background: COLORS.card,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden",
      },
      dayPropGetter: () => ({
        style: { borderColor: COLORS.line },
      }),
      slotPropGetter: () => ({
        style: { borderColor: COLORS.line },
      }),
      eventPropGetter: () => ({
        style: {
          backgroundColor: "transparent",
          border: "none",
          padding: 0,
        },
      }),
    }),
    []
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,"Apple SD Gothic Neo","Noto Sans KR",sans-serif',
        background: COLORS.bg,
      }}
    >
      {/* 좌측: 참가자 패널 */}
      <aside
        style={{
          width: 280,
          minWidth: 240,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* 상단 요약 카드 */}
        <div
          style={{
            background: COLORS.card,
            borderRadius: 16,
            border: `1px solid ${COLORS.line}`,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.sub, marginBottom: 6 }}>
            기간 합계
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>
            {events.length}일 활동
          </div>
          <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 6 }}>
            이벤트를 클릭하면 인증 이미지를 확인할 수 있어요.
          </div>
        </div>

        {/* 참가자 리스트 */}
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
          <div
            style={{
              fontSize: 13,
              color: COLORS.sub,
              padding: "2px 6px 8px",
            }}
          >
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
                  border: `1px solid ${active ? COLORS.primary : COLORS.line}`,
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
                  불러오기
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 우측: 캘린더 */}
      <main style={{ flex: 1, padding: "16px 16px 16px 0" }}>
        <div style={calendarStyles.style}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="month"
            defaultDate={new Date()}
            views={["month", "week", "day"]}
            components={{
              toolbar: Toolbar,
              event: EventChip,
            }}
            popup
            selectable
            dayPropGetter={calendarStyles.dayPropGetter}
            slotPropGetter={calendarStyles.slotPropGetter}
            eventPropGetter={calendarStyles.eventPropGetter}
            onSelectEvent={handleEventClick}
          />
        </div>
      </main>

      {/* 모달: 이미지 갤러리 */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(17,24,39,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: COLORS.card,
              borderRadius: 16,
              border: `1px solid ${COLORS.line}`,
              padding: 12,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              maxWidth: "92vw",
              maxHeight: "55vh",
              overflowX: "auto",
            }}
          >
            {selectedEventImages.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`이미지 ${idx + 1}`}
                style={{
                  maxHeight: "50vh",
                  height: "auto",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 12,
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
