-- Full category tree with subcategories
-- Run this in Neon SQL Editor

-- Income (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_income', 'Income', '💰', '#22C55E', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Salary
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_salary', 'Salary', '💵', '#22C55E', true, 'cat_income', NOW()),
('cat_basic_salary', 'Basic Salary', '💵', '#22C55E', true, 'cat_salary', NOW()),
('cat_bonus', 'Bonus', '🎁', '#22C55E', true, 'cat_salary', NOW()),
('cat_commission', 'Commission', '📊', '#22C55E', true, 'cat_salary', NOW()),
('cat_overtime', 'Overtime', '⏰', '#22C55E', true, 'cat_salary', NOW()),
('cat_leave_allowance', 'Leave Allowance', '🏖️', '#22C55E', true, 'cat_salary', NOW()),
('cat_performance_bonus', 'Performance Bonus', '🏆', '#22C55E', true, 'cat_salary', NOW()),
('cat_thirteenth_month', 'Thirteenth Month', '📅', '#22C55E', true, 'cat_salary', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Business
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_business_income', 'Business Income', '💼', '#8B5CF6', true, 'cat_income', NOW()),
('cat_sales', 'Sales', '🛒', '#8B5CF6', true, 'cat_business_income', NOW()),
('cat_service_income', 'Service Income', '🔧', '#8B5CF6', true, 'cat_business_income', NOW()),
('cat_consulting', 'Consulting', '💡', '#8B5CF6', true, 'cat_business_income', NOW()),
('cat_freelancing', 'Freelancing', '💻', '#8B5CF6', true, 'cat_business_income', NOW()),
('cat_agency_banking', 'Agency Banking', '🏦', '#8B5CF6', true, 'cat_business_income', NOW()),
('cat_pos_commission', 'POS Commission', '💳', '#8B5CF6', true, 'cat_business_income', NOW()),
('cat_affiliate_income', 'Affiliate Income', '🤝', '#8B5CF6', true, 'cat_business_income', NOW()),
('cat_royalties', 'Royalties', '👑', '#8B5CF6', true, 'cat_business_income', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Investment
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_investment_income', 'Investment Income', '📈', '#10B981', true, 'cat_income', NOW()),
('cat_interest_income', 'Interest', '🏦', '#10B981', true, 'cat_investment_income', NOW()),
('cat_dividend', 'Dividend', '📊', '#10B981', true, 'cat_investment_income', NOW()),
('cat_mutual_funds_income', 'Mutual Funds', '📈', '#10B981', true, 'cat_investment_income', NOW()),
('cat_treasury_bills_income', 'Treasury Bills', '🏛️', '#10B981', true, 'cat_investment_income', NOW()),
('cat_bonds_income', 'Bonds', '📜', '#10B981', true, 'cat_investment_income', NOW()),
('cat_stock_profit', 'Stock Profit', '📈', '#10B981', true, 'cat_investment_income', NOW()),
('cat_real_estate_income', 'Real Estate Income', '🏠', '#10B981', true, 'cat_investment_income', NOW()),
('cat_crypto_profit', 'Crypto Profit', '₿', '#10B981', true, 'cat_investment_income', NOW()),
('cat_staking_rewards', 'Staking Rewards', '🔒', '#10B981', true, 'cat_investment_income', NOW()),
('cat_capital_gains', 'Capital Gains', '💎', '#10B981', true, 'cat_investment_income', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Rental
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_rental_income', 'Rental Income', '🏠', '#EF4444', true, 'cat_income', NOW()),
('cat_residential_rent', 'Residential Rent', '🏘️', '#EF4444', true, 'cat_rental_income', NOW()),
('cat_commercial_rent', 'Commercial Rent', '🏢', '#EF4444', true, 'cat_rental_income', NOW()),
('cat_equipment_rental', 'Equipment Rental', '🔧', '#EF4444', true, 'cat_rental_income', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Transfers In
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_transfers_in', 'Transfers In', '💸', '#EC4899', true, 'cat_income', NOW()),
('cat_self_transfer_in', 'Self Transfer', '🔄', '#EC4899', true, 'cat_transfers_in', NOW()),
('cat_family_transfer_in', 'Family Transfer', '👨‍👩‍👧‍👦', '#EC4899', true, 'cat_transfers_in', NOW()),
('cat_friends_transfer_in', 'Friends Transfer', '🤝', '#EC4899', true, 'cat_transfers_in', NOW()),
('cat_employer_transfer', 'Employer Transfer', '💼', '#EC4899', true, 'cat_transfers_in', NOW()),
('cat_business_partner_transfer', 'Business Partner', '🤝', '#EC4899', true, 'cat_transfers_in', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Refunds
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_refunds', 'Refunds', '↩️', '#22C55E', true, 'cat_income', NOW()),
('cat_merchant_refund', 'Merchant Refund', '🏪', '#22C55E', true, 'cat_refunds', NOW()),
('cat_bank_reversal', 'Bank Reversal', '🏦', '#22C55E', true, 'cat_refunds', NOW()),
('cat_chargeback_income', 'Chargeback', '💳', '#22C55E', true, 'cat_refunds', NOW()),
('cat_tax_refund', 'Tax Refund', '🏛️', '#22C55E', true, 'cat_refunds', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Gifts
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_gifts_received', 'Gifts Received', '🎁', '#F43F5E', true, 'cat_income', NOW()),
('cat_cash_gift', 'Cash Gift', '💵', '#F43F5E', true, 'cat_gifts_received', NOW()),
('cat_birthday_gift', 'Birthday Gift', '🎂', '#F43F5E', true, 'cat_gifts_received', NOW()),
('cat_wedding_gift', 'Wedding Gift', '💒', '#F43F5E', true, 'cat_gifts_received', NOW()),
('cat_family_support_in', 'Family Support', '👨‍👩‍👧‍👦', '#F43F5E', true, 'cat_gifts_received', NOW()),
('cat_donation_received', 'Donation Received', '🤲', '#F43F5E', true, 'cat_gifts_received', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Loans Received
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_loans_received', 'Loans Received', '🏦', '#6366F1', true, 'cat_income', NOW()),
('cat_personal_loan_in', 'Personal Loan', '👤', '#6366F1', true, 'cat_loans_received', NOW()),
('cat_cooperative_loan_in', 'Cooperative Loan', '🤝', '#6366F1', true, 'cat_loans_received', NOW()),
('cat_business_loan_in', 'Business Loan', '💼', '#6366F1', true, 'cat_loans_received', NOW()),
('cat_mortgage_loan_in', 'Mortgage Loan', '🏠', '#6366F1', true, 'cat_loans_received', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Government
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_government_income', 'Government Income', '🏛️', '#6B7280', true, 'cat_income', NOW()),
('cat_pension', 'Pension', '👴', '#6B7280', true, 'cat_government_income', NOW()),
('cat_scholarship', 'Scholarship', '🎓', '#6B7280', true, 'cat_government_income', NOW()),
('cat_grant', 'Grant', '📝', '#6B7280', true, 'cat_government_income', NOW()),
('cat_welfare', 'Welfare', '🤲', '#6B7280', true, 'cat_government_income', NOW()),
('cat_benefits', 'Benefits', '🎁', '#6B7280', true, 'cat_government_income', NOW())
ON CONFLICT (id) DO NOTHING;

-- Income > Other
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_other_income', 'Other Income', '📁', '#6B7280', true, 'cat_income', NOW()),
('cat_cashback_income', 'Cashback', '💳', '#22C55E', true, 'cat_other_income', NOW()),
('cat_lottery', 'Lottery', '🎰', '#22C55E', true, 'cat_other_income', NOW()),
('cat_unknown_credit', 'Unknown Credit', '❓', '#6B7280', true, 'cat_other_income', NOW())
ON CONFLICT (id) DO NOTHING;

-- Food & Dining (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_food', 'Food & Dining', '🍔', '#F97316', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Food > Groceries
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_groceries', 'Groceries', '🛒', '#F97316', true, 'cat_food', NOW()),
('cat_supermarket_groceries', 'Supermarket', '🏪', '#F97316', true, 'cat_groceries', NOW()),
('cat_local_market', 'Local Market', '🥬', '#F97316', true, 'cat_groceries', NOW()),
('cat_fruits', 'Fruits', '🍎', '#F97316', true, 'cat_groceries', NOW()),
('cat_vegetables', 'Vegetables', '🥦', '#F97316', true, 'cat_groceries', NOW()),
('cat_meat', 'Meat', '🥩', '#F97316', true, 'cat_groceries', NOW()),
('cat_fish', 'Fish', '🐟', '#F97316', true, 'cat_groceries', NOW()),
('cat_poultry', 'Poultry', '🍗', '#F97316', true, 'cat_groceries', NOW()),
('cat_frozen_foods', 'Frozen Foods', '🧊', '#F97316', true, 'cat_groceries', NOW()),
('cat_dairy', 'Dairy', '🥛', '#F97316', true, 'cat_groceries', NOW()),
('cat_bread_bakery', 'Bread & Bakery', '🍞', '#F97316', true, 'cat_groceries', NOW()),
('cat_rice_grains', 'Rice & Grains', '🍚', '#F97316', true, 'cat_groceries', NOW()),
('cat_spices', 'Spices', '🧂', '#F97316', true, 'cat_groceries', NOW()),
('cat_household_food', 'Household Food', '🏠', '#F97316', true, 'cat_groceries', NOW())
ON CONFLICT (id) DO NOTHING;

-- Food > Restaurants
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_restaurants', 'Restaurants', '🍽️', '#F97316', true, 'cat_food', NOW()),
('cat_fast_food_restaurant', 'Fast Food', '🍔', '#F97316', true, 'cat_restaurants', NOW()),
('cat_casual_dining', 'Casual Dining', '🍽️', '#F97316', true, 'cat_restaurants', NOW()),
('cat_fine_dining', 'Fine Dining', '🥂', '#F97316', true, 'cat_restaurants', NOW()),
('cat_buffet', 'Buffet', '🥘', '#F97316', true, 'cat_restaurants', NOW()),
('cat_local_restaurant', 'Local Restaurant', '🍲', '#F97316', true, 'cat_restaurants', NOW())
ON CONFLICT (id) DO NOTHING;

-- Food > Street Food
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_street_food', 'Street Food', '🌮', '#F97316', true, 'cat_food', NOW()),
('cat_buka', 'Buka', '🍲', '#F97316', true, 'cat_street_food', NOW()),
('cat_suya', 'Suya', '🍢', '#F97316', true, 'cat_street_food', NOW()),
('cat_shawarma', 'Shawarma', '🌯', '#F97316', true, 'cat_street_food', NOW()),
('cat_akara', 'Akara', '🫘', '#F97316', true, 'cat_street_food', NOW()),
('cat_moi_moi', 'Moi Moi', '🫘', '#F97316', true, 'cat_street_food', NOW()),
('cat_roasted_corn', 'Roasted Corn', '🌽', '#F97316', true, 'cat_street_food', NOW())
ON CONFLICT (id) DO NOTHING;

-- Food > Drinks
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_drinks', 'Drinks', '🥤', '#F97316', true, 'cat_food', NOW()),
('cat_soft_drinks', 'Soft Drinks', '🥤', '#F97316', true, 'cat_drinks', NOW()),
('cat_juice', 'Juice', '🧃', '#F97316', true, 'cat_drinks', NOW()),
('cat_water_drink', 'Water', '💧', '#F97316', true, 'cat_drinks', NOW()),
('cat_coffee', 'Coffee', '☕', '#F97316', true, 'cat_drinks', NOW()),
('cat_tea', 'Tea', '🍵', '#F97316', true, 'cat_drinks', NOW()),
('cat_smoothies', 'Smoothies', '🥤', '#F97316', true, 'cat_drinks', NOW()),
('cat_alcohol', 'Alcohol', '🍺', '#F97316', true, 'cat_drinks', NOW())
ON CONFLICT (id) DO NOTHING;

-- Food > Other
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_food_delivery', 'Food Delivery', '🛵', '#F97316', true, 'cat_food', NOW()),
('cat_catering', 'Catering', '🍽️', '#F97316', true, 'cat_food', NOW()),
('cat_other_food', 'Other Food', '📁', '#F97316', true, 'cat_food', NOW())
ON CONFLICT (id) DO NOTHING;

-- Transportation (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_transport', 'Transportation', '🚗', '#3B82F6', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Transport > Public Transport
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_public_transport', 'Public Transport', '🚌', '#3B82F6', true, 'cat_transport', NOW()),
('cat_bus', 'Bus', '🚌', '#3B82F6', true, 'cat_public_transport', NOW()),
('cat_brt', 'BRT', '🚌', '#3B82F6', true, 'cat_public_transport', NOW()),
('cat_danfo', 'Danfo', '🚐', '#3B82F6', true, 'cat_public_transport', NOW()),
('cat_keke', 'Keke', '🛺', '#3B82F6', true, 'cat_public_transport', NOW()),
('cat_okada', 'Okada', '🏍️', '#3B82F6', true, 'cat_public_transport', NOW()),
('cat_taxi_transport', 'Taxi', '🚕', '#3B82F6', true, 'cat_public_transport', NOW()),
('cat_train', 'Train', '🚆', '#3B82F6', true, 'cat_public_transport', NOW()),
('cat_ferry', 'Ferry', '⛴️', '#3B82F6', true, 'cat_public_transport', NOW())
ON CONFLICT (id) DO NOTHING;

-- Transport > Ride Hailing
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_ride_hailing', 'Ride Hailing', '🚕', '#3B82F6', true, 'cat_transport', NOW())
ON CONFLICT (id) DO NOTHING;

-- Transport > Flights
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_flights', 'Flights', '✈️', '#3B82F6', true, 'cat_transport', NOW()),
('cat_domestic_flight', 'Domestic', '✈️', '#3B82F6', true, 'cat_flights', NOW()),
('cat_international_flight', 'International', '🌍', '#3B82F6', true, 'cat_flights', NOW())
ON CONFLICT (id) DO NOTHING;

-- Transport > Fuel
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_fuel', 'Fuel', '⛽', '#F59E0B', true, 'cat_transport', NOW()),
('cat_petrol', 'Petrol', '⛽', '#F59E0B', true, 'cat_fuel', NOW()),
('cat_diesel', 'Diesel', '⛽', '#F59E0B', true, 'cat_fuel', NOW()),
('cat_gas_fuel', 'Gas', '🔥', '#F59E0B', true, 'cat_fuel', NOW()),
('cat_ev_charging', 'EV Charging', '🔌', '#F59E0B', true, 'cat_fuel', NOW())
ON CONFLICT (id) DO NOTHING;

-- Transport > Other
INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_parking', 'Parking', '🅿️', '#3B82F6', true, 'cat_transport', NOW()),
('cat_toll_gate', 'Toll Gate', '🚧', '#3B82F6', true, 'cat_transport', NOW()),
('cat_vehicle_maintenance', 'Vehicle Maintenance', '🔧', '#3B82F6', true, 'cat_transport', NOW()),
('cat_servicing', 'Servicing', '🔧', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_engine_repair', 'Engine Repair', '🔩', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_tyres', 'Tyres', '🛞', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_oil_change', 'Oil Change', '🛢️', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_car_wash', 'Car Wash', '🚿', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_battery', 'Battery', '🔋', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_spare_parts', 'Spare Parts', '🔩', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_accessories_transport', 'Accessories', '🎯', '#3B82F6', true, 'cat_vehicle_maintenance', NOW()),
('cat_vehicle_registration', 'Vehicle Registration', '📋', '#3B82F6', true, 'cat_transport', NOW()),
('cat_vehicle_insurance', 'Vehicle Insurance', '🛡️', '#3B82F6', true, 'cat_transport', NOW()),
('cat_other_transport', 'Other Transport', '📁', '#3B82F6', true, 'cat_transport', NOW())
ON CONFLICT (id) DO NOTHING;

-- Housing (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_housing', 'Housing', '🏠', '#EF4444', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_rent', 'Rent', '🔑', '#EF4444', true, 'cat_housing', NOW()),
('cat_mortgage', 'Mortgage', '🏦', '#EF4444', true, 'cat_housing', NOW()),
('cat_electricity_housing', 'Electricity', '⚡', '#EAB308', true, 'cat_housing', NOW()),
('cat_water_housing', 'Water', '💧', '#3B82F6', true, 'cat_housing', NOW()),
('cat_cooking_gas', 'Cooking Gas', '🔥', '#F59E0B', true, 'cat_housing', NOW()),
('cat_generator_fuel', 'Generator Fuel', '⛽', '#F59E0B', true, 'cat_housing', NOW()),
('cat_estate_levy', 'Estate Levy', '🏘️', '#6B7280', true, 'cat_housing', NOW()),
('cat_security_housing', 'Security', '🔒', '#6B7280', true, 'cat_housing', NOW()),
('cat_waste_disposal', 'Waste Disposal', '🗑️', '#6B7280', true, 'cat_housing', NOW()),
('cat_furniture', 'Furniture', '🛋️', '#8B5CF6', true, 'cat_housing', NOW()),
('cat_home_appliances', 'Home Appliances', '📺', '#8B5CF6', true, 'cat_housing', NOW()),
('cat_repairs', 'Repairs', '🔨', '#F59E0B', true, 'cat_housing', NOW()),
('cat_plumbing', 'Plumbing', '🔧', '#3B82F6', true, 'cat_repairs', NOW()),
('cat_electrical_repair', 'Electrical', '⚡', '#EAB308', true, 'cat_repairs', NOW()),
('cat_painting', 'Painting', '🎨', '#F43F5E', true, 'cat_repairs', NOW()),
('cat_carpentry', 'Carpentry', '🪚', '#F59E0B', true, 'cat_repairs', NOW()),
('cat_roofing', 'Roofing', '🏠', '#6B7280', true, 'cat_repairs', NOW()),
('cat_ac_repair', 'Air Conditioner', '❄️', '#06B6D4', true, 'cat_repairs', NOW()),
('cat_general_repairs', 'General Repairs', '🔧', '#6B7280', true, 'cat_repairs', NOW()),
('cat_home_improvement', 'Home Improvement', '🏡', '#22C55E', true, 'cat_housing', NOW())
ON CONFLICT (id) DO NOTHING;

-- Utilities (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_utilities', 'Utilities', '🔧', '#6B7280', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_airtime', 'Airtime', '📱', '#EAB308', true, 'cat_utilities', NOW()),
('cat_mtn_airtime', 'MTN', '📱', '#FFCC00', true, 'cat_airtime', NOW()),
('cat_airtel_airtime', 'Airtel', '📱', '#FF0000', true, 'cat_airtime', NOW()),
('cat_glo_airtime', 'Glo', '📱', '#00A651', true, 'cat_airtime', NOW()),
('cat_9mobile_airtime', '9mobile', '📱', '#006B3F', true, 'cat_airtime', NOW()),
('cat_data', 'Data', '📶', '#3B82F6', true, 'cat_utilities', NOW()),
('cat_mtn_data', 'MTN Data', '📶', '#FFCC00', true, 'cat_data', NOW()),
('cat_airtel_data', 'Airtel Data', '📶', '#FF0000', true, 'cat_data', NOW()),
('cat_glo_data', 'Glo Data', '📶', '#00A651', true, 'cat_data', NOW()),
('cat_9mobile_data', '9mobile Data', '📶', '#006B3F', true, 'cat_data', NOW()),
('cat_internet_util', 'Internet', '🌐', '#3B82F6', true, 'cat_utilities', NOW()),
('cat_cable_tv', 'Cable TV', '📺', '#8B5CF6', true, 'cat_utilities', NOW()),
('cat_electricity_bill', 'Electricity Bill', '⚡', '#EAB308', true, 'cat_utilities', NOW()),
('cat_water_bill', 'Water Bill', '💧', '#3B82F6', true, 'cat_utilities', NOW()),
('cat_cloud_storage', 'Cloud Storage', '☁️', '#06B6D4', true, 'cat_utilities', NOW()),
('cat_domain_hosting', 'Domain & Hosting', '🌐', '#3B82F6', true, 'cat_utilities', NOW()),
('cat_software_sub', 'Software Subscription', '💻', '#8B5CF6', true, 'cat_utilities', NOW()),
('cat_email_services', 'Email Services', '📧', '#3B82F6', true, 'cat_utilities', NOW()),
('cat_other_utilities', 'Other Utilities', '📁', '#6B7280', true, 'cat_utilities', NOW())
ON CONFLICT (id) DO NOTHING;

-- Shopping (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_shopping', 'Shopping', '🛍️', '#F43F5E', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_clothing', 'Clothing', '👕', '#F43F5E', true, 'cat_shopping', NOW()),
('cat_shoes', 'Shoes', '👟', '#F43F5E', true, 'cat_shopping', NOW()),
('cat_bags', 'Bags', '👜', '#F43F5E', true, 'cat_shopping', NOW()),
('cat_jewelry', 'Jewelry', '💎', '#F59E0B', true, 'cat_shopping', NOW()),
('cat_watches', 'Watches', '⌚', '#6B7280', true, 'cat_shopping', NOW()),
('cat_cosmetics_shopping', 'Cosmetics', '💄', '#EC4899', true, 'cat_shopping', NOW()),
('cat_skincare_shopping', 'Skincare', '🧴', '#EC4899', true, 'cat_shopping', NOW()),
('cat_electronics', 'Electronics', '📱', '#3B82F6', true, 'cat_shopping', NOW()),
('cat_phones', 'Phones', '📱', '#3B82F6', true, 'cat_shopping', NOW()),
('cat_computers', 'Computers', '💻', '#3B82F6', true, 'cat_shopping', NOW()),
('cat_accessories_shop', 'Accessories', '🎧', '#8B5CF6', true, 'cat_shopping', NOW()),
('cat_home_decor', 'Home Decor', '🏠', '#F59E0B', true, 'cat_shopping', NOW()),
('cat_kitchenware', 'Kitchenware', '🍳', '#6B7280', true, 'cat_shopping', NOW()),
('cat_furniture_shop', 'Furniture', '🛋️', '#8B5CF6', true, 'cat_shopping', NOW()),
('cat_baby_products', 'Baby Products', '👶', '#EC4899', true, 'cat_shopping', NOW()),
('cat_pet_supplies', 'Pet Supplies', '🐾', '#F59E0B', true, 'cat_shopping', NOW()),
('cat_gifts_shop', 'Gifts', '🎁', '#F43F5E', true, 'cat_shopping', NOW()),
('cat_books', 'Books', '📚', '#3B82F6', true, 'cat_shopping', NOW()),
('cat_office_supplies', 'Office Supplies', '📎', '#6B7280', true, 'cat_shopping', NOW()),
('cat_online_shopping', 'Online Shopping', '📦', '#3B82F6', true, 'cat_shopping', NOW()),
('cat_other_shopping', 'Other Shopping', '📁', '#F43F5E', true, 'cat_shopping', NOW())
ON CONFLICT (id) DO NOTHING;

-- Healthcare (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_healthcare', 'Healthcare', '🏥', '#06B6D4', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_hospital', 'Hospital', '🏥', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_consultation', 'Consultation', '👨‍⚕️', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_admission', 'Admission', '🛏️', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_surgery', 'Surgery', '🏥', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_laboratory', 'Laboratory Tests', '🧪', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_pharmacy', 'Pharmacy', '💊', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_dental', 'Dental', '🦷', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_optical', 'Optical', '👓', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_physiotherapy', 'Physiotherapy', '💆', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_vaccination', 'Vaccination', '💉', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_health_insurance', 'Health Insurance', '🛡️', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_gym', 'Gym', '🏋️', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_supplements', 'Supplements', '💊', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_therapy', 'Therapy', '💆', '#06B6D4', true, 'cat_healthcare', NOW()),
('cat_other_healthcare', 'Other Healthcare', '📁', '#06B6D4', true, 'cat_healthcare', NOW())
ON CONFLICT (id) DO NOTHING;

-- Education (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_education', 'Education', '📚', '#3B82F6', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_tuition', 'Tuition', '🎓', '#3B82F6', true, 'cat_education', NOW()),
('cat_school_fees', 'School Fees', '🏫', '#3B82F6', true, 'cat_education', NOW()),
('cat_examination', 'Examination', '📝', '#3B82F6', true, 'cat_education', NOW()),
('cat_textbooks', 'Textbooks', '📖', '#3B82F6', true, 'cat_education', NOW()),
('cat_school_supplies', 'School Supplies', '📎', '#3B82F6', true, 'cat_education', NOW()),
('cat_online_courses', 'Online Courses', '💻', '#8B5CF6', true, 'cat_education', NOW()),
('cat_certification', 'Certification', '📜', '#F59E0B', true, 'cat_education', NOW()),
('cat_workshops', 'Workshops', '🔧', '#6B7280', true, 'cat_education', NOW()),
('cat_conferences', 'Conferences', '🎤', '#6B7280', true, 'cat_education', NOW()),
('cat_seminars', 'Seminars', '📊', '#6B7280', true, 'cat_education', NOW()),
('cat_other_education', 'Other Education', '📁', '#3B82F6', true, 'cat_education', NOW())
ON CONFLICT (id) DO NOTHING;

-- Business Expenses (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_business_expenses', 'Business Expenses', '💼', '#8B5CF6', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_inventory', 'Inventory', '📦', '#8B5CF6', true, 'cat_business_expenses', NOW()),
('cat_supplier_payments', 'Supplier Payments', '🤝', '#8B5CF6', true, 'cat_business_expenses', NOW()),
('cat_employee_salaries', 'Employee Salaries', '👥', '#8B5CF6', true, 'cat_business_expenses', NOW()),
('cat_freelancers', 'Freelancers', '💻', '#8B5CF6', true, 'cat_business_expenses', NOW()),
('cat_marketing', 'Marketing', '📢', '#F43F5E', true, 'cat_business_expenses', NOW()),
('cat_advertising', 'Advertising', '📺', '#F43F5E', true, 'cat_business_expenses', NOW()),
('cat_office_rent', 'Office Rent', '🏢', '#EF4444', true, 'cat_business_expenses', NOW()),
('cat_business_utilities', 'Utilities', '🔧', '#6B7280', true, 'cat_business_expenses', NOW()),
('cat_equipment', 'Equipment', '🖥️', '#3B82F6', true, 'cat_business_expenses', NOW()),
('cat_office_supplies_biz', 'Office Supplies', '📎', '#6B7280', true, 'cat_business_expenses', NOW()),
('cat_software_biz', 'Software', '💻', '#8B5CF6', true, 'cat_business_expenses', NOW()),
('cat_professional_services', 'Professional Services', '👔', '#6B7280', true, 'cat_business_expenses', NOW()),
('cat_logistics', 'Logistics', '🚚', '#F59E0B', true, 'cat_business_expenses', NOW()),
('cat_taxes_biz', 'Taxes', '🏛️', '#6B7280', true, 'cat_business_expenses', NOW()),
('cat_licenses', 'Licenses', '📋', '#6B7280', true, 'cat_business_expenses', NOW()),
('cat_other_business', 'Other Business', '📁', '#8B5CF6', true, 'cat_business_expenses', NOW())
ON CONFLICT (id) DO NOTHING;

-- Savings & Investments (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_savings_investments', 'Savings & Investments', '📈', '#10B981', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_savings', 'Savings', '🐷', '#22C55E', true, 'cat_savings_investments', NOW()),
('cat_emergency_fund', 'Emergency Fund', '🚨', '#EF4444', true, 'cat_savings_investments', NOW()),
('cat_cooperative_savings', 'Cooperative Savings', '🤝', '#3B82F6', true, 'cat_savings_investments', NOW()),
('cat_fixed_deposit', 'Fixed Deposit', '🏦', '#6B7280', true, 'cat_savings_investments', NOW()),
('cat_mutual_funds', 'Mutual Funds', '📈', '#10B981', true, 'cat_savings_investments', NOW()),
('cat_treasury_bills', 'Treasury Bills', '🏛️', '#6B7280', true, 'cat_savings_investments', NOW()),
('cat_bonds', 'Bonds', '📜', '#6B7280', true, 'cat_savings_investments', NOW()),
('cat_stocks', 'Stocks', '📈', '#10B981', true, 'cat_savings_investments', NOW()),
('cat_etfs', 'ETFs', '📊', '#10B981', true, 'cat_savings_investments', NOW()),
('cat_real_estate', 'Real Estate', '🏠', '#EF4444', true, 'cat_savings_investments', NOW()),
('cat_cryptocurrency_inv', 'Cryptocurrency', '₿', '#F59E0B', true, 'cat_savings_investments', NOW()),
('cat_gold', 'Gold', '🥇', '#F59E0B', true, 'cat_savings_investments', NOW()),
('cat_agriculture', 'Agriculture', '🌾', '#22C55E', true, 'cat_savings_investments', NOW()),
('cat_other_investments', 'Other Investments', '📁', '#10B981', true, 'cat_savings_investments', NOW())
ON CONFLICT (id) DO NOTHING;

-- Loans & Debt (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_loans_debt', 'Loans & Debt', '🏦', '#6366F1', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_loan_repayment', 'Loan Repayment', '💳', '#6366F1', true, 'cat_loans_debt', NOW()),
('cat_loan_interest', 'Loan Interest', '📊', '#6366F1', true, 'cat_loans_debt', NOW()),
('cat_credit_card_payment', 'Credit Card Payment', '💳', '#EF4444', true, 'cat_loans_debt', NOW()),
('cat_mortgage_payment', 'Mortgage Payment', '🏠', '#EF4444', true, 'cat_loans_debt', NOW()),
('cat_cooperative_loan', 'Cooperative Loan', '🤝', '#3B82F6', true, 'cat_loans_debt', NOW()),
('cat_overdraft', 'Overdraft', '⚠️', '#F59E0B', true, 'cat_loans_debt', NOW()),
('cat_other_debt', 'Other Debt', '📁', '#6366F1', true, 'cat_loans_debt', NOW())
ON CONFLICT (id) DO NOTHING;

-- Family (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_family', 'Family', '👨‍👩‍👧‍👦', '#EC4899', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_parents', 'Parents', '👴', '#EC4899', true, 'cat_family', NOW()),
('cat_spouse', 'Spouse', '💑', '#EC4899', true, 'cat_family', NOW()),
('cat_children', 'Children', '👶', '#EC4899', true, 'cat_family', NOW()),
('cat_relatives', 'Relatives', '👨‍👩‍👧‍👦', '#EC4899', true, 'cat_family', NOW()),
('cat_house_help', 'House Help', '🏠', '#6B7280', true, 'cat_family', NOW()),
('cat_school_fees_family', 'School Fees', '🎓', '#3B82F6', true, 'cat_family', NOW()),
('cat_family_support', 'Family Support', '🤝', '#EC4899', true, 'cat_family', NOW()),
('cat_family_events', 'Family Events', '🎉', '#F43F5E', true, 'cat_family', NOW()),
('cat_other_family', 'Other Family', '📁', '#EC4899', true, 'cat_family', NOW())
ON CONFLICT (id) DO NOTHING;

-- Entertainment (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_entertainment', 'Entertainment', '🎬', '#A855F7', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_movies', 'Movies', '🎥', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_streaming', 'Streaming', '📺', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_music', 'Music', '🎵', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_gaming', 'Gaming', '🎮', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_sports', 'Sports', '⚽', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_events', 'Events', '🎫', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_concerts', 'Concerts', '🎤', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_nightlife', 'Nightlife', '🌙', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_hobbies', 'Hobbies', '🎨', '#A855F7', true, 'cat_entertainment', NOW()),
('cat_other_entertainment', 'Other Entertainment', '📁', '#A855F7', true, 'cat_entertainment', NOW())
ON CONFLICT (id) DO NOTHING;

-- Travel (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_travel', 'Travel', '✈️', '#3B82F6', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_hotels', 'Hotels', '🏨', '#3B82F6', true, 'cat_travel', NOW()),
('cat_airbnb', 'Airbnb', '🏡', '#F43F5E', true, 'cat_travel', NOW()),
('cat_flights_travel', 'Flights', '✈️', '#3B82F6', true, 'cat_travel', NOW()),
('cat_bus_travel', 'Bus', '🚌', '#3B82F6', true, 'cat_travel', NOW()),
('cat_train_travel', 'Train', '🚆', '#3B82F6', true, 'cat_travel', NOW()),
('cat_visa', 'Visa', '📋', '#6B7280', true, 'cat_travel', NOW()),
('cat_passport', 'Passport', '📘', '#3B82F6', true, 'cat_travel', NOW()),
('cat_travel_insurance', 'Travel Insurance', '🛡️', '#06B6D4', true, 'cat_travel', NOW()),
('cat_vacation', 'Vacation', '🏖️', '#F59E0B', true, 'cat_travel', NOW()),
('cat_tour', 'Tour', '🗺️', '#3B82F6', true, 'cat_travel', NOW()),
('cat_other_travel', 'Other Travel', '📁', '#3B82F6', true, 'cat_travel', NOW())
ON CONFLICT (id) DO NOTHING;

-- Personal Care (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_personal_care', 'Personal Care', '💆', '#EC4899', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_haircut', 'Haircut', '✂️', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_salon', 'Salon', '💇', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_spa', 'Spa', '🧖', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_nails', 'Nails', '💅', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_barber', 'Barber', '💈', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_laundry', 'Laundry', '👔', '#3B82F6', true, 'cat_personal_care', NOW()),
('cat_skincare_pc', 'Skincare', '🧴', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_cosmetics_pc', 'Cosmetics', '💄', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_perfume', 'Perfume', '🌸', '#EC4899', true, 'cat_personal_care', NOW()),
('cat_other_personal_care', 'Other Personal Care', '📁', '#EC4899', true, 'cat_personal_care', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insurance (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_insurance', 'Insurance', '🛡️', '#06B6D4', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_health_insurance_ins', 'Health Insurance', '🏥', '#06B6D4', true, 'cat_insurance', NOW()),
('cat_life_insurance', 'Life Insurance', '💀', '#6B7280', true, 'cat_insurance', NOW()),
('cat_vehicle_insurance', 'Vehicle Insurance', '🚗', '#3B82F6', true, 'cat_insurance', NOW()),
('cat_home_insurance', 'Home Insurance', '🏠', '#EF4444', true, 'cat_insurance', NOW()),
('cat_travel_insurance_ins', 'Travel Insurance', '✈️', '#3B82F6', true, 'cat_insurance', NOW()),
('cat_gadget_insurance', 'Gadget Insurance', '📱', '#8B5CF6', true, 'cat_insurance', NOW()),
('cat_other_insurance', 'Other Insurance', '📁', '#06B6D4', true, 'cat_insurance', NOW())
ON CONFLICT (id) DO NOTHING;

-- Religious & Charity (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_religious_charity', 'Religious & Charity', '🙏', '#F59E0B', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_tithe', 'Tithe', '⛪', '#F59E0B', true, 'cat_religious_charity', NOW()),
('cat_offering', 'Offering', '🤲', '#F59E0B', true, 'cat_religious_charity', NOW()),
('cat_thanksgiving', 'Thanksgiving', '🙏', '#F59E0B', true, 'cat_religious_charity', NOW()),
('cat_seed', 'Seed', '🌱', '#22C55E', true, 'cat_religious_charity', NOW()),
('cat_building_fund', 'Building Fund', '🏗️', '#6B7280', true, 'cat_religious_charity', NOW()),
('cat_mosque_donation', 'Mosque Donation', '🕌', '#F59E0B', true, 'cat_religious_charity', NOW()),
('cat_charity', 'Charity', '🤲', '#F43F5E', true, 'cat_religious_charity', NOW()),
('cat_ngo_donation', 'NGO Donation', '🏢', '#3B82F6', true, 'cat_religious_charity', NOW()),
('cat_other_giving', 'Other Giving', '📁', '#F59E0B', true, 'cat_religious_charity', NOW())
ON CONFLICT (id) DO NOTHING;

-- Government & Taxes (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_government_taxes', 'Government & Taxes', '🏛️', '#6B7280', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_income_tax', 'Income Tax', '💰', '#6B7280', true, 'cat_government_taxes', NOW()),
('cat_property_tax', 'Property Tax', '🏠', '#6B7280', true, 'cat_government_taxes', NOW()),
('cat_business_tax', 'Business Tax', '💼', '#6B7280', true, 'cat_government_taxes', NOW()),
('cat_passport_gov', 'Passport', '📘', '#3B82F6', true, 'cat_government_taxes', NOW()),
('cat_visa_gov', 'Visa', '📋', '#6B7280', true, 'cat_government_taxes', NOW()),
('cat_drivers_license', 'Driver License', '🚗', '#3B82F6', true, 'cat_government_taxes', NOW()),
('cat_vehicle_reg_gov', 'Vehicle Registration', '📋', '#6B7280', true, 'cat_government_taxes', NOW()),
('cat_court_fees', 'Court Fees', '⚖️', '#6B7280', true, 'cat_government_taxes', NOW()),
('cat_immigration', 'Immigration', '✈️', '#3B82F6', true, 'cat_government_taxes', NOW()),
('cat_other_gov_fees', 'Other Government Fees', '📁', '#6B7280', true, 'cat_government_taxes', NOW())
ON CONFLICT (id) DO NOTHING;

-- Banking & Financial Services (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_banking_fees', 'Banking & Financial', '🏦', '#6366F1', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_bank_transfer', 'Bank Transfer', '💸', '#6366F1', true, 'cat_banking_fees', NOW()),
('cat_self_transfer', 'Self Transfer', '🔄', '#6366F1', true, 'cat_banking_fees', NOW()),
('cat_cash_withdrawal', 'Cash Withdrawal', '💵', '#22C55E', true, 'cat_banking_fees', NOW()),
('cat_cash_deposit', 'Cash Deposit', '💰', '#22C55E', true, 'cat_banking_fees', NOW()),
('cat_atm_withdrawal', 'ATM Withdrawal', '🏧', '#6366F1', true, 'cat_banking_fees', NOW()),
('cat_pos_purchase', 'POS Purchase', '💳', '#8B5CF6', true, 'cat_banking_fees', NOW()),
('cat_pos_cash', 'POS Cash Withdrawal', '💳', '#8B5CF6', true, 'cat_banking_fees', NOW()),
('cat_transfer_charges', 'Transfer Charges', '💸', '#F59E0B', true, 'cat_banking_fees', NOW()),
('cat_account_maintenance', 'Account Maintenance Fee', '🏦', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_card_maintenance', 'Card Maintenance Fee', '💳', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_card_replacement', 'Card Replacement', '💳', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_sms_charges', 'SMS Alert Charges', '📱', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_stamp_duty', 'Stamp Duty', '📋', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_vat', 'VAT', '🏛️', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_fx_charges', 'FX Charges', '💱', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_interest_charges', 'Interest Charges', '📊', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_loan_charges', 'Loan Charges', '🏦', '#6B7280', true, 'cat_banking_fees', NOW()),
('cat_failed_transaction', 'Failed Transaction', '❌', '#EF4444', true, 'cat_banking_fees', NOW()),
('cat_reversal', 'Reversal', '↩️', '#22C55E', true, 'cat_banking_fees', NOW()),
('cat_chargeback', 'Chargeback', '💳', '#EF4444', true, 'cat_banking_fees', NOW()),
('cat_other_banking_fees', 'Other Banking Fees', '📁', '#6B7280', true, 'cat_banking_fees', NOW())
ON CONFLICT (id) DO NOTHING;

-- Cryptocurrency (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_crypto', 'Cryptocurrency', '₿', '#F59E0B', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_buy_crypto', 'Buy Crypto', '📈', '#22C55E', true, 'cat_crypto', NOW()),
('cat_sell_crypto', 'Sell Crypto', '📉', '#EF4444', true, 'cat_crypto', NOW()),
('cat_wallet_transfer', 'Wallet Transfer', '💸', '#F59E0B', true, 'cat_crypto', NOW()),
('cat_exchange_deposit', 'Exchange Deposit', '🏦', '#22C55E', true, 'cat_crypto', NOW()),
('cat_exchange_withdrawal', 'Exchange Withdrawal', '💸', '#EF4444', true, 'cat_crypto', NOW()),
('cat_stablecoin', 'Stablecoin', '💵', '#22C55E', true, 'cat_crypto', NOW()),
('cat_gas_fees', 'Gas Fees', '⛽', '#F59E0B', true, 'cat_crypto', NOW()),
('cat_nft', 'NFT', '🖼️', '#8B5CF6', true, 'cat_crypto', NOW()),
('cat_staking', 'Staking', '🔒', '#10B981', true, 'cat_crypto', NOW()),
('cat_yield_farming', 'Yield Farming', '🌾', '#22C55E', true, 'cat_crypto', NOW()),
('cat_other_crypto', 'Other Crypto', '📁', '#F59E0B', true, 'cat_crypto', NOW())
ON CONFLICT (id) DO NOTHING;

-- Cash (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_cash', 'Cash', '💵', '#22C55E', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_atm_withdrawal_cash', 'ATM Withdrawal', '🏧', '#6366F1', true, 'cat_cash', NOW()),
('cat_cash_withdrawal_cash', 'Cash Withdrawal', '💵', '#22C55E', true, 'cat_cash', NOW()),
('cat_cash_deposit_cash', 'Cash Deposit', '💰', '#22C55E', true, 'cat_cash', NOW()),
('cat_petty_cash', 'Petty Cash', '📋', '#6B7280', true, 'cat_cash', NOW()),
('cat_cash_transfer', 'Cash Transfer', '💸', '#EC4899', true, 'cat_cash', NOW()),
('cat_other_cash', 'Other Cash', '📁', '#22C55E', true, 'cat_cash', NOW())
ON CONFLICT (id) DO NOTHING;

-- Fees & Charges (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_fees_charges', 'Fees & Charges', '📋', '#F59E0B', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_service_fee', 'Service Fee', '🔧', '#F59E0B', true, 'cat_fees_charges', NOW()),
('cat_processing_fee', 'Processing Fee', '⚙️', '#F59E0B', true, 'cat_fees_charges', NOW()),
('cat_platform_fee', 'Platform Fee', '💻', '#F59E0B', true, 'cat_fees_charges', NOW()),
('cat_convenience_fee', 'Convenience Fee', '🛒', '#F59E0B', true, 'cat_fees_charges', NOW()),
('cat_delivery_fee', 'Delivery Fee', '🚚', '#F59E0B', true, 'cat_fees_charges', NOW()),
('cat_penalty', 'Penalty', '⚠️', '#EF4444', true, 'cat_fees_charges', NOW()),
('cat_late_fee', 'Late Fee', '⏰', '#EF4444', true, 'cat_fees_charges', NOW()),
('cat_fine', 'Fine', '🚨', '#EF4444', true, 'cat_fees_charges', NOW()),
('cat_commission_fee', 'Commission', '📊', '#F59E0B', true, 'cat_fees_charges', NOW()),
('cat_other_charges', 'Other Charges', '📁', '#F59E0B', true, 'cat_fees_charges', NOW())
ON CONFLICT (id) DO NOTHING;

-- Transfers (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_transfers', 'Transfers', '💸', '#EC4899', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_self_transfer_out', 'Self Transfer', '🔄', '#EC4899', true, 'cat_transfers', NOW()),
('cat_family_transfer_out', 'Family Transfer', '👨‍👩‍👧‍👦', '#EC4899', true, 'cat_transfers', NOW()),
('cat_friend_transfer', 'Friend Transfer', '🤝', '#EC4899', true, 'cat_transfers', NOW()),
('cat_business_transfer', 'Business Transfer', '💼', '#EC4899', true, 'cat_transfers', NOW()),
('cat_employee_payment', 'Employee Payment', '👥', '#EC4899', true, 'cat_transfers', NOW()),
('cat_supplier_payment', 'Supplier Payment', '🤝', '#EC4899', true, 'cat_transfers', NOW()),
('cat_gift_transfer', 'Gift Transfer', '🎁', '#F43F5E', true, 'cat_transfers', NOW()),
('cat_loan_disbursement', 'Loan Disbursement', '🏦', '#6366F1', true, 'cat_transfers', NOW()),
('cat_loan_repayment_transfer', 'Loan Repayment', '💳', '#6366F1', true, 'cat_transfers', NOW()),
('cat_other_transfers', 'Other Transfers', '📁', '#EC4899', true, 'cat_transfers', NOW())
ON CONFLICT (id) DO NOTHING;

-- Miscellaneous (parent)
INSERT INTO "Category" (id, name, icon, color, "isSystem", "createdAt") VALUES
('cat_miscellaneous', 'Miscellaneous', '📁', '#6B7280', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, icon, color, "isSystem", "parentId", "createdAt") VALUES
('cat_uncategorized', 'Uncategorized', '❓', '#6B7280', true, 'cat_miscellaneous', NOW()),
('cat_unknown_debit', 'Unknown Debit', '❓', '#EF4444', true, 'cat_miscellaneous', NOW()),
('cat_unknown_credit', 'Unknown Credit', '❓', '#22C55E', true, 'cat_miscellaneous', NOW()),
('cat_pending_transaction', 'Pending Transaction', '⏳', '#F59E0B', true, 'cat_miscellaneous', NOW()),
('cat_failed_transaction_misc', 'Failed Transaction', '❌', '#EF4444', true, 'cat_miscellaneous', NOW()),
('cat_duplicate_transaction', 'Duplicate Transaction', '📋', '#F59E0B', true, 'cat_miscellaneous', NOW()),
('cat_adjustment', 'Adjustment', '⚖️', '#6B7280', true, 'cat_miscellaneous', NOW()),
('cat_test_transaction', 'Test Transaction', '🧪', '#6B7280', true, 'cat_miscellaneous', NOW()),
('cat_temporary_hold', 'Temporary Hold', '🔒', '#6B7280', true, 'cat_miscellaneous', NOW()),
('cat_other_misc', 'Other', '📁', '#6B7280', true, 'cat_miscellaneous', NOW())
ON CONFLICT (id) DO NOTHING;
