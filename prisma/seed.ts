import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_CATEGORIES = [
  // Food & Dining
  { name: "Food", icon: "🍔", color: "#F97316", parent: null },
  { name: "Groceries", icon: "🛒", color: "#F97316", parent: "Food" },
  { name: "Restaurants", icon: "🍽️", color: "#F97316", parent: "Food" },
  { name: "Street Food", icon: "🌮", color: "#F97316", parent: "Food" },
  { name: "Cafes", icon: "☕", color: "#F97316", parent: "Food" },
  { name: "Snacks", icon: "🍿", color: "#F97316", parent: "Food" },
  { name: "Fast Food", icon: "🍔", color: "#F97316", parent: "Food" },

  // Transport
  { name: "Transport", icon: "🚗", color: "#3B82F6", parent: null },
  { name: "Ride Hailing", icon: "🚕", color: "#3B82F6", parent: "Transport" },
  { name: "Fuel", icon: "⛽", color: "#3B82F6", parent: "Transport" },
  { name: "Public Transport", icon: "🚌", color: "#3B82F6", parent: "Transport" },
  { name: "Parking", icon: "🅿️", color: "#3B82F6", parent: "Transport" },
  { name: "Car Maintenance", icon: "🔧", color: "#3B82F6", parent: "Transport" },

  // Bills & Utilities
  { name: "Bills", icon: "💡", color: "#EAB308", parent: null },
  { name: "Electricity", icon: "⚡", color: "#EAB308", parent: "Bills" },
  { name: "Water", icon: "💧", color: "#EAB308", parent: "Bills" },
  { name: "Internet", icon: "🌐", color: "#EAB308", parent: "Bills" },
  { name: "Phone", icon: "📱", color: "#EAB308", parent: "Bills" },
  { name: "Cable TV", icon: "📺", color: "#EAB308", parent: "Bills" },

  // Income
  { name: "Income", icon: "💰", color: "#22C55E", parent: null },
  { name: "Salary", icon: "💵", color: "#22C55E", parent: "Income" },
  { name: "Bonus", icon: "🎁", color: "#22C55E", parent: "Income" },
  { name: "Allowance", icon: "💸", color: "#22C55E", parent: "Income" },
  { name: "Freelance", icon: "💻", color: "#22C55E", parent: "Income" },
  { name: "Refund", icon: "↩️", color: "#22C55E", parent: "Income" },
  { name: "Cashback", icon: "💳", color: "#22C55E", parent: "Income" },

  // Business
  { name: "Business", icon: "💼", color: "#8B5CF6", parent: null },
  { name: "Supplies", icon: "📦", color: "#8B5CF6", parent: "Business" },
  { name: "Equipment", icon: "🖥️", color: "#8B5CF6", parent: "Business" },
  { name: "Client Payment", icon: "🤝", color: "#8B5CF6", parent: "Business" },

  // Transfers
  { name: "Transfer", icon: "💸", color: "#EC4899", parent: null },
  { name: "Internal Transfer", icon: "🔄", color: "#EC4899", parent: "Transfer" },
  { name: "External Transfer", icon: "📤", color: "#EC4899", parent: "Transfer" },
  { name: "Self Transfer", icon: "🔁", color: "#EC4899", parent: "Transfer" },

  // Shopping
  { name: "Shopping", icon: "🛍️", color: "#F43F5E", parent: null },
  { name: "Supermarket", icon: "🛒", color: "#F43F5E", parent: "Shopping" },
  { name: "Online Shopping", icon: "📦", color: "#F43F5E", parent: "Shopping" },
  { name: "Clothing", icon: "👕", color: "#F43F5E", parent: "Shopping" },
  { name: "Electronics", icon: "📱", color: "#F43F5E", parent: "Shopping" },
  { name: "Home Goods", icon: "🏠", color: "#F43F5E", parent: "Shopping" },

  // Health
  { name: "Health", icon: "🏥", color: "#06B6D4", parent: null },
  { name: "Hospital", icon: "🏥", color: "#06B6D4", parent: "Health" },
  { name: "Pharmacy", icon: "💊", color: "#06B6D4", parent: "Health" },
  { name: "Lab", icon: "🧪", color: "#06B6D4", parent: "Health" },
  { name: "Dental", icon: "🦷", color: "#06B6D4", parent: "Health" },
  { name: "Therapy", icon: "💆", color: "#06B6D4", parent: "Health" },

  // Entertainment
  { name: "Entertainment", icon: "🎬", color: "#A855F7", parent: null },
  { name: "Streaming", icon: "📺", color: "#A855F7", parent: "Entertainment" },
  { name: "Gaming", icon: "🎮", color: "#A855F7", parent: "Entertainment" },
  { name: "Movies", icon: "🎥", color: "#A855F7", parent: "Entertainment" },
  { name: "Events", icon: "🎫", color: "#A855F7", parent: "Entertainment" },
  { name: "Books", icon: "📚", color: "#A855F7", parent: "Entertainment" },

  // Housing
  { name: "Housing", icon: "🏠", color: "#EF4444", parent: null },
  { name: "Rent", icon: "🔑", color: "#EF4444", parent: "Housing" },
  { name: "Maintenance", icon: "🔨", color: "#EF4444", parent: "Housing" },
  { name: "Agent Fee", icon: "🤝", color: "#EF4444", parent: "Housing" },

  // Education
  { name: "Education", icon: "📚", color: "#3B82F6", parent: null },
  { name: "Tuition", icon: "🎓", color: "#3B82F6", parent: "Education" },
  { name: "Books", icon: "📖", color: "#3B82F6", parent: "Education" },
  { name: "Courses", icon: "💻", color: "#3B82F6", parent: "Education" },
  { name: "Certification", icon: "📜", color: "#3B82F6", parent: "Education" },

  // Financial Services
  { name: "Financial Services", icon: "🏦", color: "#6366F1", parent: null },
  { name: "Bank Fees", icon: "📋", color: "#6366F1", parent: "Financial Services" },
  { name: "Loan Repayment", icon: "💳", color: "#6366F1", parent: "Financial Services" },
  { name: "Investment", icon: "📈", color: "#6366F1", parent: "Financial Services" },
  { name: "Insurance", icon: "🛡️", color: "#6366F1", parent: "Financial Services" },

  // ATM & POS
  { name: "ATM", icon: "🏧", color: "#6366F1", parent: null },
  { name: "POS", icon: "💳", color: "#8B5CF6", parent: null },

  // Savings
  { name: "Savings", icon: "🐷", color: "#22C55E", parent: null },

  // Tax
  { name: "Tax", icon: "🏛️", color: "#6B7280", parent: null },

  // Gift & Donations
  { name: "Gift", icon: "🎁", color: "#F43F5E", parent: null },
  { name: "Donation", icon: "🤲", color: "#F43F5E", parent: "Gift" },

  // Subscriptions
  { name: "Subscription", icon: "📱", color: "#8B5CF6", parent: null },

  // Travel
  { name: "Travel", icon: "✈️", color: "#3B82F6", parent: null },
  { name: "Flight", icon: "🛫", color: "#3B82F6", parent: "Travel" },
  { name: "Hotel", icon: "🏨", color: "#3B82F6", parent: "Travel" },
  { name: "Visa", icon: "📋", color: "#3B82F6", parent: "Travel" },

  // Utilities
  { name: "Utilities", icon: "🔧", color: "#6B7280", parent: null },

  // Family
  { name: "Family", icon: "👨‍👩‍👧‍👦", color: "#EC4899", parent: null },

  // Loan
  { name: "Loan", icon: "🏦", color: "#6366F1", parent: null },

  // Interest
  { name: "Interest", icon: "📊", color: "#10B981", parent: null },

  // Fees
  { name: "Fees", icon: "📋", color: "#F59E0B", parent: null },

  // Crypto
  { name: "Crypto", icon: "₿", color: "#F59E0B", parent: null },

  // Others
  { name: "Others", icon: "📁", color: "#6B7280", parent: null },
];

async function main() {
  console.log("Seeding categories...");

  // Create parent categories first
  const parentCategories = SYSTEM_CATEGORIES.filter(c => !c.parent);
  const childCategories = SYSTEM_CATEGORIES.filter(c => c.parent);

  const parentIdMap = new Map<string, string>();

  for (const cat of parentCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isSystem: true },
    });

    if (existing) {
      parentIdMap.set(cat.name, existing.id);
      console.log(`  Category "${cat.name}" already exists, skipping.`);
    } else {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
        },
      });
      parentIdMap.set(cat.name, created.id);
      console.log(`  Created parent category: ${cat.name}`);
    }
  }

  // Create child categories (subcategories)
  for (const cat of childCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isSystem: true },
    });

    if (existing) {
      console.log(`  Subcategory "${cat.name}" already exists, skipping.`);
    } else {
      await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
        },
      });
      console.log(`  Created subcategory: ${cat.name} (under ${cat.parent})`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
