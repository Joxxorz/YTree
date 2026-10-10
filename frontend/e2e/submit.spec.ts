import { test, expect } from "@playwright/test";
test("connect providers, replace statements and submit through the real API", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByText("1 of 3 ready")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit statements →" }),
  ).toBeDisabled();
  const rejected = await request.post("http://localhost:8080/api/submissions");
  expect(rejected.status()).toBe(422);
  await page.getByRole("button", { name: "+ Add provider" }).click();
  await page.getByRole("checkbox", { name: "Aviva Pension" }).check();
  await page.getByRole("checkbox", { name: "Fidelity Investments" }).check();
  await page.getByRole("button", { name: "Add selected (2)" }).click();
  await expect(page.getByText("1 of 5 ready")).toBeVisible();
  await page.getByRole("button", { name: "Remove Fidelity" }).click();
  await expect(page.getByText("1 of 4 ready")).toBeVisible();
  const state = await (
    await request.get("http://localhost:8080/api/accounts")
  ).json();
  for (const name of ["HSBC", "Vanguard", "Aviva"]) {
    const row = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await row.getByRole("button", { name: /^(Upload|Replace)$/ }).click();
    await row.getByLabel("Filename").fill(`${name.toLowerCase()}.pdf`);
    await row.getByLabel("Statement date").fill(state.today);
    await row.getByRole("button", { name: "Save statement" }).click();
    await expect(row.getByText("Uploaded", { exact: true })).toBeVisible();
  }
  await expect(page.getByText("4 of 4 ready")).toBeVisible();
  await page.getByRole("button", { name: "Submit statements →" }).click();
  await expect(
    page.getByText(/Submitted successfully: 4 providers/),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Connect your accounts" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
