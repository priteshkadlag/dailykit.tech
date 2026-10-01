const RAW_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-8697520535441690";

/** AdSense publisher id ("ca-pub-…"); only a well-formed id is ever written into a URL or meta tag. */
export const ADSENSE_CLIENT = /^ca-pub-\d{10,20}$/.test(RAW_CLIENT) ? RAW_CLIENT : null;

/** Production builds only, so local development never requests (or clicks) real ads. */
export const ADSENSE_ENABLED = process.env.NODE_ENV === "production" && ADSENSE_CLIENT !== null;
