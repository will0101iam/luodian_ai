import "./library.css";
import { createIcons, Search, ArrowUpRight, ArrowRight, ArrowLeft, Bookmark, LayoutGrid, List, X, ChevronLeft, ChevronRight, Download, Link, Printer, Check } from "lucide";
import { cases, industries, departments, types } from "./catalog.js";

const icons = { Search, ArrowUpRight, ArrowRight, ArrowLeft, Bookmark, LayoutGrid, List, X, ChevronLeft, ChevronRight, Download, Link, Printer, Check };
const main = document.querySelector("#main");
const dialog = document.querySelector("#contact-dialog");
const pageSize = 8;
let toastTimer;
let currentCase;
let sectionObserver;
let saved = new Set();
try {
  const stored = JSON.parse(localStorage.getItem("luodian-saved") || "[]");
  if (Array.isArray(stored)) saved = new Set(stored.filter((id) => cases.some((item) => item.id === id)));
} catch { /* Browsing remains available when storage is disabled. */ }

const esc = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const iconButton = (name, label, attrs = "") => `<button type="button" class="icon-button" aria-label="${label}" title="${label}" ${attrs}>${icon(name)}</button>`;
function refreshIcons() { createIcons({ icons, attrs: { "aria-hidden": "true" } }); }
function params() { return new URLSearchParams(location.search); }
function urlWith(changes, source = params()) {
  const next = new URLSearchParams(source);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  return `/cases/${next.size ? `?${next}` : ""}`;
}
function notify(message) {
  clearTimeout(toastTimer);
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}
function bookmark(item) {
  const active = saved.has(item.id);
  return iconButton("bookmark", active ? `取消收藏：${esc(item.title)}` : `收藏：${esc(item.title)}`, `data-save="${item.id}" aria-pressed="${active}"`);
}

function getState() {
  const p = params();
  return {
    q: p.get("q") || "",
    industry: industries.includes(p.get("industry")) ? p.get("industry") : "",
    department: departments.includes(p.get("department")) ? p.get("department") : "",
    type: types.includes(p.get("type")) ? p.get("type") : "",
    savedOnly: p.get("saved") === "1",
    view: p.get("view") === "list" ? "list" : "grid",
    sort: p.get("sort") === "difficulty" ? "difficulty" : "editorial",
    page: Math.max(1, parseInt(p.get("page"), 10) || 1),
  };
}
function matchingCases(state) {
  const words = state.q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const result = cases.filter((item) =>
    (!state.industry || item.industry === state.industry) &&
    (!state.department || item.department === state.department) &&
    (!state.type || item.type === state.type) &&
    (!state.savedOnly || saved.has(item.id)) &&
    words.every((word) => Object.values(item).join(" ").toLocaleLowerCase().includes(word)),
  );
  if (state.sort === "difficulty") {
    const rank = { "较低": 0, "中等": 1, "较高": 2 };
    result.sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
  }
  return result;
}

function card(item) {
  return `<article class="case-card">
    <div class="card-meta"><span class="industry-label">${esc(item.industry)}</span><span class="case-number">RESEARCH / ${item.number}</span></div>
    <h3><a href="${urlWith({ case: item.id })}" data-route>${esc(item.title)}</a></h3>
    <p class="card-summary">${esc(item.problem)}</p>
    <div class="card-tags">${item.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
    <div class="card-facts"><span>${esc(item.department)}</span><span>实施难度 · ${item.difficulty}</span></div>
    <div class="card-footer"><a href="${urlWith({ case: item.id })}" data-route class="read-link">查看详情 ${icon("arrow-up-right")}</a><span class="study-label">行业方案</span>${bookmark(item)}</div>
  </article>`;
}
function filterSelect(id, label, values, current) {
  return `<label class="select-filter"><span class="sr-only">${label}</span><select id="${id}" data-filter="${id}"><option value="">${label}</option>${values.map((value) => `<option value="${esc(value)}" ${current === value ? "selected" : ""}>${esc(value)}</option>`).join("")}</select></label>`;
}
function paginationItems(page, pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
  const candidates = page <= 2
    ? [1, 2, pages]
    : page >= pages - 1
      ? [1, pages - 1, pages]
      : [1, page, pages];
  const numbers = [...new Set(candidates)].sort((a, b) => a - b);
  const items = [];
  numbers.forEach((value, index) => {
    if (index && value - numbers[index - 1] > 1) items.push("ellipsis");
    items.push(value);
  });
  return items;
}

