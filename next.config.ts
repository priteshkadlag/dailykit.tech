import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared hosting caps how many processes a build may start; two page-generation workers stay well under it.
  experimental: { cpus: 2 },
  // `next dev` keeps Turbopack, which needs no extra config; declaring it stops Next refusing to start
  // because a webpack config is present.
  turbopack: {},
  // One canonical host: www.<domain> → <domain> (or the reverse when the site URL itself uses www).
  async redirects() {
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    if (site.hostname === "localhost" || /^\d+(\.\d+){3}$/.test(site.hostname)) return [];
    const other = site.hostname.startsWith("www.") ? site.hostname.slice(4) : `www.${site.hostname}`;
    return [{ source: "/:path*", has: [{ type: "host", value: other }], destination: `${site.origin}/:path*`, permanent: true }];
  },
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
