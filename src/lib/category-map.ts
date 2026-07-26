export const NORMALIZER_TO_DB_CATEGORY: Record<string, string> = {
  // Map normalizer category guesses to database category names
  "Food & Dining": "Food",
  "Supermarket": "Supermarket",
  "Transport": "Transport",
  "Fuel": "Fuel",
  "Bills & Subscriptions": "Bills",
  "Shopping": "Shopping",
  "Financial Services": "Financial Services",
  "Healthcare": "Health",
  "Education": "Education",
  "Housing": "Housing",
  "ATM & POS": "ATM",
  "Income": "Income",
  "Salary": "Salary",
  "Gift": "Gift",
  "Government": "Tax",
  "Entertainment": "Entertainment",
  "Subscription": "Subscription",
  "Insurance": "Insurance",
  "Transfer": "Transfer",
  "Others": "Others",
};

export function mapToDbCategory(normalizerGuess: string): string {
  return NORMALIZER_TO_DB_CATEGORY[normalizerGuess] || normalizerGuess;
}
