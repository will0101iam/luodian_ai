import "./library.css";
import "./home.css";
import "./about.css";
import { createIcons, ArrowUpRight, X } from "lucide";

const iconSet = { ArrowUpRight, X };
const dialog = document.querySelector("#contact-dialog");

function renderIcons(root = document) {
  createIcons({ icons: iconSet, attrs: { "aria-hidden": "true" }, root });
}

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
document.querySelector("#contact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector("#contact-status");
  const submit = form.querySelector("button[type=submit]");
  const values = new FormData(form);
  const company = String(values.get("company")).trim();
  const workflow = String(values.get("workflow")).trim();
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
        联系方式: values.get("contact") || "未填写",
        业务流程: workflow,
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

renderIcons();
