/** @type {import('next').NextConfig} */
const nextConfig = {
  // The crush serve URL is read server-side by the proxy route
  // (app/api/crush/[...path]/route.ts) from CRUSH_SERVE_URL, so it
  // never needs to be exposed to the browser bundle. Defaulting it
  // here too just documents the expected shape.
  env: {
    CRUSH_SERVE_URL: process.env.CRUSH_SERVE_URL || "http://127.0.0.1:36000",
  },
};

export default nextConfig;
