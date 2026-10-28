import { readFile } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Browser, type Page } from "@playwright/test";

// End-to-end coverage of the marketplace. Every test creates its own accounts or picks free
// booking slots, so the suite can be re-run against the same database without reseeding.

const run = Date.now().toString(36);
const password = "secret123";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Upcoming dates (from tomorrow) that fall on the given weekday (0 = Sunday).
function upcoming(dayOfWeek: number, count = 6) {
  const dates: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (dates.length < count) {
    if (d.getDay() === dayOfWeek) dates.push(isoDate(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

async function newPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

async function login(page: Page, email: string, pass: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(pass);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function register(page: Page, name: string, email: string, role: "CUSTOMER" | "TECHNICIAN") {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill("+91 98765 43210");
  await page.getByLabel("Password").fill(password);
  await page.getByLabel("I am a").selectOption(role);
  await page.getByRole("button", { name: "Create account" }).click();
}

function badge(page: Page, text: string) {
  return page.getByText(text, { exact: true }).first();
}

async function findTechnician(page: Page, category: string, area: string, technician: string) {
  await page.goto("/customer/book");
  await page.getByLabel("Category").selectOption({ label: category });
  await page.locator("#serviceAreaId").selectOption({ label: area });
  await page.getByRole("button", { name: "Find technicians" }).click();
  await page.locator("label", { hasText: technician }).click();
}

// Picks the first date (from the candidates) that still has a free slot, and that slot.
async function pickSlot(page: Page, dates: string[], preferred?: string) {
  for (const date of dates) {
    await page.getByLabel("Preferred date").fill(date);
    const select = page.locator("#preferredTime");
    await expect(select.locator("option").first()).not.toHaveText(/Loading times|Pick a date/);
    const values = await select
      .locator("option")
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
    if (values.length === 0) continue;
    const time = preferred && values.includes(preferred) ? preferred : values[0];
    await select.selectOption(time);
    return { date, time };
  }
  throw new Error("No free slot found");
}

async function fillVisitDetails(page: Page, locality: string, problem: string) {
  await page.getByLabel("Address").fill("Flat 302, Sunrise Residency, Road No. 5");
  await page.locator("#locality").fill(locality);
  await page.getByLabel("Problem description").fill(problem);
  await page.getByRole("button", { name: "Submit booking request" }).click();
  await expect(page).toHaveURL(/\/customer\/bookings\/\w+/);
  return page.url().split("/").pop()!;
}

async function readResetLink(email: string) {
  const outbox = await readFile(path.resolve(process.cwd(), ".mail-outbox.log"), "utf8");
  const entries = outbox.split("--- ").filter((e) => e.includes(`To: ${email}`) && e.includes("reset-password"));
  const match = entries.at(-1)?.match(/https?:\/\/\S+\/reset-password\?token=[a-f0-9]{64}/);
  if (!match) throw new Error(`No reset email for ${email}`);
  return match[0];
}

test("full booking lifecycle across customer, technician and admin", async ({ browser }) => {
  const techName = `E2E Tech ${run}`;
  const techEmail = `e2e.tech.${run}@example.com`;
  const tech = await newPage(browser);
  const admin = await newPage(browser);
  const customer = await newPage(browser);
  let bookingId = "";
  let bookingRef = "";
  let techProfileUrl = "";
  const tuesday = upcoming(2);

  await test.step("wrong password is rejected", async () => {
    await login(admin, "admin@fixnear.in", "wrong-password");
    await expect(admin.getByText("Invalid email or password.")).toBeVisible();
  });

  await test.step("technician registers, sets services, areas, hours and documents", async () => {
    await register(tech, techName, techEmail, "TECHNICIAN");
    await expect(tech).toHaveURL(/\/technician$/);
    await expect(tech.getByText(/enable at least one service and one area/)).toBeVisible();

    await tech.goto("/technician/profile");
    await tech.locator("li", { hasText: "Electrician" }).getByRole("button", { name: "Enable" }).click();
    await expect(tech.locator("li", { hasText: "Electrician" }).getByRole("button", { name: "Enabled" })).toBeVisible();
    await tech.locator("li", { hasText: "Madhapur" }).getByRole("button", { name: "Add area" }).click();
    await expect(tech.locator("li", { hasText: "Madhapur" }).getByRole("button", { name: "Serving" })).toBeVisible();

    await tech.getByLabel("Document type").selectOption("Aadhaar card");
    await tech.locator("#document").setInputFiles({ name: "aadhaar.pdf", mimeType: "application/pdf", buffer: PDF });
    await tech.getByRole("button", { name: "Upload" }).click();
    await expect(tech.getByText("Document uploaded.")).toBeVisible();
    await expect(tech.locator("li", { hasText: "aadhaar.pdf" })).toBeVisible();

    await tech.goto("/technician/availability");
    await tech.getByLabel("Day").selectOption("2");
    await tech.getByLabel("Start").fill("18:00");
    await tech.getByLabel("End").fill("09:00");
    await tech.getByRole("button", { name: "Save slot" }).click();
    await expect(tech.getByText("End time must be after start time.")).toBeVisible();
    await tech.getByLabel("Start").fill("09:00");
    await tech.getByLabel("End").fill("17:00");
    await tech.getByRole("button", { name: "Save slot" }).click();
    await expect(tech.getByText("Availability saved.")).toBeVisible();
    await expect(tech.locator("li", { hasText: "Tuesday" })).toContainText("09:00 – 17:00");
  });

  await test.step("customer cannot find the technician before approval", async () => {
    await register(customer, `E2E Customer ${run}`, `e2e.customer.${run}@example.com`, "CUSTOMER");
    await expect(customer).toHaveURL(/\/customer$/);
    await customer.goto("/customer/book");
    await customer.getByLabel("Category").selectOption({ label: "Electrician" });
    await customer.locator("#serviceAreaId").selectOption({ label: "Madhapur, Hyderabad" });
    await customer.getByRole("button", { name: "Find technicians" }).click();
    await expect(customer.getByText("Ravi Kumar")).toBeVisible();
    await expect(customer.getByText(techName)).toHaveCount(0);
  });

  await test.step("admin reviews documents and approves the technician", async () => {
    await login(admin, "admin@fixnear.in", "password123");
    await expect(admin).toHaveURL(/\/admin$/);
    await admin.goto("/admin/verification");
    const row = admin.locator("li", { hasText: techEmail });
    await expect(row.getByRole("link", { name: "Aadhaar card" })).toBeVisible();
    await expect(row).toContainText("Services: Electrician");
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(row.getByText("approved", { exact: true })).toBeVisible();
  });

  await test.step("only working hours are bookable", async () => {
    await findTechnician(customer, "Electrician", "Madhapur, Hyderabad", techName);
    await customer.getByLabel("Preferred date").fill(upcoming(0)[0]);
    await expect(customer.locator("#preferredTime")).toContainText("No free times on this day");
  });

  await test.step("customer books with a photo", async () => {
    const slot = await pickSlot(customer, tuesday, "11:00");
    expect(slot.time).toBe("11:00");
    await customer.locator("#photo").setInputFiles({ name: "socket.png", mimeType: "image/png", buffer: PNG });
    bookingId = await fillVisitDetails(customer, "Madhapur", "Kitchen sockets stopped working after a power surge.");
    bookingRef = (await customer.locator("h1").textContent())!.trim();
    expect(bookingRef).toMatch(/^FN-/);
    await expect(badge(customer, "requested")).toBeVisible();
    await expect(customer.getByAltText("Photo of the problem")).toBeVisible();

    // The booked slot is no longer offered to anyone.
    await findTechnician(customer, "Electrician", "Madhapur, Hyderabad", techName);
    await customer.getByLabel("Preferred date").fill(slot.date);
    await expect(customer.locator("#preferredTime option").first()).not.toHaveText(/Loading times|Pick a date/);
    await expect(customer.locator('#preferredTime option[value="11:00"]')).toHaveCount(0);
    await expect(customer.locator('#preferredTime option[value="10:00"]')).toHaveCount(1);
  });

  await test.step("technician is notified, accepts and quotes", async () => {
    await tech.goto("/technician");
    await expect(tech.getByRole("link", { name: /Notifications, \d+ unread/ })).toBeVisible();
    await tech.goto("/notifications");
    await tech.getByRole("link", { name: /New booking request/ }).first().click();
    await expect(tech).toHaveURL(new RegExp(`/technician/jobs/${bookingId}$`));
    await expect(tech.getByAltText("Photo of the problem")).toBeVisible();

    await tech.getByRole("button", { name: "Accept job" }).click();
    await expect(badge(tech, "accepted")).toBeVisible();
    await tech.getByLabel("Visit fee (₹)").fill("199");
    await tech.getByLabel("Labour (₹)").fill("600");
    await tech.getByLabel("Parts (₹)").fill("150");
    await tech.getByLabel("Other (₹)").fill("0");
    await tech.getByPlaceholder("Notes for customer").fill("Replace two sockets and check the MCB.");
    await tech.getByRole("button", { name: "Send quote" }).click();
    await expect(tech.getByText("Quote sent to customer.")).toBeVisible();
    await expect(badge(tech, "quote pending")).toBeVisible();
  });

  await test.step("customer accepts the quote and pays", async () => {
    await customer.goto(`/customer/bookings/${bookingId}`);
    await expect(customer.getByText(/Total ₹949/)).toBeVisible();
    await expect(customer.getByRole("button", { name: "Mark payment complete" })).toHaveCount(0);
    await customer.getByRole("button", { name: "Accept quote" }).click();
    await expect(badge(customer, "quote accepted")).toBeVisible();
    await customer.getByRole("button", { name: "Mark payment complete" }).click();
    await expect(badge(customer, "paid")).toBeVisible();
  });

  await test.step("technician does the job and sees earnings", async () => {
    await tech.goto(`/technician/jobs/${bookingId}`);
    await expect(tech.getByRole("button", { name: "Send quote" })).toHaveCount(0);
    await tech.getByRole("button", { name: "Start job" }).click();
    await expect(badge(tech, "in progress")).toBeVisible();
    await tech.getByRole("button", { name: "Mark work finished" }).click();
    await expect(badge(tech, "awaiting customer confirmation")).toBeVisible();

    await tech.goto("/technician/earnings");
    await expect(tech.getByText("₹949").first()).toBeVisible();
    // ₹949 minus 12% commission (₹113.88), shown rounded.
    await expect(tech.getByText("₹835")).toBeVisible();
  });

  await test.step("customer confirms, reviews and files a complaint", async () => {
    await customer.goto(`/customer/bookings/${bookingId}`);
    await customer.getByRole("button", { name: "Confirm job completed" }).click();
    await expect(badge(customer, "completed")).toBeVisible();

    await customer.getByLabel("Rating").selectOption("4");
    await customer.getByPlaceholder("Optional comment").fill(`Quick and tidy work ${run}.`);
    await customer.getByRole("button", { name: "Submit review" }).click();
    await expect(customer.getByText("Thank you for your review.")).toBeVisible();

    await customer.getByLabel("Issue type").fill(`Late arrival ${run}`);
    await customer.getByLabel("Description").fill("Technician arrived 45 minutes after the slot.");
    await customer.getByRole("button", { name: "File complaint" }).click();
    await expect(customer.getByText("Complaint submitted. Our team will review it.")).toBeVisible();
  });

  await test.step("the public profile shows the technician and review", async () => {
    const visitor = await newPage(browser);
    await visitor.goto("/technicians?service=electrician");
    await visitor.getByRole("link", { name: new RegExp(techName) }).click();
    await expect(visitor.getByRole("heading", { name: techName })).toBeVisible();
    techProfileUrl = visitor.url();
    await expect(visitor.getByText(`Quick and tidy work ${run}.`)).toBeVisible();
    await expect(visitor.getByText(/4\.0 from 1 reviews/)).toBeVisible();
  });

  await test.step("admin reconciles, resolves the complaint and hides the review", async () => {
    await admin.goto("/admin/commission");
    const record = admin.locator("li", { hasText: bookingRef });
    await expect(record).toContainText("Due ₹114");
    await record.getByRole("button", { name: "Reconcile" }).click();
    await expect(record.getByText("reconciled", { exact: true })).toBeVisible();

    await admin.goto("/admin/complaints");
    const complaint = admin.locator("li", { hasText: `Late arrival ${run}` });
    await complaint.getByRole("button", { name: "Resolve" }).click();
    await expect(complaint.getByText("resolved", { exact: true })).toBeVisible();

    await admin.goto("/admin/reviews");
    const review = admin.locator("li", { hasText: `Quick and tidy work ${run}.` });
    await review.getByRole("button", { name: "Hide" }).click();
    await expect(review.getByText("Hidden", { exact: true })).toBeVisible();

    const visitor = await newPage(browser);
    await visitor.goto(techProfileUrl);
    await expect(visitor.getByText(`Quick and tidy work ${run}.`)).toHaveCount(0);
    await expect(visitor.getByText("No reviews yet").first()).toBeVisible();
  });
});

test("customer disputes finished work and admin refunds", async ({ browser }) => {
  const customer = await newPage(browser);
  await login(customer, "customer@example.com", "password123");
  await expect(customer).toHaveURL(/\/customer$/);

  await findTechnician(customer, "Electrician", "Madhapur, Hyderabad", "Ravi Kumar");
  await pickSlot(customer, [...upcoming(1, 8), ...upcoming(4, 8)]);
  const bookingId = await fillVisitDetails(customer, "Madhapur", "Ceiling fan makes a grinding noise.");
  const bookingRef = (await customer.locator("h1").textContent())!.trim();

  const tech = await newPage(browser);
  await login(tech, "ravi.electric@example.com", "password123");
  await expect(tech).toHaveURL(/\/technician$/);
  await tech.goto(`/technician/jobs/${bookingId}`);
  await tech.getByRole("button", { name: "Send quote" }).click();
  await expect(badge(tech, "quote pending")).toBeVisible();

  await customer.goto(`/customer/bookings/${bookingId}`);
  await customer.getByRole("button", { name: "Accept quote" }).click();
  await expect(badge(customer, "quote accepted")).toBeVisible();
  await customer.getByRole("button", { name: "Mark payment complete" }).click();
  await expect(badge(customer, "paid")).toBeVisible();

  await tech.goto(`/technician/jobs/${bookingId}`);
  await tech.getByRole("button", { name: "Start job" }).click();
  await expect(badge(tech, "in progress")).toBeVisible();
  await tech.getByRole("button", { name: "Mark work finished" }).click();
  await expect(badge(tech, "awaiting customer confirmation")).toBeVisible();

  await customer.goto(`/customer/bookings/${bookingId}`);
  await customer.getByLabel("What went wrong?").fill("Fan still grinds after the visit.");
  await customer.getByRole("button", { name: "Raise dispute" }).click();
  await expect(badge(customer, "disputed")).toBeVisible();

  const admin = await newPage(browser);
  await login(admin, "admin@fixnear.in", "password123");
  await expect(admin).toHaveURL(/\/admin$/);
  await admin.goto("/admin/disputes");
  const dispute = admin.locator("li", { hasText: bookingRef });
  await expect(dispute).toContainText("Fan still grinds after the visit.");
  admin.once("dialog", (d) => d.accept());
  await dispute.getByRole("button", { name: "Cancel & refund" }).click();
  await expect(admin.locator("li", { hasText: bookingRef })).toHaveCount(0);

  await customer.goto(`/customer/bookings/${bookingId}`);
  await expect(badge(customer, "cancelled")).toBeVisible();
  await expect(badge(customer, "refunded")).toBeVisible();

  await admin.goto("/admin/commission");
  await expect(admin.locator("li", { hasText: bookingRef }).getByText("disputed", { exact: true })).toBeVisible();
});

test("customer can cancel a request before work starts", async ({ browser }) => {
  const customer = await newPage(browser);
  await login(customer, "customer@example.com", "password123");
  await expect(customer).toHaveURL(/\/customer$/);

  await findTechnician(customer, "Plumbing", "Gachibowli, Hyderabad", "Suresh Rao");
  await pickSlot(customer, [...upcoming(3, 8), ...upcoming(5, 8)]);
  await fillVisitDetails(customer, "Gachibowli", "Leaking pipe under the bathroom sink.");

  customer.once("dialog", (d) => d.accept());
  await customer.getByRole("button", { name: "Cancel booking" }).click();
  await expect(badge(customer, "cancelled")).toBeVisible();
  await expect(customer.getByRole("button", { name: "Cancel booking" })).toHaveCount(0);
});

test("password reset by email link", async ({ browser }) => {
  const email = `e2e.reset.${run}@example.com`;
  const page = await newPage(browser);
  await register(page, `E2E Reset ${run}`, email, "CUSTOMER");
  await expect(page).toHaveURL(/\/customer$/);

  const visitor = await newPage(browser);
  await visitor.goto("/login");
  await visitor.getByRole("link", { name: "Forgot password?" }).click();
  await visitor.getByLabel("Email").fill(email);
  await visitor.getByRole("button", { name: "Send reset link" }).click();
  await expect(visitor.getByText(/If an account exists for that email/)).toBeVisible();

  // Unknown emails get the same answer.
  await visitor.goto("/forgot-password");
  await visitor.getByLabel("Email").fill(`nobody.${run}@example.com`);
  await visitor.getByRole("button", { name: "Send reset link" }).click();
  await expect(visitor.getByText(/If an account exists for that email/)).toBeVisible();

  const link = await readResetLink(email);
  await visitor.goto(link);
  await visitor.getByLabel("New password", { exact: true }).fill("brandnew1");
  await visitor.getByLabel("Confirm new password").fill("different1");
  await visitor.getByRole("button", { name: "Set new password" }).click();
  await expect(visitor.getByText("Passwords don't match.")).toBeVisible();
  await visitor.getByLabel("Confirm new password").fill("brandnew1");
  await visitor.getByRole("button", { name: "Set new password" }).click();
  await expect(visitor).toHaveURL(/\/login\?reset=1/);
  await expect(visitor.getByText("Password updated.")).toBeVisible();

  await login(visitor, email, password);
  await expect(visitor.getByText("Invalid email or password.")).toBeVisible();
  await login(visitor, email, "brandnew1");
  await expect(visitor).toHaveURL(/\/customer$/);

  // A used link can't be used again.
  const again = await newPage(browser);
  await again.goto(link);
  await again.getByLabel("New password", { exact: true }).fill("another1");
  await again.getByLabel("Confirm new password").fill("another1");
  await again.getByRole("button", { name: "Set new password" }).click();
  await expect(again.getByText(/invalid or has expired/)).toBeVisible();
});

test("admin manages areas and suspends a user", async ({ browser }) => {
  test.setTimeout(180_000);
  const admin = await newPage(browser);
  await login(admin, "admin@fixnear.in", "password123");
  await expect(admin).toHaveURL(/\/admin$/);

  const locality = `E2E Nagar ${run}`;
  await admin.goto("/admin/catalog");
  await admin.getByLabel("Locality").fill(locality);
  await admin.getByRole("button", { name: "Add area" }).click();
  await expect(admin.getByText(`Added ${locality}.`)).toBeVisible();
  const area = admin.locator("li", { hasText: locality });
  await area.getByRole("button", { name: "Disable" }).click();
  await expect(area.getByRole("button", { name: "Enable" })).toBeVisible();

  const email = `e2e.suspend.${run}@example.com`;
  const user = await newPage(browser);
  await register(user, `E2E Suspend ${run}`, email, "CUSTOMER");
  await expect(user).toHaveURL(/\/customer$/);

  await admin.goto(`/admin/users?q=${encodeURIComponent(email)}`);
  const row = admin.locator("li", { hasText: email });
  admin.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "Suspend" }).click();
  await expect(row.getByText("suspended", { exact: true })).toBeVisible();

  // Sessions are re-checked against the database at most once a minute.
  await user.waitForTimeout(65_000);
  await user.goto("/customer");
  await expect(user).toHaveURL(/\/login/);
  await login(user, email, password);
  await expect(user.getByText("Invalid email or password.")).toBeVisible();

  await row.getByRole("button", { name: "Reactivate" }).click();
  await expect(row.getByText("active", { exact: true })).toBeVisible();
  await login(user, email, password);
  await expect(user).toHaveURL(/\/customer$/);
});

test("a rejected technician loses access without signing out", async ({ browser }) => {
  test.setTimeout(180_000);
  const email = `e2e.reject.${run}@example.com`;

  const tech = await newPage(browser);
  await register(tech, `E2E Reject ${run}`, email, "TECHNICIAN");
  await expect(tech).toHaveURL(/\/technician$/);

  const admin = await newPage(browser);
  await login(admin, "admin@fixnear.in", "password123");
  await expect(admin).toHaveURL(/\/admin$/);
  await admin.goto("/admin/verification");
  const row = admin.locator("li", { hasText: email });
  await row.getByRole("button", { name: "Reject" }).click();
  await expect(row.getByText("rejected", { exact: true })).toBeVisible();

  await tech.waitForTimeout(65_000);
  await tech.goto("/technician/jobs");
  await expect(tech).toHaveURL(/\/login/);
});

test("access control for pages and files", async ({ browser }) => {
  const anon = await newPage(browser);
  await anon.goto("/admin");
  await expect(anon).toHaveURL(/\/login\?callbackUrl=%2Fadmin/);
  await anon.goto("/technicians");
  await expect(anon.getByRole("heading", { name: /Verified technicians/ })).toBeVisible();
  const file = await anon.request.get(`/api/files/bookings/${"a".repeat(32)}.png`);
  expect(file.status()).toBe(401);

  const customer = await newPage(browser);
  await login(customer, "customer@example.com", "password123");
  await expect(customer).toHaveURL(/\/customer$/);
  await customer.goto("/admin/commission");
  await expect(customer).toHaveURL(/\/customer$/);
  await customer.goto("/technician/jobs");
  await expect(customer).toHaveURL(/\/customer$/);
  const traversal = await customer.request.get("/api/files/..%2F..%2F.env");
  expect(traversal.status()).toBe(404);
});
