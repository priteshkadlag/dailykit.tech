const RAW_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-W54M67CV";

/** Google Tag Manager container id; only a well-formed id is ever written into a script or URL. */
export const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/.test(RAW_ID) ? RAW_ID : null;

/** Production builds only, so local development doesn't send test visits to Google. */
export const GTM_ENABLED = process.env.NODE_ENV === "production" && GTM_ID !== null;
