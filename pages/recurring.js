// Language system
const recurringTranslations = {
  en: {
    pageTitle: "Recurring Monthly Expenses",
    linkDashboard: "Dashboard",
    linkAddExpense: "Add Expense",
    linkSMS: "Extract SMS",
    formTitle: "Add a recurring monthly expense",
    formHint: "Subscriptions, rent, insurance, and all fixed costs live here.",
    tableTitle: "Recurring expenses list",
    tableHint: "Saved locally and ready for the dashboard.",
    name: "Name",
    namePlaceholder: "Netflix, Rent...",
    category: "Category",
    categoryPlaceholder: "Housing, Utilities...",
    amount: "Monthly Amount",
    add: "Add",
    update: "Update",
    edit: "Edit",
    delete: "Delete",
    reset: "Reset",
    actions: "Actions",
    emptyState: "No recurring expenses yet. Add your first item above.",
    validationRequired: "Please fill all fields before adding.",
    validationAmount: "Monthly amount must be zero or higher.",
    autosave: "Autosaves locally",
    footerText: "Local, free, offline-friendly budget dashboard (HTML + Excel)."
  },
  ar: {
    pageTitle: "المصاريف الشهرية المتكررة",
    linkDashboard: "اللوحة الرئيسية",
    linkAddExpense: "إضافة مصروف",
    linkSMS: "تحليل رسائل البنك",
    formTitle: "أضف مصروفاً شهرياً متكرراً",
    formHint: "الاشتراكات والإيجار والتأمين وكل المصاريف الثابتة.",
    tableTitle: "قائمة المصاريف المتكررة",
    tableHint: "محفوظة محلياً وجاهزة للوحة التحكم.",
    name: "الاسم",
    namePlaceholder: "نتفلكس، إيجار...",
    category: "الفئة",
    categoryPlaceholder: "السكن، المرافق...",
    amount: "المبلغ الشهري",
    add: "إضافة",
    update: "تحديث",
    edit: "تعديل",
    delete: "حذف",
    reset: "إعادة ضبط",
    actions: "العمليات",
    emptyState: "لا توجد مصاريف متكررة بعد. أضف أول بند في الأعلى.",
    validationRequired: "يرجى تعبئة جميع الحقول قبل الإضافة.",
    validationAmount: "يجب أن يكون المبلغ الشهري صفراً أو أكثر.",
    autosave: "حفظ تلقائي محلي",
    footerText: "لوحة ميزانية محلية مجانية وتعمل دون اتصال (HTML + Excel)."
  }
};

let currentLang = localStorage.getItem("budgetLang") || "en";
let recurringExpenses = [];
let editIndex = null;
const storageKey = "recurringExpenses";

const nameInput = document.getElementById("expenseName");
const categoryInput = document.getElementById("expenseCategory");
const amountInput = document.getElementById("expenseAmount");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const expensesBody = document.getElementById("expensesBody");
const emptyState = document.getElementById("emptyState");

function getDict() {
  return recurringTranslations[currentLang];
}

function updatePlaceholders(dict) {
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.setAttribute("placeholder", dict[key]);
  });
}

function updateSubmitLabel() {
  submitBtn.textContent = editIndex === null ? getDict().add : getDict().update;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("budgetLang", lang);
  const dict = getDict();
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  updatePlaceholders(dict);
  updateSubmitLabel();
  document.body.classList.toggle("rtl", lang === "ar");
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lang === "ar" ? "ar" : "en");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  document.getElementById("btn-ar").classList.toggle("active", lang === "ar");
  renderExpenses();
}

function clearForm() {
  document.getElementById("expenseForm").reset();
  editIndex = null;
  updateSubmitLabel();
}

function renderExpenses() {
  expensesBody.innerHTML = "";
  const dict = getDict();

  if (!recurringExpenses.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  recurringExpenses.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${Number(item.amount).toFixed(3)}</td>
      <td class="actions-col">
        <div class="table-row-actions">
          <button type="button" class="table-action edit" data-index="${index}">${dict.edit}</button>
          <button type="button" class="table-action delete" data-index="${index}">${dict.delete}</button>
        </div>
      </td>
    `;
    expensesBody.appendChild(tr);
  });

  expensesBody.querySelectorAll(".table-action.edit").forEach(btn => {
    btn.addEventListener("click", () => editExpense(Number(btn.dataset.index)));
  });
  expensesBody.querySelectorAll(".table-action.delete").forEach(btn => {
    btn.addEventListener("click", () => deleteExpense(Number(btn.dataset.index)));
  });
}

// Load recurring expenses
function loadRecurringExpenses() {
  try {
    const saved = localStorage.getItem(storageKey);
    recurringExpenses = saved ? JSON.parse(saved) : [];
  } catch (err) {
    recurringExpenses = [];
  }
}

// Save to LocalStorage
function saveRecurringExpenses() {
  localStorage.setItem(storageKey, JSON.stringify(recurringExpenses));
  syncWithMainDashboard();
}

function validateForm() {
  const dict = getDict();
  const name = nameInput.value.trim();
  const category = categoryInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!name || !category || amountInput.value === "") {
    alert(dict.validationRequired);
    return false;
  }

  if (isNaN(amount) || amount < 0) {
    alert(dict.validationAmount);
    return false;
  }

  return { name, category, amount: Number(amount) };
}

function addExpense(event) {
  event.preventDefault();
  const valid = validateForm();
  if (!valid) return;

  if (editIndex !== null) {
    recurringExpenses[editIndex] = valid;
  } else {
    recurringExpenses.push(valid);
  }

  saveRecurringExpenses();
  renderExpenses();
  clearForm();
}

function editExpense(index) {
  const item = recurringExpenses[index];
  if (!item) return;
  editIndex = index;
  nameInput.value = item.name;
  categoryInput.value = item.category;
  amountInput.value = item.amount;
  updateSubmitLabel();
  nameInput.focus();
}

function deleteExpense(index) {
  recurringExpenses.splice(index, 1);
  saveRecurringExpenses();
  renderExpenses();
  clearForm();
}

// Sync with main dashboard
function syncWithMainDashboard() {
  window.recurringExpenses = [...recurringExpenses];
  window.dispatchEvent(new Event("storage"));
}

function init() {
  loadRecurringExpenses();
  renderExpenses();
  setLanguage(currentLang);
  syncWithMainDashboard();

  document.getElementById("expenseForm").addEventListener("submit", addExpense);
  resetBtn.addEventListener("click", () => {
    clearForm();
    setLanguage(currentLang);
  });

  document.getElementById("btn-en").addEventListener("click", () => setLanguage("en"));
  document.getElementById("btn-ar").addEventListener("click", () => setLanguage("ar"));
}

document.addEventListener("DOMContentLoaded", init);
