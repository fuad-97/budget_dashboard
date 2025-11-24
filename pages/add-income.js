const incomeTranslations = {
  en: {
    pageTitle: "Add Income",
    linkDashboard: "Dashboard",
    linkAddExpense: "Add Expense",
    linkRecurring: "Recurring",
    linkSMS: "Extract SMS",
    formTitle: "Add Income",
    formHint: "Record your income source, amount, and date.",
    amountLabel: "Amount (OMR)",
    sourceLabel: "Income Source",
    dateLabel: "Date",
    notesLabel: "Notes",
    save: "Save income",
    cancel: "Cancel",
    footerText: "Local, free, offline-friendly budget dashboard (HTML + Excel).",
    localOnly: "Local only"
  },

  ar: {
    pageTitle: "إضافة دخل",
    linkDashboard: "الرئيسية",
    linkAddExpense: "إضافة مصروف",
    linkRecurring: "مصاريف متكررة",
    linkSMS: "تحليل رسائل البنك",
    formTitle: "إضافة دخل",
    formHint: "سجل مصدر الدخل والمبلغ والتاريخ.",
    amountLabel: "المبلغ (OMR)",
    sourceLabel: "مصدر الدخل",
    dateLabel: "التاريخ",
    notesLabel: "ملاحظات",
    save: "حفظ الدخل",
    cancel: "إلغاء",
    footerText: "لوحة ميزانية محلية مجانية وتعمل دون اتصال.",
    localOnly: "محلي فقط"
  }
};

let currentLang = localStorage.getItem("budgetLang") || "en";

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("budgetLang", lang);

  const dict = incomeTranslations[lang];

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.body.classList.toggle("rtl", lang === "ar");
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

function saveIncome() {
  const amount = Number(document.getElementById("amount").value);
  const source = document.getElementById("source").value.trim();
  const date = document.getElementById("date").value || new Date().toISOString().split("T")[0];
  const notes = document.getElementById("notes").value.trim();

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  const entry = {
    amount,
    vendor: source,
    date,
    notes,
    category: "Income"
  };

  const key = "mobileIncome";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(entry);
  localStorage.setItem(key, JSON.stringify(existing));

  window.location.href = "../index.html";
}

function init() {
  setLanguage(currentLang);

  document.getElementById("btn-en").addEventListener("click", () => setLanguage("en"));
  document.getElementById("btn-ar").addEventListener("click", () => setLanguage("ar"));

  document.getElementById("saveBtn").addEventListener("click", saveIncome);
}

document.addEventListener("DOMContentLoaded", init);
