import { test as base } from "@playwright/test";

type DiagnosticsFixtures = {
  collectBrowserDiagnostics: void;
};

function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

export const test = base.extend<DiagnosticsFixtures>({
  collectBrowserDiagnostics: [
    async ({ page }, use, testInfo) => {
      const events: string[] = [];

      page.on("pageerror", (error) => {
        events.push(`[pageerror] ${error.stack ?? error.message}`);
      });

      page.on("console", (message) => {
        if (message.type() === "error") {
          events.push(`[console.error] ${message.text()}`);
        }
      });

      page.on("requestfailed", (request) => {
        events.push(
          `[requestfailed] ${request.method()} ${redactUrl(request.url())} — ${request.failure()?.errorText ?? "unknown error"}`,
        );
      });

      page.on("response", (response) => {
        if (response.status() < 400) {
          return;
        }

        const request = response.request();
        const resourceType = request.resourceType();
        if (
          ["document", "script", "stylesheet", "xhr", "fetch"].includes(
            resourceType,
          )
        ) {
          events.push(
            `[http ${response.status()}] ${resourceType} ${redactUrl(response.url())}`,
          );
        }
      });

      try {
        await use();
      } finally {
        let pageState = "Page state unavailable.";
        try {
          pageState = JSON.stringify(
            await page.evaluate(() => ({
              url: window.location.pathname,
              readyState: document.readyState,
              htmlClass: document.documentElement.className,
            })),
            null,
            2,
          );
        } catch (error) {
          pageState =
            error instanceof Error
              ? `Page state collection failed: ${error.message}`
              : "Page state collection failed.";
        }

        const diagnosticText = [
          `Test: ${testInfo.title}`,
          `Project: ${testInfo.project.name}`,
          `Outcome: ${testInfo.status ?? "unknown"}`,
          `Page state: ${pageState}`,
          "",
          "Browser events:",
          events.length > 0
            ? events.join("\n")
            : "No page errors, console errors, failed requests, or relevant HTTP errors captured.",
          "",
        ].join("\n");

        await testInfo.attach("browser-diagnostics.txt", {
          body: Buffer.from(diagnosticText),
          contentType: "text/plain",
        });
      }
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
