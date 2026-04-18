// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://8a720d25e865ebf396fe3959de799b5d@o4511241806020608.ingest.de.sentry.io/4511241806479440",

  integrations: [Sentry.replayIntegration()],

  // Sample 10% of traces in prod (quota-friendly), 100% in dev
  tracesSampleRate: isProd ? 0.1 : 1,
  enableLogs: true,

  // Session Replay: 10% random + 100% on errors
  replaysSessionSampleRate: isProd ? 0.05 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: true,

  // Silence known noisy errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    // Auth redirects / cancelled fetches on navigation
    "AbortError",
    "The user aborted a request",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
