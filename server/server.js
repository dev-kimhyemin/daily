// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// 🔧 CORS 설정
// ==============================
// 배포 시 Render 환경변수 FRONTEND_ORIGIN 을 다음처럼 추가해야 함:
// FRONTEND_ORIGIN=https://<your-vercel-domain>.vercel.app
// (로컬 개발 시 fallback 으로 localhost:3000 허용)
const allowOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: allowOrigin,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ==============================
// 📂 참가자 폴더 경로
// ==============================
const participantsDir = path.join(__dirname, "assets/participants");

// ==============================
// 🧾 요청 로깅 (디버그용)
// ==============================
app.use((req, res, next) => {
  console.log(`👉 [${req.method}] ${req.url}`);
  next();
});

// ==============================
// 👥 참가자 목록 API
// ==============================
app.get("/api/participants", (req, res) => {
  fs.readdir(participantsDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error("❌ 참가자 폴더 읽기 실패:", err);
      return res.status(500).json({ error: "폴더 읽기 실패" });
    }

    const folders = files.filter((d) => d.isDirectory()).map((d) => d.name);
    res.json(folders);
  });
});

// ==============================
// 🖼️ 참가자별 이미지 목록 API
// ==============================
app.get("/api/participants/:name/images", (req, res) => {
  const participantName = decodeURIComponent(req.params.name);
  const participantPath = path.join(participantsDir, participantName);

  fs.readdir(participantPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`❌ 폴더 읽기 실패: ${participantName}`, err);
      return res.status(500).json({ error: "참가자 폴더 읽기 실패" });
    }

    const imageFiles = files
      .filter((f) => f.isFile() && /\.(jpe?g|png|gif|bmp|webp)$/i.test(f.name))
      .map((f) => ({
        filename: f.name,
        url: `/participants/${encodeURIComponent(participantName)}/${encodeURIComponent(f.name)}`,
      }));

    res.json(imageFiles);
  });
});

// ==============================
// 🧱 정적 파일 서비스 (이미지)
// ==============================
app.use(
  "/participants",
  express.static(path.join(__dirname, "assets/participants"), {
    extensions: ["jpg", "jpeg", "png", "gif", "webp"],
  })
);

// ==============================
// 🩺 상태 확인용 엔드포인트
// ==============================
app.get("/healthz", (_, res) => res.send("ok"));

// ==============================
// 🏁 루트 페이지 (간단 안내)
// ==============================
app.get("/", (_, res) => {
  res.send("✅ Daily API 서버가 정상 동작 중입니다.");
});

// ==============================
// 🚀 서버 실행
// ==============================
app.listen(PORT, () => {
  console.log(`✅ API 서버 실행 중: http://localhost:${PORT}`);
});
