import { expect, test } from "./fixtures";

test("Playwright build serves same-origin assets without HTTPS upgrades", async ({
  page,
}) => {
  const failedNextAssets: string[] = [];
  page.on("requestfailed", (request) => {
    if (
      request.url().includes("localhost:3000/_next/static/") ||
      request.url().includes("127.0.0.1:3000/_next/static/")
    ) {
      failedNextAssets.push(request.url());
    }
  });

  const response = await page.goto("/");
  expect(response).not.toBeNull();

  const headers = response?.headers() ?? {};
  const csp = headers["content-security-policy"] ?? "";
  expect(csp.length).toBeGreaterThan(0);
  expect(csp.toLowerCase().includes("upgrade-insecure-requests")).toBe(false);
  expect(headers["strict-transport-security"]).toBeUndefined();

  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  expect(failedNextAssets).toEqual([]);
});

test("desktop primary navigation opens the Work page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  const workLink = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Work", exact: true });

  await expect(workLink).toBeVisible();
  await workLink.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/work");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});

test("theme toggle changes the theme and persists it after reload", async ({
  page,
}) => {
  await page.goto("/");

  const root = page.locator("html");
  const toggle = page.getByRole("button", {
    name: /switch to (dark|light) theme/i,
  });
  await expect(toggle).toBeVisible();

  const initialAction = await toggle.getAttribute("aria-label");
  const expectedTheme =
    initialAction === "Switch to dark theme" ? "dark" : "light";
  const nextAction =
    expectedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  await toggle.click();
  await expect
    .poll(async () =>
      ((await root.getAttribute("class")) ?? "")
        .split(" ")
        .includes(expectedTheme),
    )
    .toBe(true);
  await expect(toggle).toHaveAttribute("aria-label", nextAction);

  await page.reload();
  await expect
    .poll(async () =>
      ((await root.getAttribute("class")) ?? "")
        .split(" ")
        .includes(expectedTheme),
    )
    .toBe(true);
  await expect(page.getByRole("button", { name: nextAction })).toBeVisible();
});

test("mobile navigation opens, navigates, and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open menu" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const mobileNav = page.getByRole("navigation", { name: "Mobile" });
  await expect(mobileNav).toBeVisible();
  const workLink = mobileNav.getByRole("link", {
    name: "Work",
    exact: true,
  });
  await expect(workLink).toBeVisible();
  await workLink.click();

  await expect.poll(() => new URL(page.url()).pathname).toBe("/work");
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("404 page renders for an unknown route", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/wandered off/i)).toBeVisible();
});

test("contact form shows validation errors on empty submit", async ({
  page,
}) => {
  await page.goto("/contact");
  const form = page.locator("form");
  await form.getByRole("button", { name: /send message/i }).click();

  await expect(
    form.getByText("Please enter your name.", { exact: true }),
  ).toBeVisible();
  await expect(
    form.getByText("Please enter a valid email.", { exact: true }),
  ).toBeVisible();
  await expect(
    form.getByText("Give me a bit more detail (20 characters minimum).", {
      exact: true,
    }),
  ).toBeVisible();
});

test("contact form shows success after a successful submission", async ({
  page,
}) => {
  await page.route("**/api/contact", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toMatchObject({
      name: "Test Visitor",
      email: "test@example.com",
      company: "",
      renderedAt: expect.any(Number),
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/contact");
  await page.getByLabel("Name").fill("Test Visitor");
  await page.getByLabel("Email").fill("test@example.com");
  await page
    .getByLabel("Project details")
    .fill("I need help testing a sample website project.");

  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("status")).toContainText("Thanks — that's sent.");
});

test("contact form reports a failed submission accessibly", async ({
  page,
}) => {
  await page.route("**/api/contact", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Please try again later." }),
    });
  });

  await page.goto("/contact");
  await page.getByLabel("Name").fill("Test Visitor");
  await page.getByLabel("Email").fill("test@example.com");
  await page
    .getByLabel("Project details")
    .fill("I need help testing a sample website project.");

  await page.getByRole("button", { name: /send message/i }).click();
  await expect(
    page.locator("form").getByText("Please try again later.", { exact: true }),
  ).toBeVisible();
});
