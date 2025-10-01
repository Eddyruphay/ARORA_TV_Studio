import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SCHEDULE_URL: process.env.SCHEDULE_URL,
  },
};

export default nextConfig;