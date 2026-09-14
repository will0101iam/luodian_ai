import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const snapshot = process.argv[2] || path.join(root, "research/snapshots/opencodev-solutions-2026-09-14.html");
const indexPath = path.join(root, "src/case-index.json");
const detailsDir = path.join(root, "public/case-data");
const homeDataPath = path.join(root, "src/home-data.json");
const manifestPath = path.join(root, "research/migration-manifest.json");
const html = fs.readFileSync(snapshot, "utf8");
const editorialTitles = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "editorial-titles.json"), "utf8"));

function extractArray(source, key) {
  const marker = `"${key}":`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing ${key} payload`);
  const start = source.indexOf("[", markerIndex);
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "[") depth += 1;
    else if (char === "]" && --depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  throw new Error(`Unterminated ${key} payload`);
}

const sourceIndustries = extractArray(html, "industries");
if (editorialTitles.length !== 193 || new Set(editorialTitles).size !== editorialTitles.length) {
  throw new Error("Editorial titles must contain 193 unique entries");
}
const industryNames = {
  "园区运营 / 创业孵化": "园区运营",
  "政企单位": "政企服务",
  "餐饮服务": "餐饮服务",
  "建筑装修": "建筑工程",
  "生活服务": "本地生活",
};
const segmentNames = {
  "服装/纺织厂": "服装与纺织生产",
  "电子/电器组装厂": "电子与电器组装",
  "五金/钣金/冲压厂": "五金、钣金与冲压加工",
  "化工/涂料/日化厂": "化工、涂料与日化生产",
  "医药/医疗器械厂": "医药与医疗器械生产",
  "新能源/电池厂": "新能源与电池生产",
  "发电机/电机厂": "发电机与电机生产",
  "陶瓷/玻璃厂": "陶瓷与玻璃生产",
  "木材/板材加工厂": "木材与板材加工",
  "家纺/床品厂": "家纺与床品生产",
  "橡胶/轮胎厂": "橡胶与轮胎生产",
  "智慧园区 / 数字化运营": "园区数字化运营",
  "租金 / 缴费 / 合规管理": "租金、缴费与合规管理",
  "创业孵化器 / 加速器": "创业孵化与加速服务",
  "OPC 创业社区(新质生产力)": "一人公司创业社区",
  "党建 / 党员服务小工具": "党务与党员服务",
  "政务公示 / 信息公开页": "政务公示与信息公开",
  "政企活动 / 民意调研": "政企活动与民意调研",
  "新闻线索采集 / 融媒体": "新闻线索采集与融媒体运营",
  "仓储/电商仓": "仓储与电商仓配",
  "快递网点/站点": "快递网点",
  "中央厨房/团餐": "中央厨房与团餐",
  "单店餐饮/夫妻店": "单店餐饮",
  "连锁零售/便利店": "连锁零售与便利店",
  "水果店/生鲜店": "水果与生鲜门店",
  "建材/五金门店": "建材与五金门店",
  "水电/暖通安装公司": "水电与暖通安装",
  "酒店/民宿": "酒店与民宿",
  "汽修/4S店": "汽修与 4S 门店",
  "美容美发/医美": "美容美发与医美",
  "家政/保洁/维修": "家政、保洁与维修",
  "宠物店/宠物医院": "宠物门店与宠物医院",
  "健身房/瑜伽馆": "健身房与瑜伽馆",
  "洗车/汽车美容": "洗车与汽车美容",
  "广告/图文快印店": "广告与图文快印",
  "干洗店/洗衣店": "干洗与洗衣门店",
  "专业咨询(法律 / 财税 / HR)": "专业咨询（法律、财税与人力资源）",
  "种植基地/农场": "种植基地与农场",
  "光伏/风电运维": "光伏与风电运维",
  "外贸公司/跨境电商": "外贸与跨境电商",
  "跨境贸易 / 外贸公司": "跨境贸易与外贸业务",
  "农产品 / 特产电商": "农产品与特产电商",
  "直播电商 / MCN": "直播电商与内容机构",
  "KTV/棋牌室": "休闲娱乐场所",
  "景区/游乐场": "景区与游乐场",
  "小型旅行社 / 地接": "旅行社与地接服务",
};
const roleMap = {
  制造业: "生产主管、现场操作人员、质量人员和计划与仓储人员",
  园区运营: "招商主管、企业服务专员、物业与财务人员和园区负责人",
  政企服务: "受理人员、业务科室、审核负责人和服务对象",
  物流仓储: "调度、现场作业人员、结算人员和客户",
  餐饮服务: "店长、采购与后厨人员、区域运营和财务",
  零售批发: "门店人员、采购、仓配和经营负责人",
  建筑工程: "项目经理、现场人员、资料与材料人员和客户",
  本地生活: "前台与客服、一线服务人员、主管和客户",
  医疗健康: "医护人员、客服、运营负责人和患者",
  教育培训: "教务、教师、课程顾问、学员和家长",
  农业养殖: "现场负责人、技术人员、临时用工和采购与监管人员",
  能源环保: "巡检员、维修工程师、调度和区域负责人",
  商贸流通: "业务员、跟单、财务与单证人员和销售负责人",
  文旅娱乐: "运营、调度、一线服务人员和客户",
};
const boundaryMap = {
  政企服务: "系统只用于信息提取、分类和草稿辅助；事项分派、政策解释与正式发布由工作人员审核。",
  医疗健康: "系统不提供诊断、处方或治疗决定；异常信息必须交由具备资质的医护人员判断。",
  制造业: "系统只提供记录、提醒和异常线索；停机、换料、质量放行等生产决定由现场负责人确认。",
  建筑工程: "系统只辅助记录和校验；工程量、质量、安全与验收结论由具备相应职责的人员签字。",
  能源环保: "系统只辅助巡检记录与异常排序；停送电、设备隔离和合规结论由专业人员确认。",
  农业养殖: "系统只辅助记录、提醒和关联分析；用药、防疫、施肥与养殖决策由技术人员确认。",
};
const genericBoundary = "系统只负责整理信息、提示异常和生成建议；费用、承诺、审批与最终业务决定由责任人确认并留痕。";

function cleanSentence(value = "") {
  return value
    .replace(/\s+/g, " ")
    .replace(/,/g, "，")
    .replace(/:/g, "：")
    .replace(/OpenCoDev\s*帮[^，,:：]*?做一个?/gi, "建议构建")
    .replace(/OpenCoDev\s*做一个?/gi, "建议构建")
    .replace(/[。；，,]+$/u, "")
    .replace(/全靠/g, "主要依赖")
    .replace(/靠感觉|凭经验/g, "依赖个人经验")
    .replace(/手工/g, "人工")
    .replace(/手写/g, "纸笔")
    .replace(/一个个/g, "逐一")
    .replace(/经常/g, "容易")
    .replace(/不知道/g, "难以及时掌握")
    .replace(/找不到/g, "难以快速定位")
    .replace(/翻半天/g, "检索耗时")
    .replace(/一团乱|混乱/g, "缺少统一管理")
    .replace(/扯皮/g, "产生争议")
    .replace(/崩溃|烦/g, "工作负担较重")
    .replace(/算到人工作负担较重/g, "需要大量人工核算")
    .replace(/要需要/g, "需要")
    .replace(/错了才发现/g, "错误通常在后续环节才暴露")
    .replace(/没人/g, "缺少明确人员")
    .replace(/效率翻\s*\d+\s*倍/gu, "减少人工切换与重复处理")
    .replace(/(?:降低|下降|提升|提高)\s*\d+\s*%\+?/gu, "作为待验证改进目标")
    .replace(/大幅降低放鸽子率/gu, "并记录提醒与到场情况")
    .replace(/公信力一下子上来/gu, "便于形成可追溯的公示记录")
    .replace(/立刻|马上|彻底|永远|绝不|拉满/gu, "")
    .replace(/\s{2,}/g, " ");
}
function normalizeSegment(value) {
  if (segmentNames[value]) return segmentNames[value];
  return cleanSentence(value)
    .replace(/\s*\/\s*/g, "与")
    .replace(/\(([^)]+)\)/g, "（$1）")
    .trim();
}
function publicContext(segment, roles, title, sequence) {
  const variants = [
    `在${segment}场景中，这项工作通常由${roles}共同完成。本案例聚焦“${title}”，不延伸到其他业务环节。`,
    `${segment}的相关工作需要多个岗位交接信息。本案例选取“${title}”这一处具体问题，说明可行的处理方式。`,
    `本案例以${segment}的一项常见工作为背景，重点讨论“${title}”需要哪些记录、人员和确认步骤。`,
  ];
  return variants[(sequence - 1) % variants.length];
}
const insightPatterns = {
  分析与洞察: (title) => `${title}：统一统计口径，再看清业务变化`,
  预测与预警: (title) => `${title}：从事后补救转向提前提醒`,
  识别与核对: (title) => `${title}：先找出差异，再由负责人确认`,
  知识与文档: (title) => `${title}：资料有版本，查询有出处`,
  智能分流: (title) => `${title}：让事项及时找到负责的人`,
  流程自动化: (title) => `${title}：把口头协作变成可跟进的工作流程`,
};
const publicTypeNames = {
  分析与洞察: "数据汇总与分析",
  预测与预警: "预测与提醒",
  识别与核对: "识别与核对",
  知识与文档: "资料与文档",
  智能分流: "分类与分派",
  流程自动化: "流程协作",
};
function publicIssue(title, type, fields, sequence) {
  const [first = "关键信息", second = "处理状态"] = fields;
  const variants = {
    分析与洞察: [
      `${title}所需的数据分散在多份记录中，“${first}”和“${second}”的统计口径也不一致，负责人很难快速看清变化。`,
      `团队需要定期查看${title}的结果，但大部分时间花在收集和合并数据，留给判断原因的时间很少。`,
      `${title}目前靠临时表格完成。换个时间或换个人统计，同一个指标可能出现不同答案。`,
    ],
    预测与预警: [
      `${title}主要靠人工盯。“${first}”和“${second}”没有连续记录，负责人通常要等异常已经出现后再处理。`,
      `${title}没有统一的历史记录和提醒规则。业务人员知道问题可能发生，却很难判断何时需要行动。`,
      `${title}的记录散落在日常表格和消息中，没有形成可比较的变化趋势，现场只能依赖个人经验。`,
    ],
    识别与核对: [
      `${title}涉及的“${first}”和“${second}”分散在不同单据或消息里，工作人员需要逐项核对，差异很难当场发现。`,
      `处理${title}时，同一件事要在多份记录之间来回查找。缺项、重复和字段差异通常到后续环节才暴露。`,
      `${title}没有统一的核对依据。原始凭证、业务记录和处理结果相互分离，复核人员难以快速判断。`,
    ],
    知识与文档: [
      `${title}所需的资料分散在个人文件、群消息或纸面记录中，“${first}”和“${second}”缺少统一口径。`,
      `${title}存在版本、归档和查询问题。工作人员能找到文件，却不容易确认哪份有效、由谁修改。`,
      `团队处理${title}时需要反复找资料和问同事，交接后更难还原完整过程。`,
    ],
    智能分流: [
      `${title}没有稳定的入口和分派规则。事项提交后，谁来处理、是否紧急、进展到哪一步都要人工追问。`,
      `围绕${title}的消息来自多个渠道，“${first}”和“${second}”不完整，调度人员很难一次分给正确的人。`,
      `${title}依赖人工判断和临时协调。业务量上升后，错派、等待和重复沟通随之增加。`,
    ],
    流程自动化: [
      `${title}主要靠口头、表格或群消息推进，“${first}”和“${second}”没有在同一处持续更新。`,
      `处理${title}时，每个人都知道自己的一步，但整体状态没人能随时说清，交接时容易漏项。`,
      `${title}缺少统一的填写、检查和确认规则。业务量增加后，等待和返工逐渐成为日常。`,
    ],
  };
  const options = variants[type];
  return options[(sequence - 1) % options.length];
}
function publicSolution(title, type, fields, owner, sequence) {
  const firstFields = fields.slice(0, 3).join("、");
  const evidenceFields = [...new Set([...fields.slice(0, 3), "原始凭证"])].join("、");
  const actions = {
    分析与洞察: `先确认统计口径，再汇总${firstFields}，展示变化趋势和对应明细，不自动替业务人员解释原因`,
    预测与预警: `每次业务发生时记录${firstFields}，系统依据历史和规则给出分级提醒，并说明触发原因`,
    识别与核对: `统一收集${evidenceFields}，系统先提取和匹配，只把缺项、重复与差异交给人工`,
    知识与文档: `按业务对象整理${firstFields}，标记有效版本、权限和日期，查询结果同时显示资料出处`,
    智能分流: `通过统一入口收集${firstFields}，系统判断事项类型与优先级，并推荐适合的责任人`,
    流程自动化: `把${firstFields}设为必要信息，系统检查填写和前后条件，并推动任务进入下一步`,
  };
  const variants = [
    `先把“${title}”涉及的记录收在同一处。${actions[type]}。${owner}确认后，结果才写入正式业务记录。`,
    `在“${title}”中，方案不改变业务责任，只减少重复整理：${actions[type]}。最后由${owner}确认。`,
    `“${title}”仍由原团队负责。工具只承担以下工作：${actions[type]}。${owner}根据处理依据决定下一步。`,
  ];
  return variants[(sequence - 1) % variants.length];
}
function inferDepartment(text) {
  const rules = [
    ["财务与结算", /对账|结算|账|收款|工资|成本|利润|发票|赊账|佣金|分账|计费|报销/],
    ["采购与供应链", /采购|补货|供应商|进货|仓储|物流|回单|库存|报关|商检|配送/],
    ["销售与市场", /客户跟进|询盘|报价|招商|会员|复购|带看|纪念日|选品|直播|线索/],
    ["客户服务", /报修|随访|客诉|投诉|评价|通知|预约|客服|在团|售后/],
    ["行政与管理", /档案|台账|合同|文书|日志|工时|党员|公示|报名|签到|培训|学员|课消|排课/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || "生产与运营";
}
function inferType(text) {
  if (/预测|预警|提醒|推荐|趋势|分析/.test(text)) return "预测与预警";
  if (/识别|回单|单据|核对|对账|版本|拍照|图像/.test(text)) return "识别与核对";
  if (/知识|档案|文书|图纸|日志|记录|台账|病历|溯源|资料/.test(text)) return "知识与文档";
  if (/分派|派工|调度|工单|分流|匹配/.test(text)) return "智能分流";
  return "流程自动化";
}
function inferDifficulty(industry, source) {
  const text = `${source.title}${source.current}${source.solution}${source.aiBonus || ""}`;
  if (/医疗|政企|报关|商检|多平台|图像识别|自动抓取|预测|最优|智能派单|API/.test(`${industry}${text}`)) return "较高";
  if (!source.aiBonus && /登记|提醒|查询|签到|台账|日报|排班|计时|收集表/.test(text)) return "较低";
  return "中等";
}
function inferFields(title, type) {
  const fields = [];
  const add = (...values) => values.forEach((value) => { if (!fields.includes(value)) fields.push(value); });
  if (/排班|预约|调度|派工|安装|行程|会议室|活动空间|客房|包间|到访|发货计划|排课|教室/.test(title)) add("安排对象", "开始与结束时间", "地点", "任务状态", "确认人员");
  if (/技能与任务协作|导师匹配/.test(title)) add("人员编号", "技能标签", "任务要求", "可用时间", "确认状态");
  if (/采购量与销量|备料量/.test(title)) add("品类", "统计周期", "采购或备料数量", "销售或消耗数量", "损耗数量");
  if (/材料用量/.test(title)) add("项目编号", "材料编号", "工程量", "损耗系数", "测算用量");
  if (/商品价格快速查询/.test(title)) add("商品编号", "客户等级", "生效日期", "适用价格", "审核状态");
  if (/会员卡余额/.test(title)) add("会员编号", "账户余额", "消费记录", "核对状态", "复核人员");
  if (/企业资质/.test(title)) add("企业名称", "资质类型", "证照编号", "有效期", "核验状态");
  if (/报价单版本/.test(title)) add("报价单编号", "版本号", "生效日期", "客户名称", "确认状态");
  if (/客户资料归档/.test(title)) add("客户编号", "资料类型", "资料日期", "授权状态", "责任人员");
  if (/学员学习进度/.test(title)) add("学员编号", "课程", "出勤记录", "学习进度", "跟进状态");
  if (/农事作业/.test(title)) add("地块或批次", "作业日期", "作业内容", "投入品用量", "执行人员");
  if (/养殖防疫/.test(title)) add("栏舍或批次", "防疫日期", "药品及剂量", "执行人员", "复核状态");
  if (/问卷|答题|投票|满意度|评价/.test(title)) add("参与对象", "提交时间", "题目或事项", "回答或评价", "所属组织或区域");
  if (/工资|结算|对账|收款|费用|计费|利润|价格|报价|欠款|赊账|佣金|分账|核算/.test(title)) add("业务单据", "金额", "发生日期", "往来对象", "确认状态");
  if (/库存|补货|物料|材料|备料|原料|配件|耗材|食材|鲜花|农药|余料|面料|辅料|BOM|保质期|效期|临期/.test(title)) add("品类或物料编号", "库存数量", "批次", "出入库时间", "供应商及库位");
  if (/刀具/.test(title)) add("机台编号", "刀具编号", "累计使用次数", "更换时间", "质检结果");
  else if (/模具/.test(title)) add("模具编号", "累计使用次数", "维修记录", "保养日期", "当前状态");
  else if (/温控|窑炉|硫化|环境参数|能耗|药剂/.test(title)) add("设备或区域", "记录时间", "参数值", "标准范围", "记录人员");
  else if (/设备|巡检|维修|故障|老化测试|游乐/.test(title)) add("设备编号", "发生时间", "状态或读数", "责任人员", "现场证据");
  if (/客户|会员|患者|学员|游客|企业|创业者|党员|访客|线索|群众|导师|司机|导游|主播|达人|询盘|跟进/.test(title)) {
    const subject = /患者/.test(title) ? "患者编号"
      : /学员/.test(title) ? "学员编号"
        : /会员/.test(title) ? "会员编号"
          : /客户/.test(title) ? "客户编号"
        : /游客/.test(title) ? "游客或订单编号"
          : /群众|诉求|新闻线索/.test(title) ? "诉求或线索"
            : /询盘/.test(title) ? "询盘客户"
              : /企业|创业者|招商/.test(title) ? "企业或线索名称"
            : /党员/.test(title) ? "党员编号"
              : /司机|导游|主播|达人|导师/.test(title) ? "人员编号"
                : "客户或业务对象";
    add(subject, "联系方式", "授权状态", "当前状态", "下次处理日期");
  }
  if (/施工日志/.test(title)) add("项目编号", "施工日期", "施工内容", "现场人员", "天气与现场证据");
  if (/合同|文书|文件|图纸|报告|档案|资料|配方|版本|PPAP|报关|商检|脚本|选品|资质|政策/.test(title)) add("资料编号", "版本及有效期", "所属对象", "责任人员", "确认状态");
  if (/生产|工序|报工|质检|批次|投料|加工单|来料|分拣|出材|米数|色差|拆单/.test(title)) add("订单或批次", "工序或事项", "数量及规格", "操作人员", "质量结果");
  if (type === "分析与洞察") add("统计周期", "业务单元", "指标名称", "指标值", "数据来源");
  const defaults = {
    分析与洞察: ["统计周期", "业务单元", "指标名称", "指标值", "数据来源"],
    预测与预警: ["业务对象", "发生时间", "当前状态", "提醒时间", "处理结果"],
    识别与核对: ["业务编号", "原始凭证", "关键字段", "核对状态", "复核人员"],
    知识与文档: ["资料编号", "版本及有效期", "所属对象", "责任人员", "确认状态"],
    智能分流: ["事项编号", "提交时间", "事项类型", "建议责任人", "处理状态"],
    流程自动化: ["业务编号", "发生时间", "责任人", "当前状态", "完成时间"],
  };
  if (fields.length < 4) add(...defaults[type]);
  return fields.slice(0, 7);
}
function inferMeasures(text) {
  const measures = [];
  const add = (...values) => values.forEach((value) => { if (!measures.includes(value)) measures.push(value); });
  if (/找|查询|检索|版本|档案|图纸/.test(text)) add("信息查找耗时", "记录完整率");
  if (/错|误差|对不上|核对|对账|漏/.test(text)) add("差异发现率", "人工复核耗时");
  if (/提醒|预警|到期|临期|超时/.test(text)) add("提醒命中率", "逾期事项数量");
  if (/库存|补货|备料|采购|损耗/.test(text)) add("缺货或浪费比例", "人工制单耗时");
  if (/调度|派工|排班|预约|响应/.test(text)) add("首次响应耗时", "任务冲突数量");
  if (/巡检|故障|设备|刀具|质检/.test(text)) add("异常处理耗时", "记录完整率");
  if (/客户|会员|患者|学员|游客|业主/.test(text)) add("按时触达率", "重复咨询数量");
  add("单次处理耗时", "例外转人工比例", "业务负责人采纳率");
  return measures.slice(0, 3);
}
function tagWords(fields, type) {
  return [...new Set([type, ...fields.slice(0, 2)])].slice(0, 3);
}

const typeProfiles = {
  分析与洞察: {
    modules: [
      ["口径确认", "先明确统计对象、时间范围和计算方法，避免同一指标出现多种答案。"],
      ["数据汇总", "从已授权的业务记录中收集必要字段，保留来源和更新时间。"],
      ["对比分析", "按门店、时段、项目或批次比较差异，标出需要进一步核实的变化。"],
      ["明细下钻", "从汇总结果返回对应业务记录，帮助负责人判断变化原因。"],
      ["定期复盘", "保存每期结果和管理决定，持续修正口径与关注重点。"],
    ],
    process: "汇总记录、计算指标并标出值得关注的变化",
    review: "业务负责人核对口径、解释原因并决定下一步",
    risks: [
      ["口径不一", "不同部门对同一指标使用不同分母或时间范围", "在试点前签字确认字段、公式和统计周期。"],
      ["只看汇总", "总数掩盖门店、项目或时段之间的差异", "保留明细下钻，并同时展示数量与占比。"],
      ["错误归因", "看到变化后直接把相关性当成原因", "由业务负责人结合现场情况解释，不让系统自动下结论。"],
    ],
  },
  预测与预警: {
    modules: [
      ["基线数据集", "按统一时间粒度汇总历史记录，区分正常、异常与缺失样本。"],
      ["阈值与预测", "结合业务规则和历史变化计算风险区间，不把单次预测当成确定结论。"],
      ["原因解释", "展示触发提醒的主要字段、相似历史和置信程度，方便业务人员判断。"],
      ["行动队列", "把需补货、跟进、维护或处置的事项转成带负责人和期限的待办。"],
      ["结果回看", "记录采纳、驳回和最终结果，用于调整提醒规则并观察业务变化。"],
    ],
    process: "识别变化趋势并生成分级提醒",
    review: "业务负责人查看依据后决定是否执行建议",
    risks: [
      ["历史偏差", "训练窗口覆盖的季节、门店或设备状态过窄", "按业务周期分层抽样，并保留规则基线作为对照。"],
      ["数据漂移", "促销、设备更换或流程调整后误报增加", "持续记录误报和漏报，触发阈值重估。"],
      ["建议悬空", "提醒没有负责人、期限或后续动作", "每条提醒必须进入可追踪待办并记录处理结果。"],
    ],
  },
  识别与核对: {
    modules: [
      ["证据采集", "通过表单、扫码、图片或文件上传保留原始业务凭证。"],
      ["字段提取", "提取关键字段并保留原文位置，对低置信字段明确标记。"],
      ["关联匹配", "依据业务编号、日期、主体和金额等条件匹配相关记录。"],
      ["差异队列", "将缺项、冲突、重复和无法匹配的记录集中给人工复核。"],
      ["审计留痕", "保存识别结果、人工修订、确认人员和处理时间。"],
    ],
    process: "提取关键字段并完成跨记录匹配",
    review: "复核人员确认差异、金额和最终业务状态",
    risks: [
      ["原件质量", "图片模糊、字段遮挡或模板变化导致识别不稳定", "设置最低清晰度与必填字段，低置信结果全部转人工。"],
      ["错误匹配", "相似编号或同名主体被错误关联", "组合使用多个业务字段，禁止仅凭单一文本相似度自动确认。"],
      ["证据断裂", "识别结果未能回溯到原始凭证", "保留原件、字段坐标、修改记录与确认人员。"],
    ],
  },
  知识与文档: {
    modules: [
      ["统一归档", "按业务对象和流程节点归集文档、图片、记录与附件。"],
      ["结构化提取", "识别日期、版本、主体、义务和关键状态，形成可检索字段。"],
      ["版本与权限", "标记当前有效版本、历史版本、访问范围和变更来源。"],
      ["检索与摘要", "基于已授权资料回答问题，并显示引用来源和有效日期。"],
      ["审批与归档", "重要内容经责任人确认后发布或进入正式档案。"],
    ],
    process: "整理资料、识别版本并提供可追溯检索",
    review: "资料责任人确认有效版本和对外口径",
    risks: [
      ["版本冲突", "多个文件被同时视为有效版本", "建立唯一状态字段和发布责任人，历史版本只读保留。"],
      ["权限越界", "使用者检索到无权访问的文档或个人信息", "按角色、组织和资料等级过滤检索范围。"],
      ["过期内容", "摘要引用已失效政策、合同或操作规范", "记录生效与失效日期，过期资料不进入默认答案。"],
    ],
  },
  智能分流: {
    modules: [
      ["统一入口", "归集电话转录、表单、消息或现场提交的业务事项。"],
      ["分类与分级", "提取对象、地点、事项和紧急程度，并标记不确定项。"],
      ["责任匹配", "结合技能、辖区、排班和负载推荐责任人或承办部门。"],
      ["进度追踪", "记录受理、派发、处理、复核与办结状态。"],
      ["复盘分析", "汇总错派、超时和重复事项，修正规则与资源配置。"],
    ],
    process: "识别事项类型、优先级和适合的责任人",
    review: "调度或审核人员确认分派和优先级",
    risks: [
      ["错派事项", "分类结果与实际责任边界不一致", "高风险事项强制人工分派，记录退回原因并修正规则。"],
      ["资源失真", "人员位置、排班或技能信息未及时更新", "把可用状态设为派工前置条件，允许责任人拒绝并说明原因。"],
      ["紧急漏报", "文本信息不足导致紧急事项未被识别", "设置关键词与人工兜底通道，紧急规则优先于模型结果。"],
    ],
  },
  流程自动化: {
    modules: [
      ["标准业务入口", "将口头、纸面或群消息统一为包含必要字段的业务记录。"],
      ["规则校验", "检查必填项、重复提交、时间冲突和业务条件。"],
      ["任务流转", "按状态、责任人和期限推动事项进入下一环节。"],
      ["通知与确认", "向相关角色发送待办和变更摘要，并记录已读与确认。"],
      ["结果归档", "汇总处理结果、附件和异常，形成可查询的业务档案。"],
    ],
    process: "按规则校验信息并推动任务流转",
    review: "责任人确认例外、费用、审批与最终完成状态",
    risks: [
      ["规则遗漏", "少见例外没有进入流程设计", "先回放历史异常样本，保留人工新增例外与回退能力。"],
      ["重复录入", "新工具与原系统同时要求填报", "明确唯一数据入口，无法集成时优先导入导出而非双填。"],
      ["使用阻力", "一线人员认为新流程增加操作步骤", "减少必填字段，在实际工作节点完成记录并测量操作时间。"],
    ],
  },
};

const typeOverrides = {
  "case-009": "知识与文档",
  "case-011": "知识与文档",
  "case-012": "分析与洞察",
  "case-030": "预测与预警",
  "case-031": "识别与核对",
  "case-039": "分析与洞察",
  "case-041": "分析与洞察",
  "case-044": "分析与洞察",
  "case-059": "知识与文档",
  "case-055": "分析与洞察",
  "case-063": "分析与洞察",
  "case-066": "分析与洞察",
  "case-067": "流程自动化",
  "case-068": "流程自动化",
  "case-069": "流程自动化",
  "case-070": "分析与洞察",
  "case-075": "识别与核对",
  "case-076": "分析与洞察",
  "case-077": "智能分流",
  "case-078": "流程自动化",
  "case-082": "知识与文档",
  "case-085": "流程自动化",
  "case-086": "分析与洞察",
  "case-087": "知识与文档",
  "case-088": "知识与文档",
  "case-089": "流程自动化",
  "case-090": "分析与洞察",
  "case-092": "流程自动化",
  "case-094": "分析与洞察",
  "case-095": "分析与洞察",
  "case-099": "识别与核对",
  "case-101": "分析与洞察",
  "case-102": "分析与洞察",
  "case-103": "流程自动化",
  "case-105": "分析与洞察",
  "case-106": "分析与洞察",
  "case-108": "流程自动化",
  "case-109": "流程自动化",
  "case-111": "分析与洞察",
  "case-112": "分析与洞察",
  "case-116": "流程自动化",
  "case-119": "流程自动化",
  "case-121": "流程自动化",
  "case-122": "流程自动化",
  "case-127": "流程自动化",
  "case-129": "流程自动化",
  "case-132": "识别与核对",
  "case-135": "分析与洞察",
  "case-140": "分析与洞察",
  "case-147": "流程自动化",
  "case-154": "流程自动化",
  "case-155": "知识与文档",
  "case-156": "流程自动化",
  "case-159": "流程自动化",
  "case-161": "识别与核对",
  "case-162": "流程自动化",
  "case-164": "知识与文档",
  "case-165": "分析与洞察",
  "case-166": "流程自动化",
  "case-168": "流程自动化",
  "case-171": "知识与文档",
  "case-173": "流程自动化",
  "case-175": "识别与核对",
  "case-180": "流程自动化",
  "case-181": "知识与文档",
  "case-182": "分析与洞察",
  "case-185": "流程自动化",
  "case-189": "分析与洞察",
  "case-190": "知识与文档",
};

const industryProfiles = {
  制造业: { systems: ["ERP / MES 生产数据", "QMS 质量记录", "扫码或设备数据"], sensitivity: "生产配方、客户图纸与质量记录按项目和角色隔离。", owner: "生产或质量负责人" },
  园区运营: { systems: ["招商 CRM", "合同与缴费台账", "物业工单 / 企业微信"], sensitivity: "企业联系人、合同与经营数据按服务部门分权。", owner: "园区运营负责人" },
  政企服务: { systems: ["政务工单或审批平台", "已发布政策与模板库", "短信 / 政务消息渠道"], sensitivity: "个人信息与政务材料必须脱敏并在受控环境处理。", owner: "业务科室审核负责人" },
  物流仓储: { systems: ["TMS 运输系统", "WMS 仓储系统", "电子签收与消息渠道"], sensitivity: "地址、联系方式、路线与费用信息限定在履约范围内使用。", owner: "运营或结算负责人" },
  餐饮服务: { systems: ["POS 销售数据", "进销存 / 采购表", "门店日报与巡店记录"], sensitivity: "门店经营与供应商价格信息按区域和岗位分权。", owner: "区域运营或采购负责人" },
  零售批发: { systems: ["POS / ERP", "库存与批次台账", "会员或客户账款系统"], sensitivity: "会员信息、采购价格与客户欠款按最小权限开放。", owner: "品类或经营负责人" },
  建筑工程: { systems: ["项目管理系统", "材料与合同台账", "现场移动端"], sensitivity: "合同、现场人员和工程证据按项目隔离。", owner: "项目经理或资料负责人" },
  本地生活: { systems: ["预约 / CRM", "派工或服务台账", "短信 / 企业消息"], sensitivity: "客户地址、健康偏好与消费记录只用于当前服务。", owner: "门店或服务运营负责人" },
  医疗健康: { systems: ["院内业务系统导出", "随访或耗材台账", "受控消息渠道"], sensitivity: "医疗与个人健康信息只使用最小必要字段，不进入公共模型。", owner: "医疗质量或运营负责人" },
  教育培训: { systems: ["教务与排课系统", "签到 / 课消记录", "家校消息渠道"], sensitivity: "未成年人及家长信息按校区和职责隔离。", owner: "教务负责人" },
  农业养殖: { systems: ["农事 / 防疫台账", "环境或物联网数据", "天气与批次记录"], sensitivity: "用药、产量和供应商数据按基地或批次授权。", owner: "农场或技术负责人" },
  能源环保: { systems: ["SCADA 或监测导出", "设备台账", "巡检与故障工单"], sensitivity: "站点运行、排放与设备数据仅向授权运维人员开放。", owner: "运维或合规负责人" },
  商贸流通: { systems: ["CRM / 邮件", "ERP / 订单", "报价与单证库"], sensitivity: "客户、价格、合同与跨境单证按客户和项目授权。", owner: "销售运营或单证负责人" },
  文旅娱乐: { systems: ["订单与行程系统", "排班 / 场地台账", "游客或会员消息渠道"], sensitivity: "游客身份、位置和联系方式只在履约周期内使用。", owner: "运营或调度负责人" },
};
function ownerFor(industry, title) {
  const rules = {
    制造业: [
      [/工资|报价|利润|结算|对账/, "财务与生产负责人"],
      [/库存|物料|发货|交期|排期|用量|余料|齐套|拆单/, "计划与仓储负责人"],
      [/质量|质检|检验|检测|色差|PPAP|安全|合规|配方权限/, "质量负责人"],
    ],
    园区运营: [
      [/招商|入驻|在孵|创业者|一人公司|政策/, "招商或企业服务负责人"],
      [/租金|水电|缴费|合同|续租|退租/, "园区财务或运营负责人"],
      [/物业|巡检|设备|投诉|访客|车辆|满意|报修/, "园区运营负责人"],
    ],
    物流仓储: [[/回单|结算|费用|罚款/, "结算负责人"], [/库存|库位|盘点|分拣/, "仓储负责人"], [/调度|车辆/, "运输调度负责人"]],
    餐饮服务: [[/采购|食材|备料|损耗/, "采购或门店负责人"], [/多门店|巡检/, "区域运营负责人"], [/利润|收支/, "经营与财务负责人"]],
    零售批发: [[/赊账|欠款|价格|余额/, "经营与财务负责人"], [/采购|库存|补货|损耗|临期/, "采购或品类负责人"]],
    建筑工程: [[/资料|日志|交底|验收/, "项目或资料负责人"], [/报价|用量/, "项目与成本负责人"], [/排班|调度|安装/, "项目或现场负责人"]],
    医疗健康: [[/患者|随访/, "医护或随访负责人"], [/耗材/, "医疗运营或耗材负责人"]],
    教育培训: [[/排课|教室|课消/, "教务负责人"], [/学习进度/, "教务或教学负责人"]],
    农业养殖: [[/防疫|死淘/, "养殖与技术负责人"], [/农事|农药|用工/, "农场或技术负责人"]],
    能源环保: [[/环保|药剂|填报/, "运维或合规负责人"], [/巡检|故障|设备/, "设备运维负责人"]],
    商贸流通: [[/报价|收款|佣金|分账|欠款/, "销售运营或财务负责人"], [/报关|商检|文件|版本/, "单证或合规负责人"], [/直播|主播|达人/, "直播运营负责人"]],
    文旅娱乐: [[/包间|计费|预订/, "门店运营负责人"], [/设备|客流|景区/, "景区运营负责人"], [/行程|司机|导游|在团|OTA/, "旅行社运营负责人"]],
  };
  if (industry === "本地生活") {
    if (/物业/.test(title)) return "物业运营负责人";
    if (/客房|酒店|民宿|客诉/.test(title)) return "酒店运营负责人";
    if (/汽修|维修配件|车辆美容|洗车/.test(title)) return "汽车服务门店负责人";
    if (/学员学习|教练排班/.test(title)) return "驾校教务负责人";
    if (/婚礼/.test(title)) return "婚礼项目负责人";
    if (/图文|广告制作/.test(title)) return "订单负责人";
    if (/客户项目|法律文书|工时|客户资料/.test(title)) return "项目或合规负责人";
  }
  return rules[industry]?.find(([pattern]) => pattern.test(title))?.[1]
    || industryProfiles[industry]?.owner
    || "业务负责人";
}

const storyPersonas = {
  制造业: [
    { name: "陈师傅", role: "生产主管", organization: "一家制造企业" },
    { name: "李工", role: "质量负责人", organization: "一家零部件工厂" },
    { name: "周主管", role: "计划主管", organization: "一家生产企业" },
  ],
  园区运营: [
    { name: "周主管", role: "企业服务经理", organization: "一家产业园区" },
    { name: "林经理", role: "园区运营负责人", organization: "一家创业园区" },
    { name: "许专员", role: "招商主管", organization: "一家企业孵化器" },
  ],
  政企服务: [
    { name: "王科员", role: "窗口工作人员", organization: "一个基层服务窗口" },
    { name: "赵主任", role: "业务科室负责人", organization: "一家基层单位" },
    { name: "林干事", role: "活动组织人员", organization: "一个社区服务中心" },
  ],
  物流仓储: [
    { name: "刘调度", role: "运营调度", organization: "一家区域物流公司" },
    { name: "赵经理", role: "仓储负责人", organization: "一家配送中心" },
    { name: "陈师傅", role: "站点主管", organization: "一家快递网点" },
  ],
  餐饮服务: [
    { name: "林店长", role: "门店店长", organization: "一家连锁餐饮门店" },
    { name: "周经理", role: "区域运营经理", organization: "一家餐饮企业" },
    { name: "陈老板", role: "经营负责人", organization: "一家社区餐馆" },
  ],
  零售批发: [
    { name: "赵店长", role: "经营负责人", organization: "一家零售企业" },
    { name: "陈经理", role: "采购负责人", organization: "一家零售企业" },
    { name: "孙经理", role: "门店运营经理", organization: "一家连锁零售企业" },
  ],
  建筑工程: [
    { name: "李工", role: "项目经理", organization: "一个施工项目" },
    { name: "王经理", role: "工程负责人", organization: "一家装修公司" },
    { name: "周师傅", role: "现场负责人", organization: "一个工程现场" },
  ],
  本地生活: [
    { name: "周店长", role: "门店负责人", organization: "一家本地服务门店" },
    { name: "陈经理", role: "客户服务经理", organization: "一家生活服务企业" },
    { name: "刘师傅", role: "现场主管", organization: "一家上门服务团队" },
  ],
  医疗健康: [
    { name: "王护士长", role: "随访负责人", organization: "一家医疗服务机构" },
    { name: "李主任", role: "运营负责人", organization: "一家基层医疗机构" },
    { name: "周老师", role: "耗材管理员", organization: "一家诊疗机构" },
  ],
  教育培训: [
    { name: "刘老师", role: "教务负责人", organization: "一家培训机构" },
    { name: "陈教务", role: "课程运营人员", organization: "一家教育机构" },
    { name: "周校长", role: "校区负责人", organization: "一家培训学校" },
  ],
  农业养殖: [
    { name: "陈场长", role: "生产负责人", organization: "一个农业基地" },
    { name: "李技术员", role: "农事技术员", organization: "一家种植基地" },
    { name: "王老板", role: "养殖负责人", organization: "一家养殖场" },
  ],
  能源环保: [
    { name: "张工", role: "运维负责人", organization: "一个设备运维站点" },
    { name: "刘主管", role: "环保业务主管", organization: "一家环保企业" },
    { name: "陈师傅", role: "巡检负责人", organization: "一个能源站点" },
  ],
  商贸流通: [
    { name: "孙经理", role: "业务经理", organization: "一家商贸企业" },
    { name: "陈跟单", role: "外贸跟单员", organization: "一家外贸公司" },
    { name: "周主管", role: "销售运营主管", organization: "一家贸易企业" },
  ],
  文旅娱乐: [
    { name: "何调度", role: "运营调度", organization: "一家文旅服务团队" },
    { name: "林经理", role: "景区运营经理", organization: "一家文旅企业" },
    { name: "周导游", role: "团队协调人员", organization: "一家地接社" },
  ],
};

const personaRules = {
  制造业: [[/质量|检验|检测|色差|合格率|PPAP|老化|安全|危化|合规|配方权限|环境参数/, 1], [/订单|交期|工资|物料|库存|发货|报价|用量|余料|拆单|排版|成本|利润|齐套|米数|排期/, 2], [/生产|工序|设备|刀具|模具|配方|参数|投料/, 0]],
  园区运营: [[/招商|入驻企业|在孵|创业者|一人公司|政策/, 2], [/物业|巡检|设备|投诉|访客|车辆|满意|客户|报修/, 0], [/数据|能耗|租金|水电|会议室|合同/, 1]],
  政企服务: [[/活动|问卷|投票|党课|党员|答题/, 2], [/政策|招商|招投标|领导信箱|民生|线索/, 1]],
  物流仓储: [[/库存|库位|盘点|分拣/, 1], [/滞留|件量|网点/, 2]],
  餐饮服务: [[/多门店|巡店/, 1], [/利润|收支|备料/, 2], [/采购|食材|中央厨房|团餐/, 1]],
  零售批发: [[/采购|进货|库存|补货|损耗/, 1], [/客户|会员|赊账/, 0], [/加工单|门店/, 2]],
  建筑工程: [[/报价|排班|调度|用量/, 1], [/安装|现场/, 2]],
  本地生活: [[/宠物|疫苗|会员|私教|课消|衣物|鲜花|客房|包间/, 0], [/报修|维修|派工|施工|洗车/, 2], [/房源|带看|合同|工时|客户资料/, 1]],
  医疗健康: [[/随访|患者/, 0], [/耗材/, 2]],
  教育培训: [[/排课|教室/, 1], [/校区|经营/, 2]],
  农业养殖: [[/养殖|防疫|死淘/, 2], [/农事|农药/, 1]],
  能源环保: [[/环保|药剂/, 1], [/巡检/, 2], [/故障|设备|派工/, 0]],
  商贸流通: [[/询盘|报价|报关|商检|多币种|外贸/, 1], [/直播|主播|达人|内容/, 2], [/农药|进销存|欠款|催收/, 0]],
  文旅娱乐: [[/景区|游乐|客流/, 1], [/司机|导游/, 2]],
};

function personaFor(industry, title, sequence) {
  if (/宠物|疫苗/.test(title)) return { name: "周店长", role: "门店负责人", organization: "一家宠物医院" };
  if (/婚礼/.test(title)) return { name: "陈经理", role: "项目负责人", organization: "一家婚礼服务公司" };
  if (/房源|带看/.test(title)) return { name: "陈经理", role: "门店经理", organization: "一家房产中介门店" };
  if (/衣物/.test(title)) return { name: "周店长", role: "门店负责人", organization: "一家洗衣门店" };
  if (/鲜花/.test(title)) return { name: "周店长", role: "门店负责人", organization: "一家鲜花门店" };
  if (/物业/.test(title)) return { name: "刘主管", role: "物业服务主管", organization: "一个物业服务项目" };
  if (/客房|酒店|民宿|客诉/.test(title)) return { name: "林经理", role: "酒店运营经理", organization: "一家酒店" };
  if (/汽修|维修配件|车辆美容|洗车/.test(title)) return { name: "刘师傅", role: "门店主管", organization: "一家汽车服务门店" };
  if (/学员学习|教练排班/.test(title)) return { name: "陈教务", role: "教务人员", organization: "一家驾校" };
  if (/沉默会员|私教课消/.test(title)) return { name: "周店长", role: "门店负责人", organization: "一家健身门店" };
  if (/图文|广告制作/.test(title)) return { name: "陈经理", role: "订单经理", organization: "一家广告制作门店" };
  if (industry === "本地生活" && /客户项目|法律文书|工时|客户资料/.test(title)) return { name: "陈经理", role: "项目经理", organization: "一家专业服务机构" };
  if (industry === "物流仓储" && /回单|结算|费用/.test(title)) return { name: "吴会计", role: "结算专员", organization: "一家物流企业" };
  if (industry === "建筑工程" && /施工日志|资料|材料/.test(title)) return { name: "李工", role: "项目经理", organization: "一个施工项目" };
  if (industry === "建筑工程" && /工人排班|任务调度/.test(title)) return { name: "周师傅", role: "现场负责人", organization: "一个安装项目" };
  if (industry === "商贸流通" && /农产品|特产|多平台订单|退换货|防伪/.test(title)) return { name: "周主管", role: "电商运营主管", organization: "一家农产品电商企业" };
  if (industry === "文旅娱乐" && /包间|开台|预订|超时计费/.test(title)) return { name: "罗店长", role: "门店负责人", organization: "一家休闲娱乐场所" };
  const options = storyPersonas[industry] || [{ name: "李主管", role: "业务负责人", organization: "一家中小企业" }];
  const matched = personaRules[industry]?.find(([pattern]) => pattern.test(title));
  return options[matched ? matched[1] : (sequence - 1) % options.length];
}

const plainSystemActions = {
  分析与洞察: [
    "系统按同一口径汇总每天的记录，先显示变化最大的部分，并允许继续查看对应明细。",
    "系统把不同来源的数据整理到一起，自动完成计算，但每个数字都能回到原始记录。",
    "系统定期更新汇总结果，把异常变化标出来，原因仍由熟悉现场的人判断。",
  ],
  预测与预警: [
    "系统把历史记录和当前情况放在一起比较，先标出需要关注的事项，并说明为什么提醒。",
    "系统每天检查新记录，发现接近期限或偏离常态的情况，就列出原因和建议处理时间。",
    "系统不直接下结论，而是把变化较大的事项排在前面，供负责人逐项确认。",
  ],
  识别与核对: [
    "系统读取单据或记录中的关键内容，自动寻找对应项，把对不上、缺少或重复的地方单独列出来。",
    "系统先把两边的记录按编号、日期和对象配在一起，匹配不上的内容进入人工清单。",
    "系统完成逐项比对，并保留原始凭证位置；工作人员只需要查看有差异的部分。",
  ],
  知识与文档: [
    "系统把资料按对象、时间和版本整理好。需要查找时直接给出答案，同时显示答案来自哪份资料。",
    "系统先识别文件的日期、版本和归属，再把有效资料放到统一目录，旧版本保留但不混用。",
    "工作人员输入业务对象或问题，系统返回相关资料和出处；正式使用前仍由资料负责人确认。",
  ],
  智能分流: [
    "系统先判断这是什么事情、是否紧急、应该交给谁，再生成待办供调度人员确认。",
    "系统从提交内容中提取地点、事项和时限，给出建议责任人；不确定的情况直接交给人工。",
    "新事项进入后，系统先分类排序，再参考排班和职责提出分派建议。",
  ],
  流程自动化: [
    "系统按既定规则检查必填信息和前后条件，把下一步任务交给对应人员，并记录处理状态。",
    "系统收到记录后先检查缺项和冲突，条件满足才生成下一步待办。",
    "系统负责提醒、流转和留存结果；碰到不符合规则的情况，就暂停并请负责人处理。",
  ],
};

const plainSystemJobs = {
  分析与洞察: ["按统一口径汇总数据，并保留原始明细", "完成重复计算，把明显变化列出来", "先整理数据，再让业务人员判断原因"],
  预测与预警: ["提前列出需要关注的事项", "用历史记录辅助判断处理时机", "把异常变化交给负责人确认"],
  识别与核对: ["先读单据、找对应关系，只把差异留给人处理", "自动完成逐项比对，保留原始凭证", "把缺项、重复和不一致集中列出"],
  知识与文档: ["整理资料和版本，查询时同时给出出处", "把有效文件、历史版本和权限分清", "先找资料，再让责任人确认是否可用"],
  智能分流: ["先判断事情类型和建议责任人，再由调度确认", "把新事项按轻重缓急排好", "依据职责和排班提出分派建议"],
  流程自动化: ["先检查信息，再推动下一步并记录状态", "负责提醒和流转，例外交回人工", "把口头交接改成有状态的待办"],
};

const storyHeadlinePatterns = {
  分析与洞察: [
    (name, title) => `${name}如何从“${title}”中看出业务变化`,
    (name, title) => `围绕“${title}”，${name}还要回答什么`,
    (name, title) => `“${title}”如何回到同一套统计口径`,
  ],
  预测与预警: [
    (name, title) => `${name}如何提前处理“${title}”中的异常`,
    (name, title) => `等问题发生前，先看“${title}”的哪些变化`,
    (name, title) => `“${title}”从人工盯守到分级提醒`,
  ],
  识别与核对: [
    (name, title) => `${name}如何先找出“${title}”里的差异`,
    (name, title) => `“${title}”不必再从头逐项核对`,
    (name, title) => `把“${title}”中对不上的记录先挑出来`,
  ],
  知识与文档: [
    (name, title) => `${name}如何找到“${title}”需要的有效资料`,
    (name, title) => `处理“${title}”时，先分清版本和出处`,
    (name, title) => `“${title}”换人接手也能查清来龙去脉`,
  ],
  智能分流: [
    (name, title) => `${name}如何让“${title}”及时找到负责人`,
    (name, title) => `“${title}”先分清轻重缓急，再安排处理`,
    (name, title) => `“${title}”交给谁，不再依赖逐个询问`,
  ],
  流程自动化: [
    (name, title) => `${name}如何把“${title}”变成可跟进的流程`,
    (name, title) => `“${title}”进行到哪一步，所有人都能查到`,
    (name, title) => `把“${title}”的交接规则写进日常工作`,
  ],
};
const storyProblems = {
  分析与洞察: (name, title) => `“${title}”的时间主要花在收集数据、核对口径。等${name}拿到汇总时，往往已经没有时间继续查原因。`,
  预测与预警: (name, title) => `在“${title}”这件事上，${name}最困难的不是处理单个事项，而是很难提前判断哪些事情更值得关注。大家只能凭经验安排先后，忙起来就容易错过时机。`,
  识别与核对: (name, title) => `“${title}”最耗时间的地方，是同一件事要在几份记录之间反复比对。${name}需要的并不是更多表格，而是一张只列差异的清单。`,
  知识与文档: (name, title) => `“${title}”看起来是找文件，实际难点是判断哪份有效、内容从哪里来。${name}每次都要重新问人，交接以后更麻烦。`,
  智能分流: (name, title) => `“${title}”一忙起来，${name}最怕事情在不同人之间来回转。没人能马上说清谁负责、是否紧急、现在处理到哪一步。`,
  流程自动化: (name, title) => `“${title}”本身并不复杂，麻烦在于每个人的做法不一样。${name}需要的是一套简单规则，让交接时不再靠口头提醒。`,
};
const storyEndings = {
  分析与洞察: (name, title) => `现在，${name}查看“${title}”时能先看到一致口径的汇总，再回到具体记录核实原因。系统负责计算，业务判断仍由人完成。`,
  预测与预警: (name, title) => `现在，${name}不用等“${title}”相关事项堆积后再逐一排查。系统先把值得关注的内容列出来，负责人看过依据后再决定是否行动。`,
  识别与核对: (name, title) => `现在，${name}不必把“${title}”涉及的每一条记录从头查一遍。系统先找差异，人只处理例外，确认过程也能回看。`,
  知识与文档: (name, title) => `现在，${name}处理“${title}”时能直接看到有效资料和出处。即使换人接手，也不用从聊天记录和个人电脑重新拼资料。`,
  智能分流: (name, title) => `现在，“${title}”进入系统后会带着类型、轻重缓急和建议责任人。${name}负责确认，不再靠逐个电话推动。`,
  流程自动化: (name, title) => `现在，“${title}”每走一步都会留下状态和责任人。${name}不用反复追问，也能知道事情卡在哪里。`,
};

function plainUserStory({ industry, title, issue, fields, owner, type, segment, sequence }) {
  const persona = personaFor(industry, title, sequence);
  const firstFields = fields.slice(0, 3).join("、");
  const turningPoints = [
    `团队先从${segment}里的“${title}”入手，只统一${firstFields}这几个必要信息，不改动其他流程。`,
    `原有工作方式暂时保留，只在“${title}”发生时补充一份清楚记录：${firstFields}。`,
    `试点只处理“${title}”这一件事，先把${firstFields}放到同一处。`,
  ];
  const headlinePatterns = storyHeadlinePatterns[type];
  const openingPatterns = [
    `${persona.name}是${persona.organization}的${persona.role}。${issue}`,
    `在${persona.organization}，${persona.name}负责“${title}”相关工作。${issue}`,
    `${persona.name}在${persona.organization}担任${persona.role}。${issue}`,
  ];
  return {
    label: "情景故事 · 人物与企业均为虚构",
    persona,
    headline: headlinePatterns[(sequence - 1) % headlinePatterns.length](persona.name, title),
    opening: openingPatterns[(sequence - 1) % openingPatterns.length],
    plainProblem: storyProblems[type](persona.name, title),
    turningPoint: turningPoints[(sequence - 1) % turningPoints.length],
    scenes: [
      {
        title: "原来的做法",
        text: `${issue}${persona.name}往往要停下手头工作，重新追问、翻找或核对。`,
      },
      {
        title: "先把信息记清",
        text: `现在每次涉及“${title}”，一线人员只需记录${firstFields}，原始凭证或现场信息一起保留。`,
      },
      {
        title: "系统做重复工作",
        text: plainSystemActions[type][(sequence - 1) % plainSystemActions[type].length],
      },
      {
        title: "人做最后决定",
        text: `${owner}查看系统给出的依据，只处理异常和例外。确认之后，结果才进入下一步业务流程。`,
      },
    ],
    beforeAfter: {
      before: `过去：${issue}出现问题后，团队再靠追问、翻记录和个人经验补救。`,
      after: `现在：事情发生时先留下${firstFields}。系统完成重复整理，${owner}只需根据证据确认结果。`,
    },
    ending: storyEndings[type](persona.name, title),
    takeaways: [
      `先把范围缩小到“${title}”，不先替换全部系统`,
      `让系统${plainSystemJobs[type][(sequence - 1) % plainSystemJobs[type].length]}`,
      `由${owner}保留最终判断，异常随时可以转人工`,
      "先记录当前耗时、遗漏和人工投入，再决定是否扩大",
    ],
  };
}

const departmentEffects = {
  财务与结算: "金额差异与结算状态发现较晚，财务在周期末集中补资料和复核。",
  采购与供应链: "采购、库存与履约信息不同步，容易同时出现缺货、积压或交付争议。",
  销售与市场: "客户状态和历史口径分散，跟进依赖个人记忆，组织难以复用过程数据。",
  客户服务: "服务事项缺少统一入口和进度反馈，客户重复询问，负责人难以复盘。",
  行政与管理: "资料、审批与到期事项分散在个人文件中，交接与检查成本较高。",
  生产与运营: "现场状态无法及时汇总，异常往往在后续环节才暴露并扩大影响。",
};

function fieldRequirement(field, industry) {
  const sensitivity = /联系|患者|学员|游客|业主|身份|地址/.test(field)
    ? "个人信息，需授权与脱敏"
    : /金额|费用|合同|价格/.test(field)
      ? "经营敏感，按角色分权"
      : /质量|现场证据|状态|读数/.test(field)
        ? "业务证据，保留原始记录"
        : "一般业务字段";
  const quality = /时间|日期/.test(field)
    ? "统一时区与格式，不能为空"
    : /编号|单号|批次/.test(field)
      ? "全流程唯一且不可重复"
      : /金额|数量|读数/.test(field)
        ? "明确单位、精度与取值范围"
        : "定义口径、来源和必填规则";
  const source = industryProfiles[industry]?.systems[0] || "现有业务台账";
  const sourceDescription = source.endsWith("导出") ? `可使用${source}` : `可从${source}导出`;
  return { field, source: `${sourceDescription}，或在试点期间单独记录`, quality, sensitivity };
}
function integrationLevels(industry) {
  const systems = industryProfiles[industry]?.systems || ["业务台账", "现有管理系统", "企业消息渠道"];
  return [
    { level: "L1 · 文件试点", scope: `从${systems[0]}按周期导出 CSV / Excel，验证字段与业务规则。`, condition: "不改原系统，适合前两周验证。" },
    { level: "L2 · 受控同步", scope: `通过接口或定时任务同步${systems.slice(0, 2).join("、")}的数据。`, condition: "需完成账号、权限与失败重试设计。" },
    { level: "L3 · 正式接入", scope: "把确认结果写回现有业务系统，并通过企业消息或待办通知相关人员。", condition: "仅在准确性、审计和责任边界通过验收后启用。" },
  ];
}
function problemBreakdown(current, department, type) {
  const typeEffect = {
    分析与洞察: "数据收集和计算占用了大部分时间，管理者拿到结果后难以继续查看明细并判断原因。",
    预测与预警: "团队缺少稳定的历史序列和提前量，通常在问题发生后才被动处置。",
    识别与核对: "重复录入与人工比对增加遗漏，错误往往到结算、交付或检查时才发现。",
    知识与文档: "资料版本、状态和责任记录分散，查找、交接与审计成本持续增加。",
    智能分流: "事项不能及时进入正确的责任队列，优先级、进度和退回原因难以追踪。",
    流程自动化: "流程依赖口头沟通和个人习惯，业务量上升后等待、漏项和返工增加。",
  };
  return [
    { title: "现场症状", detail: current },
    { title: "流程影响", detail: typeEffect[type] },
    { title: "管理盲点", detail: departmentEffects[department] || departmentEffects["生产与运营"] },
  ];
}
function solutionModules(title, type, fields, owner) {
  return typeProfiles[type].modules.map(([name, description], index) => ({
    name: index === 0 ? `${title}业务入口` : name,
    description: index === 0 ? `围绕${fields.slice(0, 3).join("、")}建立统一记录，确保后续处理有稳定输入。` : description,
    owner: index === typeProfiles[type].modules.length - 1 ? owner : index < 2 ? "一线业务人员与数据责任人" : "系统与业务共同处理",
  }));
}
function userJourney(title, type, fields, owner) {
  return [
    { actor: "一线业务人员", action: `在${title}发生时记录${fields.slice(0, 3).join("、")}`, output: "结构化业务记录与原始证据" },
    { actor: "辅助系统", action: typeProfiles[type].process, output: "带来源与置信提示的处理建议" },
    { actor: owner, action: typeProfiles[type].review, output: "确认、调整、驳回或升级处理" },
    { actor: "运营与管理人员", action: "跟踪执行结果并复盘例外", output: "审计日志、指标记录与规则改进项" },
  ];
}
function pilotPhases(title, segment, measures) {
  return [
    { days: "D01 — D03", title: "现场建模", tasks: [`访谈${segment}业务负责人和一线角色`, `抽取${title}历史样本`, `确认${measures.join("、")}的基线口径`], exit: "流程边界、样本范围和责任人签字确认" },
    { days: "D04 — D07", title: "原型与规则", tasks: ["建立字段字典与业务规则", "做出可实际操作的录入、处理和确认流程", "用历史样本逐条回放并记录错误"], exit: "关键流程可操作，严重错误有人工兜底" },
    { days: "D08 — D11", title: "受控试运行", tasks: ["与原流程并行运行", "收集一线反馈和例外", "调整阈值、权限与通知方式"], exit: "连续业务样本完成复核，问题可定位" },
    { days: "D12 — D14", title: "验收与决策", tasks: ["复算验收指标", "核算人工复核与运维成本", "评审扩大、调整或停止条件"], exit: "形成书面试点报告与下一阶段决策" },
  ];
}
function prerequisites(industry, fields, owner) {
  return [
    `明确一名${owner}作为业务决策人与验收人`,
    `能够提供${fields.slice(0, 3).join("、")}等字段的授权样本`,
    "至少保留一段可代表正常与异常情况的历史记录",
    "一线使用者愿意参与回放、试运行和例外反馈",
    `落实数据权限：${industryProfiles[industry]?.sensitivity || "仅使用最小必要业务字段。"}`,
  ];
}
function costDrivers(industry, type) {
  const systems = industryProfiles[industry]?.systems || ["业务台账", "现有系统"];
  return [
    { item: "数据整理", detail: "字段缺失、历史格式不一和重复记录会增加前期清洗工作。" },
    { item: "系统接入", detail: `从文件导入升级到${systems.slice(0, 2).join("、")}接口同步时，需要额外开发与运维。` },
    { item: "复核与管理", detail: `实际使用${publicTypeNames[type]}功能时，需要持续记录误报、例外、权限和人工修改。` },
    { item: "推广培训", detail: "跨部门或多地点推广时，需要统一规则、培训和版本管理。" },
  ];
}
function decisionRules(measures) {
  return {
    expand: `连续两个验证周期中，${measures.slice(0, 2).join("和")}稳定改善，且人工复核、系统运行和维护成本可接受。`,
    adjust: "业务价值成立，但字段质量、阈值、交互或责任分配仍导致较多例外，应收窄范围后继续验证。",
    stop: "关键数据无法稳定获得、错误可能造成不可接受影响，或新增操作与维护成本抵消业务收益。",
  };
}
function notSuitable(industry, type) {
  const extra = /医疗|政企|能源/.test(industry)
    ? "需要系统自动作出不可逆的医疗、行政或安全决定"
    : "要求系统在没有责任人确认时自动作出高风险决定";
  return [
    "流程发生频次极低，无法在合理周期内取得足够验证样本",
    "没有可访问的记录，也无法安排一线人员补充最小字段",
    extra,
    type === "预测与预警" ? "业务环境持续剧烈变化，历史数据不能代表即将发生的情况" : "流程本身仍频繁变化，尚未形成基本规则",
  ];
}
function openQuestions(title, fields, owner) {
  return [
    `${title}每周发生多少次，旺季与普通周期差异多大？`,
    `当前由哪些角色填写、复核和最终确认${fields.slice(0, 2).join("与")}？`,
    "过去三个月最常见的三个例外是什么，分别如何处理？",
    "哪些错误可以事后修正，哪些错误发生后不可逆？",
    `${owner}将依据哪些指标决定扩大、调整或停止？`,
  ];
}
function metricMethod(name) {
  if (/准确|有效|命中/.test(name)) return "从每个验证周期随机抽样，由业务人员复核正确、错误与漏检数量。";
  if (/完整/.test(name)) return "统计关键字段齐全、证据可回溯的记录占全部应记录事项的比例。";
  if (/及时|按时|触达/.test(name)) return "按约定时限统计完成数量，并单独记录超时原因。";
  if (/采纳/.test(name)) return "统计业务负责人确认采用、调整和驳回的建议数量及原因。";
  if (/耗时|时长|响应/.test(name)) return "对同等任务量记录开始与完成时间，比较中位数和最慢样本。";
  if (/比例|比率|浪费|损耗/.test(name)) return "统一数量或金额口径，比较试点前后的相同业务周期。";
  return "按日记录数量、结果与发生原因，并与同等业务量的基线周期比较。";
}

const sourceSegments = sourceIndustries.reduce((count, industry) => count + industry.subs.length, 0);
const sourcePoints = sourceIndustries.reduce(
  (count, industry) => count + industry.subs.reduce((sum, segment) => sum + segment.painPoints.length, 0),
  0,
);
if (sourceIndustries.length !== 14 || sourceSegments !== 83 || sourcePoints !== 193) {
  throw new Error(`Unexpected source counts: ${sourceIndustries.length}/${sourceSegments}/${sourcePoints}`);
}

let sequence = 0;
const records = sourceIndustries.flatMap((industry) => {
  const normalizedIndustry = industryNames[industry.name] || industry.name;
  return industry.subs.flatMap((segment) => segment.painPoints.map((source) => {
    sequence += 1;
    const number = String(sequence).padStart(3, "0");
    const id = `case-${number}`;
    const segmentName = normalizeSegment(segment.name);
    const roles = roleMap[normalizedIndustry] || "业务负责人、一线执行人员、审核人员和服务对象";
    const text = `${source.title}${source.current}${source.solution}${source.aiBonus || ""}`;
    const publicTitle = editorialTitles[sequence - 1];
    const type = typeOverrides[id] || inferType(text);
    const publicType = publicTypeNames[type];
    const department = inferDepartment(text);
    const fields = inferFields(publicTitle, type);
    const measures = inferMeasures(text);
    const owner = ownerFor(normalizedIndustry, publicTitle);
    const issue = publicIssue(publicTitle, type, fields, sequence);
    const solution = publicSolution(publicTitle, type, fields, owner, sequence);
    const dataRequirements = fields.map((field) => fieldRequirement(field, normalizedIndustry));
    const risks = [
      ...typeProfiles[type].risks.map(([risk, signal, mitigation]) => ({ risk, signal, mitigation })),
      {
        risk: "权限与敏感数据",
        signal: industryProfiles[normalizedIndustry]?.sensitivity || "试点使用范围和访问人员尚未明确",
        mitigation: "建立字段级清单、角色权限、留存周期和导出审计；试点仅使用最小必要数据。",
      },
    ];
    return {
      id,
      number,
      industry: normalizedIndustry,
      segment: segmentName,
      title: publicTitle,
      insight: insightPatterns[type](publicTitle),
      context: publicContext(segmentName, roles, publicTitle, sequence),
      roles,
      before: `目前，${issue}`,
      problem: issue,
      solution,
      boundary: boundaryMap[normalizedIndustry] || genericBoundary,
      owner,
      pilot: `先在${segmentName}的一处真实工作场景中验证“${publicTitle}”。使用已授权的历史样本建立现状基线，再与原来的处理方式并行运行。`,
      tags: tagWords(fields, publicType),
      department,
      type: publicType,
      difficulty: inferDifficulty(normalizedIndustry, source),
      assumptions: [
        `以${segmentName}的单个业务单元为试点范围，不代表同一行业的所有机构都采用相同流程。`,
        "默认现有业务记录可在授权后导出；字段质量、样本数量和例外分布需在启动阶段验证。",
        `默认由${owner}承担业务确认与验收责任，技术团队不替代业务审批。`,
      ],
      problemBreakdown: problemBreakdown(issue, department, type),
      solutionModules: solutionModules(publicTitle, type, fields, owner),
      userJourney: userJourney(publicTitle, type, fields, owner),
      userStory: plainUserStory({
        industry: normalizedIndustry,
        title: publicTitle,
        issue,
        fields,
        owner,
        type,
        segment: segmentName,
        sequence,
      }),
      dataRequirements,
      integrationLevels: integrationLevels(normalizedIndustry),
      pilotPhases: pilotPhases(publicTitle, segmentName, measures),
      deliverables: [
        "现状流程图、角色责任表与例外清单",
        `包含${fields.slice(0, 4).join("、")}的字段字典与样本质量报告`,
        `围绕“${publicTitle}”的可操作试点`,
        "试运行日志、错误样本、人工修订与指标对比",
        "扩大、调整或停止的书面建议与下一阶段路线",
      ],
      prerequisites: prerequisites(normalizedIndustry, fields, owner),
      costDrivers: costDrivers(normalizedIndustry, type),
      riskRegister: risks,
      decisionRules: decisionRules(measures),
      notSuitable: notSuitable(normalizedIndustry, type),
      openQuestions: openQuestions(publicTitle, fields, owner),
      acceptanceCriteria: measures.map((metric) => ({
        metric,
        method: metricMethod(metric),
        baseline: "试点 D01—D03 测量",
        target: "由业务负责人与项目组共同确认",
        sample: "至少覆盖正常、异常与边界样本",
      })),
      valueHypothesis: {
        operational: `减少${publicTitle}过程中的重复录入、查找、等待或漏项。`,
        management: `让${owner}能查看状态、异常、责任人和处理结果，而不是依赖临时追问。`,
        economic: "只有在基线改善覆盖数据整理、人工复核、系统接入与运维成本时，才具备扩大价值。",
      },
      scope: {
        included: [`${segmentName}中的一个高频环节`, "授权历史样本回放", "小范围真实用户并行验证", "人工复核与审计记录"],
        excluded: ["未经验证直接替换原系统", "自动作出不可逆业务决定", "跨组织全量推广", "承诺固定收益或准确率"],
      },
      readingMinutes: 9,
      updated: "2026-09-14",
      status: "参考方案",
    };
  }));
});

const ids = new Set(records.map((record) => record.id));
if (records.length !== 193 || ids.size !== records.length) throw new Error("Migration produced invalid record count or duplicate IDs");
for (const record of records) {
  for (const key of ["industry", "segment", "title", "context", "roles", "before", "problem", "solution", "boundary", "pilot"]) {
    if (!record[key]) throw new Error(`Missing ${key} in ${record.id}`);
  }
  const expectedArrays = {
    assumptions: 3,
    problemBreakdown: 3,
    solutionModules: 5,
    userJourney: 4,
    dataRequirements: 4,
    integrationLevels: 3,
    pilotPhases: 4,
    deliverables: 5,
    prerequisites: 5,
    costDrivers: 4,
    riskRegister: 4,
    notSuitable: 4,
    openQuestions: 5,
    acceptanceCriteria: 3,
  };
  for (const [key, minimum] of Object.entries(expectedArrays)) {
    if (!Array.isArray(record[key]) || record[key].length < minimum) {
      throw new Error(`Incomplete ${key} in ${record.id}: expected at least ${minimum}`);
    }
  }
  for (const key of ["label", "headline", "opening", "plainProblem", "turningPoint", "ending"]) {
    if (!record.userStory?.[key]) throw new Error(`Missing user story ${key} in ${record.id}`);
  }
  if (record.userStory.scenes?.length !== 4 || record.userStory.takeaways?.length !== 4) {
    throw new Error(`Incomplete user story sequence in ${record.id}`);
  }
  if (!record.userStory.beforeAfter?.before || !record.userStory.beforeAfter?.after) {
    throw new Error(`Missing user story before/after in ${record.id}`);
  }
  for (const key of ["expand", "adjust", "stop"]) {
    if (!record.decisionRules[key]) throw new Error(`Missing decision rule ${key} in ${record.id}`);
  }
  for (const key of ["operational", "management", "economic"]) {
    if (!record.valueHypothesis[key]) throw new Error(`Missing value hypothesis ${key} in ${record.id}`);
  }
}
const disallowed = [
  /OpenCoDev/i,
  /demoUrl|demoDevice|aiBonus/,
  /当场签(?:约|单)/,
  /效率翻\s*\d+\s*倍/,
  /(?:降低|下降|提升|提高)\s*\d+\s*%\+?/,
];
for (const record of records) {
  const payload = JSON.stringify(record);
  for (const pattern of disallowed) {
    if (pattern.test(payload)) throw new Error(`Disallowed source or claim leaked into ${record.id}: ${pattern}`);
  }
}

const indexRecords = records.map(({
  id, number, industry, segment, title, insight, problem, tags,
  department, type, difficulty, updated, status,
}) => ({
  id, number, industry, segment, title, insight, problem, tags,
  department, type, difficulty, updated, status,
}));
fs.writeFileSync(indexPath, `${JSON.stringify(indexRecords, null, 2)}\n`);
fs.rmSync(detailsDir, { recursive: true, force: true });
fs.mkdirSync(detailsDir, { recursive: true });
for (const record of records) {
  fs.writeFileSync(path.join(detailsDir, `${record.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
}
const selectedIds = new Set(["case-001", "case-096", "case-174"]);
const homeData = {
  counts: {
    industries: new Set(records.map((record) => record.industry)).size,
    segments: new Set(records.map((record) => `${record.industry}::${record.segment}`)).size,
    cases: records.length,
  },
  selected: records
    .filter((record) => selectedIds.has(record.id))
    .map(({ id, number, industry, title, problem }) => ({ id, number, industry, title, problem })),
};
fs.writeFileSync(homeDataPath, `${JSON.stringify(homeData, null, 2)}\n`);
const manifest = {
  migratedAt: "2026-09-14",
  snapshot: path.relative(root, snapshot),
  snapshotSha256: crypto.createHash("sha256").update(html).digest("hex"),
  input: { industries: sourceIndustries.length, segments: sourceSegments, scenarios: sourcePoints },
  output: {
    scenarios: records.length,
    indexFieldsPerRecord: Object.keys(indexRecords[0]).length,
    detailFieldsPerRecord: Object.keys(records[0]).length,
    detailFiles: fs.readdirSync(detailsDir).length,
    homepageSelections: homeData.selected.length,
  },
  excludedFields: ["script", "demoUrl", "demoDevice", "aiBonus"],
  publicLabel: "参考方案",
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
