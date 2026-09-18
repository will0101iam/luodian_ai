import "./library.css";
import "./home.css";
import { createIcons, ArrowUpRight, ArrowRight, Download, Menu, X } from "lucide";
import homeData from "./home-data.json";

const iconSet = { ArrowUpRight, ArrowRight, Download, Menu, X };
const selected = homeData.selected;
const dialog = document.querySelector("#contact-dialog");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("#home-nav");

function renderIcons(root = document) {
  createIcons({ icons: iconSet, attrs: { "aria-hidden": "true" }, root });
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}
document.querySelector("[data-selected-cases]").innerHTML = selected.map((item) => `
  <article>
    <div><span>${escapeHtml(item.industry)}</span><small>RESEARCH / ${item.number}</small></div>
    <h3><a href="/cases/?case=${item.id}">${escapeHtml(item.title)}</a></h3>
    <p>${escapeHtml(item.problem)}</p>
    <a href="/cases/?case=${item.id}">阅读方案 <i data-lucide="arrow-up-right"></i></a>
  </article>
`).join("");
document.querySelector("[data-industry-count]").textContent = homeData.counts.industries;
document.querySelector("[data-case-count]").textContent = homeData.counts.cases;

function setNavigation(open) {
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  nav.classList.toggle("is-open", open);
  navToggle.innerHTML = `<i data-lucide="${open ? "x" : "menu"}"></i>`;
  renderIcons(navToggle);
}
navToggle.addEventListener("click", () => setNavigation(navToggle.getAttribute("aria-expanded") !== "true"));
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setNavigation(false)));

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-contact")) {
    document.querySelector("#contact-form").reset();
    document.querySelector("#contact-status").textContent = "";
    dialog.showModal();
  } else if (button.hasAttribute("data-close-dialog")) dialog.close();
});
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const company = String(values.get("company")).trim();
  const workflow = String(values.get("workflow")).trim();
  if (!company || !workflow) {
    document.querySelector("#contact-status").textContent = "请填写企业与具体流程，内容不能只有空格。";
    return;
  }
  const text = `落点 AI / 项目沟通需求单\n\n企业或团队：${company}\n联系方式：${values.get("contact") || "未填写"}\n\n业务流程：\n${workflow}\n\n待确认：业务频次、当前耗时、数据权限、人工责任和验收标准。\n`;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "luodian-project-brief.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector("#contact-status").textContent = "需求单已下载，信息未上传。";
});

renderIcons();
