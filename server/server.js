const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// 프론트 도메인에서만 허용(배포 후 FRONTEND_ORIGIN을 Render에 설정)
const allowOrigin = process.env.FRONTEND_ORIGIN || "*";
app.use(cors({ origin: allowOrigin }));

const participantsDir = path.join(__dirname, "assets/participants");

// 요청 로깅 (필요 없으면 주석)
app.use((req, res, next) => {
  console.log("👉", req.method, req.url);
  next();
});

// 참가자 목록
app.get("/api/participants", (req, res) => {
  fs.readdir(participantsDir, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: "폴더 읽기 실패" });
    const folders = files.filter((d) => d.isDirectory()).map((d) => d.name);
    res.json(folders);
  });
});

// 참가자 이미지
app.get("/api/participants/:name/images", (req, res) => {
  const participantName = decodeURIComponent(req.params.name);
  const participantPath = path.join(participantsDir, participantName);

  fs.readdir(participantPath, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: "참가자 폴더 읽기 실패" });

    const imageFiles = files
      .filter((f) => f.isFile() && /\.(jpe?g|png|gif|bmp|webp)$/i.test(f.name))
      .map((f) => ({
        filename: f.name,
        url: `/participants/${encodeURIComponent(participantName)}/${encodeURIComponent(f.name)}`
      }));

    res.json(imageFiles);
  });
});

// 정적 파일 (이미지)
app.use("/participants", express.static(path.join(__dirname, "assets/participants")));

app.get("/healthz", (_, res) => res.send("ok"));

app.listen(PORT, () => {
  console.log(`✅ API http://localhost:${PORT}`);
});
