// Language system
const translationsAdd = {
  en: {
    pageTitle: "Add Expense",
    linkDashboard: "Dashboard",
    linkRecurring: "Recurring",
    linkSMS: "Extract SMS",
    formTitle: "Add a manual expense",
    formHint: "Store receipts and expenses locally. Works offline.",
    localOnly: "Local only",
    date: "Date",
    vendor: "Vendor",
    vendorPlaceholder: "Store, Company",
    category: "Category",
    categoryPlaceholder: "Groceries, Rent",
    amount: "Amount",
    receipt: "Receipt (image/pdf)",
    save: "Save",
    back: "Back to dashboard",
    footerText: "Local, free, offline-friendly budget dashboard (HTML + Excel).",
    success: "Saved! Redirecting to dashboard..."
  },
  ar: {
    pageTitle: "إضافة مصروف",
    linkDashboard: "اللوحة الرئيسية",
    linkRecurring: "مصاريف متكررة",
    linkSMS: "تحليل رسائل البنك",
    formTitle: "أضف مصروفاً يدوياً",
    formHint: "خزن الإيصالات والمصروفات محلياً. يعمل دون اتصال.",
    localOnly: "محلي فقط",
    date: "التاريخ",
    vendor: "الجهة",
    vendorPlaceholder: "متجر، شركة",
    category: "الفئة",
    categoryPlaceholder: "بقالة، إيجار",
    amount: "المبلغ",
    receipt: "الإيصال (صورة/ PDF)",
    save: "حفظ",
    back: "العودة للوحة التحكم",
    footerText: "لوحة ميزانية محلية مجانية وتعمل دون اتصال (HTML + Excel).",
    success: "تم الحفظ! سيتم الرجوع للوحة التحكم..."
  }
};

let currentLang = localStorage.getItem("budgetLang") || "en";

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("budgetLang", lang);
  const dict = translationsAdd[lang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.setAttribute("placeholder", dict[key]);
  });
  document.body.classList.toggle("rtl", lang === "ar");
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang === "ar" ? "ar" : "en");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  document.getElementById("btn-ar").classList.toggle("active", lang === "ar");
}

function readFileAsBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// Save to LocalStorage
async function saveExpense(e) {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const vendor = document.getElementById("vendor").value.trim();
  const category = document.getElementById("category").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const file = document.getElementById("receipt").files[0];

  if (!date || !vendor || !category || isNaN(amount)) return;

  const receipt = await readFileAsBase64(file);
  const payload = {
    date,
    vendor,
    category,
    amount,
    receipt
  };

  try {
    const existing = localStorage.getItem("mobileExpenses");
    const arr = existing ? JSON.parse(existing) : [];
    arr.push(payload);
    localStorage.setItem("mobileExpenses", JSON.stringify(arr));
  } catch (err) {
    localStorage.setItem("mobileExpenses", JSON.stringify([payload]));
  }

  document.getElementById("status").textContent = translationsAdd[currentLang].success;
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 700);
}

function init() {
  setLanguage(currentLang);

  document.getElementById("btn-en").addEventListener("click", () => setLanguage("en"));
  document.getElementById("btn-ar").addEventListener("click", () => setLanguage("ar"));

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;
  document.getElementById("expenseForm").addEventListener("submit", saveExpense);
}

document.addEventListener("DOMContentLoaded", init);
