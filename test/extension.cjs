// Requires Playwright. CCF_CHROMIUM_PATH selects a Chrome for Testing binary.
// CCF_EXTENSION_ROOT can point to an extracted sharing package.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { searchHTML, profileHTML, seconFullSource, seconTruncatedSource } = require("./fixtures.cjs");
const root = path.resolve(
  process.env.CCF_EXTENSION_ROOT || path.join(__dirname, ".."),
);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ccf-extension-"));
const selector = '[data-ccfrank-owned="true"]';

(async () => {
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      executablePath:
        process.env.CCF_CHROMIUM_PATH || chromium.executablePath(),
      headless: true,
      ignoreDefaultArgs: ["--disable-extensions"],
      args: ["--enable-unsafe-extension-debugging"],
    });
    // Chrome validates the real unpacked package before any DOM assertions.
    const cdp = await context.browser().newBrowserCDPSession();
    const loaded = await cdp.send("Extensions.loadUnpacked", { path: root });
    assert.ok(loaded.id);
    await context.route("**/*", async (route) => {
      if (route.request().resourceType() !== "document") return route.abort();
      const body =
        new URL(route.request().url()).pathname === "/citations"
          ? profileHTML
          : searchHTML;
      await route.fulfill({ contentType: "text/html", body });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // No addInitScript/addScriptTag: Chrome itself must load the extension.
    await page.goto("https://scholar.google.com/scholar?q=extension-test");
    await page.waitForSelector(selector, { timeout: 10000 });
    assert.equal(await page.locator(selector).count(), 3);
    assert.equal(await page.evaluate(() => typeof globalThis.ccf), "undefined");
    assert.equal(
      await page
        .locator("#formal " + selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(255, 0, 0)",
    );
    assert.equal(
      await page
        .locator("#citation " + selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(0, 200, 83)",
    );
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent =
        "A Author - 2019 IEEE International Conference on Web Services, 2019 - ieeexplore.ieee.org";
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#late [data-ccfrank-owned]")?.textContent ===
        "CCF B",
    );
    assert.equal(
      await page
        .locator("#late " + selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(255, 176, 0)",
    );
    assert.equal(
      await page
        .locator("#late " + selector)
        .evaluate((el) => getComputedStyle(el).color),
      "rgb(255, 255, 255)",
    );
    if (process.env.CCF_BADGE_PREVIEW)
      await page
        .locator("#late " + selector)
        .screenshot({ path: process.env.CCF_BADGE_PREVIEW, scale: "css" });
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent =
        "F Sun, F Dong, D Shen - IEEE INFOCOM 2026-IEEE Conference on Computer Communications, 1-10 - ieeexplore.ieee.org";
    });
    await page.waitForFunction(
      () => document.querySelector("#late [data-ccfrank-owned]")?.textContent === "CCF A",
    );
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent = "A Author - ICML - Workshop, 2024 - example.org";
    });
    await page.waitForFunction(
      () => !document.querySelector("#late [data-ccfrank-owned]"),
    );
    for (const source of [seconFullSource, seconTruncatedSource]) {
      await page.locator("#late .gs_a").evaluate((el) => {
        el.textContent = "S Fu - arXiv preprint, 2023 - arxiv.org";
      });
      await page.waitForFunction(
        () => !document.querySelector("#late [data-ccfrank-owned]"),
      );
      await page.locator("#late .gs_a").evaluate((el, value) => {
        el.textContent = "S Fu, F Dong, D Shen, Q He - " + value + " - ieeexplore.ieee.org";
      }, source);
      await page.waitForFunction(
        () => document.querySelector("#late [data-ccfrank-owned]")?.textContent === "CCF B",
      );
    }
    await page.reload();
    await page.waitForSelector(selector);
    assert.equal(await page.locator(selector).count(), 3);
    await page.goto("https://scholar.google.com/citations?user=extension-test");
    await page.waitForFunction(
      () =>
        document.querySelector("#profile [data-ccfrank-owned]")?.textContent ===
        "CCF B",
    );
    await page.waitForFunction(
      () => document.querySelector("#infocom [data-ccfrank-owned]")?.textContent === "CCF A",
    );
    await page.waitForFunction(
      () => document.querySelector("#secon [data-ccfrank-owned]")?.textContent === "CCF B",
    );
    if (process.env.CCF_SECON_PREVIEW)
      await page.locator("#secon .gsc_a_t").screenshot({
        path: process.env.CCF_SECON_PREVIEW,
      });
    await page.evaluate((source) => {
      document.body.insertAdjacentHTML("beforeend",
        '<div id="gsc_oci_title">Publication detail</div><div id="gsc_oci_table"><div class="gs_scl"><div class="gsc_oci_field">研讨会论文</div><div class="gsc_oci_value">' + source + '</div></div></div>');
    }, seconFullSource);
    const detailBadge = "#gsc_oci_title + " + selector;
    await page.waitForFunction(
      () => document.querySelector("#gsc_oci_title + [data-ccfrank-owned]")?.textContent === "CCF B",
    );
    for (const label of ["会议名称：", "Conference proceedings:", "研讨会论文"]) {
      await page.locator(".gsc_oci_field").evaluate((el) => { el.textContent = "论文标题"; });
      await page.waitForFunction(
        () => !document.querySelector("#gsc_oci_title + [data-ccfrank-owned]"),
      );
      await page.locator(".gsc_oci_field").evaluate((el, value) => { el.textContent = value; }, label);
      await page.waitForFunction(
        () => document.querySelector("#gsc_oci_title + [data-ccfrank-owned]")?.textContent === "CCF B",
      );
      assert.equal(await page.locator(detailBadge).textContent(), "CCF B");
    }
    await page.locator(".gsc_oci_value").evaluate((el) => { el.textContent += " Workshops"; });
    await page.waitForFunction(
      () => !document.querySelector("#gsc_oci_title + [data-ccfrank-owned]"),
    );
    assert.equal(await page.locator("#secon " + selector).textContent(), "CCF B");
    assert.equal(
      await page.locator("#infocom " + selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(255, 0, 0)",
    );
    if (process.env.CCF_INFOCOM_PREVIEW)
      await page.locator("#infocom .gsc_a_t").screenshot({
        path: process.env.CCF_INFOCOM_PREVIEW,
      });
    await page.locator("#infocom .gs_gray").nth(1).evaluate((el) => {
      el.textContent = "IEEE INFOCOM 2026-IEEE Conference on Computer Communications Workshops, 1-10";
    });
    await page.waitForFunction(
      () => !document.querySelector("#infocom [data-ccfrank-owned]"),
    );
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector("#infocom [data-ccfrank-owned]")?.textContent === "CCF A",
    );
    await page.waitForFunction(
      () => document.querySelector("#secon [data-ccfrank-owned]")?.textContent === "CCF B",
    );
    for (const url of [
      "https://www.google.com/search?q=extension-test",
      "https://dblp.org/search?q=extension-test",
      "https://arxiv.org/abs/2601.1",
      "https://scholar.google.com.evil.test/scholar",
    ]) {
      await page.goto(url);
      await page.waitForTimeout(200);
      assert.equal(await page.locator(selector).count(), 0, url);
    }
    assert.deepEqual(errors, []);
    console.log(
      "Actual unpacked extension passed: Chrome manifest injection, isolated scripts, CSS colors, INFOCOM/SECON search/profile regression, localized publication details, dynamic edits, refresh, and Google-Scholar-only scope.",
    );
  } finally {
    await context?.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
