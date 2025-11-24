// Language system
const translations = {
  en: {
    appTitle: "Personal Budget Dashboard",
    linkAddExpense: "Add Expense",
    linkRecurring: "Recurring",
    linkAddIncome: "Add Income",
    linkSMS: "Extract SMS",
    importTitle: "Import Excel",
    importHint: "Upload a workbook with sheets named Income and Expenses.",
    importNote: "No server required. Everything stays in your browser.",
    localOnly: "Local only",
    exportExcel: "Export to Excel",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",
    netBalance: "Net Balance",
    savingsRate: "Savings",
    chartNetMonthly: "Net Monthly Trend",
    chartIncomeVsExpenses: "Income vs Expenses",
    chartByCategory: "Expenses by Category",
    recentHintTitle: "Tip",
    recentHintBody: "Use this dashboard regularly to track your spending habits and improve your savings.",
    footerText: "Local, free, offline-friendly budget dashboard (HTML + Excel).",
    entries: "entries",
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    alertMissingSheets: "Missing 'Income' or 'Expenses' sheet in Excel file.",
    alertInvalidFile: "Could not read the Excel file. Please try again.",
    clearData: "Clear income & expenses",
    clearConfirm: "This will remove local income and expense entries. Continue?",
    clearSuccess: "Cleared local income and expenses."
  },
  ar: {
    appTitle: "لوحة الميزانية الشخصية",
    linkAddExpense: "إضافة مصروف",
    linkAddIncome: "إضافة دخل",
    linkRecurring: "مصاريف متكررة",
    linkSMS: "تحليل رسائل البنك",
    importTitle: "استيراد ملف Excel",
    importHint: "قم برفع ملف يحتوي على أوراق باسم Income و Expenses.",
    importNote: "لا يوجد خادم. كل شيء يبقى داخل المتصفح.",
    localOnly: "محلي فقط",
    exportExcel: "تصدير إلى Excel",
    totalIncome: "إجمالي الدخل",
    totalExpenses: "إجمالي المصروفات",
    netBalance: "صافي الميزانية",
    savingsRate: "نسبة الادخار",
    chartNetMonthly: "الاتجاه الشهري الصافي",
    chartIncomeVsExpenses: "الدخل مقابل المصروفات",
    chartByCategory: "المصروفات حسب الفئة",
    recentHintTitle: "نصيحة",
    recentHintBody: "استخدم هذه اللوحة بانتظام لتتبع الإنفاق وتحسين ادخارك.",
    footerText: "لوحة ميزانية محلية مجانية وتعمل دون اتصال (HTML + Excel).",
    entries: "عملية",
    months: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
    alertMissingSheets: "ملف Excel لا يحتوي على ورقة Income أو Expenses.",
    alertInvalidFile: "تعذر قراءة الملف. حاول مرة أخرى.",
    clearData: "حذف الدخل والمصروفات",
    clearConfirm: "سيتم حذف بيانات الدخل والمصروفات المحلية. هل تريد المتابعة؟",
    clearSuccess: "تم حذف الدخل والمصروفات المحلية."
  }
};

let currentLang = localStorage.getItem("budgetLang") || "en";
let netChart = null;
let incomeExpensesChart = null;
let categoryChart = null;

const months = () => translations[currentLang].months;

const LS_KEYS = {
  mobileExpenses: "mobileExpenses",
  mobileIncome: "mobileIncome",
  recurring: "recurringExpenses"
};

const excelState = {
  income: [],
  expenses: []
};

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("budgetLang", lang);
  const dict = translations[lang];

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.body.classList.toggle("rtl", lang === "ar");
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang === "ar" ? "ar" : "en");

  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  document.getElementById("btn-ar").classList.toggle("active", lang === "ar");

  updateUI();
}

function formatCurrency(value) {
  return `${value.toFixed(3)} OMR`;
}

