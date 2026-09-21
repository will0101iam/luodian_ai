// Deliberately bounded, local demo rules. No model or production-system calls.
export const crmSamples = {
  luggage: '客户：陈经理\n公司：示例箱包贸易\n上次那个20寸拉杆箱，德国客户想先要800个。还是黑色，轮子要静音轮。\n你周五前给我个报价，最好下个月中旬能走。',
  machine: '客户：周经理\n公司：示例精密制造\n我们想采购2台数控车床，用来加工铝件。\n周三前给我个报价，下个月交货。具体精度要求我再问一下工程师。',
};

export function extractCRM(text) {
  if (!text.trim()) throw new Error('先粘贴一段客户沟通，或载入样例。');
  const find = (regex) => { const matches = [...text.matchAll(regex)]; return matches.at(-1); };
  const rules = [
    ['customer', '客户联系人', /客户[：:]\s*([^\n，。]+)/g, (m) => m[1].trim()],
    ['company', '企业名称', /公司[：:]\s*([^\n，。]+)/g, (m) => m[1].trim()],
    ['product', '需求产品', /(\d+\s*寸(?:拉杆箱|箱子)?|数控车床|电动童车)/g, (m) => m[0]],
    ['quantity', '意向数量', /(\d[\d,]*)\s*(个|件|台|套)/g, (m) => `${m[1].replaceAll(',', '')} ${m[2]}`],
    ['market', '目标市场', /(德国|美国|法国|英国|日本|国内)(?:客户|市场)?/g, (m) => m[1]],
    ['spec', '规格要求', /(黑色|藏青色|蓝色|白色|静音轮|加工铝件)/g, () => [...new Set(text.match(/黑色|藏青色|蓝色|白色|静音轮|加工铝件/g))].join('、')],
    ['followup', '下一步跟进', /((?:周[一二三四五六日天]|\d{1,2}月\d{1,2}日)前)[^。\n]*?(报价|价格)/g, (m) => `${m[1]}提供报价（具体日期待确认）`],
    ['delivery', '交付要求', /(下个月(?:中旬|上旬|下旬)?|\d{1,2}月\d{1,2}日)[^。\n]*?(?:走|交货|出货)/g, (m) => `${m[0]}（待确认）`],
  ];
  const fields = rules.map(([id, label, regex, convert]) => {
    const match = find(regex);
    return { id, label, value: match ? convert(match) : '', evidence: match?.[0] || '', previous: id === 'quantity' && /箱/.test(text) ? '500 个（样例档案）' : '', reviewed: false };
  });
  const warnings = ['未识别的内容不会自动写入字段；请逐项对照原文确认。'];
  if (/不要|不是|取消|不采购|不需要|改成|改为/.test(text)) warnings.unshift('存在否定或变更表述：本演示无法可靠判断最终意图，提取值仅供人工修正。');
  const quantities = text.match(/\d[\d,]*\s*(?:个|件|台|套)/g) || [];
  if (quantities.length > 1) warnings.unshift('发现多个数量，暂展示最后一处；请核实产品归属，不能直接作为总数量。');
  return { fields, warnings };
}

export const orderSamples = {
  apparel: {
    title: '服装订单 · PH-FZ-0921', industry: '服装 / 款色码',
    original: [['颜色', '蓝色 / BL-01'], ['L 码', '600 件'], ['XL 码', '400 件'], ['包装袋', 'V1 已确认']],
    text: '蓝色改成藏青，L码减少200件，XL码增加200件。包装袋用新版，其他不变。',
    alternate: '蓝色改成黑色，L码减少100件，XL码增加300件。包装袋用新版，其他不变。',
    sourceNote: '订单总量 1,000 件 · 生产单已下发 · 包装文件 V1',
  },
  stroller: {
    title: '电动童车订单 · PH-TC-0922', industry: '童车 / 出口配置',
    original: [['电池', '12V 7Ah'], ['充电器', '12V / 欧规插头'], ['颜色', '红色'], ['包装', '英文版 V1']],
    text: '电池改成24V 7Ah，充电器改成24V，插头改成美规。包装换成新版，其他不变。',
    alternate: '电池改成24V 7Ah，充电器改成12V，插头改成美规。包装换成新版，其他不变。',
    sourceNote: '订单数量 300 台 · 已审核配置 12V · 出口包装 V1',
  },
};

