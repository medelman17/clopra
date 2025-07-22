import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing Next.js configuration
  
  // Hide source maps in production
  productionBrowserSourceMaps: false,
  
  // Security: Block source maps from being publicly accessible
  async rewrites() {
    return process.env.VERCEL_ENV === 'production' 
      ? {
          beforeFiles: [
            { source: '/:path*.map', destination: '/404' }
          ]
        }
      : { beforeFiles: [] };
  },
};

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "fortai-legal",
    project: "clopra",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Configure source maps
    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },
  }
);