import type { NextConfig } from "next";
import dotenv from "dotenv";

const env = process.env.ENV ?? "development";
dotenv.config({ path: `.env.${env}` });

const rawApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "https://ask.all-time-high.ai/";

const API_URL = process.env.NODE_ENV === "production" ? rawApiUrl : rawApiUrl;

const normalizedDevProxyTarget = API_URL.replace(/\/$/, "");

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  turbopack: {},
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NODE_ENV !== "production" ? "/api-proxy" : API_URL,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [],
  },
  output: "standalone",
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/api-proxy/:path*",
          destination: `${normalizedDevProxyTarget}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
