import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared hosting caps how many processes a build may start; two page-generation workers stay well under it.
  experimental: { cpus: 2 },
  // `next dev` keeps Turbopack, which needs no extra config; declaring it stops Next refusing to start
  // because a webpack config is present.
  turbopack: {},
  // Production builds use webpack (`npm run build`): Turbopack's separate PostCSS worker crashes on
  // hosts with tight process/memory limits such as Hostinger. Dev still uses Turbopack, which ignores this.
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // pptxgenjs (PDF to PowerPoint) only uses node:fs / node:https when running in Node.
      // Strip the "node:" prefix so the fallbacks below can stub them out of the browser bundle.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, https: false };
    }
    return config;
  },
};

export default nextConfig;
