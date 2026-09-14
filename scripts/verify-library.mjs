import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import cases from "../src/case-index.json" with { type: "json" };

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
await mkdir("screenshots/library", { recursive: true });
const errors = [];
const report = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1").textContent(), "企业 AI 转型服务");
  assert.equal(await page.locator(".home-case-grid article").count(), 3);
  assert.equal(await page.locator("[data-case-count]").textContent(), "193");
  assert.equal(await page.locator(".library-summary").getByText("9 个实施章节", { exact: true }).count(), 1);
  assert.equal(await page.locator("i[data-lucide]").count(), 0, "All homepage icon names must resolve");
  assert.equal(await page.locator(".workflow-map").count(), 1, "Homepage must keep a nonblank visual fallback");
  await page.screenshot({ path: "screenshots/library/official-home-desktop.png", fullPage: true });

  await page.goto(`${base}/cases/`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".case-grid .case-card").count(), 8);
  assert.equal(await page.locator("#result-count").textContent(), "193 篇");
  assert.equal(await page.locator("i[data-lucide]").count(), 0, "All icon names must resolve");
  await page.screenshot({ path: "screenshots/library/library-desktop.png", fullPage: true });
  await page.locator("#case-search").fill("刀具更换提醒");
  assert.equal(await page.locator("#result-count").textContent(), "1 篇");
  await page.locator('[data-save="case-001"]').click();
  assert.equal(await page.locator("#saved-count").textContent(), "1");
  await page.locator(".case-card h3 a").click();
  assert.equal(await page.locator("h1").textContent(), "刀具更换提醒与质量追踪");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator(".case-article > section[id]").count(), 9);
  await page.screenshot({ path: "screenshots/library/detail-desktop.png", fullPage: true });
  await page.goBack();
  assert.equal(await page.locator("#case-search").inputValue(), "刀具更换提醒");
  assert.equal(await page.locator("#result-count").textContent(), "1 篇");
  await page.locator("#case-search").fill("没有这种业务zzzz");
  assert.equal(await page.locator(".empty-state").count(), 1);
  await page.locator("[data-clear-filters]").last().click();
  await page.locator('[data-filter="department"]').selectOption("客户服务");
  await page.locator('[data-filter="type"]').selectOption("流程协作");
  const combinedCount = cases.filter((item) => item.department === "客户服务" && item.type === "流程协作").length;
  assert.equal(await page.locator("#result-count").textContent(), `${combinedCount} 篇`);
  await page.locator('[data-view="list"]').click();
  assert.equal(await page.locator(".case-grid.list-view").count(), 1);
  await page.goto(`${base}/cases/?saved=1`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("#result-count").textContent(), "1 篇");
  await page.locator('[data-save="case-001"]').click();
  assert.equal(await page.locator(".empty-state").count(), 1);
  await page.goto(`${base}/cases/?page=25`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".case-grid .case-card").count(), 1);
  assert.ok(await page.locator(".pagination a, .pagination button, .pagination span").count() <= 10);
  await page.goto(`${base}/cases/?case=missing`, { waitUntil: "networkidle" });
  assert.match(await page.locator("h1").textContent(), /暂不存在/);

  for (const item of cases) {
    await page.goto(`${base}/cases/?case=${item.id}`, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("h1").textContent(), item.title);
    assert.equal(await page.locator(".measurement-table tbody tr").count(), 3);
    assert.equal(await page.locator(".case-article > section[id]").count(), 9);
    assert.equal(await page.locator(".story-scenes li").count(), 4);
    assert.equal(await page.locator(".story-before-after article").count(), 2);
    assert.equal(await page.locator(".story-ending li").count(), 4);
    assert.match(await page.locator(".story-persona > div span").textContent(), /人物与企业均为虚构/);
    assert.equal(await page.locator(".module-list article").count(), 5);
    assert.equal(await page.locator('.journey-table > [role="row"]').count(), 5);
    assert.ok(await page.locator(".data-table tbody tr").count() >= 4);
    assert.equal(await page.locator(".pilot-phase-list article").count(), 4);
    assert.equal(await page.locator(".risk-table tbody tr").count(), 4);
    assert.equal(await page.locator(".questions-block li").count(), 5);
  }
  await page.locator(".article-cta [data-contact]").click();
  await page.locator('[name="company"]').fill("测试团队");
  const downloadEvent = page.waitForEvent("download");
  await page.locator('#contact-form [type="submit"]').click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), "luodian-project-brief.txt");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog").evaluate((element) => element.open), false);

  for (const width of [1920, 1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    for (const [name, path] of [["official", "/"], ["library", "/cases/"], ["detail", "/cases/?case=case-096"]]) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        missingLabels: [...document.querySelectorAll("input,select,textarea")].filter((el) => !el.closest("label") && !el.getAttribute("aria-label")).length,
        duplicateIds: [...document.querySelectorAll("[id]")].map((el) => el.id).filter((id, index, all) => all.indexOf(id) !== index),
        sourceMention: /opencodev/i.test(document.body.innerText),
      }));
      assert.equal(metrics.overflow, 0, `${name} overflows at ${width}`);
      assert.equal(metrics.missingLabels, 0);
      assert.equal(metrics.sourceMention, false);
      assert.deepEqual(metrics.duplicateIds, []);
      if (width === 390) await page.screenshot({ path: `screenshots/library/${name}-mobile.png`, fullPage: true });
      report.push({ name, ...metrics });
    }
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "PASS", cases: cases.length, workflows: ["official homepage", "search", "combined filters", "empty state", "bookmark persistence", "list view", "compact pagination", "detail reload", "browser back", "unknown case", "download", "escape"], viewports: report, errors }, null, 2));
} finally {
  await browser.close();
}