export function inspectOrder(type, text) {
  if (!text.trim()) throw new Error('先输入客户的变更要求，或载入样例。');
  const changes = [];
  const add = (field, before, after, evidence, risk, blocking = false) => changes.push({ field, before, after, evidence, risk, blocking, reviewed: false });
  if (type === 'apparel') {
    const color = text.match(/蓝色改(?:成|为)(藏青|黑色|白色|红色)/);
    if (color) add('颜色', '蓝色 / BL-01', color[1], color[0], '客户色名需要对应内部色号；请跟单员确认。');
    let total = 1000;
    for (const [size, base] of [['L', 600], ['XL', 400]]) {
      const matches = [...text.matchAll(new RegExp(`(?:^|[^A-Z])(${size}\\s*码?\\s*(减少|增加|减|加)\\s*(\\d+)\\s*件?)`, 'g'))];
      const match = matches.at(-1);
      if (match) {
        const delta = Number(match[3]) * (/减/.test(match[2]) ? -1 : 1);
        const next = base + delta;
        total += delta;
        add(`${size} 码`, `${base} 件`, `${next} 件`, match[1], next < 0 ? '变更后数量小于零，需修改输入重新检查。' : matches.length > 1 ? '发现多次修改，暂按最后一处计算，请确认版本。' : '生产单已下发，需核实裁剪与备料进度。', next < 0);
      }
    }
    if (/包装袋.*新版/.test(text)) add('包装袋', 'V1 已确认', '新版（文件缺失）', text.match(/包装袋[^。\n，]*新版/)[0], '请补齐新版包装文件，确认后再安排生产。');
    return { changes, headline: !changes.length ? '未识别到支持的变更句式。' : total === 1000 ? '总量没变，生产要求变了。' : `订单总量变为 ${total.toLocaleString()} 件。`, summary: !changes.length ? '请对照原文人工核实，不能据此判断订单没有变化。' : `原订单 1,000 件 → 变更后 ${total.toLocaleString()} 件。${total === 1000 ? '需要重点核实尺码结构和物料版本。' : '请同步复核金额、备料和交期。'}` };
  }
  const battery = text.match(/电池改(?:成|为)\s*(\d+)V\s*(\d+)Ah/i);
  const charger = text.match(/充电器改(?:成|为)\s*(\d+)V/i);
  const plug = text.match(/插头改(?:成|为)(美规|欧规|英规)/);
  const batteryV = battery ? Number(battery[1]) : 12;
  const chargerV = charger ? Number(charger[1]) : 12;
  if (battery) add('电池', '12V 7Ah', `${battery[1]}V ${battery[2]}Ah`, battery[0], '电池电压变更需工程师核实整车电机、控制器与配套配置。');
  if (charger) add('充电器', '12V', `${charger[1]}V`, charger[0], '演示仅核对配置标称电压，实际适配需工程师确认。');
  if (plug) add('插头', '欧规', plug[1], plug[0], '确认目标市场与插头规格。');
  if (/包装.*新版/.test(text)) add('包装', '英文版 V1', '新版（文件缺失）', text.match(/包装[^。\n，]*新版/)[0], '需要新版文件与客户确认记录。');
  if (batteryV !== chargerV) add('配置冲突', `原配置 12V / 12V`, `${batteryV}V 电池 / ${chargerV}V 充电器`, [battery?.[0], charger?.[0]].filter(Boolean).join('；'), '标称电压不一致。请修改客户要求并重新检查。', true);
  return { changes, headline: !changes.length ? '未识别到支持的变更句式。' : batteryV !== chargerV ? '发现电池与充电器配置冲突。' : '客户改了配置，配套也要一起核实。', summary: '对照已审核配置逐项检查。这里的规则核对不代表整车适配或认证通过。' };
}

