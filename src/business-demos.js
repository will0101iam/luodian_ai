import './business-demos.css';
import { opportunities, inquiries, quoteVersions, compareQuotes, deliveryPlans, materialGap, costPresets, calculateCost } from './business-engine.js';

export const businessConfigs = {
  sales: { num: '04', icon: 'message-square', name: '销售跟进工作台', role: '盘活商机 / 老客复购', industry: '箱包 · 童车 · 机床 · 服装', title: '客户不少，今天最该跟进谁？', desc: '把客户消息与商机进度放在一起。看清卡在哪里，带着具体方案再联系。', system: 'CRM 商机 / 跟进任务' },
  inquiries: { num: '05', icon: 'search', name: '询盘转商机', role: '展会 / 邮件 / 官网线索', industry: '外贸获客 · 装备销售', title: '展会回来，一堆线索怎么接住？', desc: '从询盘中辨认采购需求，匹配产品，补齐关键问题，再分给合适的销售。', system: '线索池 / CRM 商机' },
  quotes: { num: '06', icon: 'git-compare-arrows', name: '报价版本协同', role: '比版本 / 守住报价口径', industry: '箱包外贸 · 业务与跟单', title: '报价改了三轮，客户说的哪一版？', desc: '价格、包装、运费和贸易条款一起比较。谈降价前，先确认双方说的是同一件事。', system: 'CRM 报价 / ERP 产品成本' },
  delivery: { num: '07', icon: 'clipboard-check', name: '订单交付推演', role: '缺料预警 / 交期协同', industry: '箱包制造 · 采购与生产', title: '还有一周出货，缺料怎么补救？', desc: '把缺料、供应商消息和工序连起来，比较延期、分批与加急，让各部门围绕一份方案行动。', system: 'ERP 库存 / 采购 / 生产计划' },
  costing: { num: '08', icon: 'file-text', name: '成本与报价测算', role: '接单报价 / 毛利控制', industry: '箱包 · 童车 · 机加工', title: '客户再压一点价，这单还能接吗？', desc: '拆开材料、人工与一次性费用。试着改数量、让利幅度，看利润怎样变化。', system: 'ERP 成本 / 报价审批' },
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yuan = n => Number(n).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 });
const btn = (action, text, primary = false, disabled = false) => `<button type="button" class="button ${primary ? 'solid' : ''}" data-biz="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;
const tag = (s, tone = '') => `<span class="biz-tag ${tone}">${esc(s)}</span>`;
const metric = (name, value, note) => `<div class="biz-metric"><span>${name}</span><strong>${value}</strong><small>${note}</small></div>`;
const field = (label, name, value, type = 'text', extra = '') => `<label class="biz-field">${label}<input data-edit="${name}" type="${type}" value="${esc(value)}" ${type === 'text' ? 'maxlength="200"' : type === 'number' ? 'min="0" step="0.01" max="10000000"' : ''} ${extra}></label>`;
const exportLabels = { id: '编号', name: '名称', qty: '数量', date: '日期', price: '单价', cost: '单位成本', currency: '币种', term: '贸易条款', pack: '包装', freight: '单件运输费', note: '备注', first: '首批预计出厂日', rest: '剩余批次', extra: '额外费用 / 元', late: '需要调整原交付承诺', dependency: '方案依据', approval: '待确认前提', material: '单件材料 / 元', labor: '单件人工 / 元', packaging: '单件包装 / 元', overhead: '单件制造费用 / 元', tooling: '一次性工装 / 元', margin: '毛利率 / %', discount: '让利 / %', unitCost: '单件成本 / 元', quote: '目标毛利报价 / 元', actual: '让利后单价 / 元', total: '本单销售额 / 元', profit: '本单毛利 / 元' };
function formatRecord(record, depth = 0) {
  return Object.entries(record).map(([k, v]) => {
    const label = `${'  '.repeat(depth)}${exportLabels[k] || k}`;
    if (Array.isArray(v)) return `${label}：\n${v.map(x => `${'  '.repeat(depth + 1)}• ${x}`).join('\n')}`;
    if (v && typeof v === 'object') return `${label}：\n${formatRecord(v, depth + 1)}`;
    return `${label}：${typeof v === 'number' ? Number(v.toFixed(2)) : typeof v === 'boolean' ? (v ? '是' : '否') : v}`;
  }).join('\n');
}
const fresh = key => ({ selected: 0, filter: '全部', ready: false, busy: false, stage: 0, saved: {}, drafts: {}, reviewed: false, ...(key === 'inquiries' ? { entries: structuredClone(inquiries), owners: {} } : {}), ...(key === 'quotes' ? { versions: structuredClone(quoteVersions), a: 'V2', b: 'V3', price: 27.4 } : {}), ...(key === 'delivery' ? { plan: 'split' } : {}), ...(key === 'costing' ? { preset: 'luggage', inputs: structuredClone(costPresets.luggage) } : {}) });
const state = Object.fromEntries(Object.keys(businessConfigs).map(k => [k, fresh(k)]));
let dispose = () => {};
export function unmountBusinessDemo() { dispose(); dispose = () => {}; }

export function mountBusinessDemo(host, key, api) {
  unmountBusinessDemo();
  const s = state[key];
  const c = businessConfigs[key];
  const controller = new AbortController();
  let timers = [];
  function cancel() { timers.forEach(clearTimeout); timers = []; s.busy = false; }
  dispose = () => { cancel(); controller.abort(); };
  function invalidate() { cancel(); s.ready = false; s.reviewed = false; }
  function processing() {
    if (!s.busy) return '';
    const steps = ['读取样例业务记录', '交叉核对与方案推演', '形成可复核的行动建议'];
    return `<div class="biz-processing" role="status"><span class="biz-spinner"></span><div><strong>${steps[s.stage]}…</strong><small>本地流程演示 · ${s.stage + 1} / 3</small></div>${btn('cancel', '取消')}</div>`;
  }
  function run() {
    if (s.busy) return;
    if (key === 'costing') { try { calculateCost(s.inputs); } catch (e) { api.notify(e.message); return; } }
    s.ready = false; s.reviewed = false; s.busy = true; s.stage = 0; render();
    [900, 1900, 2900].forEach((delay, i) => timers.push(setTimeout(() => { if (i < 2) s.stage = i + 1; else { s.busy = false; s.ready = true; timers = []; } render(); }, delay)));
  }
  const review = () => `<label class="biz-review"><input type="checkbox" data-edit="reviewed" ${s.reviewed ? 'checked' : ''}> 我已核对依据与待确认事项，保存为本地演示草稿</label>`;
  const empty = text => s.busy ? processing() : `<div class="biz-empty"><span>AI 辅助判断</span><h3>${text}</h3><p>读取业务依据，逐步给出建议。结果由你复核，确认后形成下一步行动。</p>${btn('analyze', '开始分析 →', true, s.busy)}</div>`;
  const saved = text => `<div class="biz-saved" role="status">✓ ${text} · 仅本次页面有效 ${btn('export', '查看 / 导出')}</div>`;
  function render() {
    host.innerHTML = `<div class="demo-breadcrumb"><span>业务工作台</span><span> / ${c.name}</span><span class="sample-badge">行业示例数据</span></div><section class="scenario-heading"><p class="eyebrow">WORKSPACE ${c.num} <span> / ${c.industry}</span></p><h1>${c.title}</h1><p>${c.desc}</p></section><div class="biz-toolbar"><span><i class="live-dot"></i> 演示基准日 2026-09-18 · 数据为固定样例</span>${btn('reset', '重置此工作台')}</div><div class="biz-workspace" aria-busy="${s.busy}">${({ sales: renderSales, inquiries: renderInquiries, quotes: renderQuotes, delivery: renderDelivery, costing: renderCosting })[key]()}</div><section class="demo-benefits"><div><p class="eyebrow">接上已有系统</p><h2>${c.system}</h2><p>读取业务记录 → 提出有依据的建议 → 人工确认 → 形成执行草稿</p></div>${btn('brief', '聊聊我的业务 ↗')}</section>`;
    api.refreshIcons();
  }
  function renderSales() {
    const p = opportunities[s.selected];
    const visible = opportunities.filter(p => s.filter === '全部' || p.owner === s.filter);
    return `<div class="biz-metrics">${metric('跟进中的商机', '4', '覆盖四类业务样例')}${metric('超过 7 天未推进', '2', '按样例记录间隔筛选')}${metric('已形成行动草稿', Object.keys(s.saved).length, '逐个客户确认，不群发')}</div><div class="biz-columns"><section class="panel biz-list"><div class="panel-heading"><h2>商机雷达</h2><select aria-label="筛选销售" data-edit="filter">${['全部', '陈晓', '沈洁'].map(v => `<option ${s.filter === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>${visible.map(p => `<button class="biz-record ${opportunities[s.selected].id === p.id ? 'selected' : ''}" data-select="${opportunities.indexOf(p)}"><span>${tag(p.stage)}<small>${p.owner} · ${p.days} 天</small></span><strong>${p.company}</strong><span>${esc(p.product)}</span><p>${p.signal}</p><b>${p.amount}</b>${s.saved[p.id] ? '<em>已安排下一步 ✓</em>' : ''}</button>`).join('')}</section><section class="panel biz-detail"><div class="panel-heading"><div><span class="panel-kicker">${p.industry}</span><h2>${p.company}</h2></div>${tag(p.stage)}</div><h3>从原始记录看进展</h3><ol class="biz-timeline">${p.evidence.map(e => `<li>${esc(e)}</li>`).join('')}</ol>${s.ready ? `<div class="biz-insight"><span>建议优先解决</span><h3>${p.next}</h3><p>依据：${p.signal}。这是规则提示，不代表成交概率。</p></div><label class="biz-field">发给客户的沟通草稿<textarea data-edit="draft" rows="4" maxlength="2000">${esc(s.drafts[p.id] ?? p.draft)}</textarea></label><div class="biz-two">${field('任务负责人', 'owner', s.owner ?? p.owner)}${field('计划跟进日期', 'date', s.date ?? '2026-09-21', 'date')}</div>${review()}${btn('save-sales', '确认跟进任务', true, !!s.saved[p.id])}${s.saved[p.id] ? saved('跟进任务已保存') : ''}` : empty('下一次跟进，该说什么？')}</section></div>`;
  }
  function renderInquiries() {
    const p = s.entries[s.selected];
    return `<div class="biz-metrics">${metric('待处理询盘', 3 - Object.keys(s.saved).length, '三个来源，统一接待')}${metric('同名客户提醒', '1', '只提示重复，人工核实')}${metric('已确认处理', Object.keys(s.saved).length, '合并线索或新建待补全商机')}</div><div class="biz-columns"><section class="panel biz-list"><div class="panel-heading"><h2>统一询盘箱</h2></div>${s.entries.map((p, i) => `<button class="biz-record ${i === s.selected ? 'selected' : ''}" data-select="${i}"><span>${tag(p.channel)}<small>${p.id}</small></span><strong>${p.company}</strong><span>${esc(p.product)} · ${p.qty} ${i === 0 ? '个' : '台'}</span><p>${p.note}</p>${s.saved[p.id] ? '<em>已处理 ✓</em>' : ''}</button>`).join('')}</section><section class="panel biz-detail"><div class="panel-heading"><h2>${p.company}</h2>${tag(p.channel)}</div><blockquote class="biz-source">${p.note}<footer>来源：${p.channel}记录 · ${esc(inquiries[s.selected].contact)}</footer></blockquote>${s.ready ? `<div class="biz-insight"><span>样例目录匹配</span><h3>${esc(inquiries[s.selected].product)}</h3><p>由本条固定询盘映射至样例产品目录；配置与价格仍需核实。</p></div><div class="biz-two">${field('需求产品', 'product', p.product)}${field('采购数量', 'qty', p.qty, 'number', 'step="1"')}${field('销售目的地', 'destination', p.destination)}${field('联系人 / 联系方式', 'contact', p.contact)}</div><div class="biz-warning"><strong>报价前还要问清</strong><ul>${p.missing.map(m => `<li>${m}</li>`).join('')}</ul></div>${p.duplicate ? `<div class="biz-warning"><strong>同名客户提醒</strong><p>${p.duplicate}</p><label class="biz-field">处理方式<select data-edit="merge"><option value="">请选择</option><option value="merge" ${s.merge === 'merge' ? 'selected' : ''}>已核实同一项目，追加到 S01</option><option value="new" ${s.merge === 'new' ? 'selected' : ''}>已核实为不同项目，新建商机</option></select></label></div>` : ''}<label class="biz-field">分配负责人<select data-edit="owner"><option>请选择负责人</option>${['陈晓', '沈洁'].map(v => `<option ${s.owner === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>${review()}${btn('save-inquiry', '确认转入商机跟进', true, !!s.saved[p.id])}${s.saved[p.id] ? saved('线索处理结果已保存，待补全问题一并带入') : ''}` : empty('把线索变成可跟进的机会')}</section></div>`;
  }
  function renderQuotes() {
    const a = s.versions.find(v => v.id === s.a), b = s.versions.find(v => v.id === s.b), diff = compareQuotes(a, b);
    const labels = { qty: '采购数量', price: '单价 / USD', term: '贸易条款', pack: '包装方式', freight: '单件运保费 / USD' };
    return `<div class="biz-metrics">${metric('客户 / 产品', 'NordWay', '20 寸登机箱 · 固定样例')}${metric('报价版本', s.versions.length, '所有版本保留原始口径')}${metric('当前对比', `${a.id} → ${b.id}`, '以贸易条款和配置为前提')}</div><section class="panel biz-detail"><div class="panel-heading"><h2>报价沿革</h2><span class="muted">币种 USD · 样例成本不含税</span></div><div class="biz-version-strip">${s.versions.map(v => `<article><span>${v.id} · ${v.date}</span><strong>$${v.price.toFixed(2)}</strong><small>${v.term} / ${v.pack}</small><p>${esc(v.note)}</p></article>`).join('')}</div><div class="biz-two"><label class="biz-field">基准版本<select data-edit="a">${s.versions.map(v => `<option ${v.id === s.a ? 'selected' : ''}>${v.id}</option>`).join('')}</select></label><label class="biz-field">比较版本<select data-edit="b">${s.versions.map(v => `<option ${v.id === s.b ? 'selected' : ''}>${v.id}</option>`).join('')}</select></label></div><div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>比较项目</th><th>${a.id}</th><th>${b.id}</th></tr></thead><tbody>${Object.entries(labels).map(([k,l]) => `<tr class="${a[k] !== b[k] ? 'changed' : ''}"><th>${l}</th><td>${esc(a[k])}</td><td>${esc(b[k])}</td></tr>`).join('')}</tbody></table></div>${s.ready ? `<div class="biz-insight"><span>版本判断</span><h3>${diff.comparable ? '报价口径一致，可以比较单价' : '报价口径有变化，不能直接判断涨价或降价'}</h3><p>表面单价差 $${diff.delta.toFixed(2)}；扣除各自运保费后差额 $${diff.normalizedDelta.toFixed(2)}。包装、数量等变化仍须单独评估，不能仅据此判断利润。</p></div><div class="biz-two"><div><h3>基于 ${b.id} 拟定下一版</h3><p>沿用数量、包装、币种与贸易条款。仅调整单价，生成内部草稿。</p>${field('新版本单价 / USD', 'price', s.price, 'number')}<p class="biz-price-hint">沿用样例单位成本 $${b.cost.toFixed(2)}；拟报价毛利率 ${s.price > 0 ? ((s.price - b.cost) / s.price * 100).toFixed(1) : '—'}%。低于成本时停止保存。</p></div><div class="biz-warning"><strong>发布报价前确认</strong><p>客户是否接受当前包装？运保费估算是否仍有效？最终报价需业务与财务审批。</p></div></div>${review()}${btn('save-quote', '保存新版本草稿', true)}${s.saved.latest ? saved(`${s.saved.latest.id} 已加入版本记录，未发送客户`) : ''}` : empty('先弄清差价来自哪里')}</section>`;
  }
  function renderDelivery() {
    const p = deliveryPlans.find(p => p.id === s.plan);
    return `<div class="biz-metrics">${metric('原定出厂日', '09 / 25', 'PO-PH260918 · 3,000 个登机箱')}${metric('关键拉杆缺口', materialGap(3000, 2400), 'ERP 样例库存：2,400 套')}${metric('供应商答复', '09 / 24', '600 套预计到货 · 尚未锁定')}</div><section class="panel biz-detail"><div class="panel-heading"><h2>从采购到出货，一起看</h2>${tag('交期风险', 'warn')}</div><div class="biz-process-track">${[['订单确认','已完成'],['面料 / 箱壳','已齐料'],['拉杆配套','缺 600 套'],['组装 / 质检','待排产'],['出货','约定 09-25']].map(([a,b],i) => `<div class="${i === 2 ? 'at-risk' : ''}"><small>0${i+1}</small><strong>${a}</strong><span>${b}</span></div>`).join('')}</div><blockquote class="biz-source">供应商 09-18 09:20：“缺的 600 套正常 24 号到。加急可以争取 20 号，每套多 6 元，要今天确认。”<footer>ERP 与供应商消息均为演示样例；以下日期由预设工序与排期给出，不是实时承诺。</footer></blockquote>${s.ready ? `<h3>选一个方案，看代价和前提</h3><div class="biz-plan-grid">${deliveryPlans.map(p => `<button class="biz-plan ${s.plan === p.id ? 'selected' : ''}" data-plan="${p.id}" aria-pressed="${s.plan === p.id}">${tag(p.late ? '需调整交付承诺' : '有条件按期', p.late ? 'warn' : '')}<h3>${p.name}</h3><strong>${p.first}</strong><span>首批 ${p.qty.toLocaleString()} 个</span><p>余量：${p.rest}</p><b>额外费用 ${yuan(p.extra)}</b></button>`).join('')}</div><div class="biz-insight"><span>所选方案 · ${p.name}</span><h3>${p.approval}</h3><p>${p.dependency}</p></div><div class="biz-two"><div><h3>待办清单</h3><ol class="biz-task-list"><li>跟单 · 获取客户对交期 / 分批的书面确认</li><li>采购 · 核实拉杆到货节点与费用</li><li>生产 · 锁定装配、质检及出货排期</li></ol></div><div class="biz-warning"><strong>仍未消除的风险</strong><p>样例未计算周末、停机、返工和订舱变化。实际排期需以工厂日历、产能及质检结果复核。</p></div></div>${review()}${btn('save-delivery', '确认并生成协调单', true)}${s.saved.plan ? saved(`已保存：${s.saved.plan.name}`) : ''}` : empty('同一张订单，试着推演三种补救方案')}</section>`;
  }
  function renderCosting() {
    let calc, error;
    try { calc = calculateCost(s.inputs); } catch(e) { error = e.message; }
    const names = { qty: '订单数量 / 件', material: '单件材料 / 元', labor: '单件人工 / 元', packaging: '单件包装 / 元', overhead: '单件制造费用 / 元', freight: '单件运输 / 元', tooling: '一次性工装 / 元', margin: '目标毛利率 / %', discount: '在建议价上让利 / %' };
    return `<div class="biz-preset-tabs" role="group" aria-label="选择成本行业">${Object.entries(costPresets).map(([k,p]) => `<button data-preset="${k}" aria-pressed="${s.preset === k}">${p.name}</button>`).join('')}</div><div class="biz-columns cost-columns"><section class="panel biz-detail"><div class="panel-heading"><h2>把成本拆开算</h2>${tag('CNY · 不含税')}</div><div class="biz-two">${Object.entries(names).map(([k,l]) => field(l, k, s.inputs[k], 'number')).join('')}</div><p class="biz-footnote">工装按本单数量全额分摊；材料、人工等为可编辑样例单价。毛利率 =（收入 − 成本）÷ 收入，不是成本加价率。未计税、汇率、账期及售后风险。</p>${error ? `<p role="alert" class="biz-error">${error}</p>` : ''}${btn('analyze', '测算报价与毛利 →', true, s.busy)}</section><section class="panel biz-detail"><div class="panel-heading"><h2>接单决策</h2><span class="muted">修改参数后需重新测算</span></div>${s.ready && calc ? `<div class="biz-quote-hero"><span>让利后的单件报价</span><strong>${yuan(calc.actual)}</strong><small>目标毛利报价 ${yuan(calc.quote)} / 让利 ${s.inputs.discount}%</small></div><div class="biz-metrics small">${metric('单位成本', yuan(calc.unitCost), `含工装分摊 ${yuan(s.inputs.tooling / s.inputs.qty)}`)}${metric('实际毛利率', `${calc.margin.toFixed(1)}%`, calc.margin < s.inputs.margin - .05 ? '低于目标，需重新复核' : '达到设定目标')}${metric('本单毛利', yuan(calc.profit), `销售额 ${yuan(calc.total)}`)}</div><div class="biz-cost-bars">${['material','labor','packaging','overhead','freight','tooling'].map(k => { const val = k === 'tooling' ? s.inputs[k] / s.inputs.qty : s.inputs[k]; return `<div><span>${names[k].split(' /')[0]}</span><i><b style="width:${calc.unitCost ? val/calc.unitCost*100 : 0}%"></b></i><strong>${yuan(val)}</strong></div>`; }).join('')}</div><div class="${calc.profit < 0 ? 'biz-warning' : 'biz-insight'}"><strong>${calc.profit < 0 ? '报价低于成本，不可保存' : calc.margin < s.inputs.margin - .05 ? '让利已压缩毛利，建议带着依据审批' : '在当前成本假设下，达到目标毛利'}</strong><p>多接订单可能摊薄工装费用，但不代表材料和人工会自动降价。最终以实际成本与审批为准。</p></div>${review()}${btn('save-cost', '保存报价测算单', true, calc.profit < 0)}${s.saved.cost ? saved('测算单已保存') : ''}` : empty('数量和折扣，会怎样影响这单利润？')}</section></div>`;
  }
  function exportSaved() {
    const records = Object.values(s.saved);
    if (!records.length) return api.notify('请先复核并保存一份业务草稿。');
    api.download(`落点AI-${c.name}.txt`, `落点 AI / ${c.name}\n示例数据 · 在线演算 · 未连接或写入 CRM / ERP\n演示基准日：2026-09-18\n\n${records.map(r => formatRecord(r)).join('\n\n')}`);
  }
  function save(action) {
    if (!s.ready || s.busy || !s.reviewed) return api.notify('请先完成分析，并勾选复核确认。');
    if (action === 'save-sales') {
      const p = opportunities[s.selected], draft = s.drafts[p.id] ?? p.draft;
      if (!draft.trim() || !(s.owner ?? p.owner).trim() || !(s.date ?? '2026-09-21').match(/^\d{4}-\d{2}-\d{2}$/)) return api.notify('请补齐沟通草稿、负责人及有效日期。');
      s.saved[p.id] = { 客户: p.company, 任务: p.next, 负责人: s.owner ?? p.owner, 日期: s.date ?? '2026-09-21', 沟通草稿: draft, 原始依据: p.evidence, 状态: '待跟进，未发送客户' };
    }
    if (action === 'save-inquiry') {
      const p = s.entries[s.selected];
      if (!p.product.trim() || !Number.isInteger(p.qty) || p.qty <= 0 || p.qty > 1e7 || !p.destination.trim() || !p.contact.trim()) return api.notify('请补全产品、正整数数量、目的地和联系人。');
      if (!['陈晓', '沈洁'].includes(s.owner)) return api.notify('请分配一位销售负责人。');
      if (p.duplicate && !s.merge) return api.notify('请先核实同名客户，选择追加或新建。');
      s.saved[p.id] = { 来源: p.channel, 客户: p.company, 产品: p.product, 数量: p.qty, 目的地: p.destination, 联系人: p.contact, 负责人: s.owner, 处理: s.merge === 'merge' ? '追加到 S01（本地演示）' : '新建待补全商机（本地演示）', 待确认: p.missing, 原文: p.note };
    }
    if (action === 'save-quote') {
      const b = s.versions.find(v => v.id === s.b);
      if (!Number.isFinite(s.price) || s.price < b.cost || s.price > 1e7) return api.notify('新报价不能低于样例成本，且必须是有效正数。');
      const v = { ...b, id: `V${s.versions.length + 1}`, price: Math.round(s.price*100)/100, date: '09-18', note: `基于 ${b.id} 调整价格；内部草稿，待审批。` };
      s.versions.push(v); s.saved.latest = v; s.reviewed = false;
    }
    if (action === 'save-delivery') s.saved.plan = { ...deliveryPlans.find(p => p.id === s.plan), 状态: '协调草稿，所有前提待责任人确认', 库存依据: '订单 3000，现料 2400，缺口 600；09-18 样例快照', 待办清单: ['跟单：获取客户对交期或分批的书面确认', '采购：核实拉杆到货节点与费用', '生产：锁定装配、质检及出货排期'] };
    if (action === 'save-cost') {
      const result = calculateCost(s.inputs);
      if (result.profit < 0) return api.notify('报价低于成本，请调整。');
      s.saved.cost = { 场景: s.inputs.name, 成本输入: { ...s.inputs }, 测算结果: result, 口径: '人民币不含税，工装全额分摊，未含账期、税、汇率及售后风险', 状态: '内部测算草稿，未审批' };
    }
    api.notify('已保存本地演示草稿，未向外部系统提交。'); render();
  }
  host.addEventListener('click', event => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.hasAttribute('data-select')) { invalidate(); s.selected = Number(target.dataset.select); s.owner = undefined; s.date = undefined; s.merge = ''; const prior = s.saved[(key === 'sales' ? opportunities : s.entries)[s.selected].id]; if (prior) { s.owner = prior.负责人; s.date = prior.日期; s.merge = prior.处理?.startsWith('追加') ? 'merge' : 'new'; } render(); return; }
    if (target.dataset.plan) { s.plan = target.dataset.plan; s.reviewed = false; delete s.saved.plan; render(); return; }
    if (target.dataset.preset) { invalidate(); s.preset = target.dataset.preset; s.inputs = structuredClone(costPresets[s.preset]); s.saved = {}; render(); return; }
    const action = target.dataset.biz;
    if (action === 'analyze') run();
    if (action === 'cancel') { cancel(); render(); }
    if (action === 'reset') { cancel(); Object.keys(s).forEach(k => delete s[k]); Object.assign(s, fresh(key)); render(); api.notify('工作台已恢复初始样例。'); }
    if (action === 'brief') api.brief();
    if (action === 'export') exportSaved();
    if (action?.startsWith('save-')) save(action);
  }, { signal: controller.signal });
  function edit(event) {
    const el = event.target, name = el.dataset.edit; if (!name) return;
    if (name === 'reviewed') { s.reviewed = el.checked; return; }
    if (name === 'filter') { s.filter = el.value; const current = opportunities[s.selected]; if (s.filter !== '全部' && current.owner !== s.filter) { invalidate(); s.selected = opportunities.findIndex(p => p.owner === s.filter); s.owner = undefined; s.date = undefined; } render(); return; }
    s.reviewed = false;
    if (key === 'costing') { s.inputs[name] = el.value === '' ? NaN : Number(el.value); invalidate(); s.saved = {}; host.querySelector('.biz-workspace').setAttribute('aria-busy', 'false'); host.querySelector('[data-biz="analyze"]').disabled = false; host.querySelectorAll('.biz-error').forEach(e => e.remove()); { const result = host.querySelector('.cost-columns > section:last-child'); result.innerHTML = '<div class="biz-empty"><h3>参数已修改，请重新测算。</h3><p>旧结果已清除，避免使用过期报价。</p></div>'; } return; }
    if (key === 'sales') { const p = opportunities[s.selected]; if (name === 'draft') s.drafts[p.id] = el.value; else s[name] = el.value; delete s.saved[p.id]; }
    if (key === 'inquiries') { if (['product','qty','destination','contact'].includes(name)) s.entries[s.selected][name] = name === 'qty' ? Number(el.value) : el.value; else s[name] = el.value; delete s.saved[s.entries[s.selected].id]; }
    if (key === 'quotes') { if (name === 'a' || name === 'b') { invalidate(); s[name] = el.value; s.price = s.versions.find(v => v.id === s.b).price; render(); return; } s.price = el.value === '' ? NaN : Number(el.value); delete s.saved.latest; }
    if (key === 'sales' || key === 'inquiries') {
      const total = Object.keys(s.saved).length;
      const metrics = host.querySelectorAll('.biz-metrics > .biz-metric > strong');
      metrics[2].textContent = String(total);
      if (key === 'inquiries') metrics[0].textContent = String(3 - total);
      host.querySelector('.biz-record.selected em')?.remove();
    }
    // Inputs remain focused while typing; invalidate visible confirmations immediately.
    host.querySelectorAll('.biz-review input').forEach(e => e.checked = false);
    host.querySelectorAll('.biz-saved').forEach(e => e.remove());
    host.querySelectorAll('[data-biz="save-sales"], [data-biz="save-inquiry"]').forEach(e => e.disabled = false);
    if (key === 'quotes') { const base = s.versions.find(v => v.id === s.b); host.querySelector('.biz-price-hint').textContent = `沿用样例单位成本 $${base.cost.toFixed(2)}；拟报价毛利率 ${s.price > 0 ? ((s.price - base.cost) / s.price * 100).toFixed(1) : '—'}%。低于成本时停止保存。`; }
  }
  host.addEventListener('input', edit, { signal: controller.signal });
  host.addEventListener('change', edit, { signal: controller.signal });
  render();
}