function renderLibrary() {
  currentCase = null;
  document.title = "企业业务方案库 · 落点 AI";
  const state = getState();
  main.innerHTML = `<div class="page-container">
    <section class="library-intro">
      <div><p class="eyebrow">BUSINESS CASE LIBRARY</p><h1>企业业务方案库<span class="heading-dot">.</span></h1><p class="intro-copy">从具体问题出发，看清怎么做、需要什么、如何验收。</p></div>
      <div class="collection-note"><span>覆盖范围</span><strong>${industries.length} <small>个行业</small> <span class="stat-divider">/</span> ${cases.length} <small>篇方案</small></strong><p>用户故事 · 解决步骤 · 实施条件</p></div>
    </section>
    <div class="library-layout">
      <aside class="industry-sidebar" aria-label="行业分类">
        <div class="sidebar-title"><h2>行业索引</h2><span>INDEX</span></div>
        <nav class="industry-list"><a href="${urlWith({ industry: null, page: null, case: null })}" data-route class="${!state.industry ? "selected" : ""}" ${!state.industry ? 'aria-current="true"' : ""}><span>全部行业</span><small>${cases.length}</small></a>${industries.map((industry) => `<a href="${urlWith({ industry, page: null, case: null })}" data-route class="${state.industry === industry ? "selected" : ""}" ${state.industry === industry ? 'aria-current="true"' : ""}><span>${esc(industry)}</span><small>${String(cases.filter((item) => item.industry === industry).length).padStart(2, "0")}</small></a>`).join("")}</nav>
        <div class="sidebar-note"><span class="eyebrow">OUR APPROACH</span><p>先把问题说清，<br>再决定怎么做。</p><button class="text-button" data-contact>讨论你的问题 ${icon("arrow-up-right")}</button></div>
      </aside>
      <section class="catalog" aria-label="案例列表">
        <div class="catalog-toolbar">
          <label class="search-field">${icon("search")}<span class="sr-only">搜索案例</span><input id="case-search" type="search" value="${esc(state.q)}" placeholder="搜索行业、场景或业务问题" autocomplete="off" /></label>
          <div class="filter-row">
            ${filterSelect("industry", "全部行业", industries, state.industry)}
            ${filterSelect("department", "业务部门", departments, state.department)}
            ${filterSelect("type", "应用类型", types, state.type)}
            <label class="saved-filter"><input type="checkbox" id="saved-filter" ${state.savedOnly ? "checked" : ""} /> 只看收藏</label>
          </div>
        </div>
        <div id="catalog-results"></div>
      </section>
    </div>
    </div>`;
  renderResults();
}

