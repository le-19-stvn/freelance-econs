// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://8a720d25e865ebf396fe3959de799b5d@o4511241806020608.ingest.de.sentry.io/4511241806479440",

  // Sample 10% of server traces in prod, 100% in dev
  tracesSampleRate: isProd ? 0.1 : 1,
  enableLogs: true,
  sendDefaultPii: true,
});