export const ledgerSample = {
  orders: [
    { ref: 'PO-0920', sku: 'LG-02', name: '黑色拉杆', qty: 1000, price: 12.5 },
    { ref: 'PO-0920', sku: 'JL-01', name: '静音轮', qty: 2000, price: 3.2 },
    { ref: 'PO-0920', sku: 'BZ-01', name: '包装袋', qty: 1000, price: 0.8 },
  ],
  receipts: [
    { ref: 'SH-001', sku: 'LG-02', name: '黑色拉杆', qty: 980, price: 12.5 },
    { ref: 'SH-002', sku: 'JL-01', name: '静音轮', qty: 2000, price: 3.2 },
    { ref: 'SH-003', sku: 'BZ-01', name: '包装袋', qty: 1000, price: 0.8 },
  ],
  statements: [
    { ref: 'SH-001', sku: 'LG-02', name: '黑色伸缩杆', qty: 1000, price: 13 },
    { ref: 'SH-002', sku: 'JL-01', name: '静音轮', qty: 2000, price: 3.2 },
    { ref: 'SH-002', sku: 'JL-01', name: '静音轮', qty: 2000, price: 3.2 },
    { ref: 'SH-003', sku: 'BZ-01', name: '包装袋', qty: 1000, price: 0.8 },
  ],
};

export function reconcile(docs) {
  for (const [key, rows] of Object.entries(docs)) {
    if (!rows.length) throw new Error('三份单据都需要至少一行数据。');
    rows.forEach((row, i) => {
      if (!row.ref.trim() || !row.sku.trim() || !row.name.trim() || row.qty === '' || row.price === '' || !Number.isFinite(Number(row.qty)) || !Number.isFinite(Number(row.price)) || Number(row.qty) < 0 || Number(row.price) < 0 || !Number.isInteger(Number(row.qty)) || !Number.isSafeInteger(Number(row.qty)) || Number(row.qty) > 10000000 || Number(row.price) > 10000000) throw new Error(`${{ orders: '采购订单', receipts: '收货记录', statements: '供应商对账单' }[key]}第 ${i + 1} 行：请填写单号、编码、名称、有效的非负整数数量与单价（不超过 1,000 万）。`);
    });
  }
  const skus = [...new Set(Object.values(docs).flat().map((r) => r.sku.trim()))];
  const results = skus.map((sku) => {
    const groups = Object.fromEntries(Object.entries(docs).map(([k, rows]) => [k, rows.filter((r) => r.sku.trim() === sku)]));
    const sumQty = (rows) => rows.reduce((n, r) => n + Number(r.qty), 0);
    const money = (rows) => rows.reduce((n, r) => n + Number(r.qty) * Math.round(Number(r.price) * 100), 0);
    const issues = [];
    const oq = sumQty(groups.orders), rq = sumQty(groups.receipts), sq = sumQty(groups.statements);
    if (!groups.orders.length) issues.push('未找到对应采购订单');
    if (!groups.receipts.length) issues.push('未找到对应收货记录');
    if (!groups.statements.length) issues.push('未找到对应对账记录');
    if (oq !== rq) issues.push(`订购 ${oq} / 收货 ${rq}，相差 ${Math.abs(oq - rq)} 件`);
    if (sq !== rq) issues.push(`对账 ${sq} / 收货 ${rq}，相差 ${Math.abs(sq - rq)} 件`);
    const orderPrices = new Set(groups.orders.map((r) => Math.round(Number(r.price) * 100)));
    if (groups.statements.some((r) => !orderPrices.has(Math.round(Number(r.price) * 100)))) issues.push('对账单价与采购约定不一致');
    const duplicates = groups.statements.filter((r, i, arr) => arr.findIndex((x) => x.ref.trim() === r.ref.trim()) !== i);
    if (duplicates.length) issues.push(`送货单 ${[...new Set(duplicates.map((r) => r.ref))].join('、')} 疑似重复计入（总数暂含重复行）`);
    if (groups.statements.some((r) => !groups.receipts.some((x) => x.ref.trim() === r.ref.trim()))) issues.push('对账引用的送货单号未在收货记录中找到');
    if (new Set(Object.values(groups).flat().map((r) => r.name.trim())).size > 1) issues.push('名称不同，已按相同物料编码归组，请确认');
    return { sku, name: groups.orders[0]?.name || Object.values(groups).flat()[0].name, ordered: oq, received: rq, billed: sq, amount: money(groups.statements) / 100, issues, groups, reviewed: false, resolution: '', note: '' };
  });
  return { results, total: results.reduce((sum, r) => sum + Math.round(r.amount * 100), 0) / 100 };
}

export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
