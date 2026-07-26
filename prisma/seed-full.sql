-- Full category tree with slug + sort_order
-- 24 parents, 269 children = 293 total

-- ============================================================
-- PARENT CATEGORIES (parentId = NULL, sorted)
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('cat_income',       'Income',                   'income',                  '💰', '#22C55E', 1,  true, NULL, NOW()),
('cat_food',         'Food & Dining',            'food-dining',             '🍔', '#F97316', 2,  true, NULL, NOW()),
('cat_transport',    'Transportation',           'transportation',          '🚗', '#3B82F6', 3,  true, NULL, NOW()),
('cat_housing',      'Housing',                  'housing',                 '🏠', '#EF4444', 4,  true, NULL, NOW()),
('cat_utilities',    'Utilities',                'utilities',               '📱', '#6B7280', 5,  true, NULL, NOW()),
('cat_shopping',     'Shopping',                 'shopping',                '🛍️', '#F43F5E', 6,  true, NULL, NOW()),
('cat_healthcare',   'Healthcare',               'healthcare',              '🏥', '#06B6D4', 7,  true, NULL, NOW()),
('cat_education',    'Education',                'education',               '📚', '#3B82F6', 8,  true, NULL, NOW()),
('cat_business',     'Business',                 'business',                '💼', '#8B5CF6', 9,  true, NULL, NOW()),
('cat_savings',      'Savings & Investments',    'savings-investments',     '📈', '#10B981', 10, true, NULL, NOW()),
('cat_debt',         'Loans & Debt',             'loans-debt',              '🏦', '#6366F1', 11, true, NULL, NOW()),
('cat_family',       'Family',                   'family',                  '👨‍👩‍👧‍👦', '#EC4899', 12, true, NULL, NOW()),
('cat_entertainment','Entertainment',             'entertainment',           '🎬', '#A855F7', 13, true, NULL, NOW()),
('cat_travel',       'Travel',                   'travel',                  '✈️', '#3B82F6', 14, true, NULL, NOW()),
('cat_personal',     'Personal Care',            'personal-care',           '💆', '#EC4899', 15, true, NULL, NOW()),
('cat_insurance',    'Insurance',                'insurance',               '🛡️', '#06B6D4', 16, true, NULL, NOW()),
('cat_religious',    'Religious & Charity',      'religious-charity',       '🙏', '#F59E0B', 17, true, NULL, NOW()),
('cat_government',   'Government & Taxes',       'government-taxes',        '🏛️', '#6B7280', 18, true, NULL, NOW()),
('cat_banking',      'Banking & Financial',      'banking-financial',       '🏦', '#6366F1', 19, true, NULL, NOW()),
('cat_crypto',       'Cryptocurrency',           'cryptocurrency',          '₿',  '#F59E0B', 20, true, NULL, NOW()),
('cat_cash',         'Cash',                     'cash',                    '💵', '#22C55E', 21, true, NULL, NOW()),
('cat_fees',         'Fees & Charges',           'fees-charges',            '📋', '#F59E0B', 22, true, NULL, NOW()),
('cat_transfers',    'Transfers',                'transfers',               '💸', '#EC4899', 23, true, NULL, NOW()),
('cat_misc',         'Miscellaneous',            'miscellaneous',           '📁', '#6B7280', 24, true, NULL, NOW());

-- ============================================================
-- INCOME SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_salary',       'Salary',                   'salary',                  '💵', '#22C55E', 1,  true, 'cat_income', NOW()),
('inc_business',     'Business',                 'income-business',         '💼', '#8B5CF6', 2,  true, 'cat_income', NOW()),
('inc_investment',   'Investment',               'income-investment',       '📈', '#10B981', 3,  true, 'cat_income', NOW()),
('inc_rental',       'Rental Income',            'rental-income',           '🏠', '#EF4444', 4,  true, 'cat_income', NOW()),
('inc_transfers',    'Transfers',                'income-transfers',        '💸', '#EC4899', 5,  true, 'cat_income', NOW()),
('inc_refunds',      'Refunds',                  'refunds',                 '↩️', '#22C55E', 6,  true, 'cat_income', NOW()),
('inc_gifts',        'Gifts',                    'gifts',                   '🎁', '#F43F5E', 7,  true, 'cat_income', NOW()),
('inc_loans',        'Loans Received',           'loans-received',          '🏦', '#6366F1', 8,  true, 'cat_income', NOW()),
('inc_government',   'Government',               'income-government',       '🏛️', '#6B7280', 9,  true, 'cat_income', NOW()),
('inc_other',        'Other Income',             'other-income',            '📁', '#6B7280', 10, true, 'cat_income', NOW());

-- Salary children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_salary_basic',     'Basic Salary',         'basic-salary',            '💵', '#22C55E', 1, true, 'inc_salary', NOW()),
('inc_salary_bonus',     'Bonus',                'bonus',                   '🎁', '#22C55E', 2, true, 'inc_salary', NOW()),
('inc_salary_commission','Commission',            'commission',              '📊', '#22C55E', 3, true, 'inc_salary', NOW()),
('inc_salary_overtime',  'Overtime',              'overtime',                '⏰', '#22C55E', 4, true, 'inc_salary', NOW()),
('inc_salary_leave',     'Leave Allowance',      'leave-allowance',         '🏖️', '#22C55E', 5, true, 'inc_salary', NOW()),
('inc_salary_perf',      'Performance Bonus',    'performance-bonus',       '🏆', '#22C55E', 6, true, 'inc_salary', NOW()),
('inc_salary_13th',      'Thirteenth Month',     'thirteenth-month',        '📅', '#22C55E', 7, true, 'inc_salary', NOW()),
('inc_salary_other',     'Other Salary',         'other-salary',            '📁', '#22C55E', 8, true, 'inc_salary', NOW());

-- Business children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_biz_sales',       'Sales',                'sales',                   '🛒', '#8B5CF6', 1, true, 'inc_business', NOW()),
('inc_biz_service',     'Service Income',       'service-income',          '🔧', '#8B5CF6', 2, true, 'inc_business', NOW()),
('inc_biz_consulting',  'Consulting',           'consulting',              '💡', '#8B5CF6', 3, true, 'inc_business', NOW()),
('inc_biz_freelance',   'Freelancing',          'freelancing',             '💻', '#8B5CF6', 4, true, 'inc_business', NOW()),
('inc_biz_agency',      'Agency Banking',       'agency-banking',          '🏦', '#8B5CF6', 5, true, 'inc_business', NOW()),
('inc_biz_pos',         'POS Commission',       'pos-commission',          '💳', '#8B5CF6', 6, true, 'inc_business', NOW()),
('inc_biz_affiliate',   'Affiliate Income',     'affiliate-income',        '🤝', '#8B5CF6', 7, true, 'inc_business', NOW()),
('inc_biz_royalties',   'Royalties',            'royalties',               '👑', '#8B5CF6', 8, true, 'inc_business', NOW()),
('inc_biz_other',       'Other Business Income','other-business-income',   '📁', '#8B5CF6', 9, true, 'inc_business', NOW());

