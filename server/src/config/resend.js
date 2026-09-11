import { Resend } from "resend";

// Unlike cloudinary.js's config() call, `new Resend(...)` throws
// immediately if the key is missing or empty — it doesn't tolerate being
// constructed with a blank value the way Cloudinary's client does. So
// this can't build the client eagerly at import time the way
// cloudinary.js does: every file that transitively imports the auth
// controller (which is most of the app, via app.js) would crash at
// import time in any environment without RESEND_API_KEY set, including
// the test suite. Building it lazily, only once a caller has already
// confirmed the key exists (see utils/email.js), keeps the same "fails
// only when actually used" behavior Cloudinary gets for free (ADR-062).
export const getResendClient = () => new Resend(process.env.RESEND_API_KEY);
