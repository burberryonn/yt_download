"use client";

import { useState } from "react";

const FORMATS = [
  { value: "mp4", label: "MP4 (video)" },
  { value: "mp3", label: "MP3 (audio)" },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function Home() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!API_BASE_URL) {
      setError("Backend base URL is not configured.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, format }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Download failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch = contentDisposition
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.toLowerCase().startsWith("filename="));

      const rawFilename = filenameMatch?.split("=")[1]?.replaceAll('"', "");
      const filename = rawFilename && rawFilename.length
        ? rawFilename
        : `download.${format}`;

      const objectUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = objectUrl;
      tempLink.download = filename;
      tempLink.style.display = "none";
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
      URL.revokeObjectURL(objectUrl);

      setInfo("Download started");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">YouTube downloader</h1>
          <p className="text-sm text-slate-400">
            Paste a URL and choose the output format to download through the backend service.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">YouTube URL</span>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Format</span>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              {FORMATS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Download"}
          </button>
        </form>

        {(error || info) && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              error ? "bg-red-500/10 text-red-400 border border-red-500/50" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
            }`}
          >
            {error || info}
          </div>
        )}

        <footer className="text-xs text-slate-500 text-center">
          Backend URL: {API_BASE_URL || "not set"}
        </footer>
      </div>
    </main>
  );
}