-- Investment children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_inv_interest',    'Interest',             'interest',                '🏦', '#10B981', 1, true, 'inc_investment', NOW()),
('inc_inv_dividend',    'Dividend',             'dividend',                '📊', '#10B981', 2, true, 'inc_investment', NOW()),
('inc_inv_mutual',      'Mutual Funds',         'mutual-funds',            '📊', '#10B981', 3, true, 'inc_investment', NOW()),
('inc_inv_treasury',    'Treasury Bills',       'treasury-bills',          '🏛️', '#10B981', 4, true, 'inc_investment', NOW()),
('inc_inv_bonds',       'Bonds',                'bonds',                   '📈', '#10B981', 5, true, 'inc_investment', NOW()),
('inc_inv_stock',       'Stock Profit',         'stock-profit',            '📈', '#10B981', 6, true, 'inc_investment', NOW()),
('inc_inv_realestate',  'Real Estate Income',   'real-estate-income',      '🏠', '#10B981', 7, true, 'inc_investment', NOW()),
('inc_inv_crypto',      'Crypto Profit',        'crypto-profit',           '₿',  '#10B981', 8, true, 'inc_investment', NOW()),
('inc_inv_staking',     'Staking Rewards',      'staking-rewards',         '🔒', '#10B981', 9, true, 'inc_investment', NOW()),
('inc_inv_capital',     'Capital Gains',        'capital-gains',           '💎', '#10B981', 10, true, 'inc_investment', NOW());

-- Rental children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_rental_res',      'Residential Rent',     'residential-rent',        '🏘️', '#EF4444', 1, true, 'inc_rental', NOW()),
('inc_rental_com',      'Commercial Rent',      'commercial-rent',         '🏢', '#EF4444', 2, true, 'inc_rental', NOW()),
('inc_rental_equip',    'Equipment Rental',     'equipment-rental',        '🔧', '#EF4444', 3, true, 'inc_rental', NOW());

-- Income Transfers children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_xfer_self',       'Self Transfer',        'income-self-transfer',    '🔄', '#EC4899', 1, true, 'inc_transfers', NOW()),
('inc_xfer_family',     'Family',               'income-family',           '👨‍👩‍👧‍👦', '#EC4899', 2, true, 'inc_transfers', NOW()),
('inc_xfer_friends',    'Friends',              'income-friends',          '🤝', '#EC4899', 3, true, 'inc_transfers', NOW()),
('inc_xfer_employer',   'Employer',             'employer',                '👔', '#EC4899', 4, true, 'inc_transfers', NOW()),
('inc_xfer_partner',    'Business Partner',     'business-partner',        '🤝', '#EC4899', 5, true, 'inc_transfers', NOW()),
('inc_xfer_other',      'Other Transfer',       'other-transfer',          '📁', '#EC4899', 6, true, 'inc_transfers', NOW());

-- Refunds children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_ref_merchant',    'Merchant Refund',      'merchant-refund',         '🏪', '#22C55E', 1, true, 'inc_refunds', NOW()),
('inc_ref_bank',        'Bank Reversal',        'bank-reversal',           '🏦', '#22C55E', 2, true, 'inc_refunds', NOW()),
('inc_ref_chargeback',  'Chargeback',           'chargeback',              '↩️', '#22C55E', 3, true, 'inc_refunds', NOW()),
('inc_ref_tax',         'Tax Refund',           'tax-refund',              '🏛️', '#22C55E', 4, true, 'inc_refunds', NOW()),
('inc_ref_other',       'Other Refund',         'other-refund',            '📁', '#22C55E', 5, true, 'inc_refunds', NOW());

-- Gifts children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_gift_cash',       'Cash Gift',            'cash-gift',               '💵', '#F43F5E', 1, true, 'inc_gifts', NOW()),
('inc_gift_birthday',   'Birthday Gift',        'birthday-gift',           '🎂', '#F43F5E', 2, true, 'inc_gifts', NOW()),
('inc_gift_wedding',    'Wedding Gift',         'wedding-gift',            '💒', '#F43F5E', 3, true, 'inc_gifts', NOW()),
('inc_gift_family',     'Family Support',       'family-support',          '🤝', '#F43F5E', 4, true, 'inc_gifts', NOW()),
('inc_gift_donation',   'Donation Received',    'donation-received',       '🤲', '#F43F5E', 5, true, 'inc_gifts', NOW());

-- Loans Received children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_loan_personal',   'Personal Loan',        'personal-loan-in',        '👤', '#6366F1', 1, true, 'inc_loans', NOW()),
('inc_loan_coop',       'Cooperative Loan',     'cooperative-loan-in',     '🤝', '#6366F1', 2, true, 'inc_loans', NOW()),
('inc_loan_business',   'Business Loan',        'business-loan-in',        '💼', '#6366F1', 3, true, 'inc_loans', NOW()),
('inc_loan_mortgage',   'Mortgage Loan',        'mortgage-loan-in',        '🏠', '#6366F1', 4, true, 'inc_loans', NOW()),
('inc_loan_other',      'Other Loan',           'other-loan-in',           '📁', '#6366F1', 5, true, 'inc_loans', NOW());

-- Government Income children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_gov_pension',     'Pension',              'pension',                 '👴', '#6B7280', 1, true, 'inc_government', NOW()),
('inc_gov_scholarship', 'Scholarship',          'scholarship',             '🎓', '#6B7280', 2, true, 'inc_government', NOW()),
('inc_gov_grant',       'Grant',                'grant',                   '📋', '#6B7280', 3, true, 'inc_government', NOW()),
('inc_gov_welfare',     'Welfare',              'welfare',                 '🤝', '#6B7280', 4, true, 'inc_government', NOW()),
('inc_gov_benefits',    'Benefits',             'benefits',                '🎁', '#6B7280', 5, true, 'inc_government', NOW());

-- Other Income children
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('inc_other_cashback',  'Cashback',             'cashback',                '💳', '#22C55E', 1, true, 'inc_other', NOW()),
('inc_other_lottery',   'Lottery',              'lottery',                 '🎰', '#22C55E', 2, true, 'inc_other', NOW()),
('inc_other_credit',    'Unknown Credit',       'unknown-credit',          '❓', '#22C55E', 3, true, 'inc_other', NOW()),
('inc_other_misc',      'Miscellaneous',        'misc-income',             '📁', '#22C55E', 4, true, 'inc_other', NOW());

