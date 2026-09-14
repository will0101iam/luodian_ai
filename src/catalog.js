import records from "./case-index.json";

export const cases = records;
export const industries = [...new Set(cases.map((item) => item.industry))];
export const segments = [...new Set(cases.map((item) => item.segment))];
export const departments = [...new Set(cases.map((item) => item.department))];
export const types = [...new Set(cases.map((item) => item.type))];