function safeParseArray(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function loadLocalData() {
  return {
    mobileExpenses: safeParseArray(LS_KEYS.mobileExpenses),
    mobileIncome: safeParseArray(LS_KEYS.mobileIncome),
    recurring: safeParseArray(LS_KEYS.recurring)
  };
}

function addToMonthTotals(array, item) {
  const date = new Date(item.date || item.Date);
  if (isNaN(date.getTime())) return null;
  const m = date.getMonth();
  if (typeof item.amount !== "number") return null;
  array[m] += item.amount;
  return m;
}

function buildSummary() {
  const { mobileExpenses, mobileIncome, recurring } = loadLocalData();

  const incomeRows = [...excelState.income, ...mobileIncome];
  const expenseRows = [...excelState.expenses, ...mobileExpenses];

  const incomeByMonth = Array(12).fill(0);
  const expensesByMonth = Array(12).fill(0);
  const expensesByCategory = {};

  let totalIncome = 0;
  let totalExpenses = 0;

  incomeRows.forEach(row => {
    const date = new Date(row.date || row.Date);
    const amount = Number(row.amount || row.Amount || 0);
    if (isNaN(date.getTime()) || isNaN(amount)) return;
    totalIncome += amount;
    addToMonthTotals(incomeByMonth, { date, amount });
  });

  expenseRows.forEach(row => {
    const date = new Date(row.date || row.Date);
    const amount = Number(row.amount || row.Amount || 0);
    const cat = row.category || row.Category || "Other";
    if (isNaN(date.getTime()) || isNaN(amount)) return;
    totalExpenses += amount;
    addToMonthTotals(expensesByMonth, { date, amount });
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amount;
  });

  // Apply recurring expenses to every month
  recurring.forEach(item => {
    const amount = Number(item.amount || 0);
    if (isNaN(amount)) return;
    for (let i = 0; i < 12; i++) {
      expensesByMonth[i] += amount;
    }
    const cat = item.category || "Recurring";
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amount * 12;
  });

  // Normalize totals after recurring adjustments
  totalIncome = incomeByMonth.reduce((a, b) => a + b, 0);
  totalExpenses = expensesByMonth.reduce((a, b) => a + b, 0);

  const netByMonth = incomeByMonth.map((v, i) => v - expensesByMonth[i]);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  return {
    incomeByMonth,
    expensesByMonth,
    netByMonth,
    expensesByCategory,
    totals: { totalIncome, totalExpenses, netBalance, savingsRate },
    counts: { income: incomeRows.length, expenses: expenseRows.length, recurring: recurring.length }
  };
}

function buildCharts(summary) {
  const ctxNet = document.getElementById("netChart").getContext("2d");
  const ctxIE = document.getElementById("incomeExpensesChart").getContext("2d");
  const ctxCat = document.getElementById("categoryChart").getContext("2d");

  if (netChart) netChart.destroy();
  if (incomeExpensesChart) incomeExpensesChart.destroy();
  if (categoryChart) categoryChart.destroy();

  netChart = new Chart(ctxNet, {
    type: "line",
    data: {
      labels: months(),
      datasets: [{
        label: translations[currentLang].netBalance,
        data: summary.netByMonth,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  incomeExpensesChart = new Chart(ctxIE, {
    type: "bar",
    data: {
      labels: months(),
      datasets: [
        {
          label: translations[currentLang].totalIncome,
          data: summary.incomeByMonth,
          backgroundColor: "rgba(34, 197, 94, 0.5)",
          borderColor: "#22c55e"
        },
        {
          label: translations[currentLang].totalExpenses,
          data: summary.expensesByMonth,
          backgroundColor: "rgba(249, 115, 22, 0.5)",
          borderColor: "#f97316"
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const catLabels = Object.keys(summary.expensesByCategory);
  const catValues = Object.values(summary.expensesByCategory);

  categoryChart = new Chart(ctxCat, {
    type: "pie",
    data: {
      labels: catLabels,
      datasets: [{
        data: catValues,
        backgroundColor: ["#38bdf8","#22c55e","#f97316","#a855f7","#f43f5e","#fcd34d"]
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function updateUI() {
  const summary = buildSummary();

  document.getElementById("totalIncomeValue").textContent = formatCurrency(summary.totals.totalIncome);
  document.getElementById("totalExpensesValue").textContent = formatCurrency(summary.totals.totalExpenses);
  document.getElementById("netBalanceValue").textContent = formatCurrency(summary.totals.netBalance);
  document.getElementById("savingsRate").textContent = `${summary.totals.savingsRate.toFixed(1)}% ${translations[currentLang].savingsRate}`;
  document.getElementById("incomeCount").textContent = `${summary.counts.income} ${translations[currentLang].entries}`;
  document.getElementById("expenseCount").textContent = `${summary.counts.expenses + summary.counts.recurring} ${translations[currentLang].entries}`;

  buildCharts(summary);
}

function parseExcelSheet(sheet, isIncome = false) {
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map(r => {
    const dateStr = r["Date"] || r["date"] || r["DATE"];
    const category = r["Category"] || r["category"] || (isIncome ? "Income" : "Expense");
    const vendor = r["Vendor"] || r["vendor"] || r["Description"] || "";
    const amountVal = r["Amount (OMR)"] || r["Amount"] || r["amount"] || 0;
    const amount = Number(amountVal) || 0;
    return {
      date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
      category,
      vendor,
      amount
    };
  });
}

function handleExcelFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const incomeSheet = workbook.Sheets["Income"];
      const expenseSheet = workbook.Sheets["Expenses"];
      if (!incomeSheet || !expenseSheet) {
        alert(translations[currentLang].alertMissingSheets);
        return;
      }
      excelState.income = parseExcelSheet(incomeSheet, true);
      excelState.expenses = parseExcelSheet(expenseSheet, false);
      updateUI();
    } catch (err) {
      alert(translations[currentLang].alertInvalidFile);
    }
  };
  reader.readAsArrayBuffer(file);
}

function init() {
  setLanguage(currentLang);

  document.getElementById("btn-en").addEventListener("click", () => setLanguage("en"));
  document.getElementById("btn-ar").addEventListener("click", () => setLanguage("ar"));

  document.getElementById("excelFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleExcelFile(file);
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    if (typeof exportToExcel === "function") {
      exportToExcel();
    }
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    const dict = translations[currentLang];
    if (!confirm(dict.clearConfirm)) return;
    localStorage.removeItem(LS_KEYS.mobileIncome);
    localStorage.removeItem(LS_KEYS.mobileExpenses);
    updateUI();
    alert(dict.clearSuccess);
  });

  window.addEventListener("storage", () => updateUI());
}

document.addEventListener("DOMContentLoaded", init);
