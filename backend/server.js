import express from "express";
import cors from "cors";
import { YtDlp } from "ytdlp-nodejs";

const app = express();
const PORT = process.env.PORT || 8080;
const ytdlp = new YtDlp();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : null;

app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length ? allowedOrigins : "*",
  })
);
app.use(express.json({ limit: "1mb" }));

app.post("/download", async (req, res) => {
  const { url, format } = req.body ?? {};

  if (!url || !format) {
    return res.status(400).json({ message: "url and format are required" });
  }

  const normalizedFormat = String(format).toLowerCase();
  const isAudioOnly = normalizedFormat === "mp3";
  const downloadFormat = isAudioOnly
    ? { filter: "audioonly", type: "mp3", quality: "highest" }
    : { filter: "audioandvideo", type: "mp4", quality: "highest" };

  try {
    const titlePromise = ytdlp.getTitleAsync(url).catch(() => null);
    const pipeResponse = ytdlp.stream(url, { format: downloadFormat });

    if (!pipeResponse) {
      throw new Error("Stream could not be created");
    }

    const title = await titlePromise;
    const safeTitle = title
      ? title.replace(/[^\w\d-_ ]+/g, "").replace(/\s+/g, " ").trim()
      : "download";

    const filename = `${safeTitle || "download"}.${isAudioOnly ? "mp3" : "mp4"}`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      isAudioOnly ? "audio/mpeg" : "video/mp4"
    );
    res.setHeader("Cache-Control", "no-store");

    await pipeResponse.pipeAsync(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Unable to download file" });
    } else {
      res.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
