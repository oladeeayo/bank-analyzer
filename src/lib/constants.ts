export const BANKS = [
  "GTBank",
  "Access Bank",
  "UBA",
  "OPay",
  "PalmPay",
  "Moniepoint",
  "Kuda Bank",
  "First Bank",
  "Zenith Bank",
  "Wema Bank",
  "Fidelity Bank",
  "Sterling Bank",
  "Union Bank",
  "Polaris Bank",
  "Unity Bank",
  "Stanbic IBTC",
  "Ecobank",
  "Standard Chartered",
] as const;

export type BankName = (typeof BANKS)[number];

export const CATEGORIES = [
  { name: "Food", icon: "🍔", color: "#F97316" },
  { name: "Transport", icon: "🚗", color: "#3B82F6" },
  { name: "Bills", icon: "💡", color: "#EAB308" },
  { name: "Salary", icon: "💰", color: "#22C55E" },
  { name: "Business", icon: "💼", color: "#8B5CF6" },
  { name: "Transfer", icon: "💸", color: "#EC4899" },
  { name: "Investment", icon: "📈", color: "#10B981" },
  { name: "Shopping", icon: "🛍️", color: "#F43F5E" },
  { name: "Health", icon: "🏥", color: "#06B6D4" },
  { name: "Fuel", icon: "⛽", color: "#F59E0B" },
  { name: "ATM", icon: "🏧", color: "#6366F1" },
  { name: "POS", icon: "💳", color: "#8B5CF6" },
  { name: "Cash Withdrawal", icon: "💵", color: "#10B981" },
  { name: "Rent", icon: "🏠", color: "#EF4444" },
  { name: "School", icon: "📚", color: "#3B82F6" },
  { name: "Family", icon: "👨‍👩‍👧‍👦", color: "#EC4899" },
  { name: "Gift", icon: "🎁", color: "#F43F5E" },
  { name: "Loan", icon: "🏦", color: "#6366F1" },
  { name: "Interest", icon: "📊", color: "#10B981" },
  { name: "Fees", icon: "📋", color: "#F59E0B" },
  { name: "Tax", icon: "🏛️", color: "#6B7280" },
  { name: "Internal Transfer", icon: "🔄", color: "#06B6D4" },
  { name: "Savings", icon: " piggy", color: "#22C55E" },
  { name: "Crypto", icon: "₿", color: "#F59E0B" },
  { name: "Dining", icon: "🍽️", color: "#EF4444" },
  { name: "Supermarket", icon: "🛒", color: "#22C55E" },
  { name: "Utilities", icon: "🔧", color: "#6B7280" },
  { name: "Travel", icon: "✈️", color: "#3B82F6" },
  { name: "Subscription", icon: "📱", color: "#8B5CF6" },
  { name: "Insurance", icon: "🛡️", color: "#06B6D4" },
  { name: "Others", icon: "📁", color: "#6B7280" },
] as const;

export const FILE_TYPES = {
  CSV: ".csv",
  EXCEL: ".xlsx,.xls",
  PDF: ".pdf",
} as const;

export const TRANSACTION_TYPES = {
  DEBIT: "debit",
  CREDIT: "credit",
} as const;
