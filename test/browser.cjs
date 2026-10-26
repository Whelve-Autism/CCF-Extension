// Run with Playwright installed (or supplied through NODE_PATH).
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const content = JSON.parse(fs.readFileSync(path.join(root, "manifest.json")))
  .content_scripts[0];
const source = content.js
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const selector = '[data-ccfrank-owned="true"]';
const { searchHTML, profileHTML } = require("./fixtures.cjs");

(async function () {
  const browser = await chromium.launch({
    executablePath:
      process.env.CCF_CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 850 },
  });
  const errors = [];
  const requests = [];
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.resourceType() !== "document") requests.push(request.url());
  });
  let renderCount = 0;
  await context.route("https://scholar.google.com/**", async (route) => {
    renderCount++;
    await route.fulfill({
      contentType: "text/html",
      body:
        new URL(route.request().url()).pathname === "/citations"
          ? profileHTML
          : searchHTML,
    });
  });
  // Emulate document_idle execution with the exact packaged content scripts;
  // an isolated test profile does not use the user's installed extensions.
  await context.addInitScript({
    content: `document.addEventListener("DOMContentLoaded",()=>{${source}\nconst style=document.createElement("style");style.textContent=${JSON.stringify(css)};document.head.append(style);globalThis.ccfTest={ccf,scholar};});`,
  });
  const count = () => page.locator(selector).count();
  const text = (id) => page.locator("#" + id + " " + selector).textContent();
  try {
    await page.goto("https://scholar.google.com/scholar?q=fixture");
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-ccfrank-owned="true"]').length === 3,
    );
    assert.equal(await text("formal"), "CCF A");
    assert.equal(await text("journal"), "CCF A");
    assert.equal(await text("citation"), "CCF C");
    assert.equal(await page.locator("#citation h3 " + selector).count(), 1);
    assert.equal(await page.locator("#preprint " + selector).count(), 0);
    assert.equal(await page.locator("#ambiguous " + selector).count(), 0);
    assert.equal(await page.locator("#findings " + selector).count(), 0);

    // A late response fills in an existing row without any scroll/click.
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent =
        "A Author - 2019 IEEE International Conference on Web Services, 2019 - ieeexplore.ieee.org";
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#late [data-ccfrank-owned]")?.textContent ===
        "CCF B",
    );
    // Changing the conference year must not change its current catalog rank.
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent =
        "A Author - IEEE 2025 International Conference on Web Services (ICWS 2025), 2025 - ieeexplore.ieee.org";
    });
    await page.waitForFunction(
      () =>
        document.querySelector("#late [data-ccfrank-owned]")?.textContent ===
        "CCF B",
    );
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent =
        "F Sun, F Dong, D Shen - IEEE INFOCOM 2026-IEEE Conference on Computer Communications, 1-10 - ieeexplore.ieee.org";
    });
    await page.waitForFunction(
      () => document.querySelector("#late [data-ccfrank-owned]")?.textContent === "CCF A",
    );
    // Qualifiers after a year must survive extraction and remove a former badge.
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent = "A Author - ICWS, 2019, Workshop - ieeexplore.ieee.org";
    });
    await page.waitForFunction(
      () => !document.querySelector("#late [data-ccfrank-owned]"),
    );
    // A virtualized/reused row must lose its former rank when source changes.
    await page.locator("#late .gs_a").evaluate((el) => {
      el.textContent = "A Author - arXiv preprint, 2026 - arxiv.org";
    });
    await page.waitForFunction(
      () => !document.querySelector("#late [data-ccfrank-owned]"),
    );

    await page.evaluate(() => {
      document
        .getElementById("gs_res_ccl_mid")
        .insertAdjacentHTML(
          "beforeend",
          '<div class="gs_ri" id="new"><h3 class="gs_rt"><a href="/paper">Newly loaded paper</a></h3><div class="gs_a">A Author - ICML, 2025 - proceedings.mlr.press</div></div>',
        );
      window.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(
      () => !!document.querySelector("#new [data-ccfrank-owned]"),
    );
    assert.equal(await text("new"), "CCF A");
    for (let i = 0; i < 10; i++)
      await page.evaluate(() => {
        ccfTest.scholar.run();
        window.dispatchEvent(new Event("scroll"));
      });
    await page.waitForTimeout(250);
    assert.equal(await count(), 4);

    // The page can remove only a badge while retaining the surrounding row.
    // It must reappear without a scroll, a reload, or any other page activity.
    await page.locator("#formal " + selector).evaluate((el) => el.remove());
    await page.waitForFunction(
      () => !!document.querySelector("#formal [data-ccfrank-owned]"),
      null,
      { timeout: 2000 },
    );

    // Observer must settle rather than scheduling itself continuously.
    await page.evaluate(() => {
      globalThis.scanCalls = 0;
      const scan = ccfTest.scholar.scan;
      ccfTest.scholar.scan = () => {
        scanCalls++;
        return scan();
      };
    });
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => scanCalls), 0);

    // Unrelated UI animations must not repeatedly rescan a long result list.
    await page.evaluate(() => {
      const decoration = document.createElement("aside");
      decoration.id = "unrelated-animation";
      document.body.append(decoration);
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      scanCalls = 0;
    });
    for (let i = 0; i < 4; i++) {
      await page.evaluate((i) => {
        document.getElementById("unrelated-animation").className = "state-" + i;
      }, i);
      await page.waitForTimeout(120);
    }
    assert.equal(await page.evaluate(() => scanCalls), 0);

    if (process.env.CCF_SCREENSHOT)
      await page.screenshot({
        path: process.env.CCF_SCREENSHOT,
        fullPage: true,
      });
    await page.reload();
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-ccfrank-owned="true"]').length === 3,
    );
    assert.ok(renderCount >= 2);

    await page.goto("https://scholar.google.com/citations?user=fixture");
    await page.waitForFunction(
      () => !!document.querySelector("#profile [data-ccfrank-owned]"),
    );
    assert.equal(await text("profile"), "CCF B");
    await page.waitForFunction(
      () => document.querySelector("#infocom [data-ccfrank-owned]")?.textContent === "CCF A",
    );
    assert.equal(await text("infocom"), "CCF A");
    await page.evaluate(
      () =>
        (document.getElementById("gsc_bpf_more").onclick = () =>
          document
            .querySelector("tbody")
            .insertAdjacentHTML(
              "beforeend",
              '<tr class="gsc_a_tr" id="more"><td class="gsc_a_t"><a class="gsc_a_at" href="/citations?paper=2">More paper</a><div class="gs_gray">A Author</div><div class="gs_gray">2019 IEEE International Conference on Web Services, 1-8</div></td></tr>',
            )),
    );
    await page.locator("#gsc_bpf_more span").click();
    await page.waitForFunction(
      () => !!document.querySelector("#more [data-ccfrank-owned]"),
    );
    assert.equal(await text("more"), "CCF B");
    await page.evaluate(() =>
      document.body.insertAdjacentHTML(
        "beforeend",
        '<div id="gsc_oci_title">Publication detail</div><div id="gsc_oci_table"><div class="gs_scl"><div class="gsc_oci_field">会议</div><div class="gsc_oci_value">2019 IEEE International Conference on Web Services</div></div></div>',
      ),
    );
    await page.waitForFunction(
      () =>
        document.querySelector("#gsc_oci_title + [data-ccfrank-owned]")
          ?.textContent === "CCF B",
    );
    // Detail views can share a parent with existing search/profile rows.
    assert.equal(await text("profile"), "CCF B");
    assert.equal(await text("more"), "CCF B");
    await page
      .locator(".gsc_oci_value")
      .evaluate((el) => (el.textContent = "ICLR under review"));
    await page.waitForFunction(
      () => !document.querySelector("#gsc_oci_title + [data-ccfrank-owned]"),
    );
    await page.locator(".gsc_oci_value").evaluate((el) => {
      el.textContent = "ICWS";
    });
    await page.waitForFunction(
      () => !!document.querySelector("#gsc_oci_title + [data-ccfrank-owned]"),
    );
    await page.locator("#gsc_oci_table").evaluate((el) => el.remove());
    await page.waitForFunction(
      () => !document.querySelector("#gsc_oci_title + [data-ccfrank-owned]"),
    );
    assert.equal(await text("profile"), "CCF B");
    assert.equal(await text("more"), "CCF B");
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    console.log(
      "Browser DOM checks passed: initial load, refresh, source edits, scroll insertion, deduplication, observer settling, profile show-more, publication dialogs, zero network requests.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