function renderResults() {
  const state = getState();
  const results = matchingCases(state);
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Math.min(state.page, pages);
  const visible = results.slice((page - 1) * pageSize, page * pageSize);
  const filtered = state.q || state.industry || state.department || state.type || state.savedOnly;
  const featured = !filtered && page === 1;
  const first = cases[0];
  const chips = [["q", state.q], ["industry", state.industry], ["department", state.department], ["type", state.type]].filter(([, value]) => value);
  document.querySelector("#catalog-results").innerHTML = `
    <div class="results-heading"><div><h2>${state.savedOnly ? "我的收藏" : filtered ? "筛选结果" : "全部方案"}</h2><span id="result-count" role="status">${results.length} 篇</span></div>
      <div class="result-controls"><label><span class="sr-only">排序方式</span><select data-sort><option value="editorial" ${state.sort === "editorial" ? "selected" : ""}>编辑排序</option><option value="difficulty" ${state.sort === "difficulty" ? "selected" : ""}>实施难度由低到高</option></select></label>
      <div class="view-control" role="group" aria-label="显示方式">${iconButton("layout-grid", "网格视图", `data-view="grid" aria-pressed="${state.view === "grid"}"`)}${iconButton("list", "列表视图", `data-view="list" aria-pressed="${state.view === "list"}"`)}</div></div>
    </div>
    ${chips.length ? `<div class="active-filters">${chips.map(([key, value]) => `<button data-remove-filter="${key}" aria-label="移除筛选：${esc(value)}">${esc(value)} ${icon("x")}</button>`).join("")}<button class="text-button" data-clear-filters>清除筛选</button></div>` : ""}
    ${featured ? `<article class="featured-study">
      <div class="featured-copy"><p class="eyebrow"><span class="square-mark"></span>本期选读 / MANUFACTURING</p><h2><a href="${urlWith({ case: first.id })}" data-route>${esc(first.insight)}</a></h2><p>以刀具管理为起点，把机台、批次与质检记录连接起来。</p><a class="read-link" href="${urlWith({ case: first.id })}" data-route>阅读专题 ${icon("arrow-up-right")}</a></div>
      <div class="featured-path" aria-label="解决步骤"><span class="case-number">SCENARIO STUDY / 01</span><ol><li><span>01</span><strong>留下记录</strong><small>机台 / 刀具 / 批次</small></li><li><span>02</span><strong>提前提醒</strong><small>使用次数 / 质量记录</small></li><li><span>03</span><strong>人工确认</strong><small>换刀 / 质量放行</small></li></ol><span class="study-label">行业方案</span></div>
    </article>` : ""}
    ${visible.length ? `<div class="case-grid ${state.view === "list" ? "list-view" : ""}">${visible.map(card).join("")}</div>` :
      `<div class="empty-state">${icon(state.savedOnly ? "bookmark" : "search")}<h3>${state.savedOnly && !saved.size ? "还没有收藏的案例" : "没有找到匹配的案例"}</h3><p>${state.savedOnly && !saved.size ? "先从感兴趣的业务场景开始。" : "试试其他关键词，或移除部分筛选条件。"}</p><button class="button" data-clear-filters>浏览全部案例 ${icon("arrow-right")}</button></div>`}
    <div class="catalog-bottom"><p>以下方案基于行业典型业务场景整理，可按你的实际情况调整落地。</p>${results.length ? `<nav class="pagination" aria-label="案例分页">${page > 1 ? `<a href="${urlWith({ page: page - 1 })}" data-route aria-label="上一页">${icon("chevron-left")}</a>` : `<button disabled aria-label="上一页">${icon("chevron-left")}</button>`}${paginationItems(page, pages).map((item) => item === "ellipsis" ? `<span aria-hidden="true">…</span>` : `<a href="${urlWith({ page: item })}" data-route ${page === item ? 'aria-current="page"' : ""}>${item}</a>`).join("")}${page < pages ? `<a href="${urlWith({ page: page + 1 })}" data-route aria-label="下一页">${icon("chevron-right")}</a>` : `<button disabled aria-label="下一页">${icon("chevron-right")}</button>`}</nav>` : ""}</div>`;
  refreshIcons();
}

