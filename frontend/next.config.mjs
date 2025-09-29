const configuredDevOrigins = process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: Array.from(
    new Set([
      "localhost",
      "127.0.0.1",
      "https://yt-download-wlmo-git-main-burberryonns-projects-dcec7371.vercel.app/",
      ...(configuredDevOrigins ?? []),
    ])
  ),
};

export default nextConfig;
