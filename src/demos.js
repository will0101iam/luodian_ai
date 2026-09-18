import './library.css';
import './demos.css';
import { businessConfigs, mountBusinessDemo, unmountBusinessDemo } from './business-demos.js';
import { createIcons, MessageSquare, GitCompareArrows, Files, ArrowRight, ArrowUpRight, Check, CheckCheck, Download, RotateCcw, Play, FileText, Info, CircleAlert, Search, ChevronRight, ClipboardCheck, ChevronLeft, Ellipsis, Smile, CirclePlus, Mic, LoaderCircle, Pencil } from 'lucide';
import { crmSamples, orderSamples, ledgerSample, extractCRM, inspectOrder, reconcile, csvCell } from './demo-engine.js';

const icons = { MessageSquare, GitCompareArrows, Files, ArrowRight, ArrowUpRight, Check, CheckCheck, Download, RotateCcw, Play, FileText, Info, CircleAlert, Search, ChevronRight, ClipboardCheck, ChevronLeft, Ellipsis, Smile, CirclePlus, Mic, LoaderCircle, Pencil };
const configs = {
  ...businessConfigs,
  crm: { num: '01', icon: 'message-square', name: '微信转 CRM', role: '销售 / 客户跟进', industry: '箱包外贸 · 机床销售', title: '聊完客户，还要再填一遍 CRM？', desc: '从聊天里整理需求、数量和下一步。对照原文检查，把跟进记录交给现有系统。', inputTitle: '客户刚刚发来的消息', inputHint: '试着把 800 改成 1200，再整理一次。', run: '整理客户需求', outcome: '客户需求与跟进草稿', value: ['少一次复制粘贴', '跟进事项不遗漏', '每个字段都有依据'], system: 'CRM 客户档案 / 商机 / 跟进任务' },
  order: { num: '02', icon: 'git-compare-arrows', name: '订单变更检查', role: '跟单 / 生产协同', industry: '服装 · 电动童车', title: '客户说“就改这几处”，你都同步了吗？', desc: '把最新要求和原订单放在一起，找出数量、配置与版本变化，生产前再核对一次。', inputTitle: '原订单与最新要求', inputHint: '改一处数量，或切换童车样例检查配置。', run: '检查订单变更', outcome: '订单变更复核单', value: ['发现隐蔽的变更', '指出配套冲突', '交接有清晰依据'], system: 'ERP 订单 / 生产单 / 变更审批' },
  reconcile: { num: '03', icon: 'files', name: '单据核对', role: '采购 / 仓库 / 财务', industry: '箱包配件 · 制造企业', title: '月底对账，时间都花在找差异？', desc: '采购、收货、对账放在一起检查。先找到不一致的几行，再让人判断原因。', inputTitle: '三份业务单据', inputHint: '可修改数量、单价，也可添加或删除单据行。', run: '开始核对单据', outcome: '差异核对清单', value: ['数量与价格一起核', '重复记录提前发现', '异常逐项确认'], system: 'ERP 采购 / 收货 / 应付对账' },
};
const states = {
  crm: { sample: 'luggage', text: crmSamples.luggage, result: null, confirmed: false },
  order: { sample: 'apparel', text: orderSamples.apparel.text, result: null, confirmed: false },
  reconcile: { doc: 'orders', docs: structuredClone(ledgerSample), result: null, confirmed: false },
};
let active = Object.hasOwn(configs, location.hash.slice(1)) ? location.hash.slice(1) : 'crm';
let toastTimer;
let exportUrl;
let processingTimers = [];
let processingVersion = 0;
const processingSteps = {
  crm: [['读取聊天记录', '梳理客户消息与上下文'], ['整理业务字段', '提取产品、数量和跟进事项'], ['检查缺失信息', '保留原文依据，准备复核草稿']],
  order: [['读取客户最新要求', '对照原订单与本次变更'], ['逐项比较变化', '检查数量、规格与配置'], ['整理复核清单', '标记冲突与待确认事项']],
  reconcile: [['读取三份单据', '按物料编码归组业务记录'], ['核对数量与单价', '检查实收、对账及重复记录'], ['汇总核对结果', '整理差异与原始单据依据']],
};
const app = document.querySelector('#demo-app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name) => `<i data-lucide="${name}"></i>`;
const money = (n) => Number(n).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' });
const refreshIcons = () => createIcons({ icons, attrs: { 'aria-hidden': 'true' } });
const docNames = { orders: '采购订单', receipts: '收货记录', statements: '供应商对账单' };

function notify(message) {
  const toast = document.querySelector('#demo-toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 5000);
}

function renderNav() {
  document.querySelector('#scenario-nav').innerHTML = ['crm', 'order', 'reconcile', ...Object.keys(businessConfigs)].map(key => [key, configs[key]]).map(([key, c]) => `${key === 'crm' ? '<span class="nav-group-label">日常业务助手</span>' : key === 'sales' ? '<span class="nav-group-label">增长与经营工作台</span>' : ''}<a href="#${key}" class="scenario-link ${key === active ? 'active' : ''}" ${key === active ? 'aria-current="page"' : ''}><span class="scenario-icon">${icon(c.icon)}</span><span><strong>${c.name}</strong><small>${c.role}</small></span><span class="scenario-number">${c.num}</span></a>`).join('');
}

function render() {
  const c = configs[active];
  renderNav();
  if (businessConfigs[active]) { mountBusinessDemo(app, active, { refreshIcons, notify, download, brief: openBrief }); return; }
  app.innerHTML = `<div class="demo-breadcrumb"><span>行业体验台</span>${icon('chevron-right')}<span>${c.name}</span><span class="sample-badge">虚构业务样例</span></div>
    <section class="scenario-heading"><p class="eyebrow">SCENARIO ${c.num} <span> / ${c.industry}</span></p><h1>${c.title}</h1><p>${c.desc}</p></section>
    <div class="demo-progress" aria-label="体验步骤"><span class="current"><b>1</b> 放入业务材料</span><i></i><span data-step="2"><b>2</b> 检查整理结果</span><i></i><span data-step="3"><b>3</b> 确认并导出</span></div>
    <div class="demo-workbench"><section class="input-panel panel"><div class="panel-heading"><div><span class="panel-kicker">业务输入</span><h2>${c.inputTitle}</h2></div><button class="icon-button" data-action="reset" aria-label="重置当前样例" title="重置当前样例">${icon('rotate-ccw')}</button></div><div id="input-content">${renderInput()}</div><div class="input-actions"><p>${c.inputHint}</p><button class="button solid run-button" data-action="run">${icon('play')}${c.run}${icon('arrow-right')}</button><p id="input-error" role="alert"></p></div></section>
    <section class="output-panel panel" aria-label="处理结果"><div class="panel-heading"><div><span class="panel-kicker">处理结果</span><h2>${c.outcome}</h2></div><span id="result-badge" class="result-badge">等待处理</span></div><div id="result-content" aria-live="polite"></div><div id="result-actions"></div></section></div>
    <section class="demo-benefits"><div><p class="eyebrow">接上已有系统</p><h2>${c.system}</h2><p>${c.value.join(' · ')}</p></div><button class="button" data-action="brief">我也有这个问题 ${icon('arrow-up-right')}</button></section>`;
  renderResult();
  refreshIcons();
}

function renderInput() {
  const s = states[active];
  if (active === 'reconcile') return `<div class="doc-tabs" role="group" aria-label="切换单据">${Object.entries(docNames).map(([key, name]) => `<button data-doc="${key}" aria-pressed="${s.doc === key}">${name}<small>${s.docs[key].length}</small></button>`).join('')}</div><div id="ledger-editor">${renderLedgerEditor()}</div><p class="document-note">样例已完成字段整理。此处直接体验核对步骤，未接入 OCR 文件识别。</p>`;
  const choices = active === 'crm' ? [['luggage', '箱包外贸'], ['machine', '机床销售']] : [['apparel', '服装款色码'], ['stroller', '电动童车配置']];
  const switcher = `<div class="sample-switch" role="group" aria-label="选择行业样例">${choices.map(([key, label]) => `<button data-sample="${key}" aria-pressed="${s.sample === key}">${label}</button>`).join('')}</div>`;
  if (active === 'crm') return `${switcher}<div id="chat-preview">${renderChat(s)}</div><details class="chat-editor" id="chat-editor"><summary>${icon('pencil')} 修改聊天内容 <span>试试调整数量</span></summary><label class="source-label" for="source-text">沟通原文<span>修改后聊天气泡同步更新</span></label><textarea id="source-text" maxlength="6000" rows="6" spellcheck="false">${esc(s.text)}</textarea></details><div class="source-tools"><span>${icon('info')} 样例聊天 · 支持样例句式，可修改后重新整理</span></div>`;
  return `${switcher}
    <div class="original-order"><div class="document-title">${icon('file-text')}<strong>${orderSamples[s.sample].title}</strong><span>原始版本</span></div><dl>${orderSamples[s.sample].original.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><small>${orderSamples[s.sample].sourceNote}</small></div>
    <label class="source-label" for="source-text">客户最新要求<span>可直接修改</span></label><textarea id="source-text" maxlength="6000" rows="4" spellcheck="false">${esc(s.text)}</textarea>
    <div class="source-tools"><span>${icon('info')} 支持样例句式，复杂要求请人工复核</span>${active === 'order' ? `<button class="text-button" data-action="alternate">${s.sample === 'apparel' ? '试试总量变化' : '试试配置冲突'} ↗</button>` : ''}</div>`;
}

function renderChat(s, evidence = '') {
  const customer = s.text.match(/客户[：:]\s*([^\n，。]+)/)?.[1]?.trim() || '客户';
  const company = s.text.match(/公司[：:]\s*([^\n，。]+)/)?.[1]?.trim() || '客户沟通';
  // Keep each sentence contiguous so evidence buttons can locate its exact words.
  const messages = s.text.split('\n').filter((line) => line.trim() && !/^(客户|公司)[：:]/.test(line.trim())).flatMap((line) => line.match(/[^。！？]+[。！？]?/g) || []).map((line) => line.trim()).filter(Boolean);
  const highlight = (text) => {
    const index = evidence ? text.indexOf(evidence) : -1;
    return index < 0 ? esc(text) : `${esc(text.slice(0, index))}<mark>${esc(evidence)}</mark>${esc(text.slice(index + evidence.length))}`;
  };
  const metadataMatch = evidence && /^(客户|公司)[：:]/.test(evidence);
  return `<div class="wechat-window" aria-label="微信风格的虚构聊天记录"><div class="wechat-titlebar"><span aria-hidden="true">${icon('chevron-left')}</span><div class="${metadataMatch ? 'chat-evidence' : ''}" ${metadataMatch ? 'tabindex="-1" data-chat-evidence' : ''}><strong>${esc(customer)}</strong><small>${esc(company)}</small></div><span aria-hidden="true">${icon('ellipsis')}</span></div><div class="wechat-messages"><div class="chat-timestamp">09:41 <span>· 样例会话</span></div><div class="wechat-message outgoing"><span class="wechat-avatar sales-avatar" aria-label="销售头像">我</span><div class="wechat-bubble">您好，方便把这次的采购需求发我一下吗？</div></div>${messages.map((message, i) => `<div class="wechat-message incoming"><span class="wechat-avatar customer-avatar" aria-label="${esc(customer)}头像">${esc(customer.slice(0, 1))}</span><div class="wechat-message-body">${i === 0 ? `<small class="chat-sender">${esc(customer)}</small>` : ''}<div class="wechat-bubble ${evidence && message.includes(evidence) ? 'chat-evidence' : ''}" ${evidence && message.includes(evidence) ? 'tabindex="-1" data-chat-evidence' : ''}>${highlight(message)}</div></div></div>`).join('') || '<p class="chat-no-messages">还没有客户消息，点击下方修改聊天内容。</p>'}<div class="chat-record-end">以上为客户沟通样例</div></div><div class="wechat-composer" aria-hidden="true">${icon('mic')}<span>聊天记录预览</span>${icon('smile')}${icon('circle-plus')}</div></div>`;
}

function cancelProcessing() {
  processingVersion += 1;
  processingTimers.forEach(clearTimeout);
  processingTimers = [];
  Object.values(states).forEach((s) => { s.processing = false; });
}

function renderProcessing(s) {
  const steps = processingSteps[active];
  return `<div class="processing-view"><div class="processing-orbit" aria-hidden="true">${icon(configs[active].icon)}<span></span></div><span class="processing-caption">流程演示</span><h3>${steps[s.stage][0]}<span class="processing-dots" aria-hidden="true">…</span></h3><p>${steps[s.stage][1]}</p><ol class="processing-checklist">${steps.map(([title, subtitle], index) => `<li class="${index < s.stage ? 'done' : index === s.stage ? 'running' : ''}"><span>${index < s.stage ? icon('check') : index === s.stage ? icon('loader-circle') : String(index + 1).padStart(2, '0')}</span><div><strong>${title}</strong><small>${subtitle}</small></div>${index < s.stage ? '<em>已完成</em>' : ''}</li>`).join('')}</ol><button class="text-button" data-action="cancel-processing">取消本次处理</button></div>`;
}

function startProcessing() {
  const s = states[active];
  if (s.processing) return;
  let result;
  try {
    result = active === 'crm' ? extractCRM(s.text) : active === 'order' ? inspectOrder(s.sample, s.text) : reconcile(s.docs);
  } catch (error) { document.querySelector('#input-error').textContent = error.message; return; }
  cancelProcessing();
  const version = processingVersion;
  const scenario = active;
  s.result = null; s.confirmed = false; s.dirty = false; s.processing = true; s.stage = 0;
  document.querySelector('#input-error').textContent = '';
  renderResult();
  if (matchMedia('(max-width: 850px)').matches) document.querySelector('.output-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  // A short, explicitly labelled demonstration sequence, not simulated network work.
  [1050, 2150, 3250].forEach((delay, index) => processingTimers.push(setTimeout(() => {
    if (processingVersion !== version || active !== scenario || !s.processing) return;
    if (index < 2) s.stage = index + 1;
    else { s.processing = false; s.result = result; processingTimers = []; }
    renderResult();
  }, delay)));
}

function renderLedgerEditor() {
  const s = states.reconcile;
  return `<div class="document-title">${icon('file-text')}<strong>${docNames[s.doc]}</strong><span>9 月样例</span></div><div class="ledger-scroll"><table class="ledger-table"><thead><tr><th>${s.doc === 'orders' ? '订单号' : '送货单号'}</th><th>物料编码</th><th>名称</th><th>数量</th><th>单价 / 元</th><th><span class="sr-only">操作</span></th></tr></thead><tbody>${s.docs[s.doc].map((row, i) => `<tr>${['ref', 'sku', 'name', 'qty', 'price'].map((key) => `<td><input aria-label="${docNames[s.doc]}第${i + 1}行${{ ref: '单号', sku: '编码', name: '名称', qty: '数量', price: '单价' }[key]}" data-row="${i}" data-column="${key}" value="${esc(row[key])}" ${['qty', 'price'].includes(key) ? `type="number" min="0" max="10000000" step="${key === 'qty' ? '1' : '0.01'}"` : 'maxlength="100"'} /></td>`).join('')}<td><button class="remove-row" data-remove="${i}" aria-label="删除${docNames[s.doc]}第${i + 1}行" ${s.docs[s.doc].length <= 1 ? 'disabled' : ''}>×</button></td></tr>`).join('')}</tbody></table></div><button class="text-button add-row" data-action="add-row">＋ 添加一行</button><div class="ledger-tip">${icon('search')} ${s.doc === 'orders' ? '这里记录约定数量和单价，是核对的起点。' : s.doc === 'receipts' ? '收货可以分批；按物料编码累计，再匹配送货单号。' : '留意 SH-002 的重复记录，以及拉杆的数量与单价。'}</div>`;
}

function renderResult() {
  const s = states[active];
  const host = document.querySelector('#result-content');
  const badge = document.querySelector('#result-badge');
  document.querySelector('[data-step="2"]').classList.toggle('current', !!s.result || !!s.processing);
  document.querySelector('[data-step="3"]').classList.toggle('current', s.confirmed);
  badge.textContent = s.processing ? '正在处理' : s.confirmed ? '已保存演示草稿' : s.result ? '待人工复核' : '等待处理';
  badge.className = `result-badge ${s.confirmed ? 'complete' : s.result ? 'pending' : ''}`;
  document.querySelector('.output-panel').setAttribute('aria-busy', String(!!s.processing));
  const runButton = document.querySelector('[data-action="run"]');
  runButton.disabled = !!s.processing;
  runButton.innerHTML = s.processing ? `${icon('loader-circle')}正在处理，请稍候` : `${icon('play')}${configs[active].run}${icon('arrow-right')}`;
  runButton.classList.toggle('is-processing', !!s.processing);
  if (s.processing) host.innerHTML = renderProcessing(s);
  else if (!s.result) {
    host.innerHTML = `<div class="result-empty"><div class="empty-illustration"><span>${icon(configs[active].icon)}</span><i></i><span>${icon('clipboard-check')}</span></div><h3>${s.dirty ? '材料已修改，重新检查一下。' : '把重复整理的那一步，交给助手。'}</h3><p>${s.dirty ? '旧结果已清除，避免把过时内容带入草稿。' : '已准备好一份行业样例。点击左侧按钮，看看哪些信息能整理、哪些问题需要你确认。'}</p><div class="empty-preview"><span>原文依据</span><span>异常提示</span><span>可编辑结果</span></div></div>`;
  } else if (active === 'crm') host.innerHTML = renderCRM(s);
  else if (active === 'order') host.innerHTML = renderOrder(s);
  else host.innerHTML = renderReconcile(s);
  renderActions();
  refreshIcons();
}

function renderCRM(s) {
  const missing = s.result.fields.filter((f) => !f.value.trim()).length;
  return `<div class="result-summary"><span class="summary-icon">${icon('check-check')}</span><div><strong>整理为 ${s.result.fields.length} 个业务字段</strong><p>${missing ? `${missing} 项未明确，可补充或保留待确认。` : '字段已整理，请核实相对日期与客户意图。'}</p></div></div><div class="crm-fields">${s.result.fields.map((f, i) => `<div class="crm-field"><label for="field-${f.id}">${f.label}${['customer', 'product', 'quantity'].includes(f.id) ? '<em>必填</em>' : ''}</label><input id="field-${f.id}" data-field="${i}" value="${esc(f.value)}" placeholder="原文未明确，待补充" maxlength="300" />${f.previous ? `<small class="field-conflict">原档案：${f.previous} → 本次需求请复核</small>` : ''}${f.evidence ? `<button class="evidence-link" data-evidence="${esc(f.evidence)}">${icon('search')} 原文：${esc(f.evidence)}</button>` : '<small class="missing-evidence">未找到明确依据</small>'}</div>`).join('')}</div><div class="review-note">${icon('info')}<div>${s.result.warnings.map((w) => `<p>${esc(w)}</p>`).join('')}</div></div>`;
}

function renderOrder(s) {
  const r = s.result;
  return `<div class="result-summary ${r.changes.some((c) => c.blocking) ? 'alert' : ''}"><span class="summary-icon">${icon('git-compare-arrows')}</span><div><strong>${esc(r.headline)}</strong><p>${esc(r.summary)}</p></div></div><div class="changes-list">${r.changes.length ? r.changes.map((c, i) => `<article class="change-item ${c.blocking ? 'blocking' : ''}"><div class="change-title"><strong>${c.field}</strong><span>${c.blocking ? '需修改' : '需复核'}</span></div><div class="change-values"><del>${esc(c.before)}</del>${icon('arrow-right')}<b>${esc(c.after)}</b></div><button class="evidence-link" data-evidence="${esc(c.evidence)}">${icon('search')} ${esc(c.evidence)}</button><p>${esc(c.risk)}</p><label class="review-check"><input type="checkbox" data-review="${i}" ${c.reviewed ? 'checked' : ''} ${c.blocking ? 'disabled' : ''} />已核对，记入变更草稿</label></article>`).join('') : '<div class="no-match">未识别到支持的变更句式。请尝试样例写法；不能据此判断订单没有变化。</div>'}</div><div class="review-note">${icon('info')}<p>检查仅覆盖样例规则，不保证识别全部变更。草稿保留待补文件与待确认事项，不能直接作为生产指令。</p></div>`;
}

function renderReconcile(s) {
  const r = s.result;
  const abnormal = r.results.filter((row) => row.issues.length).length;
  return `<div class="reconcile-metrics"><div><strong>${r.results.length}</strong><span>项物料</span></div><div class="amber"><strong>${abnormal}</strong><span>项需核实</span></div><div><strong>${money(r.total)}</strong><span>对账单合计 · 含疑似重复</span></div></div><div class="reconcile-list">${r.results.map((row, i) => `<article class="reconcile-item ${row.issues.length ? 'has-issues' : ''}"><div class="change-title"><strong>${esc(row.name)} <small>${esc(row.sku)}</small></strong><span class="${row.issues.length ? '' : 'ok-tag'}">${row.issues.length ? '待核实' : '规则核对一致'}</span></div><div class="quantity-strip"><span>订购 <b>${row.ordered}</b></span><span>实收 <b>${row.received}</b></span><span>对账 <b>${row.billed}</b></span></div>${row.issues.length ? `<ul class="issue-list">${row.issues.map((issue) => `<li>${esc(issue)}</li>`).join('')}</ul>` : '<p class="matching-copy">数量、单价、单号与名称未发现差异。</p>'}<details><summary>查看三份单据依据</summary><div class="evidence-documents">${Object.entries(row.groups).map(([key, rows]) => `<div><strong>${docNames[key]}</strong>${rows.length ? rows.map((v) => `<p>${esc(v.ref)} · ${esc(v.name)}<br />${v.qty} 件 × ${money(v.price)}</p>`).join('') : '<p>未找到</p>'}</div>`).join('')}</div></details>${row.issues.length ? `<label class="resolution-label">处理结论<select data-resolution="${i}" aria-label="${esc(row.sku)}处理结论"><option value="">选择核实结论</option>${['待联系供应商', '分批到货，待补齐', '价格已协商，需补凭据', '重复或错记，待更正', '其他，见备注'].map((v) => `<option ${row.resolution === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><input class="resolution-note" data-note="${i}" aria-label="${esc(row.sku)}核实备注" placeholder="补充核实备注（选填；选择其他时必填）" maxlength="500" value="${esc(row.note)}" />` : ''}</article>`).join('')}</div><p class="document-note">相同编码归组；总数包含全部单据行。提示为差异线索，不代表实际损失。</p>`;
}

function renderActions() {
  const s = states[active];
  document.querySelector('#result-actions').innerHTML = `<div class="result-actions"><button class="button ${s.confirmed ? '' : 'solid'}" data-action="confirm" ${!s.result || s.confirmed ? 'disabled' : ''}>${icon(s.confirmed ? 'check-check' : 'check')}${s.confirmed ? '演示草稿已保存' : '已核对，保存草稿'}</button><button class="button" data-action="export" ${!s.confirmed ? 'disabled' : ''}>${icon('download')}导出${active === 'reconcile' ? ' CSV' : '草稿'}</button></div><p class="export-note">仅生成本地草稿，不会写入真实业务系统。</p>`;
}

function invalidate() {
  const s = states[active];
  const wasProcessing = s.processing;
  cancelProcessing();
  s.confirmed = false;
  s.dirty = true;
  if (s.result || wasProcessing) { s.result = null; renderResult(); }
  document.querySelector('#input-error').textContent = '';
}

function unconfirm() {
  const s = states[active];
  s.confirmed = false;
  document.querySelector('#result-badge').textContent = '待人工复核';
  document.querySelector('#result-badge').className = 'result-badge pending';
  document.querySelector('[data-step="3"]').classList.remove('current');
  renderActions();
  refreshIcons();
}

function confirmResult() {
  const s = states[active];
  if (!s.result) return;
  if (active === 'crm') {
    const empty = s.result.fields.find((f) => ['customer', 'product', 'quantity'].includes(f.id) && !f.value.trim());
    if (empty) { notify(`请先补充${empty.label}。`); document.querySelector(`#field-${empty.id}`).focus(); return; }
  }
  if (active === 'order') {
    if (!s.result.changes.length) return notify('没有识别到变更，请先调整输入。');
    if (s.result.changes.some((c) => c.blocking)) return notify('请先修正输入中的数量或配置冲突，再重新检查。');
    if (s.result.changes.some((c) => !c.reviewed)) return notify('请逐项勾选已核对的变更。');
  }
  if (active === 'reconcile') {
    if (s.result.results.some((r) => r.issues.length && (!r.resolution || (r.resolution === '其他，见备注' && !r.note.trim())))) return notify('请为每项异常选择处理结论；选择“其他”时请补充备注。');
  }
  s.confirmed = true;
  renderResult();
  notify('已保存当前页面中的演示草稿，可导出带原文依据的结果。');
}

function download(filename, content, type = 'text/plain;charset=utf-8') {
  if (exportUrl) URL.revokeObjectURL(exportUrl);
  exportUrl = URL.createObjectURL(new Blob([content], { type }));
  const a = document.querySelector('#export-download'); a.href = exportUrl; a.download = filename;
  document.querySelector('#export-preview').value = content;
  document.querySelector('#export-status').textContent = filename;
  document.querySelector('#brief-dialog').close();
  document.querySelector('#export-dialog').showModal();
}

function exportResult() {
  const s = states[active];
  if (!s.confirmed) return;
  if (active === 'reconcile') {
    const rows = [['演示性质', '物料编码', '名称', '订购数量', '实收数量', '对账数量', '对账金额', '差异', '处理结论', '备注', '采购依据', '收货依据', '对账依据']];
    s.result.results.forEach((r) => rows.push(['虚构样例 / 本地规则核对 / 未写入ERP', r.sku, r.name, r.ordered, r.received, r.billed, r.amount, r.issues.join('；'), r.resolution || '规则核对一致', r.note, ...Object.values(r.groups).map((g) => g.map((v) => `${v.ref} ${v.sku} ${v.name} ${v.qty}件 单价${v.price}`).join('；'))]));
    download('落点AI-单据核对-演示草稿.csv', '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  } else {
    const lines = [`落点 AI / ${configs[active].name} / 已复核演示草稿`, '虚构样例 · 本地规则演示 · 未写入 CRM / ERP', `复核时间：${new Date().toLocaleString('zh-CN')}`, '', '【沟通原文】', s.text, '', '【复核结果】'];
    if (active === 'crm') {
      s.result.fields.forEach((f) => lines.push(`${f.label}：${f.value.trim() || '待补充'}`, `  原文依据：${f.evidence || '无，需人工补充确认'}`, ...(f.previous ? [`  样例原档案：${f.previous}`] : [])));
      lines.push('', '【待确认提示】', ...s.result.warnings);
    } else {
      lines.push(orderSamples[s.sample].title, s.result.summary);
      s.result.changes.forEach((c) => lines.push('', `${c.field}：${c.before} → ${c.after}`, `原文依据：${c.evidence}`, `后续待办：${c.risk}`));
      lines.push('', '本草稿保留待补文件与待确认事项，不能直接作为生产指令。');
    }
    download(`落点AI-${configs[active].name}-演示草稿.txt`, lines.join('\n'));
  }
  notify('导出内容已生成，请预览或下载。');
}

app.addEventListener('input', (event) => {
  if (businessConfigs[active]) return;
  const el = event.target;
  const s = states[active];
  if (el.id === 'source-text') { s.text = el.value; invalidate(); if (active === 'crm') { document.querySelector('#chat-preview').innerHTML = renderChat(s); refreshIcons(); } }
  if (el.hasAttribute('data-column')) { s.docs[s.doc][Number(el.dataset.row)][el.dataset.column] = el.value; invalidate(); }
  if (el.hasAttribute('data-field')) { s.result.fields[Number(el.dataset.field)].value = el.value; unconfirm(); }
  if (el.hasAttribute('data-note')) { s.result.results[Number(el.dataset.note)].note = el.value; unconfirm(); }
});
app.addEventListener('change', (event) => {
  if (businessConfigs[active]) return;
  const el = event.target;
  const s = states[active];
  if (el.hasAttribute('data-review')) { s.result.changes[Number(el.dataset.review)].reviewed = el.checked; unconfirm(); }
  if (el.hasAttribute('data-resolution')) { s.result.results[Number(el.dataset.resolution)].resolution = el.value; unconfirm(); }
});
app.addEventListener('click', (event) => {
  if (businessConfigs[active]) return;
  const button = event.target.closest('button');
  if (!button) return;
  const s = states[active];
  if (button.dataset.evidence) {
    if (active === 'crm') {
      document.querySelector('#chat-preview').innerHTML = renderChat(s, button.dataset.evidence);
      refreshIcons();
      const bubble = document.querySelector('[data-chat-evidence]');
      if (bubble) { bubble.focus({ preventScroll: true }); bubble.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); return; }
      document.querySelector('#chat-editor').open = true;
    }
    const text = document.querySelector('#source-text');
    const index = text.value.indexOf(button.dataset.evidence);
    text.focus();
    if (index >= 0) text.setSelectionRange(index, index + button.dataset.evidence.length);
    else notify('请对照上方原文核实该组合信息。');
    return;
  }
  if (button.dataset.sample) {
    cancelProcessing();
    s.sample = button.dataset.sample;
    s.text = active === 'crm' ? crmSamples[s.sample] : orderSamples[s.sample].text;
    s.result = null; s.confirmed = false; s.dirty = false; render(); return;
  }
  if (button.dataset.doc) { s.doc = button.dataset.doc; document.querySelector('#input-content').innerHTML = renderInput(); refreshIcons(); return; }
  if (button.hasAttribute('data-remove')) { s.docs[s.doc].splice(Number(button.dataset.remove), 1); invalidate(); document.querySelector('#input-content').innerHTML = renderInput(); refreshIcons(); return; }
  switch (button.dataset.action) {
    case 'run':
      startProcessing();
      break;
    case 'cancel-processing': cancelProcessing(); renderResult(); notify('已取消，可以修改材料后重新处理。'); break;
    case 'reset':
      cancelProcessing();
      if (active === 'reconcile') s.docs = structuredClone(ledgerSample);
      else s.text = active === 'crm' ? crmSamples[s.sample] : orderSamples[s.sample].text;
      s.result = null; s.confirmed = false; s.dirty = false; render(); notify('已恢复当前行业的样例。'); break;
    case 'alternate': cancelProcessing(); s.text = orderSamples[s.sample].alternate; s.result = null; s.confirmed = false; s.dirty = true; render(); break;
    case 'add-row':
      if (s.docs[s.doc].length >= 30) return notify('单份演示单据最多 30 行。');
      s.docs[s.doc].push({ ref: '', sku: '', name: '', qty: 0, price: 0 }); invalidate(); document.querySelector('#input-content').innerHTML = renderInput(); refreshIcons(); break;
    case 'confirm': confirmResult(); break;
    case 'export': exportResult(); break;
    case 'brief': openBrief(); break;
  }
});

function openBrief() {
  document.querySelector('#demo-brief').reset();
  document.querySelector('#demo-brief [name="problem"]').value = `我想了解“${configs[active].name}”如何用于我们的业务。\n当前每月处理量：\n最容易出错的一步：`;
  document.querySelector('#brief-status').textContent = '';
  document.querySelector('#brief-dialog').showModal();
}

document.querySelector('[data-action="close-brief"]').addEventListener('click', () => document.querySelector('#brief-dialog').close());
document.querySelector('[data-action="close-export"]').addEventListener('click', () => document.querySelector('#export-dialog').close());
document.querySelector('#export-download').addEventListener('click', () => {
  document.querySelector('#export-status').textContent = '已发起下载，请在浏览器下载记录中查看；也可选中上方内容复制。';
});
document.querySelector('#demo-brief').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  if (!String(data.get('company')).trim() || !String(data.get('problem')).trim()) { document.querySelector('#brief-status').textContent = '企业与流程说明不能只填空格。'; return; }
  download('落点AI-流程沟通单.txt', `落点 AI / 流程沟通单\n\n场景：${configs[active].name}\n企业：${data.get('company')}\n现有系统：${data.get('system') || '待沟通'}\n\n${data.get('problem')}\n\n一起确认：处理频次、耗时、样本格式、系统接口、异常责任人和试点验收方式。`);
  document.querySelector('#brief-status').textContent = '沟通单已下载到本地，未提交或发送。';
});
window.addEventListener('hashchange', () => {
  if (!Object.hasOwn(configs, location.hash.slice(1))) return;
  cancelProcessing();
  unmountBusinessDemo();
  active = location.hash.slice(1); render();
});
render();