const chapters = [
  ["overview", "研究摘要"], ["story", "用户故事"], ["context", "问题拆解"], ["architecture", "方案模块"], ["journey", "业务流程"],
  ["data", "数据与系统"], ["delivery", "实施计划"], ["evaluation", "验收决策"], ["risks", "风险与边界"],
];
function sectionTitle(index, title) { return `<div class="article-section-title"><span>${String(index).padStart(2, "0")}</span><h2>${title}</h2></div>`; }
function renderDetail(item) {
  currentCase = item;
  document.title = `${item.title} · 落点 AI 案例库`;
  const returnUrl = urlWith({ case: null });
  const related = cases.filter((other) => other.id !== item.id).sort((a, b) => Number(b.type === item.type) - Number(a.type === item.type)).slice(0, 2);
  main.innerHTML = `<div class="page-container detail-page">
    <nav class="breadcrumb" aria-label="面包屑"><a href="${returnUrl}" data-route>${icon("arrow-left")} 返回案例库</a><span>/</span><a href="${urlWith({ industry: item.industry, case: null, page: null })}" data-route>${esc(item.industry)}</a><span>/</span><span>研究 ${item.number}</span></nav>
    <header class="detail-heading">
      <div class="detail-kicker"><span class="industry-label">${esc(item.industry)}</span><span>SCENARIO STUDY / ${item.number}</span><span class="study-label">行业方案</span></div>
      <h1>${esc(item.title)}</h1><p>${esc(item.insight)}。</p>
      <div class="detail-meta"><span>落点 AI 场景方案</span><span>更新于 ${item.updated}</span><span>${item.department}</span>
        <div class="detail-actions">${bookmark(item)}${iconButton("link", "复制案例链接", "data-share")}${iconButton("printer", "打印 / 保存为 PDF", "data-print")}</div>
      </div>
    </header>
    <div class="reading-layout">
      <aside class="reading-sidebar"><p class="eyebrow">CONTENTS</p><nav aria-label="文章目录">${chapters.map(([id, title], i) => `<a href="#${id}" ${i === 0 ? 'aria-current="location"' : ""}><span>${String(i + 1).padStart(2, "0")}</span>${title}</a>`).join("")}</nav><a class="text-button" href="${returnUrl}" data-route>${icon("arrow-left")} 返回索引</a></aside>
      <article class="case-article">
        <section id="overview" class="executive-summary"><p class="eyebrow">EXECUTIVE SUMMARY / 研究摘要</p><h2>${esc(item.insight)}</h2><p>${esc(item.problem)}</p><div class="summary-facts"><div><span>切入方式</span><strong>${item.type}</strong></div><div><span>实施难度</span><strong>${item.difficulty}<small> / 初步判断</small></strong></div><div><span>阅读时间</span><strong>${item.readingMinutes} 分钟<small> / 约</small></strong></div></div></section>
        <p class="editor-note">本页基于行业典型业务场景整理，具体指标需结合你的实际数据在试点中测量。</p>
        <section id="story" class="article-section story-section">${sectionTitle(2, "先看一个用户故事")}<div class="story-persona"><div><span>${esc(item.userStory.label)}</span><strong>${esc(item.userStory.persona.name)} · ${esc(item.userStory.persona.role)}</strong></div><h3>${esc(item.userStory.headline)}</h3><p>${esc(item.userStory.opening)}</p></div><blockquote>${esc(item.userStory.plainProblem)}</blockquote><div class="story-turn"><span>事情的转折</span><p>${esc(item.userStory.turningPoint)}</p></div><ol class="story-scenes">${item.userStory.scenes.map((scene, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(scene.title)}</h3><p>${esc(scene.text)}</p></div></li>`).join("")}</ol><div class="story-before-after"><article><span>BEFORE / 以前</span><p>${esc(item.userStory.beforeAfter.before)}</p></article><article><span>AFTER / 现在</span><p>${esc(item.userStory.beforeAfter.after)}</p></article></div><div class="story-ending"><h3>处理方式发生了哪些变化</h3><p>${esc(item.userStory.ending)}</p><ul>${item.userStory.takeaways.map((entry) => `<li>${icon("check")} ${esc(entry)}</li>`).join("")}</ul></div></section>
        <section id="context" class="article-section">${sectionTitle(3, "业务背景与问题拆解")}<p>${esc(item.context)}</p><dl class="context-facts"><div><dt>参与角色</dt><dd>${esc(item.roles)}</dd></div><div><dt>业务责任人</dt><dd>${esc(item.owner)}</dd></div><div><dt>目前做法</dt><dd>${esc(item.before)}</dd></div></dl><div class="problem-grid">${item.problemBreakdown.map((part, i) => `<article><span>${String(i + 1).padStart(2, "0")}</span><h3>${esc(part.title)}</h3><p>${esc(part.detail)}。</p></article>`).join("")}</div><div class="assumption-block"><strong>阅读前提</strong><ul>${item.assumptions.map((assumption) => `<li>${esc(assumption)}</li>`).join("")}</ul></div></section>
        <section id="architecture" class="article-section">${sectionTitle(4, "方案模块与范围")}<p>${esc(item.solution)}</p><div class="module-list">${item.solutionModules.map((module, i) => `<article><span>${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(module.name)}</h3><p>${esc(module.description)}</p><small>责任：${esc(module.owner)}</small></div></article>`).join("")}</div><div class="scope-grid"><div><h3>试点包含</h3><ul>${item.scope.included.map((entry) => `<li>${icon("check")} ${esc(entry)}</li>`).join("")}</ul></div><div><h3>本阶段不包含</h3><ul>${item.scope.excluded.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ul></div></div></section>
        <section id="journey" class="article-section">${sectionTitle(5, "实际使用路径")}<p>新工具要放进现有工作，而不是另开一套没人维护的看板。下表说明谁做什么、留下什么记录。</p><div class="journey-table" role="table" aria-label="使用流程"><div role="row" class="journey-head"><span role="columnheader">角色</span><span role="columnheader">动作</span><span role="columnheader">留下的记录</span></div>${item.userJourney.map((step) => `<div role="row"><strong role="cell">${esc(step.actor)}</strong><p role="cell">${esc(step.action)}</p><span role="cell">${esc(step.output)}</span></div>`).join("")}</div><div class="human-check"><span class="eyebrow">人工确认</span><p>${esc(item.boundary)}</p></div></section>
        <section id="data" class="article-section">${sectionTitle(6, "数据要求与系统接入")}<p>先检查字段是否齐全、口径是否一致、谁有权查看，再讨论系统接口。资料本身有问题，换工具也解决不了。</p><div class="table-scroll"><table class="data-table"><caption>最小数据集与质量要求</caption><thead><tr><th>字段</th><th>建议来源</th><th>质量要求</th><th>敏感级别</th></tr></thead><tbody>${item.dataRequirements.map((entry) => `<tr><td>${esc(entry.field)}</td><td>${esc(entry.source)}</td><td>${esc(entry.quality)}</td><td>${esc(entry.sensitivity)}</td></tr>`).join("")}</tbody></table></div><div class="integration-list">${item.integrationLevels.map((entry) => `<article><span>${esc(entry.level)}</span><p>${esc(entry.scope)}</p><small>${esc(entry.condition)}</small></article>`).join("")}</div></section>
        <section id="delivery" class="article-section">${sectionTitle(7, "十四天试点计划")}<p>${esc(item.pilot)}</p><div class="pilot-phase-list">${item.pilotPhases.map((phase) => `<article><span>${esc(phase.days)}</span><div><h3>${esc(phase.title)}</h3><ul>${phase.tasks.map((task) => `<li>${esc(task)}</li>`).join("")}</ul><p><strong>退出条件：</strong>${esc(phase.exit)}</p></div></article>`).join("")}</div><div class="deliverables"><h3>交付物</h3><ol>${item.deliverables.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ol></div></section>
        <section id="evaluation" class="article-section">${sectionTitle(8, "价值假设与验收决策")}<div class="value-grid"><article><span>日常工作</span><p>${esc(item.valueHypothesis.operational)}</p></article><article><span>管理判断</span><p>${esc(item.valueHypothesis.management)}</p></article><article><span>是否值得投入</span><p>${esc(item.valueHypothesis.economic)}</p></article></div><div class="table-scroll"><table class="measurement-table"><caption>基线与目标将在试点开始时共同确认</caption><thead><tr><th>指标</th><th>测量方法</th><th>目前水平</th><th>验收目标</th></tr></thead><tbody>${item.acceptanceCriteria.map((entry) => `<tr><td>${esc(entry.metric)}</td><td>${esc(entry.method)}<small>${esc(entry.sample)}</small></td><td>${esc(entry.baseline)}</td><td><span class="pending-label">${esc(entry.target)}</span></td></tr>`).join("")}</tbody></table></div><div class="decision-grid"><article><span>扩大使用</span><p>${esc(item.decisionRules.expand)}</p></article><article><span>调整后再试</span><p>${esc(item.decisionRules.adjust)}</p></article><article><span>停止投入</span><p>${esc(item.decisionRules.stop)}</p></article></div><div class="cost-list"><h3>主要成本</h3>${item.costDrivers.map((entry) => `<div><strong>${esc(entry.item)}</strong><p>${esc(entry.detail)}</p></div>`).join("")}</div></section>
        <section id="risks" class="article-section">${sectionTitle(9, "实施前提与风险边界")}<div class="table-scroll"><table class="risk-table"><caption>风险登记表</caption><thead><tr><th>风险</th><th>预警信号</th><th>控制措施</th></tr></thead><tbody>${item.riskRegister.map((entry) => `<tr><td>${esc(entry.risk)}</td><td>${esc(entry.signal)}</td><td>${esc(entry.mitigation)}</td></tr>`).join("")}</tbody></table></div><div class="readiness-grid"><div><h3>开始前应具备</h3><ul>${item.prerequisites.map((entry) => `<li>${icon("check")} ${esc(entry)}</li>`).join("")}</ul></div><div><h3>不适合立即启动</h3><ul>${item.notSuitable.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ul></div></div><div class="questions-block"><h3>首次诊断需要回答</h3><ol>${item.openQuestions.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ol></div></section>
        <section class="article-cta"><div><p class="eyebrow">FROM RESEARCH TO PRACTICE</p><h2>你的团队也遇到过类似问题？</h2><p>带上目前的做法和一小份样本，我们一起判断是否值得试。</p></div><button class="button solid" data-contact>聊聊这个问题 ${icon("arrow-up-right")}</button></section>
        <section class="related-section"><div class="section-heading"><h2>继续阅读</h2><a href="${returnUrl}" data-route>全部案例 ${icon("arrow-right")}</a></div><div class="case-grid">${related.map(card).join("")}</div></section>
      </article>
    </div>
  </div>`;
  sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (!visible.length) return;
    const id = visible[0].target.id;
    document.querySelectorAll(".reading-sidebar nav a").forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-100px 0px -55% 0px" });
  main.querySelectorAll(".case-article > section[id]").forEach((section) => sectionObserver.observe(section));
}

let renderVersion = 0;
function finishRender() {
  const savedCount = document.querySelector("#saved-count");
  if (savedCount) savedCount.textContent = saved.size;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.toggleAttribute("data-active", link.dataset.nav === "library");
  });
  refreshIcons();
}
function renderNotFound(message = "链接可能已失效，请回到案例库继续查找。") {
  currentCase = null;
  document.title = "案例未找到 · 落点 AI";
  main.innerHTML = `<div class="page-container empty-state"><span class="eyebrow">CASE NOT FOUND</span><h1>这篇案例暂不存在</h1><p>${esc(message)}</p><a class="button solid" data-route href="/cases/">返回案例库 ${icon("arrow-right")}</a></div>`;
}
async function render() {
  const version = ++renderVersion;
  sectionObserver?.disconnect();
  const caseId = params().get("case");
  const summary = cases.find((entry) => entry.id === caseId);
  if (!caseId) renderLibrary();
  else if (!summary) renderNotFound();
  else {
    document.title = `${summary.title} · 正在加载`;
    main.innerHTML = `<div class="page-container detail-loading"><span class="eyebrow">LOADING STUDY / ${summary.number}</span><p>正在加载详细方案…</p></div>`;
    try {
      const response = await fetch(`/case-data/${encodeURIComponent(caseId)}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const detail = await response.json();
      if (version !== renderVersion) return;
      renderDetail(detail);
    } catch {
      if (version !== renderVersion) return;
      renderNotFound("详细方案数据加载失败，请刷新页面或返回案例库。");
    }
  }
  if (version === renderVersion) finishRender();
}

async function navigate(href, { replace = false, preserveScroll = false } = {}) {
  history.replaceState({ ...history.state, scroll: window.scrollY }, "");
  if (replace) history.replaceState({ scroll: preserveScroll ? window.scrollY : 0 }, "", href);
  else history.pushState({ scroll: preserveScroll ? window.scrollY : 0 }, "", href);
  await render();
  if (!preserveScroll) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}
history.scrollRestoration = "manual";
window.addEventListener("popstate", () => {
  render().then(() => requestAnimationFrame(() => window.scrollTo(0, history.state?.scroll || 0)));
});

document.addEventListener("click", async (event) => {
  const route = event.target.closest("a[data-route]");
  if (route && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
    event.preventDefault();
    await navigate(route.href);
    return;
  }
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-save")) {
    const id = button.dataset.save;
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    try { localStorage.setItem("luodian-saved", JSON.stringify([...saved])); }
    catch { notify("本次收藏已更新，但浏览器未允许持久保存。"); }
    const savedCountEl = document.querySelector("#saved-count");
    if (savedCountEl) savedCountEl.textContent = saved.size;
    if (!currentCase) renderResults();
    else {
      document.querySelectorAll(`[data-save="${id}"]`).forEach((control) => {
        const label = `${saved.has(id) ? "取消收藏" : "收藏"}：${cases.find((item) => item.id === id).title}`;
        control.setAttribute("aria-pressed", String(saved.has(id)));
        control.setAttribute("aria-label", label);
        control.title = label;
      });
    }
  } else if (button.hasAttribute("data-view")) {
    history.replaceState(history.state, "", urlWith({ view: button.dataset.view }));
    renderResults();
  } else if (button.hasAttribute("data-remove-filter")) {
    navigate(urlWith({ [button.dataset.removeFilter]: null, page: null }), { replace: true, preserveScroll: true });
  } else if (button.hasAttribute("data-clear-filters")) {
    navigate("/cases/", { replace: true, preserveScroll: true });
  } else if (button.hasAttribute("data-share")) {
    try {
      await navigator.clipboard.writeText(new URL(`/cases/?case=${currentCase.id}`, location.origin).href);
      notify("案例链接已复制");
    } catch { notify("复制未获授权，可以复制浏览器地址栏中的链接。"); }
  } else if (button.hasAttribute("data-print")) window.print();
  else if (button.hasAttribute("data-contact")) {
    document.querySelector("#contact-form").reset();
    document.querySelector("#contact-status").textContent = "";
    if (currentCase) document.querySelector('[name="workflow"]').value = `关注方案：${currentCase.title}\n我的业务现状：`;
    dialog.showModal();
  } else if (button.hasAttribute("data-close-dialog")) dialog.close();
});

