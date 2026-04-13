import type NextConfig from "next";

const nextConfig: NextConfig = {
  // Enable React 19 features
  reactStrictMode: true,

  // React Compiler (auto-memoizes, eliminates manual useMemo/useCallback)
  reactCompiler: true,

  // Optimize images for the diagram builder
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow images from common sources
    remotePatterns: [],
  },

  // Enable cache components for Next.js 16+ partial prerendering
  cacheComponents: true,

  // Compress output
  compress: true,

  // Optimize webpack for production
  productionBrowserSourceMaps: false,

  // Security headers — CSP allows inline scripts for next-themes,
  // Hugeicons icon components, blob: for html-to-image exports,
  // and 'unsafe-eval' for React dev mode debugging features.
  // Note: In production, 'unsafe-eval' can be removed for stricter CSP.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
              "frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
