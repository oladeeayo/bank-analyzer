export const NORMALIZER_TO_DB_CATEGORY: Record<string, string> = {
  // Map normalizer category guesses to database parent category names
  "Food": "Food & Dining",
  "Food & Dining": "Food & Dining",
  "Supermarket": "Food & Dining",
  "Transport": "Transportation",
  "Fuel": "Transportation",
  "Bills": "Utilities",
  "Bills & Subscriptions": "Utilities",
  "Shopping": "Shopping",
  "Financial Services": "Banking & Financial",
  "Healthcare": "Healthcare",
  "Health": "Healthcare",
  "Education": "Education",
  "Housing": "Housing",
  "ATM & POS": "Banking & Financial",
  "Income": "Income",
  "Salary": "Income",
  "Gift": "Income",
  "Government": "Government & Taxes",
  "Tax": "Government & Taxes",
  "Entertainment": "Entertainment",
  "Subscription": "Entertainment",
  "Insurance": "Insurance",
  "Transfer": "Banking & Financial",
  "Others": "Miscellaneous",
};

export function mapToDbCategory(normalizerGuess: string): string {
  return NORMALIZER_TO_DB_CATEGORY[normalizerGuess] || normalizerGuess;
}