document.addEventListener("input", (event) => {
  if (event.target.id !== "case-search") return;
  history.replaceState(history.state, "", urlWith({ q: event.target.value, page: null }));
  renderResults();
});
document.addEventListener("change", (event) => {
  const field = event.target;
  if (field.hasAttribute("data-filter")) navigate(urlWith({ [field.dataset.filter]: field.value, page: null }), { replace: true, preserveScroll: true });
  else if (field.hasAttribute("data-sort")) {
    history.replaceState(history.state, "", urlWith({ sort: field.value, page: null }));
    renderResults();
  } else if (field.id === "saved-filter") navigate(urlWith({ saved: field.checked ? 1 : null, page: null }), { replace: true, preserveScroll: true });
});
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
document.querySelector("#contact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector("#contact-status");
  const submit = form.querySelector("button[type=submit]");
  const formData = new FormData(form);
  const company = String(formData.get("company")).trim();
  const workflow = String(formData.get("workflow")).trim();
  if (!company || !workflow) {
    status.textContent = "请填写企业与具体流程，内容不能只有空格。";
    return;
  }
  submit.disabled = true;
  status.textContent = "正在发送…";
  try {
    const response = await fetch("https://formsubmit.co/ajax/pardus.team.william@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `落点 AI 项目咨询：${company}`,
        _captcha: "false",
        企业或团队: company,
        联系方式: formData.get("contact") || "未填写",
        业务流程: workflow,
        参考案例: currentCase?.title || "未选择",
      }),
    });
    if (!response.ok) throw new Error(String(response.status));
    form.reset();
    status.textContent = "已发送，我们会尽快联系你。";
  } catch (error) {
    status.textContent = "发送失败，请直接邮件或微信联系：pardus.team.william@gmail.com / sopia101。";
  } finally {
    submit.disabled = false;
  }
});
render();
