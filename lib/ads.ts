const RAW_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-8697520535441690";

/** AdSense publisher id ("ca-pub-…"); only a well-formed id is ever written into a URL or meta tag. */
export const ADSENSE_CLIENT = /^ca-pub-\d{10,20}$/.test(RAW_CLIENT) ? RAW_CLIENT : null;

/** Ad units created in AdSense → Ads → By ad unit. */
export const AD_SLOTS = {
  /** "test1": responsive display unit shown below each tool and each blog article. */
  inContent: "1031215839",
  /** Multiplex ("autorelaxed") unit: a grid of ads at the end of tool pages and blog posts. */
  multiplex: "1079317295",
} as const;

/** Production builds only, so local development never requests (or clicks) real ads. */
export const ADSENSE_ENABLED = process.env.NODE_ENV === "production" && ADSENSE_CLIENT !== null;
