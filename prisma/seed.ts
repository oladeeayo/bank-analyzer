import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

interface CatDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  parent?: string;
  children?: CatDef[];
}

const CATEGORY_TREE: CatDef[] = [
  // Income
  { id: "cat_income", name: "Income", icon: "💰", color: "#22C55E", children: [
    { id: "cat_salary", name: "Salary", icon: "💵", color: "#22C55E", children: [
      { id: "cat_basic_salary", name: "Basic Salary", icon: "💵", color: "#22C55E" },
      { id: "cat_bonus", name: "Bonus", icon: "🎁", color: "#22C55E" },
      { id: "cat_commission", name: "Commission", icon: "📊", color: "#22C55E" },
      { id: "cat_overtime", name: "Overtime", icon: "⏰", color: "#22C55E" },
      { id: "cat_leave_allowance", name: "Leave Allowance", icon: "🏖️", color: "#22C55E" },
      { id: "cat_performance_bonus", name: "Performance Bonus", icon: "🏆", color: "#22C55E" },
      { id: "cat_thirteenth_month", name: "Thirteenth Month", icon: "📅", color: "#22C55E" },
    ]},
    { id: "cat_business_income", name: "Business Income", icon: "💼", color: "#8B5CF6", children: [
      { id: "cat_sales", name: "Sales", icon: "🛒", color: "#8B5CF6" },
      { id: "cat_service_income", name: "Service Income", icon: "🔧", color: "#8B5CF6" },
      { id: "cat_consulting", name: "Consulting", icon: "💡", color: "#8B5CF6" },
      { id: "cat_freelancing", name: "Freelancing", icon: "💻", color: "#8B5CF6" },
      { id: "cat_agency_banking", name: "Agency Banking", icon: "🏦", color: "#8B5CF6" },
      { id: "cat_pos_commission", name: "POS Commission", icon: "💳", color: "#8B5CF6" },
      { id: "cat_affiliate_income", name: "Affiliate Income", icon: "🤝", color: "#8B5CF6" },
      { id: "cat_royalties", name: "Royalties", icon: "👑", color: "#8B5CF6" },
    ]},
    { id: "cat_investment_income", name: "Investment Income", icon: "📈", color: "#10B981", children: [
      { id: "cat_interest_income", name: "Interest", icon: "🏦", color: "#10B981" },
      { id: "cat_dividend", name: "Dividend", icon: "📊", color: "#10B981" },
      { id: "cat_stock_profit", name: "Stock Profit", icon: "📈", color: "#10B981" },
      { id: "cat_crypto_profit", name: "Crypto Profit", icon: "₿", color: "#10B981" },
      { id: "cat_staking_rewards", name: "Staking Rewards", icon: "🔒", color: "#10B981" },
      { id: "cat_capital_gains", name: "Capital Gains", icon: "💎", color: "#10B981" },
    ]},
    { id: "cat_rental_income", name: "Rental Income", icon: "🏠", color: "#EF4444", children: [
      { id: "cat_residential_rent", name: "Residential Rent", icon: "🏘️", color: "#EF4444" },
      { id: "cat_commercial_rent", name: "Commercial Rent", icon: "🏢", color: "#EF4444" },
      { id: "cat_equipment_rental", name: "Equipment Rental", icon: "🔧", color: "#EF4444" },
    ]},
    { id: "cat_transfers_in", name: "Transfers In", icon: "💸", color: "#EC4899", children: [
      { id: "cat_self_transfer_in", name: "Self Transfer", icon: "🔄", color: "#EC4899" },
      { id: "cat_family_transfer_in", name: "Family Transfer", icon: "👨‍👩‍👧‍👦", color: "#EC4899" },
      { id: "cat_friends_transfer_in", name: "Friends Transfer", icon: "🤝", color: "#EC4899" },
    ]},
    { id: "cat_refunds", name: "Refunds", icon: "↩️", color: "#22C55E", children: [
      { id: "cat_merchant_refund", name: "Merchant Refund", icon: "🏪", color: "#22C55E" },
      { id: "cat_bank_reversal", name: "Bank Reversal", icon: "🏦", color: "#22C55E" },
      { id: "cat_tax_refund", name: "Tax Refund", icon: "🏛️", color: "#22C55E" },
    ]},
    { id: "cat_gifts_received", name: "Gifts Received", icon: "🎁", color: "#F43F5E", children: [
      { id: "cat_cash_gift", name: "Cash Gift", icon: "💵", color: "#F43F5E" },
      { id: "cat_birthday_gift", name: "Birthday Gift", icon: "🎂", color: "#F43F5E" },
      { id: "cat_donation_received", name: "Donation Received", icon: "🤲", color: "#F43F5E" },
    ]},
    { id: "cat_loans_received", name: "Loans Received", icon: "🏦", color: "#6366F1", children: [
      { id: "cat_personal_loan_in", name: "Personal Loan", icon: "👤", color: "#6366F1" },
      { id: "cat_business_loan_in", name: "Business Loan", icon: "💼", color: "#6366F1" },
    ]},
    { id: "cat_other_income", name: "Other Income", icon: "📁", color: "#6B7280", children: [
      { id: "cat_cashback_income", name: "Cashback", icon: "💳", color: "#22C55E" },
      { id: "cat_unknown_credit", name: "Unknown Credit", icon: "❓", color: "#6B7280" },
    ]},
  ]},

  // Food & Dining
  { id: "cat_food", name: "Food & Dining", icon: "🍔", color: "#F97316", children: [
    { id: "cat_groceries", name: "Groceries", icon: "🛒", color: "#F97316", children: [
      { id: "cat_supermarket_groceries", name: "Supermarket", icon: "🏪", color: "#F97316" },
      { id: "cat_local_market", name: "Local Market", icon: "🥬", color: "#F97316" },
      { id: "cat_fruits", name: "Fruits", icon: "🍎", color: "#F97316" },
      { id: "cat_meat", name: "Meat", icon: "🥩", color: "#F97316" },
      { id: "cat_dairy", name: "Dairy", icon: "🥛", color: "#F97316" },
      { id: "cat_rice_grains", name: "Rice & Grains", icon: "🍚", color: "#F97316" },
    ]},
    { id: "cat_restaurants", name: "Restaurants", icon: "🍽️", color: "#F97316", children: [
      { id: "cat_fast_food_restaurant", name: "Fast Food", icon: "🍔", color: "#F97316" },
      { id: "cat_casual_dining", name: "Casual Dining", icon: "🍽️", color: "#F97316" },
      { id: "cat_fine_dining", name: "Fine Dining", icon: "🥂", color: "#F97316" },
      { id: "cat_local_restaurant", name: "Local Restaurant", icon: "🍲", color: "#F97316" },
    ]},
    { id: "cat_street_food", name: "Street Food", icon: "🌮", color: "#F97316", children: [
      { id: "cat_buka", name: "Buka", icon: "🍲", color: "#F97316" },
      { id: "cat_suya", name: "Suya", icon: "🍢", color: "#F97316" },
      { id: "cat_shawarma", name: "Shawarma", icon: "🌯", color: "#F97316" },
    ]},
    { id: "cat_drinks", name: "Drinks", icon: "🥤", color: "#F97316", children: [
      { id: "cat_soft_drinks", name: "Soft Drinks", icon: "🥤", color: "#F97316" },
      { id: "cat_coffee", name: "Coffee", icon: "☕", color: "#F97316" },
      { id: "cat_alcohol", name: "Alcohol", icon: "🍺", color: "#F97316" },
    ]},
    { id: "cat_food_delivery", name: "Food Delivery", icon: "🛵", color: "#F97316" },
    { id: "cat_other_food", name: "Other Food", icon: "📁", color: "#F97316" },
  ]},

  // Transportation
  { id: "cat_transport", name: "Transportation", icon: "🚗", color: "#3B82F6", children: [
    { id: "cat_public_transport", name: "Public Transport", icon: "🚌", color: "#3B82F6", children: [
      { id: "cat_brt", name: "BRT", icon: "🚌", color: "#3B82F6" },
      { id: "cat_danfo", name: "Danfo", icon: "🚐", color: "#3B82F6" },
      { id: "cat_keke", name: "Keke", icon: "🛺", color: "#3B82F6" },
      { id: "cat_okada", name: "Okada", icon: "🏍️", color: "#3B82F6" },
    ]},
    { id: "cat_ride_hailing", name: "Ride Hailing", icon: "🚕", color: "#3B82F6" },
    { id: "cat_fuel", name: "Fuel", icon: "⛽", color: "#F59E0B", children: [
      { id: "cat_petrol", name: "Petrol", icon: "⛽", color: "#F59E0B" },
      { id: "cat_diesel", name: "Diesel", icon: "⛽", color: "#F59E0B" },
      { id: "cat_gas_fuel", name: "Gas", icon: "🔥", color: "#F59E0B" },
    ]},
    { id: "cat_parking", name: "Parking", icon: "🅿️", color: "#3B82F6" },
    { id: "cat_vehicle_maintenance", name: "Vehicle Maintenance", icon: "🔧", color: "#3B82F6", children: [
      { id: "cat_servicing", name: "Servicing", icon: "🔧", color: "#3B82F6" },
      { id: "cat_tyres", name: "Tyres", icon: "🛞", color: "#3B82F6" },
      { id: "cat_car_wash", name: "Car Wash", icon: "🚿", color: "#3B82F6" },
    ]},
    { id: "cat_other_transport", name: "Other Transport", icon: "📁", color: "#3B82F6" },
  ]},

  // Housing
  { id: "cat_housing", name: "Housing", icon: "🏠", color: "#EF4444", children: [
    { id: "cat_rent", name: "Rent", icon: "🔑", color: "#EF4444" },
    { id: "cat_mortgage", name: "Mortgage", icon: "🏦", color: "#EF4444" },
    { id: "cat_electricity_housing", name: "Electricity", icon: "⚡", color: "#EAB308" },
    { id: "cat_water_housing", name: "Water", icon: "💧", color: "#3B82F6" },
    { id: "cat_cooking_gas", name: "Cooking Gas", icon: "🔥", color: "#F59E0B" },
    { id: "cat_estate_levy", name: "Estate Levy", icon: "🏘️", color: "#6B7280" },
    { id: "cat_repairs", name: "Repairs", icon: "🔨", color: "#F59E0B", children: [
      { id: "cat_plumbing", name: "Plumbing", icon: "🔧", color: "#3B82F6" },
      { id: "cat_electrical_repair", name: "Electrical", icon: "⚡", color: "#EAB308" },
      { id: "cat_painting", name: "Painting", icon: "🎨", color: "#F43F5E" },
      { id: "cat_ac_repair", name: "Air Conditioner", icon: "❄️", color: "#06B6D4" },
    ]},
    { id: "cat_home_improvement", name: "Home Improvement", icon: "🏡", color: "#22C55E" },
  ]},

  // Utilities
  { id: "cat_utilities", name: "Utilities", icon: "🔧", color: "#6B7280", children: [
    { id: "cat_airtime", name: "Airtime", icon: "📱", color: "#EAB308", children: [
      { id: "cat_mtn_airtime", name: "MTN", icon: "📱", color: "#FFCC00" },
      { id: "cat_airtel_airtime", name: "Airtel", icon: "📱", color: "#FF0000" },
      { id: "cat_glo_airtime", name: "Glo", icon: "📱", color: "#00A651" },
      { id: "cat_9mobile_airtime", name: "9mobile", icon: "📱", color: "#006B3F" },
    ]},
    { id: "cat_data", name: "Data", icon: "📶", color: "#3B82F6" },
    { id: "cat_internet_util", name: "Internet", icon: "🌐", color: "#3B82F6" },
    { id: "cat_cable_tv", name: "Cable TV", icon: "📺", color: "#8B5CF6" },
    { id: "cat_electricity_bill", name: "Electricity Bill", icon: "⚡", color: "#EAB308" },
    { id: "cat_software_sub", name: "Software Subscription", icon: "💻", color: "#8B5CF6" },
    { id: "cat_other_utilities", name: "Other Utilities", icon: "📁", color: "#6B7280" },
  ]},

  // Shopping
  { id: "cat_shopping", name: "Shopping", icon: "🛍️", color: "#F43F5E", children: [
    { id: "cat_clothing", name: "Clothing", icon: "👕", color: "#F43F5E" },
    { id: "cat_shoes", name: "Shoes", icon: "👟", color: "#F43F5E" },
    { id: "cat_electronics", name: "Electronics", icon: "📱", color: "#3B82F6" },
    { id: "cat_phones", name: "Phones", icon: "📱", color: "#3B82F6" },
    { id: "cat_computers", name: "Computers", icon: "💻", color: "#3B82F6" },
    { id: "cat_online_shopping", name: "Online Shopping", icon: "📦", color: "#3B82F6" },
    { id: "cat_other_shopping", name: "Other Shopping", icon: "📁", color: "#F43F5E" },
  ]},

  // Healthcare
  { id: "cat_healthcare", name: "Healthcare", icon: "🏥", color: "#06B6D4", children: [
    { id: "cat_hospital", name: "Hospital", icon: "🏥", color: "#06B6D4" },
    { id: "cat_pharmacy", name: "Pharmacy", icon: "💊", color: "#06B6D4" },
    { id: "cat_dental", name: "Dental", icon: "🦷", color: "#06B6D4" },
    { id: "cat_gym", name: "Gym", icon: "🏋️", color: "#06B6D4" },
    { id: "cat_other_healthcare", name: "Other Healthcare", icon: "📁", color: "#06B6D4" },
  ]},

  // Education
  { id: "cat_education", name: "Education", icon: "📚", color: "#3B82F6", children: [
    { id: "cat_tuition", name: "Tuition", icon: "🎓", color: "#3B82F6" },
    { id: "cat_school_fees", name: "School Fees", icon: "🏫", color: "#3B82F6" },
    { id: "cat_online_courses", name: "Online Courses", icon: "💻", color: "#8B5CF6" },
    { id: "cat_certification", name: "Certification", icon: "📜", color: "#F59E0B" },
    { id: "cat_other_education", name: "Other Education", icon: "📁", color: "#3B82F6" },
  ]},

  // Entertainment
  { id: "cat_entertainment", name: "Entertainment", icon: "🎬", color: "#A855F7", children: [
    { id: "cat_movies", name: "Movies", icon: "🎥", color: "#A855F7" },
    { id: "cat_streaming", name: "Streaming", icon: "📺", color: "#A855F7" },
    { id: "cat_music", name: "Music", icon: "🎵", color: "#A855F7" },
    { id: "cat_gaming", name: "Gaming", icon: "🎮", color: "#A855F7" },
    { id: "cat_nightlife", name: "Nightlife", icon: "🌙", color: "#A855F7" },
    { id: "cat_other_entertainment", name: "Other Entertainment", icon: "📁", color: "#A855F7" },
  ]},

  // Travel
  { id: "cat_travel", name: "Travel", icon: "✈️", color: "#3B82F6", children: [
    { id: "cat_hotels", name: "Hotels", icon: "🏨", color: "#3B82F6" },
    { id: "cat_flights_travel", name: "Flights", icon: "✈️", color: "#3B82F6" },
    { id: "cat_visa", name: "Visa", icon: "📋", color: "#6B7280" },
    { id: "cat_vacation", name: "Vacation", icon: "🏖️", color: "#F59E0B" },
    { id: "cat_other_travel", name: "Other Travel", icon: "📁", color: "#3B82F6" },
  ]},

  // Personal Care
  { id: "cat_personal_care", name: "Personal Care", icon: "💆", color: "#EC4899", children: [
    { id: "cat_haircut", name: "Haircut", icon: "✂️", color: "#EC4899" },
    { id: "cat_salon", name: "Salon", icon: "💇", color: "#EC4899" },
    { id: "cat_barber", name: "Barber", icon: "💈", color: "#EC4899" },
    { id: "cat_laundry", name: "Laundry", icon: "👔", color: "#3B82F6" },
    { id: "cat_other_personal_care", name: "Other Personal Care", icon: "📁", color: "#EC4899" },
  ]},

  // Insurance
  { id: "cat_insurance", name: "Insurance", icon: "🛡️", color: "#06B6D4", children: [
    { id: "cat_health_insurance", name: "Health Insurance", icon: "🏥", color: "#06B6D4" },
    { id: "cat_vehicle_insurance", name: "Vehicle Insurance", icon: "🚗", color: "#3B82F6" },
    { id: "cat_home_insurance", name: "Home Insurance", icon: "🏠", color: "#EF4444" },
    { id: "cat_other_insurance", name: "Other Insurance", icon: "📁", color: "#06B6D4" },
  ]},

  // Religious & Charity
  { id: "cat_religious_charity", name: "Religious & Charity", icon: "🙏", color: "#F59E0B", children: [
    { id: "cat_tithe", name: "Tithe", icon: "⛪", color: "#F59E0B" },
    { id: "cat_offering", name: "Offering", icon: "🤲", color: "#F59E0B" },
    { id: "cat_charity", name: "Charity", icon: "🤲", color: "#F43F5E" },
    { id: "cat_other_giving", name: "Other Giving", icon: "📁", color: "#F59E0B" },
  ]},

  // Government & Taxes
  { id: "cat_government_taxes", name: "Government & Taxes", icon: "🏛️", color: "#6B7280", children: [
    { id: "cat_income_tax", name: "Income Tax", icon: "💰", color: "#6B7280" },
    { id: "cat_property_tax", name: "Property Tax", icon: "🏠", color: "#6B7280" },
    { id: "cat_passport_gov", name: "Passport", icon: "📘", color: "#3B82F6" },
    { id: "cat_drivers_license", name: "Driver License", icon: "🚗", color: "#3B82F6" },
    { id: "cat_other_gov_fees", name: "Other Government Fees", icon: "📁", color: "#6B7280" },
  ]},

  // Banking & Financial
  { id: "cat_banking_fees", name: "Banking & Financial", icon: "🏦", color: "#6366F1", children: [
    { id: "cat_bank_transfer", name: "Bank Transfer", icon: "💸", color: "#6366F1" },
    { id: "cat_self_transfer", name: "Self Transfer", icon: "🔄", color: "#6366F1" },
    { id: "cat_atm_withdrawal", name: "ATM Withdrawal", icon: "🏧", color: "#6366F1" },
    { id: "cat_pos_purchase", name: "POS Purchase", icon: "💳", color: "#8B5CF6" },
    { id: "cat_transfer_charges", name: "Transfer Charges", icon: "💸", color: "#F59E0B" },
    { id: "cat_bank_fees", name: "Bank Fees", icon: "🏦", color: "#6B7280" },
    { id: "cat_sms_charges", name: "SMS Alert Charges", icon: "📱", color: "#6B7280" },
    { id: "cat_stamp_duty", name: "Stamp Duty", icon: "📋", color: "#6B7280" },
    { id: "cat_vat", name: "VAT", icon: "🏛️", color: "#6B7280" },
    { id: "cat_other_banking_fees", name: "Other Banking Fees", icon: "📁", color: "#6B7280" },
  ]},

  // Family
  { id: "cat_family", name: "Family", icon: "👨‍👩‍👧‍👦", color: "#EC4899", children: [
    { id: "cat_parents", name: "Parents", icon: "👴", color: "#EC4899" },
    { id: "cat_spouse", name: "Spouse", icon: "💑", color: "#EC4899" },
    { id: "cat_children", name: "Children", icon: "👶", color: "#EC4899" },
    { id: "cat_family_support", name: "Family Support", icon: "🤝", color: "#EC4899" },
    { id: "cat_other_family", name: "Other Family", icon: "📁", color: "#EC4899" },
  ]},

  // Savings & Investments
  { id: "cat_savings_investments", name: "Savings & Investments", icon: "📈", color: "#10B981", children: [
    { id: "cat_savings", name: "Savings", icon: "🐷", color: "#22C55E" },
    { id: "cat_emergency_fund", name: "Emergency Fund", icon: "🚨", color: "#EF4444" },
    { id: "cat_stocks", name: "Stocks", icon: "📈", color: "#10B981" },
    { id: "cat_cryptocurrency_inv", name: "Cryptocurrency", icon: "₿", color: "#F59E0B" },
    { id: "cat_other_investments", name: "Other Investments", icon: "📁", color: "#10B981" },
  ]},

  // Loans & Debt
  { id: "cat_loans_debt", name: "Loans & Debt", icon: "🏦", color: "#6366F1", children: [
    { id: "cat_loan_repayment", name: "Loan Repayment", icon: "💳", color: "#6366F1" },
    { id: "cat_credit_card_payment", name: "Credit Card Payment", icon: "💳", color: "#EF4444" },
    { id: "cat_mortgage_payment", name: "Mortgage Payment", icon: "🏠", color: "#EF4444" },
    { id: "cat_other_debt", name: "Other Debt", icon: "📁", color: "#6366F1" },
  ]},

  // Fees & Charges
  { id: "cat_fees_charges", name: "Fees & Charges", icon: "📋", color: "#F59E0B", children: [
    { id: "cat_service_fee", name: "Service Fee", icon: "🔧", color: "#F59E0B" },
    { id: "cat_processing_fee", name: "Processing Fee", icon: "⚙️", color: "#F59E0B" },
    { id: "cat_penalty", name: "Penalty", icon: "⚠️", color: "#EF4444" },
    { id: "cat_fine", name: "Fine", icon: "🚨", color: "#EF4444" },
    { id: "cat_other_charges", name: "Other Charges", icon: "📁", color: "#F59E0B" },
  ]},

  // Transfers
  { id: "cat_transfers", name: "Transfers", icon: "💸", color: "#EC4899", children: [
    { id: "cat_self_transfer_out", name: "Self Transfer", icon: "🔄", color: "#EC4899" },
    { id: "cat_family_transfer_out", name: "Family Transfer", icon: "👨‍👩‍👧‍👦", color: "#EC4899" },
    { id: "cat_friend_transfer", name: "Friend Transfer", icon: "🤝", color: "#EC4899" },
    { id: "cat_business_transfer", name: "Business Transfer", icon: "💼", color: "#EC4899" },
    { id: "cat_other_transfers", name: "Other Transfers", icon: "📁", color: "#EC4899" },
  ]},

  // Cryptocurrency
  { id: "cat_crypto", name: "Cryptocurrency", icon: "₿", color: "#F59E0B", children: [
    { id: "cat_buy_crypto", name: "Buy Crypto", icon: "📈", color: "#22C55E" },
    { id: "cat_sell_crypto", name: "Sell Crypto", icon: "📉", color: "#EF4444" },
    { id: "cat_wallet_transfer", name: "Wallet Transfer", icon: "💸", color: "#F59E0B" },
    { id: "cat_gas_fees", name: "Gas Fees", icon: "⛽", color: "#F59E0B" },
    { id: "cat_other_crypto", name: "Other Crypto", icon: "📁", color: "#F59E0B" },
  ]},

  // Miscellaneous
  { id: "cat_miscellaneous", name: "Miscellaneous", icon: "📁", color: "#6B7280", children: [
    { id: "cat_uncategorized", name: "Uncategorized", icon: "❓", color: "#6B7280" },
    { id: "cat_unknown_debit", name: "Unknown Debit", icon: "❓", color: "#EF4444" },
    { id: "cat_pending_transaction", name: "Pending Transaction", icon: "⏳", color: "#F59E0B" },
    { id: "cat_other_misc", name: "Other", icon: "📁", color: "#6B7280" },
  ]},
];

async function main() {
  console.log("Seeding categories...");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  async function createCategory(cat: CatDef, parentId: string | null = null) {
    const existing = await prisma.category.findUnique({ where: { id: cat.id } });
    if (existing) {
      console.log(`  ${cat.name} exists, skipping.`);
      return;
    }

    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
        parentId: parentId,
      },
    });
    console.log(`  Created: ${cat.name}${parentId ? ` (under ${parentId})` : ""}`);

    if (cat.children) {
      for (const child of cat.children) {
        await createCategory(child, cat.id);
      }
    }
  }

  for (const cat of CATEGORY_TREE) {
    await createCategory(cat);
  }

  console.log("Seeding complete!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
