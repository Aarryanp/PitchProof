// Switches for tools that cost credits. Both are OFF unless the environment
// variable is set to "on", so the agent only reuses saved results until
// Aarryan decides to spend credits.
//   CRUSTDATA_LIVE=on  lets the find step ask Crustdata for new businesses.
//   OLOSTEP_LIVE=on    lets the audit read websites we haven't read before.
// PageSpeed and Gemini are free at our volume, so they need only a key.

export const crustdataLive = () => process.env.CRUSTDATA_LIVE === "on";
export const olostepLive = () => process.env.OLOSTEP_LIVE === "on";

// Most businesses one Crustdata call may return (0.03 credits each).
export const CRUSTDATA_MAX_PER_CALL = 20;
