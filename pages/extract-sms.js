// Language system
const smsTranslations = {
  en: {
    pageTitle: "Extract Bank SMS",
    linkDashboard: "Dashboard",
    linkAddExpense: "Add Expense",
    linkRecurring: "Recurring",
    formTitle: "Paste your bank SMS",
    formHint: "We detect type, amount, vendor, and store it locally.",
    localOnly: "Local only",
    messageLabel: "Message",
    messagePlaceholder: "Paste the SMS here",
    analyze: "Analyze message",
    viewDashboard: "View dashboard",
    resultTitle: "Detected details",
    type: "Type",
    amount: "Amount",
    vendor: "Vendor",
    date: "Date",
    expense: "Expense",
    income: "Income",
    savedExpense: "Saved as expense.",
    savedIncome: "Saved as income.",
    footerText: "Local, free, offline-friendly budget dashboard (HTML + Excel).",
    missing: "No data detected. Please check the message."
  },
  ar: {
    pageTitle: "تحليل رسائل البنك",
    linkDashboard: "اللوحة الرئيسية",
    linkAddExpense: "إضافة مصروف",
    linkRecurring: "مصاريف متكررة",
    formTitle: "ألصق رسالة البنك",
    formHint: "نستخرج النوع والمبلغ والجهة ونخزنها محلياً.",
    localOnly: "محلي فقط",
    messageLabel: "الرسالة",
    messagePlaceholder: "ألصق الرسالة هنا",
    analyze: "تحليل الرسالة",
    viewDashboard: "عرض في لوحة التحكم",
    resultTitle: "البيانات المستخرجة",
    type: "النوع",
    amount: "المبلغ",
    vendor: "الجهة",
    date: "التاريخ",
    expense: "مصروف",
    income: "دخل",
    savedExpense: "تم التخزين كمصروف.",
    savedIncome: "تم التخزين كدخل.",
    footerText: "لوحة ميزانية محلية مجانية وتعمل دون اتصال (HTML + Excel).",
    missing: "لم يتم العثور على بيانات. يرجى مراجعة الرسالة."
  }
};

let currentLang = localStorage.getItem("budgetLang") || "en";

// -----------------------------
// TEXT NORMALIZER
// -----------------------------
function normalizeText(text) {
  return text
    .replace(/\n+/g, " ")     // replace new lines
    .replace(/\s+/g, " ")     // collapse spaces
    .trim();
}

// -----------------------------
// DETECT EXPENSE / INCOME
// -----------------------------
function detectType(clean) {
  const lower = clean.toLowerCase();
  const incomeWords = ["credit", "credited", "deposit", "تم إضافة", "إيداع"];
  const isIncome = incomeWords.some(w => lower.includes(w.toLowerCase()));
  return isIncome ? "income" : "expense";
}

// -----------------------------
// EXTRACT AMOUNT (OMAN FORMAT)
// -----------------------------
function extractAmount(clean) {
  const m = clean.match(/OMR\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!m) return null;
  const val = Number(m[1]);
  return isNaN(val) ? null : val;
}

// -----------------------------
// EXTRACT VENDOR
// -----------------------------
function extractVendor(clean) {
  const patterns = [
    /at\s+([A-Za-z0-9\s\-\&]+)/i,
    /POS\s+([A-Za-z0-9\s\-\&]+)/i,
    /ATM\s+([A-Za-z0-9\s\-\&]+)/i,
    /(?:to|for|For)\s+([A-Za-z0-9\s\-\&]+)/i
  ];

  for (const re of patterns) {
    const m = clean.match(re);
    if (m) return m[1].trim();
  }
  return "";
}

// -----------------------------
// CONVERT DATE TO ISO
// -----------------------------
function toISODate(datePart, timePart = "00:00:00") {
  const sep = datePart.includes("/") ? "/" : "-";
  const [a, b, c] = datePart.split(sep);
  if (!a || !b || !c) return null;

  let day, month, year;

  if (a.length === 4) {
    year = Number(a);
    month = Number(b);
    day = Number(c);
  } else {
    day = Number(a);
    month = Number(b);
    year = Number(c);
  }

  if (year < 100) year = 2000 + year;

  const pad = v => String(v).padStart(2, "0");
  const isoString = `${year}-${pad(month)}-${pad(day)}T${timePart}`;
  const d = new Date(isoString);

  return isNaN(d.getTime()) ? null : d.toISOString();
}

// -----------------------------
// EXTRACT DATE (ALL OMAN FORMATS)
// -----------------------------
function extractDate(clean) {
  // Format: on 22/11/2025 23:24:23
  const m = clean.match(/on\s*\.?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(\d{2}:\d{2}:\d{2})?/i);
  if (m) {
    const datePart = m[1];
    const timePart = m[2] || "00:00:00";
    const iso = toISODate(datePart, timePart);
    if (iso) return iso;
  }

  // Format: 2025/11/22
  const m2 = clean.match(/(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
  if (m2) {
    const iso = toISODate(m2[1], "00:00:00");
    if (iso) return iso;
  }

  return new Date().toISOString();
}

// -----------------------------
// MAIN PARSER
// -----------------------------
function parseBankSMS(raw) {
  const clean = normalizeText(raw);
  if (!clean) return null;

  const amount = extractAmount(clean);
  if (amount === null) return null;

  const type = detectType(clean);
  const vendor = extractVendor(clean);
  const date = extractDate(clean);

  return { type, amount, vendor, date };
}

// -----------------------------
// SAVE TO LOCALSTORAGE
// -----------------------------
function saveRecord(type, data) {
  const key = type === "expense" ? "mobileExpenses" : "mobileIncome";

  try {
    const existing = localStorage.getItem(key);
    const arr = existing ? JSON.parse(existing) : [];
    arr.push(data);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (err) {
    localStorage.setItem(key, JSON.stringify([data]));
  }
}

// -----------------------------
// ANALYZE BUTTON HANDLER
// -----------------------------
function analyzeMessage() {
  const text = document.getElementById("smsText").value.trim();
  const dict = smsTranslations[currentLang];
  const resultEl = document.getElementById("result");
  const statusEl = document.getElementById("saveStatus");

  const parsed = parseBankSMS(text);
  if (!parsed) {
    statusEl.textContent = dict.missing;
    resultEl.hidden = false;
    return;
  }

  const payload = {
    date: parsed.date,
    vendor: parsed.vendor,
    category: "SMS",
    amount: parsed.amount
  };

  saveRecord(parsed.type, payload);

  document.getElementById("resType").textContent =
    parsed.type === "expense" ? dict.expense : dict.income;

  document.getElementById("resAmount").textContent =
    `${parsed.amount.toFixed(3)} OMR`;

  document.getElementById("resVendor").textContent = parsed.vendor || "--";

  document.getElementById("resDate").textContent =
    new Date(parsed.date).toLocaleString(currentLang);

  statusEl.textContent =
    parsed.type === "expense" ? dict.savedExpense : dict.savedIncome;

  resultEl.hidden = false;

  window.dispatchEvent(new Event("storage"));
}

// -----------------------------
// INIT
// -----------------------------
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("budgetLang", lang);

  const dict = smsTranslations[lang];

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

  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  document.getElementById("btn-ar").classList.toggle("active", lang === "ar");
}

function init() {
  setLanguage(currentLang);
  document.getElementById("btn-en").addEventListener("click", () => setLanguage("en"));
  document.getElementById("btn-ar").addEventListener("click", () => setLanguage("ar"));
  document.getElementById("analyzeBtn").addEventListener("click", analyzeMessage);
}

document.addEventListener("DOMContentLoaded", init);
