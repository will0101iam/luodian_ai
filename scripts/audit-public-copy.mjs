import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const detailsDir = path.join(root, "public/case-data");
const snapshotPath = path.join(root, "research/snapshots/opencodev-solutions-2026-09-14.html");
const files = fs.readdirSync(detailsDir).filter((file) => file.endsWith(".json")).sort();
const records = files.map((file) => JSON.parse(fs.readFileSync(path.join(detailsDir, file), "utf8")));
const publicPayload = JSON.stringify(records);

function extractArray(source, key) {
  const markerIndex = source.indexOf(`"${key}":`);
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
    } else if (char === '"') inString = true;
    else if (char === "[") depth += 1;
    else if (char === "]" && --depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  throw new Error(`Missing ${key} payload`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function duplicateCount(getValue) {
  const frequencies = new Map();
  records.forEach((record) => {
    const value = getValue(record);
    frequencies.set(value, (frequencies.get(value) || 0) + 1);
  });
  return [...frequencies.values()].filter((count) => count > 1).length;
}
function bigramSimilarity(left, right) {
  const grams = (value) => {
    const normalized = value.replace(/[\s/·（）()_-]/g, "");
    return new Set(Array.from({ length: Math.max(0, normalized.length - 1) }, (_, index) => normalized.slice(index, index + 2)));
  };
  const leftGrams = grams(left);
  const rightGrams = grams(right);
  const shared = [...leftGrams].filter((gram) => rightGrams.has(gram)).length;
  return shared / Math.max(1, new Set([...leftGrams, ...rightGrams]).size);
}

const sourceHtml = fs.readFileSync(snapshotPath, "utf8");
const sourceIndustries = extractArray(sourceHtml, "industries");
const sourceSegments = sourceIndustries.flatMap((industry) => industry.subs);
const sourceRecords = sourceSegments.flatMap((segment) => segment.painPoints);
const staticCopy = [
  "index.html", "cases/index.html", "src/app.js", "src/home.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

assert(records.length === 193, `Expected 193 details, received ${records.length}`);
assert(new Set(records.map((record) => record.title)).size === records.length, "Public titles must be unique");
assert(records.every((record) => Object.keys(record).length === 39), "Each public detail must contain 39 fields");
assert(records.every((record) => record.userStory?.scenes?.length === 4), "Every story needs four scenes");
assert(records.every((record) => record.userStory?.takeaways?.length === 4), "Every story needs four takeaways");
assert(
  new Set(records.map((record) => record.type)).size === 6
  && records.every((record) => ["数据汇总与分析", "预测与提醒", "识别与核对", "资料与文档", "分类与分派", "流程协作"].includes(record.type)),
  "Public application types must use customer-facing labels",
);

const sourceTitles = new Set(sourceRecords.map((record) => record.title.trim()));
assert(records.every((record) => !sourceTitles.has(record.title)), "A public title still exactly matches the source");
assert(
  records.every((record, index) => bigramSimilarity(record.title, sourceRecords[index].title) < 0.75),
  "A public title remains too close to its source wording",
);
for (const source of sourceRecords) {
  for (const value of [source.current, source.solution, source.script, source.aiBonus]) {
    if (value?.length > 15) assert(!publicPayload.includes(value), `Source sentence leaked into public data: ${value}`);
  }
}
for (const segment of sourceSegments) {
  for (const value of [segment.examples, segment.dailyWork, segment.entryStrategy]) {
    if (value?.length > 15) assert(!publicPayload.includes(value), `Source background leaked into public data: ${value}`);
  }
}

for (const [name, getValue] of Object.entries({
  problem: (record) => record.problem,
  solution: (record) => record.solution,
  context: (record) => record.context,
  headline: (record) => record.userStory.headline,
  opening: (record) => record.userStory.opening,
  plainProblem: (record) => record.userStory.plainProblem,
  turningPoint: (record) => record.userStory.turningPoint,
  ending: (record) => record.userStory.ending,
})) {
  assert(duplicateCount(getValue) === 0, `Repeated public narrative detected in ${name}`);
}

const forbiddenPublicPatterns = [
  /OpenCoDev/i,
  /opencodev\.cn/i,
  /团队需要同时解决信息留痕/,
  /团队没有先采购一套大系统/,
  /变化不在于“AI替人做完了”/,
  /从救火变成日常流程/,
  /实现最小处理链路/,
  /形成可追踪/,
  /闭环/,
  /赋能/,
  /落地路径/,
  /规模化落地/,
  /负责生产主管/,
  /要需要/,
  /导出导出/,
  /小工具/,
  /夫妻店/,
  /新质生产力/,
  /\bOPC\b/,
  /客户\/业务对象/,
  /企业\/线索/,
  /版本\/有效期/,
  /设备\/区域/,
  /分析与洞察/,
  /智能分流/,
  /真正/,
];
for (const pattern of forbiddenPublicPatterns) {
  assert(!pattern.test(publicPayload + staticCopy), `Forbidden public copy pattern found: ${pattern}`);
}

const awkwardTitlePattern = /缺少统一管理|难以及时掌握|难以快速定位|管不住|一团乱|算不清|看不见|查不到|客户天天催|工作负担较重|靠感觉|凭经验|不接地气/;
assert(records.every((record) => !awkwardTitlePattern.test(record.title)), "An unedited source-style title remains");

console.log(JSON.stringify({
  status: "PASS",
  records: records.length,
  fieldsPerRecord: Object.keys(records[0]).length,
  uniqueTitles: new Set(records.map((record) => record.title)).size,
  exactSourceTitles: 0,
  highSimilarityTitles: 0,
  leakedSourceSentences: 0,
  repeatedNarratives: 0,
}, null, 2));