-- ============================================================
-- FOOD & DINING SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('food_groceries',     'Groceries',            'groceries',               '🛒', '#F97316', 1, true, 'cat_food', NOW()),
('food_restaurants',   'Restaurants',          'restaurants',             '🍽️', '#F97316', 2, true, 'cat_food', NOW()),
('food_street',        'Street Food',          'street-food',             '🌮', '#F97316', 3, true, 'cat_food', NOW()),
('food_drinks',        'Drinks',               'drinks',                  '🥤', '#F97316', 4, true, 'cat_food', NOW()),
('food_delivery',      'Food Delivery',        'food-delivery',           '🛵', '#F97316', 5, true, 'cat_food', NOW()),
('food_catering',      'Catering',             'catering',                '🍳', '#F97316', 6, true, 'cat_food', NOW()),
('food_other',         'Other Food',           'other-food',              '📁', '#F97316', 7, true, 'cat_food', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('food_groc_super',    'Supermarket',          'supermarket',             '🏪', '#F97316', 1, true, 'food_groceries', NOW()),
('food_groc_market',   'Local Market',         'local-market',            '🥬', '#F97316', 2, true, 'food_groceries', NOW()),
('food_groc_fruits',   'Fruits',               'fruits',                  '🍎', '#F97316', 3, true, 'food_groceries', NOW()),
('food_groc_veg',      'Vegetables',           'vegetables',              '🥬', '#F97316', 4, true, 'food_groceries', NOW()),
('food_groc_meat',     'Meat',                 'meat',                    '🥩', '#F97316', 5, true, 'food_groceries', NOW()),
('food_groc_fish',     'Fish',                 'fish',                    '🐟', '#F97316', 6, true, 'food_groceries', NOW()),
('food_groc_poultry',  'Poultry',              'poultry',                 '🍗', '#F97316', 7, true, 'food_groceries', NOW()),
('food_groc_frozen',   'Frozen Foods',         'frozen-foods',            '🧊', '#F97316', 8, true, 'food_groceries', NOW()),
('food_groc_dairy',    'Dairy',                'dairy',                   '🥛', '#F97316', 9, true, 'food_groceries', NOW()),
('food_groc_bread',    'Bread & Bakery',       'bread-bakery',            '🍞', '#F97316', 10, true, 'food_groceries', NOW()),
('food_groc_rice',     'Rice & Grains',        'rice-grains',             '🍚', '#F97316', 11, true, 'food_groceries', NOW()),
('food_groc_spices',   'Spices',               'spices',                  '🌶️', '#F97316', 12, true, 'food_groceries', NOW()),
('food_groc_house',    'Household Food',       'household-food',          '🏠', '#F97316', 13, true, 'food_groceries', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('food_rest_fast',     'Fast Food',            'fast-food',               '🍔', '#F97316', 1, true, 'food_restaurants', NOW()),
('food_rest_casual',   'Casual Dining',        'casual-dining',           '🍽️', '#F97316', 2, true, 'food_restaurants', NOW()),
('food_rest_fine',     'Fine Dining',          'fine-dining',             '🥂', '#F97316', 3, true, 'food_restaurants', NOW()),
('food_rest_buffet',   'Buffet',               'buffet',                  '🍽️', '#F97316', 4, true, 'food_restaurants', NOW()),
('food_rest_local',    'Local Restaurant',     'local-restaurant',        '🍲', '#F97316', 5, true, 'food_restaurants', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('food_street_buka',    'Buka',                'buka',                    '🍲', '#F97316', 1, true, 'food_street', NOW()),
('food_street_suya',    'Suya',                'suya',                    '🍢', '#F97316', 2, true, 'food_street', NOW()),
('food_street_shawa',   'Shawarma',            'shawarma',                '🌯', '#F97316', 3, true, 'food_street', NOW()),
('food_street_akara',   'Akara',               'akara',                   '🫘', '#F97316', 4, true, 'food_street', NOW()),
('food_street_moi',     'Moi Moi',             'moi-moi',                 '🫘', '#F97316', 5, true, 'food_street', NOW()),
('food_street_corn',    'Roasted Corn',        'roasted-corn',            '🌽', '#F97316', 6, true, 'food_street', NOW()),
('food_street_snacks',  'Snacks',              'snacks',                  '🍿', '#F97316', 7, true, 'food_street', NOW()),
('food_street_other',   'Others',              'other-street-food',       '📁', '#F97316', 8, true, 'food_street', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('food_drink_soft',    'Soft Drinks',          'soft-drinks',             '🥤', '#F97316', 1, true, 'food_drinks', NOW()),
('food_drink_juice',   'Juice',                'juice',                   '🧃', '#F97316', 2, true, 'food_drinks', NOW()),
('food_drink_water',   'Water',                'drinking-water',          '💧', '#F97316', 3, true, 'food_drinks', NOW()),
('food_drink_coffee',  'Coffee',               'coffee',                  '☕', '#F97316', 4, true, 'food_drinks', NOW()),
('food_drink_tea',     'Tea',                  'tea',                     '🍵', '#F97316', 5, true, 'food_drinks', NOW()),
('food_drink_smoothie','Smoothies',            'smoothies',               '🥤', '#F97316', 6, true, 'food_drinks', NOW()),
('food_drink_alcohol', 'Alcohol',              'alcohol',                 '🍺', '#F97316', 7, true, 'food_drinks', NOW());

-- ============================================================
-- TRANSPORTATION SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('trans_pub',         'Public Transport',      'public-transport',        '🚌', '#3B82F6', 1, true, 'cat_transport', NOW()),
('trans_hailing',     'Ride Hailing',          'ride-hailing',            '🚕', '#3B82F6', 2, true, 'cat_transport', NOW()),
('trans_flights',     'Flights',               'transport-flights',       '✈️', '#3B82F6', 3, true, 'cat_transport', NOW()),
('trans_fuel',        'Fuel',                  'fuel',                    '⛽', '#F59E0B', 4, true, 'cat_transport', NOW()),
('trans_parking',     'Parking',               'parking',                 '🅿️', '#3B82F6', 5, true, 'cat_transport', NOW()),
('trans_toll',        'Toll Gate',             'toll-gate',               '🛣️', '#3B82F6', 6, true, 'cat_transport', NOW()),
('trans_maint',       'Vehicle Maintenance',   'vehicle-maintenance',     '🔧', '#3B82F6', 7, true, 'cat_transport', NOW()),
('trans_reg',         'Vehicle Registration',  'vehicle-registration',    '📋', '#3B82F6', 8, true, 'cat_transport', NOW()),
('trans_ins',         'Vehicle Insurance',     'vehicle-insurance-t',     '🛡️', '#3B82F6', 9, true, 'cat_transport', NOW()),
('trans_other',       'Other Transport',       'other-transport',         '📁', '#3B82F6', 10, true, 'cat_transport', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('trans_pub_bus',      'Bus',                  'bus',                     '🚌', '#3B82F6', 1, true, 'trans_pub', NOW()),
('trans_pub_brt',      'BRT',                  'brt',                     '🚌', '#3B82F6', 2, true, 'trans_pub', NOW()),
('trans_pub_danfo',    'Danfo',                'danfo',                   '🚐', '#3B82F6', 3, true, 'trans_pub', NOW()),
('trans_pub_keke',     'Keke',                 'keke',                    '🛺', '#3B82F6', 4, true, 'trans_pub', NOW()),
('trans_pub_okada',    'Okada',                'okada',                   '🏍️', '#3B82F6', 5, true, 'trans_pub', NOW()),
('trans_pub_taxi',     'Taxi',                 'taxi',                    '🚕', '#3B82F6', 6, true, 'trans_pub', NOW()),
('trans_pub_train',    'Train',                'train',                   '🚂', '#3B82F6', 7, true, 'trans_pub', NOW()),
('trans_pub_ferry',    'Ferry',                'ferry',                   '⛴️', '#3B82F6', 8, true, 'trans_pub', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('trans_flight_dom',   'Domestic',             'domestic-flight',         '✈️', '#3B82F6', 1, true, 'trans_flights', NOW()),
('trans_flight_intl',  'International',        'international-flight',    '✈️', '#3B82F6', 2, true, 'trans_flights', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('trans_fuel_petrol',  'Petrol',               'petrol',                  '⛽', '#F59E0B', 1, true, 'trans_fuel', NOW()),
('trans_fuel_diesel',  'Diesel',               'diesel',                  '⛽', '#F59E0B', 2, true, 'trans_fuel', NOW()),
('trans_fuel_gas',     'Gas',                  'fuel-gas',                '🔥', '#F59E0B', 3, true, 'trans_fuel', NOW()),
('trans_fuel_ev',      'EV Charging',          'ev-charging',             '⚡', '#F59E0B', 4, true, 'trans_fuel', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('trans_maint_serv',   'Servicing',            'servicing',               '🔧', '#3B82F6', 1, true, 'trans_maint', NOW()),
('trans_maint_engine', 'Engine Repair',        'engine-repair',           '🔧', '#3B82F6', 2, true, 'trans_maint', NOW()),
('trans_maint_tyres',  'Tyres',                'tyres',                   '🛞', '#3B82F6', 3, true, 'trans_maint', NOW()),
('trans_maint_oil',    'Oil Change',           'oil-change',              '🛢️', '#3B82F6', 4, true, 'trans_maint', NOW()),
('trans_maint_wash',   'Car Wash',             'car-wash',                '🚿', '#3B82F6', 5, true, 'trans_maint', NOW()),
('trans_maint_battery','Battery',              'battery',                 '🔋', '#3B82F6', 6, true, 'trans_maint', NOW()),
('trans_maint_parts',  'Spare Parts',          'spare-parts',             '🔩', '#3B82F6', 7, true, 'trans_maint', NOW()),
('trans_maint_access', 'Accessories',          'vehicle-accessories',     '🎧', '#3B82F6', 8, true, 'trans_maint', NOW());

-- ============================================================
-- HOUSING SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('house_rent',         'Rent',                 'rent',                    '🔑', '#EF4444', 1, true, 'cat_housing', NOW()),
('house_mortgage',     'Mortgage',             'housing-mortgage',        '🏦', '#EF4444', 2, true, 'cat_housing', NOW()),
('house_elec',         'Electricity',          'housing-electricity',     '⚡', '#EAB308', 3, true, 'cat_housing', NOW()),
('house_water',        'Water',                'housing-water',           '💧', '#3B82F6', 4, true, 'cat_housing', NOW()),
('house_gas',          'Cooking Gas',          'cooking-gas',             '🔥', '#F59E0B', 5, true, 'cat_housing', NOW()),
('house_generator',    'Generator Fuel',       'generator-fuel',          '⛽', '#F59E0B', 6, true, 'cat_housing', NOW()),
('house_estate',       'Estate Levy',          'estate-levy',             '🏘️', '#6B7280', 7, true, 'cat_housing', NOW()),
('house_security',     'Security',             'security',                '🔒', '#6B7280', 8, true, 'cat_housing', NOW()),
('house_waste',        'Waste Disposal',       'waste-disposal',          '🗑️', '#6B7280', 9, true, 'cat_housing', NOW()),
('house_furniture',    'Furniture',            'housing-furniture',       '🛋️', '#EF4444', 10, true, 'cat_housing', NOW()),
('house_appliances',   'Home Appliances',      'home-appliances',         '🏠', '#EF4444', 11, true, 'cat_housing', NOW()),
('house_repairs',      'Repairs',              'repairs',                 '🔨', '#F59E0B', 12, true, 'cat_housing', NOW()),
('house_improve',      'Home Improvement',     'home-improvement',        '🏡', '#22C55E', 13, true, 'cat_housing', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('house_rep_plumb',    'Plumbing',             'plumbing',                '🔧', '#3B82F6', 1, true, 'house_repairs', NOW()),
('house_rep_elec',     'Electrical',           'electrical',              '⚡', '#EAB308', 2, true, 'house_repairs', NOW()),
('house_rep_paint',    'Painting',             'painting',                '🎨', '#F43F5E', 3, true, 'house_repairs', NOW()),
('house_rep_carp',     'Carpentry',            'carpentry',               '🪚', '#F59E0B', 4, true, 'house_repairs', NOW()),
('house_rep_roof',     'Roofing',              'roofing',                 '🏠', '#F59E0B', 5, true, 'house_repairs', NOW()),
('house_rep_ac',       'Air Conditioner',      'air-conditioner',         '❄️', '#06B6D4', 6, true, 'house_repairs', NOW()),
('house_rep_general',  'General Repairs',      'general-repairs',         '🔨', '#F59E0B', 7, true, 'house_repairs', NOW());

-- ============================================================
-- UTILITIES SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('util_airtime',       'Airtime',              'airtime',                 '📱', '#EAB308', 1, true, 'cat_utilities', NOW()),
('util_data',          'Data',                 'data',                    '📶', '#3B82F6', 2, true, 'cat_utilities', NOW()),
('util_internet',      'Internet',             'internet',                '🌐', '#3B82F6', 3, true, 'cat_utilities', NOW()),
('util_cable',         'Cable TV',             'cable-tv',                '📺', '#8B5CF6', 4, true, 'cat_utilities', NOW()),
('util_elec_bill',     'Electricity Bill',     'electricity-bill',        '⚡', '#EAB308', 5, true, 'cat_utilities', NOW()),
('util_water_bill',    'Water Bill',           'water-bill',              '💧', '#3B82F6', 6, true, 'cat_utilities', NOW()),
('util_cloud',         'Cloud Storage',        'cloud-storage',           '☁️', '#8B5CF6', 7, true, 'cat_utilities', NOW()),
('util_domain',        'Domain & Hosting',     'domain-hosting',          '🌐', '#8B5CF6', 8, true, 'cat_utilities', NOW()),
('util_software',      'Software Subscription','software-subscription',   '💻', '#8B5CF6', 9, true, 'cat_utilities', NOW()),
('util_email',         'Email Services',       'email-services',          '📧', '#8B5CF6', 10, true, 'cat_utilities', NOW()),
('util_other',         'Other Utilities',      'other-utilities',         '📁', '#6B7280', 11, true, 'cat_utilities', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('util_air_mtn',       'MTN',                  'mtn-airtime',             '📱', '#FFCC00', 1, true, 'util_airtime', NOW()),
('util_air_airtel',    'Airtel',               'airtel-airtime',          '📱', '#FF0000', 2, true, 'util_airtime', NOW()),
('util_air_glo',       'Glo',                  'glo-airtime',             '📱', '#00A651', 3, true, 'util_airtime', NOW()),
('util_air_9mobile',   '9mobile',              '9mobile-airtime',         '📱', '#006B3F', 4, true, 'util_airtime', NOW());

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('util_data_mtn',      'MTN',                  'mtn-data',                '📶', '#FFCC00', 1, true, 'util_data', NOW()),
('util_data_airtel',   'Airtel',               'airtel-data',             '📶', '#FF0000', 2, true, 'util_data', NOW()),
('util_data_glo',      'Glo',                  'glo-data',                '📶', '#00A651', 3, true, 'util_data', NOW()),
('util_data_9mobile',  '9mobile',              '9mobile-data',            '📶', '#006B3F', 4, true, 'util_data', NOW());

-- ============================================================
-- SHOPPING SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('shop_clothing',      'Clothing',             'clothing',                '👕', '#F43F5E', 1, true, 'cat_shopping', NOW()),
('shop_shoes',         'Shoes',                'shoes',                   '👟', '#F43F5E', 2, true, 'cat_shopping', NOW()),
('shop_bags',          'Bags',                 'bags',                    '👜', '#F43F5E', 3, true, 'cat_shopping', NOW()),
('shop_jewelry',       'Jewelry',              'jewelry',                 '💎', '#F43F5E', 4, true, 'cat_shopping', NOW()),
('shop_watches',       'Watches',              'watches',                 '⌚', '#F43F5E', 5, true, 'cat_shopping', NOW()),
('shop_cosmetics',     'Cosmetics',            'cosmetics',               '💄', '#F43F5E', 6, true, 'cat_shopping', NOW()),
('shop_skincare',      'Skincare',             'skincare',                '🧴', '#F43F5E', 7, true, 'cat_shopping', NOW()),
('shop_electronics',   'Electronics',          'electronics',             '📱', '#3B82F6', 8, true, 'cat_shopping', NOW()),
('shop_phones',        'Phones',               'phones',                  '📱', '#3B82F6', 9, true, 'cat_shopping', NOW()),
('shop_computers',     'Computers',            'computers',               '💻', '#3B82F6', 10, true, 'cat_shopping', NOW()),
('shop_accessories',   'Accessories',          'accessories',             '🎧', '#3B82F6', 11, true, 'cat_shopping', NOW()),
('shop_decor',         'Home Decor',           'home-decor',              '🖼️', '#F43F5E', 12, true, 'cat_shopping', NOW()),
('shop_kitchen',       'Kitchenware',          'kitchenware',             '🍳', '#F43F5E', 13, true, 'cat_shopping', NOW()),
('shop_furniture',     'Furniture',            'shopping-furniture',      '🛋️', '#F43F5E', 14, true, 'cat_shopping', NOW()),
('shop_baby',          'Baby Products',        'baby-products',           '👶', '#F43F5E', 15, true, 'cat_shopping', NOW()),
('shop_pets',          'Pet Supplies',         'pet-supplies',            '🐾', '#F43F5E', 16, true, 'cat_shopping', NOW()),
('shop_gifts',         'Gifts',                'shopping-gifts',          '🎁', '#F43F5E', 17, true, 'cat_shopping', NOW()),
('shop_books',         'Books',                'books',                   '📚', '#F43F5E', 18, true, 'cat_shopping', NOW()),
('shop_office',        'Office Supplies',      'office-supplies',         '📎', '#F43F5E', 19, true, 'cat_shopping', NOW()),
('shop_online',        'Online Shopping',      'online-shopping',         '📦', '#3B82F6', 20, true, 'cat_shopping', NOW()),
('shop_other',         'Other Shopping',       'other-shopping',          '📁', '#F43F5E', 21, true, 'cat_shopping', NOW());

-- ============================================================
-- HEALTHCARE SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('health_hospital',     'Hospital',             'hospital',               '🏥', '#06B6D4', 1, true, 'cat_healthcare', NOW()),
('health_consult',      'Consultation',         'consultation',           '🩺', '#06B6D4', 2, true, 'cat_healthcare', NOW()),
('health_admit',        'Admission',            'admission',              '🛏️', '#06B6D4', 3, true, 'cat_healthcare', NOW()),
('health_surgery',      'Surgery',              'surgery',                '⚕️', '#06B6D4', 4, true, 'cat_healthcare', NOW()),
('health_lab',          'Laboratory Tests',     'laboratory-tests',       '🧪', '#06B6D4', 5, true, 'cat_healthcare', NOW()),
('health_pharmacy',     'Pharmacy',             'pharmacy',               '💊', '#06B6D4', 6, true, 'cat_healthcare', NOW()),
('health_dental',       'Dental',               'dental',                 '🦷', '#06B6D4', 7, true, 'cat_healthcare', NOW()),
('health_optical',      'Optical',              'optical',                '👓', '#06B6D4', 8, true, 'cat_healthcare', NOW()),
('health_physio',       'Physiotherapy',        'physiotherapy',          '🦿', '#06B6D4', 9, true, 'cat_healthcare', NOW()),
('health_vaccine',      'Vaccination',          'vaccination',            '💉', '#06B6D4', 10, true, 'cat_healthcare', NOW()),
('health_ins',          'Health Insurance',     'health-insurance-h',     '🛡️', '#06B6D4', 11, true, 'cat_healthcare', NOW()),
('health_gym',          'Gym',                  'gym',                    '🏋️', '#06B6D4', 12, true, 'cat_healthcare', NOW()),
('health_supplements',  'Supplements',          'supplements',            '💊', '#06B6D4', 13, true, 'cat_healthcare', NOW()),
('health_therapy',      'Therapy',              'therapy',                '🧠', '#06B6D4', 14, true, 'cat_healthcare', NOW()),
('health_other',        'Other Healthcare',     'other-healthcare',       '📁', '#06B6D4', 15, true, 'cat_healthcare', NOW());

-- ============================================================
-- EDUCATION SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('edu_tuition',        'Tuition',              'tuition',                 '🎓', '#3B82F6', 1, true, 'cat_education', NOW()),
('edu_fees',           'School Fees',          'school-fees',             '🏫', '#3B82F6', 2, true, 'cat_education', NOW()),
('edu_exam',           'Examination',          'examination',             '📝', '#3B82F6', 3, true, 'cat_education', NOW()),
('edu_textbooks',      'Textbooks',            'textbooks',               '📖', '#3B82F6', 4, true, 'cat_education', NOW()),
('edu_supplies',       'School Supplies',      'school-supplies',         '✏️', '#3B82F6', 5, true, 'cat_education', NOW()),
('edu_online',         'Online Courses',       'online-courses',          '💻', '#8B5CF6', 6, true, 'cat_education', NOW()),
('edu_cert',           'Certification',        'certification',           '📜', '#F59E0B', 7, true, 'cat_education', NOW()),
('edu_workshop',       'Workshops',            'workshops',               '🛠️', '#3B82F6', 8, true, 'cat_education', NOW()),
('edu_conference',     'Conferences',          'conferences',             '🎤', '#3B82F6', 9, true, 'cat_education', NOW()),
('edu_seminar',        'Seminars',             'seminars',                '📋', '#3B82F6', 10, true, 'cat_education', NOW()),
('edu_other',          'Other Education',      'other-education',         '📁', '#3B82F6', 11, true, 'cat_education', NOW());

-- ============================================================
-- BUSINESS SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('biz_inventory',       'Inventory',           'inventory',               '📦', '#8B5CF6', 1, true, 'cat_business', NOW()),
('biz_supplier',        'Supplier Payments',   'supplier-payments',       '🤝', '#8B5CF6', 2, true, 'cat_business', NOW()),
('biz_salary',          'Employee Salaries',   'employee-salaries',       '👥', '#8B5CF6', 3, true, 'cat_business', NOW()),
('biz_freelancers',     'Freelancers',         'freelancers',             '💻', '#8B5CF6', 4, true, 'cat_business', NOW()),
('biz_marketing',       'Marketing',           'marketing',               '📣', '#8B5CF6', 5, true, 'cat_business', NOW()),
('biz_advertising',     'Advertising',         'advertising',             '📢', '#8B5CF6', 6, true, 'cat_business', NOW()),
('biz_office_rent',     'Office Rent',         'office-rent',             '🏢', '#8B5CF6', 7, true, 'cat_business', NOW()),
('biz_utilities',       'Utilities',           'business-utilities',      '🔧', '#8B5CF6', 8, true, 'cat_business', NOW()),
('biz_equipment',       'Equipment',           'equipment',               '🖥️', '#8B5CF6', 9, true, 'cat_business', NOW()),
('biz_office_supplies', 'Office Supplies',     'business-office-supplies','📎', '#8B5CF6', 10, true, 'cat_business', NOW()),
('biz_software',        'Software',            'business-software',       '💻', '#8B5CF6', 11, true, 'cat_business', NOW()),
('biz_professional',    'Professional Services','professional-services',  '👔', '#8B5CF6', 12, true, 'cat_business', NOW()),
('biz_logistics',       'Logistics',           'logistics',               '🚚', '#8B5CF6', 13, true, 'cat_business', NOW()),
('biz_taxes',           'Taxes',               'business-taxes',          '🏛️', '#8B5CF6', 14, true, 'cat_business', NOW()),
('biz_licenses',        'Licenses',            'licenses',                '📋', '#8B5CF6', 15, true, 'cat_business', NOW()),
('biz_other',           'Other Business Expenses','other-business-expenses','📁', '#8B5CF6', 16, true, 'cat_business', NOW());

-- ============================================================
-- SAVINGS & INVESTMENTS SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('sav_savings',        'Savings',              'savings',                 '🐷', '#22C55E', 1, true, 'cat_savings', NOW()),
('sav_emergency',      'Emergency Fund',       'emergency-fund',          '🚨', '#EF4444', 2, true, 'cat_savings', NOW()),
('sav_coop',           'Cooperative Savings',  'cooperative-savings',     '🤝', '#10B981', 3, true, 'cat_savings', NOW()),
('sav_fixed',          'Fixed Deposit',        'fixed-deposit',           '🏦', '#10B981', 4, true, 'cat_savings', NOW()),
('sav_mutual',         'Mutual Funds',         'savings-mutual-funds',    '📊', '#10B981', 5, true, 'cat_savings', NOW()),
('sav_treasury',       'Treasury Bills',       'savings-treasury-bills',  '🏛️', '#10B981', 6, true, 'cat_savings', NOW()),
('sav_bonds',          'Bonds',                'savings-bonds',           '📈', '#10B981', 7, true, 'cat_savings', NOW()),
('sav_stocks',         'Stocks',               'stocks',                  '📈', '#10B981', 8, true, 'cat_savings', NOW()),
('sav_etfs',           'ETFs',                 'etfs',                    '📊', '#10B981', 9, true, 'cat_savings', NOW()),
('sav_realestate',     'Real Estate',          'real-estate',             '🏠', '#10B981', 10, true, 'cat_savings', NOW()),
('sav_crypto',         'Cryptocurrency',       'savings-crypto',          '₿', '#F59E0B', 11, true, 'cat_savings', NOW()),
('sav_gold',           'Gold',                 'gold',                    '🥇', '#F59E0B', 12, true, 'cat_savings', NOW()),
('sav_agriculture',    'Agriculture',          'agriculture',             '🌾', '#10B981', 13, true, 'cat_savings', NOW()),
('sav_other',          'Other Investments',    'other-investments',       '📁', '#10B981', 14, true, 'cat_savings', NOW());

-- ============================================================
-- LOANS & DEBT SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('debt_repay',         'Loan Repayment',       'loan-repayment',          '💳', '#6366F1', 1, true, 'cat_debt', NOW()),
('debt_interest',      'Loan Interest',        'loan-interest',           '📈', '#6366F1', 2, true, 'cat_debt', NOW()),
('debt_credit',        'Credit Card Payment',  'credit-card-payment',     '💳', '#EF4444', 3, true, 'cat_debt', NOW()),
('debt_mortgage',      'Mortgage Payment',     'mortgage-payment',        '🏠', '#EF4444', 4, true, 'cat_debt', NOW()),
('debt_coop',          'Cooperative Loan',     'cooperative-loan',        '🤝', '#6366F1', 5, true, 'cat_debt', NOW()),
('debt_overdraft',     'Overdraft',            'overdraft',               '⚠️', '#6366F1', 6, true, 'cat_debt', NOW()),
('debt_other',         'Other Debt',           'other-debt',              '📁', '#6366F1', 7, true, 'cat_debt', NOW());

-- ============================================================
-- FAMILY SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('fam_parents',        'Parents',              'parents',                 '👴', '#EC4899', 1, true, 'cat_family', NOW()),
('fam_spouse',         'Spouse',               'spouse',                  '💑', '#EC4899', 2, true, 'cat_family', NOW()),
('fam_children',       'Children',             'children',                '👶', '#EC4899', 3, true, 'cat_family', NOW()),
('fam_relatives',      'Relatives',            'relatives',               '👨‍👩‍👧‍👦', '#EC4899', 4, true, 'cat_family', NOW()),
('fam_househelp',      'House Help',           'house-help',              '🏠', '#EC4899', 5, true, 'cat_family', NOW()),
('fam_schoolfees',     'School Fees',          'family-school-fees',      '🏫', '#EC4899', 6, true, 'cat_family', NOW()),
('fam_support',        'Family Support',       'family-support-f',        '🤝', '#EC4899', 7, true, 'cat_family', NOW()),
('fam_events',         'Family Events',        'family-events',           '🎉', '#EC4899', 8, true, 'cat_family', NOW()),
('fam_other',          'Other Family Expenses','other-family-expenses',   '📁', '#EC4899', 9, true, 'cat_family', NOW());

-- ============================================================
-- ENTERTAINMENT SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('ent_movies',         'Movies',               'movies',                  '🎥', '#A855F7', 1, true, 'cat_entertainment', NOW()),
('ent_streaming',      'Streaming',            'streaming',               '📺', '#A855F7', 2, true, 'cat_entertainment', NOW()),
('ent_music',          'Music',                'music',                   '🎵', '#A855F7', 3, true, 'cat_entertainment', NOW()),
('ent_gaming',         'Gaming',               'gaming',                  '🎮', '#A855F7', 4, true, 'cat_entertainment', NOW()),
('ent_sports',         'Sports',               'sports',                  '⚽', '#A855F7', 5, true, 'cat_entertainment', NOW()),
('ent_events',         'Events',               'events',                  '🎪', '#A855F7', 6, true, 'cat_entertainment', NOW()),
('ent_concerts',       'Concerts',             'concerts',                '🎤', '#A855F7', 7, true, 'cat_entertainment', NOW()),
('ent_nightlife',      'Nightlife',            'nightlife',               '🌙', '#A855F7', 8, true, 'cat_entertainment', NOW()),
('ent_hobbies',        'Hobbies',              'hobbies',                 '🎨', '#A855F7', 9, true, 'cat_entertainment', NOW()),
('ent_other',          'Other Entertainment',  'other-entertainment',     '📁', '#A855F7', 10, true, 'cat_entertainment', NOW());

-- ============================================================
-- TRAVEL SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('trav_hotels',        'Hotels',               'hotels',                  '🏨', '#3B82F6', 1, true, 'cat_travel', NOW()),
('trav_airbnb',        'Airbnb',               'airbnb',                  '🏠', '#3B82F6', 2, true, 'cat_travel', NOW()),
('trav_flights',       'Flights',              'travel-flights',          '✈️', '#3B82F6', 3, true, 'cat_travel', NOW()),
('trav_bus',           'Bus',                  'travel-bus',              '🚌', '#3B82F6', 4, true, 'cat_travel', NOW()),
('trav_train',         'Train',                'travel-train',            '🚂', '#3B82F6', 5, true, 'cat_travel', NOW()),
('trav_visa',          'Visa',                 'travel-visa',             '📋', '#6B7280', 6, true, 'cat_travel', NOW()),
('trav_passport',      'Passport',             'passport',                '📘', '#3B82F6', 7, true, 'cat_travel', NOW()),
('trav_ins',           'Travel Insurance',     'travel-insurance',        '🛡️', '#06B6D4', 8, true, 'cat_travel', NOW()),
('trav_vacation',      'Vacation',             'vacation',                '🏖️', '#F59E0B', 9, true, 'cat_travel', NOW()),
('trav_tour',          'Tour',                 'tour',                    '🗺️', '#3B82F6', 10, true, 'cat_travel', NOW()),
('trav_other',         'Other Travel',         'other-travel',            '📁', '#3B82F6', 11, true, 'cat_travel', NOW());

-- ============================================================
-- PERSONAL CARE SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('pc_haircut',         'Haircut',              'haircut',                 '✂️', '#EC4899', 1, true, 'cat_personal', NOW()),
('pc_salon',           'Salon',                'salon',                   '💇', '#EC4899', 2, true, 'cat_personal', NOW()),
('pc_spa',             'Spa',                  'spa',                     '💆', '#EC4899', 3, true, 'cat_personal', NOW()),
('pc_nails',           'Nails',                'nails',                   '💅', '#EC4899', 4, true, 'cat_personal', NOW()),
('pc_barber',          'Barber',               'barber',                  '💈', '#EC4899', 5, true, 'cat_personal', NOW()),
('pc_laundry',         'Laundry',              'laundry',                 '👔', '#3B82F6', 6, true, 'cat_personal', NOW()),
('pc_skincare',        'Skincare',             'pc-skincare',             '🧴', '#EC4899', 7, true, 'cat_personal', NOW()),
('pc_cosmetics',       'Cosmetics',            'pc-cosmetics',            '💄', '#EC4899', 8, true, 'cat_personal', NOW()),
('pc_perfume',         'Perfume',              'perfume',                 '🌹', '#EC4899', 9, true, 'cat_personal', NOW()),
('pc_other',           'Other Personal Care',  'other-personal-care',     '📁', '#EC4899', 10, true, 'cat_personal', NOW());

-- ============================================================
-- INSURANCE SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('ins_health',         'Health Insurance',     'health-insurance',        '🏥', '#06B6D4', 1, true, 'cat_insurance', NOW()),
('ins_life',           'Life Insurance',       'life-insurance',          '❤️', '#06B6D4', 2, true, 'cat_insurance', NOW()),
('ins_vehicle',        'Vehicle Insurance',    'vehicle-insurance',       '🚗', '#3B82F6', 3, true, 'cat_insurance', NOW()),
('ins_home',           'Home Insurance',       'home-insurance',          '🏠', '#EF4444', 4, true, 'cat_insurance', NOW()),
('ins_travel',         'Travel Insurance',     'travel-insurance-i',      '✈️', '#3B82F6', 5, true, 'cat_insurance', NOW()),
('ins_gadget',         'Gadget Insurance',     'gadget-insurance',        '📱', '#06B6D4', 6, true, 'cat_insurance', NOW()),
('ins_other',          'Other Insurance',      'other-insurance',         '📁', '#06B6D4', 7, true, 'cat_insurance', NOW());

-- ============================================================
-- RELIGIOUS & CHARITY SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('rel_tithe',          'Tithe',                'tithe',                   '⛪', '#F59E0B', 1, true, 'cat_religious', NOW()),
('rel_offering',       'Offering',             'offering',                '🤲', '#F59E0B', 2, true, 'cat_religious', NOW()),
('rel_thanks',         'Thanksgiving',         'thanksgiving',            '🙏', '#F59E0B', 3, true, 'cat_religious', NOW()),
('rel_seed',           'Seed',                 'seed',                    '🌱', '#F59E0B', 4, true, 'cat_religious', NOW()),
('rel_building',       'Building Fund',        'building-fund',           '🏗️', '#F59E0B', 5, true, 'cat_religious', NOW()),
('rel_mosque',         'Mosque Donation',      'mosque-donation',         '🕌', '#F59E0B', 6, true, 'cat_religious', NOW()),
('rel_charity',        'Charity',              'charity',                 '🤲', '#F43F5E', 7, true, 'cat_religious', NOW()),
('rel_ngo',            'NGO Donation',         'ngo-donation',            '🏢', '#F43F5E', 8, true, 'cat_religious', NOW()),
('rel_other',          'Other Giving',         'other-giving',            '📁', '#F59E0B', 9, true, 'cat_religious', NOW());

-- ============================================================
-- GOVERNMENT & TAXES SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('gov_income_tax',     'Income Tax',           'income-tax',              '💰', '#6B7280', 1, true, 'cat_government', NOW()),
('gov_property_tax',   'Property Tax',         'property-tax',            '🏠', '#6B7280', 2, true, 'cat_government', NOW()),
('gov_biz_tax',        'Business Tax',         'business-tax',            '💼', '#6B7280', 3, true, 'cat_government', NOW()),
('gov_passport',       'Passport',             'gov-passport',            '📘', '#3B82F6', 4, true, 'cat_government', NOW()),
('gov_visa',           'Visa',                 'gov-visa',                '📋', '#6B7280', 5, true, 'cat_government', NOW()),
('gov_license',        'Driver License',       'driver-license',          '🚗', '#3B82F6', 6, true, 'cat_government', NOW()),
('gov_veh_reg',        'Vehicle Registration', 'gov-vehicle-registration','📋', '#6B7280', 7, true, 'cat_government', NOW()),
('gov_court',          'Court Fees',           'court-fees',              '⚖️', '#6B7280', 8, true, 'cat_government', NOW()),
('gov_immigration',    'Immigration',          'immigration',             '🛂', '#6B7280', 9, true, 'cat_government', NOW()),
('gov_other',          'Other Government Fees','other-government-fees',   '📁', '#6B7280', 10, true, 'cat_government', NOW());

-- ============================================================
-- BANKING & FINANCIAL SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('bank_transfer',      'Bank Transfer',        'bank-transfer',           '💸', '#6366F1', 1, true, 'cat_banking', NOW()),
('bank_self',          'Self Transfer',        'banking-self-transfer',   '🔄', '#6366F1', 2, true, 'cat_banking', NOW()),
('bank_cash_with',     'Cash Withdrawal',      'cash-withdrawal',         '💵', '#6366F1', 3, true, 'cat_banking', NOW()),
('bank_cash_dep',      'Cash Deposit',         'cash-deposit',            '💰', '#6366F1', 4, true, 'cat_banking', NOW()),
('bank_atm',           'ATM Withdrawal',       'atm-withdrawal',          '🏧', '#6366F1', 5, true, 'cat_banking', NOW()),
('bank_pos',           'POS Purchase',         'pos-purchase',            '💳', '#8B5CF6', 6, true, 'cat_banking', NOW()),
('bank_pos_cash',      'POS Cash Withdrawal',  'pos-cash-withdrawal',     '💳', '#8B5CF6', 7, true, 'cat_banking', NOW()),
('bank_xfer_charges',  'Transfer Charges',     'transfer-charges',        '💸', '#F59E0B', 8, true, 'cat_banking', NOW()),
('bank_acct_maint',    'Account Maintenance Fee','account-maintenance-fee','🏦', '#6B7280', 9, true, 'cat_banking', NOW()),
('bank_card_maint',    'Card Maintenance Fee', 'card-maintenance-fee',    '💳', '#6B7280', 10, true, 'cat_banking', NOW()),
('bank_card_replace',  'Card Replacement',     'card-replacement',        '💳', '#6B7280', 11, true, 'cat_banking', NOW()),
('bank_sms',           'SMS Alert Charges',    'sms-alert-charges',       '📱', '#6B7280', 12, true, 'cat_banking', NOW()),
('bank_stamp',         'Stamp Duty',           'stamp-duty',              '📋', '#6B7280', 13, true, 'cat_banking', NOW()),
('bank_vat',           'VAT',                  'vat',                     '🏛️', '#6B7280', 14, true, 'cat_banking', NOW()),
('bank_fx',            'FX Charges',           'fx-charges',              '💱', '#6B7280', 15, true, 'cat_banking', NOW()),
('bank_int_charges',   'Interest Charges',     'interest-charges',        '📈', '#6B7280', 16, true, 'cat_banking', NOW()),
('bank_loan_charges',  'Loan Charges',         'loan-charges',            '🏦', '#6B7280', 17, true, 'cat_banking', NOW()),
('bank_failed',        'Failed Transaction',   'failed-transaction',      '❌', '#EF4444', 18, true, 'cat_banking', NOW()),
('bank_reversal',      'Reversal',             'reversal',                '↩️', '#22C55E', 19, true, 'cat_banking', NOW()),
('bank_chargeback',    'Chargeback',           'bank-chargeback',         '↩️', '#EF4444', 20, true, 'cat_banking', NOW()),
('bank_other',         'Other Banking Fees',   'other-banking-fees',      '📁', '#6B7280', 21, true, 'cat_banking', NOW());

-- ============================================================
-- CRYPTOCURRENCY SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('crypto_buy',         'Buy Crypto',           'buy-crypto',              '📈', '#22C55E', 1, true, 'cat_crypto', NOW()),
('crypto_sell',        'Sell Crypto',          'sell-crypto',             '📉', '#EF4444', 2, true, 'cat_crypto', NOW()),
('crypto_wallet',      'Wallet Transfer',      'wallet-transfer',         '💸', '#F59E0B', 3, true, 'cat_crypto', NOW()),
('crypto_dep',         'Exchange Deposit',     'exchange-deposit',        '🏦', '#10B981', 4, true, 'cat_crypto', NOW()),
('crypto_with',        'Exchange Withdrawal',  'exchange-withdrawal',     '💸', '#F59E0B', 5, true, 'cat_crypto', NOW()),
('crypto_stable',      'Stablecoin',           'stablecoin',              '💲', '#10B981', 6, true, 'cat_crypto', NOW()),
('crypto_gas',         'Gas Fees',             'gas-fees',                '⛽', '#F59E0B', 7, true, 'cat_crypto', NOW()),
('crypto_nft',         'NFT',                  'nft',                     '🖼️', '#A855F7', 8, true, 'cat_crypto', NOW()),
('crypto_staking',     'Staking',              'crypto-staking',          '🔒', '#10B981', 9, true, 'cat_crypto', NOW()),
('crypto_yield',       'Yield Farming',        'yield-farming',           '🌾', '#10B981', 10, true, 'cat_crypto', NOW()),
('crypto_other',       'Other Crypto',         'other-crypto',            '📁', '#F59E0B', 11, true, 'cat_crypto', NOW());

-- ============================================================
-- CASH SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('cash_atm',           'ATM Withdrawal',       'cash-atm-withdrawal',     '🏧', '#22C55E', 1, true, 'cat_cash', NOW()),
('cash_withdrawal',    'Cash Withdrawal',      'cash-withdrawal',         '💵', '#22C55E', 2, true, 'cat_cash', NOW()),
('cash_deposit',       'Cash Deposit',         'cash-deposit-c',          '💰', '#22C55E', 3, true, 'cat_cash', NOW()),
('cash_petty',         'Petty Cash',           'petty-cash',              '👛', '#22C55E', 4, true, 'cat_cash', NOW()),
('cash_transfer',      'Cash Transfer',        'cash-transfer',           '💸', '#22C55E', 5, true, 'cat_cash', NOW()),
('cash_other',         'Other Cash Transactions','other-cash-transactions','📁', '#22C55E', 6, true, 'cat_cash', NOW());

-- ============================================================
-- FEES & CHARGES SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('fees_service',       'Service Fee',          'service-fee',             '🔧', '#F59E0B', 1, true, 'cat_fees', NOW()),
('fees_processing',    'Processing Fee',       'processing-fee',          '⚙️', '#F59E0B', 2, true, 'cat_fees', NOW()),
('fees_platform',      'Platform Fee',         'platform-fee',            '💻', '#F59E0B', 3, true, 'cat_fees', NOW()),
('fees_convenience',   'Convenience Fee',      'convenience-fee',         '🛒', '#F59E0B', 4, true, 'cat_fees', NOW()),
('fees_delivery',      'Delivery Fee',         'delivery-fee',            '🚚', '#F59E0B', 5, true, 'cat_fees', NOW()),
('fees_penalty',       'Penalty',              'penalty',                 '⚠️', '#EF4444', 6, true, 'cat_fees', NOW()),
('fees_late',          'Late Fee',             'late-fee',                '⏰', '#EF4444', 7, true, 'cat_fees', NOW()),
('fees_fine',          'Fine',                 'fine',                    '🚨', '#EF4444', 8, true, 'cat_fees', NOW()),
('fees_commission',    'Commission',           'commission',              '🤝', '#F59E0B', 9, true, 'cat_fees', NOW()),
('fees_other',         'Other Charges',        'other-charges',           '📁', '#F59E0B', 10, true, 'cat_fees', NOW());

-- ============================================================
-- TRANSFERS SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('xfer_self',          'Self Transfer',        'transfer-self',           '🔄', '#EC4899', 1, true, 'cat_transfers', NOW()),
('xfer_family',        'Family Transfer',      'family-transfer',         '👨‍👩‍👧‍👦', '#EC4899', 2, true, 'cat_transfers', NOW()),
('xfer_friend',        'Friend Transfer',      'friend-transfer',         '🤝', '#EC4899', 3, true, 'cat_transfers', NOW()),
('xfer_business',      'Business Transfer',    'business-transfer',       '💼', '#EC4899', 4, true, 'cat_transfers', NOW()),
('xfer_employee',      'Employee Payment',     'employee-payment',        '👥', '#EC4899', 5, true, 'cat_transfers', NOW()),
('xfer_supplier',      'Supplier Payment',     'supplier-payment-t',      '🤝', '#EC4899', 6, true, 'cat_transfers', NOW()),
('xfer_gift',          'Gift Transfer',        'gift-transfer',           '🎁', '#EC4899', 7, true, 'cat_transfers', NOW()),
('xfer_loan_disb',     'Loan Disbursement',    'loan-disbursement',       '🏦', '#EC4899', 8, true, 'cat_transfers', NOW()),
('xfer_loan_repay',    'Loan Repayment',       'transfer-loan-repayment', '💳', '#EC4899', 9, true, 'cat_transfers', NOW()),
('xfer_other',         'Other Transfers',      'other-transfers',         '📁', '#EC4899', 10, true, 'cat_transfers', NOW());

-- ============================================================
-- MISCELLANEOUS SUBCATEGORIES
-- ============================================================

INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "isSystem", "parentId", "createdAt") VALUES
('misc_uncategorized', 'Uncategorized',        'uncategorized',           '❓', '#6B7280', 1, true, 'cat_misc', NOW()),
('misc_unknown_debit', 'Unknown Debit',        'unknown-debit',           '❓', '#EF4444', 2, true, 'cat_misc', NOW()),
('misc_unknown_credit','Unknown Credit',       'misc-unknown-credit',     '❓', '#22C55E', 3, true, 'cat_misc', NOW()),
('misc_pending',       'Pending Transaction',  'pending-transaction',     '⏳', '#F59E0B', 4, true, 'cat_misc', NOW()),
('misc_failed',        'Failed Transaction',   'misc-failed-transaction', '❌', '#EF4444', 5, true, 'cat_misc', NOW()),
('misc_duplicate',     'Duplicate Transaction','duplicate-transaction',   '👯', '#6B7280', 6, true, 'cat_misc', NOW()),
('misc_adjustment',    'Adjustment',           'adjustment',              '🔧', '#6B7280', 7, true, 'cat_misc', NOW()),
('misc_test',          'Test Transaction',     'test-transaction',        '🧪', '#6B7280', 8, true, 'cat_misc', NOW()),
('misc_hold',          'Temporary Hold',       'temporary-hold',          '🔒', '#F59E0B', 9, true, 'cat_misc', NOW()),
('misc_other',         'Other',                'other-misc',              '📁', '#6B7280', 10, true, 'cat_misc', NOW());
