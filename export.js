function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function exportToExcel() {
  const expenses = readLocal("mobileExpenses");
  const income = readLocal("mobileIncome");
  const recurring = readLocal("recurringExpenses");

  const wb = XLSX.utils.book_new();

  const expenseSheet = XLSX.utils.json_to_sheet(expenses.map(item => ({
    Date: item.date || "",
    Vendor: item.vendor || "",
    Category: item.category || "",
    Amount: item.amount || 0,
    Receipt: item.receipt || ""
  })));

  const incomeSheet = XLSX.utils.json_to_sheet(income.map(item => ({
    Date: item.date || "",
    Source: item.vendor || "",
    Category: item.category || "",
    Amount: item.amount || 0
  })));

  const recurringSheet = XLSX.utils.json_to_sheet(recurring.map(item => ({
    Name: item.name || "",
    Category: item.category || "",
    Amount: item.amount || 0
  })));

  XLSX.utils.book_append_sheet(wb, expenseSheet, "Expenses");
  XLSX.utils.book_append_sheet(wb, incomeSheet, "Income");
  XLSX.utils.book_append_sheet(wb, recurringSheet, "Recurring");

  XLSX.writeFile(wb, "Budget_Export.xlsx");
}

window.exportToExcel = exportToExcel;
