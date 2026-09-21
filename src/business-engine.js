export const opportunities = [
  { id: 'S01', company: 'NordWay Travel', industry: '箱包外贸', product: '20 寸登机箱 · 3,000 个', stage: '报价中', owner: '陈晓', amount: '¥486,000', days: 8, signal: '客户关心包装，报价后 8 天未推进', evidence: ['09-08 客户：包装能否改为无塑料？请同时说明增加的成本。', '09-10 销售：已发标准包装报价，环保包装待工厂确认。', '09-18 CRM：没有环保包装成本，也没有下一次沟通安排。'], next: '先补环保包装差价，再约客户确认', draft: '您好，上次您提到的无塑料包装，我们正在补充纸浆内托方案与差价。方便确认是否需要 FSC 包装认证，以及预计上市时间吗？确认后给您两套可比较的报价。' },
  { id: 'S02', company: 'Little Orbit Toys', industry: '电动童车', product: '双驱童车 · 800 台', stage: '打样中', owner: '沈洁', amount: '¥336,000', days: 3, signal: '样品已签收，缺少测试反馈', evidence: ['09-12 客户：样品主要测试续航与遥控距离。', '09-15 物流：样品已签收。', '09-18 CRM：暂未登记测试反馈。'], next: '预约样品测试回访，确认两项测试结果', draft: '您好，样品已于 15 日签收。续航和遥控距离测试是否已经完成？我们可以安排工程师一起确认测试条件，并根据反馈调整量产配置。' },
  { id: 'S03', company: '禾川精密（样例）', industry: '机床制造', product: '立式加工中心 · 2 台', stage: '技术确认', owner: '陈晓', amount: '¥680,000', days: 5, signal: '精度需求明确，工件图纸仍缺失', evidence: ['09-11 客户：铝件，关键孔位公差 ±0.01 mm。', '09-13 工程师：需要零件图和节拍要求才能选型。', '09-18 CRM：图纸未到，选型未完成。'], next: '索取脱敏图纸和目标节拍，安排技术沟通', draft: '您好，为确认机型能否满足关键孔位精度，麻烦提供可脱敏的零件图、材料及目标节拍。收到后由工程师评估工艺，再约您确认选型。' },
  { id: 'S04', company: 'Harbor Outfitters', industry: '服装外贸', product: '秋冬外套 · 补单待确认', stage: '老客复购', owner: '沈洁', amount: '待确认', days: 14, signal: '上季订单已结束，补单窗口尚未核实', evidence: ['08-20 ERP：上季 2,000 件外套已交货。', '09-04 客户：等销售数据出来再决定补单。', '09-18 CRM：尚无销量和库存反馈。'], next: '询问实际动销和库存，再判断是否补单', draft: '您好，上季外套目前各尺码的销售和库存情况如何？如果有补单计划，我们可以先核查面料余量与排期，再给您交期建议。' },
];
export const inquiries = [
  { id: 'I01', channel: '展会', company: 'NordWay Travel', contact: 'Anna · anna@example.com', product: '20 寸登机箱', qty: 3000, destination: '德国', note: '展位沟通：要轻量款，3,000 个，环保包装；最好 11 月到德国。是否沿用上次报价？', missing: ['确认到港日还是出厂日', '确认环保包装标准'], duplicate: 'CRM 已有同名客户，存在 S01 报价中商机；需人工核实是否同一项目。' },
  { id: 'I02', channel: '邮件', company: 'Sunny Wheels', contact: 'Leo · leo@example.com', product: '双驱童车', qty: 600, destination: '西班牙', note: 'We need 600 ride-on cars for Spain. Please quote 12V and 24V options with shipping. Delivery date to be discussed.', missing: ['明确 12V / 24V 配置', '确认目的港及贸易条款', '确认认证要求和交期'], duplicate: '' },
  { id: 'I03', channel: '官网', company: '远帆制造（样例）', contact: '周先生 · 联系方式待补充', product: '立式加工中心', qty: 2, destination: '苏州', note: '加工铝件，考虑采购两台。能否先看加工效果？图纸可以后续发，想了解设备和服务。', missing: ['补充可联系的电话或邮箱', '获取图纸、精度及节拍', '确认预算和采购时间'], duplicate: '' },
];
export const quoteVersions = [
  { id: 'V1', date: '09-08', qty: 3000, price: 24, cost: 18, currency: 'USD', term: 'FOB 宁波', pack: '标准纸箱', freight: 0, note: '首轮报价，客户尚未确认包装。' },
  { id: 'V2', date: '09-12', qty: 3000, price: 25.2, cost: 18.9, currency: 'USD', term: 'FOB 宁波', pack: '环保纸浆内托', freight: 0, note: '包装成本每个增加 $0.90，报价增加 $1.20。' },
  { id: 'V3', date: '09-16', qty: 3000, price: 27.4, cost: 21.1, currency: 'USD', term: 'CIF 汉堡', pack: '环保纸浆内托', freight: 2.2, note: '每个含海运与保险估算 $2.20，运价尚待货代锁定。' },
];
export function compareQuotes(a, b) {
  const comparable = a.currency === b.currency && a.term === b.term && a.qty === b.qty && a.pack === b.pack;
  return { comparable, delta: b.price - a.price, normalizedDelta: a.currency === b.currency ? (b.price - b.freight) - (a.price - a.freight) : null,
    changes: ['qty', 'price', 'term', 'pack', 'freight'].filter(k => a[k] !== b[k]) };
}
export const deliveryPlans = [
  { id: 'wait', name: '等待齐料，整单交付', qty: 3000, first: '09-29', rest: '无分批', extra: 0, late: true, dependency: '600 套拉杆 09-24 到货；次日起按来料检查 1 天、装配 2 天、质检 1 天、出货准备 1 天推演。', approval: '客户接受延期，并重新确认船期' },
  { id: 'split', name: '现料先做，分批交付', qty: 2400, first: '09-25', rest: '600 个 / 09-29', extra: 1800, late: true, dependency: '现有 2,400 套拉杆安排 09-21 至 09-25 检查、装配与出货；余量沿用齐料后排期，额外提货与单证费 ¥1,800。', approval: '客户书面同意分批，财务批准额外运费' },
  { id: 'expedite', name: '加急来料，争取原交期', qty: 3000, first: '09-25', rest: '无分批', extra: 3600, late: false, dependency: '供应商须在 09-20 送达缺口 600 套；加急费每套 ¥6；09-21 至 09-25 预留来料检查、装配、质检与出货准备。', approval: '供应商确认到货承诺，生产锁定产能，负责人批准费用' },
];
export function materialGap(order, ready) {
  if (![order, ready].every(Number.isFinite) || order < 0 || ready < 0) throw new Error('数量必须是非负数');
  return Math.max(0, order - ready);
}
export const costPresets = {
  luggage: { name: '箱包 · 环保包装登机箱', qty: 3000, material: 82, labor: 24, packaging: 12, overhead: 8, freight: 6, tooling: 6000, margin: 25, discount: 0 },
  toy: { name: '童车 · 24V 双驱车型', qty: 800, material: 265, labor: 42, packaging: 25, overhead: 18, freight: 12, tooling: 8000, margin: 25, discount: 0 },
  machine: { name: '机加工 · 铝合金支架', qty: 500, material: 38, labor: 55, packaging: 4, overhead: 12, freight: 3, tooling: 4500, margin: 30, discount: 0 },
};
export function calculateCost(p) {
  const keys = ['qty', 'material', 'labor', 'packaging', 'overhead', 'freight', 'tooling', 'margin', 'discount'];
  if (keys.some(k => !Number.isFinite(p[k]) || p[k] < 0 || p[k] > 1e7) || !Number.isInteger(p.qty) || p.qty < 1 || p.qty > 1e7 || p.margin >= 95 || p.discount >= 100) throw new Error('请填写有效数值：数量为正整数，目标毛利率低于 95%，折扣低于 100%。');
  const unitCost = p.material + p.labor + p.packaging + p.overhead + p.freight + p.tooling / p.qty;
  if (unitCost <= 0) throw new Error('请至少填入一项大于零的业务成本。');
  const quote = Math.ceil(unitCost / (1 - p.margin / 100) * 100 - 1e-8) / 100;
  const actual = Math.round(quote * (1 - p.discount / 100) * 100) / 100;
  const total = actual * p.qty;
  return { unitCost, quote, actual, total, profit: total - unitCost * p.qty, margin: actual ? (actual - unitCost) / actual * 100 : -100 };
}
