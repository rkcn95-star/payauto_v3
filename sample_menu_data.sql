-- Sample data for menus table
-- First, insert parent menus (no parent_id)
INSERT INTO public.menus (id, name, path, icon, parent_id, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dashboard', '/dashboard', 'grid', NULL, 1),
  ('66666666-6666-6666-6666-666666666666', 'Products', '/dashboard/products', 'package', NULL, 2),
  ('77777777-7777-7777-7777-777777777777', 'Masters', NULL, 'database', NULL, 3),
  ('22222222-2222-2222-2222-222222222222', 'HR Management', NULL, 'users', NULL, 4),
  ('33333333-3333-3333-3333-333333333333', 'Finance', NULL, 'dollar-sign', NULL, 5),
  ('44444444-4444-4444-4444-444444444444', 'Reports', NULL, 'bar-chart', NULL, 6),
  ('55555555-5555-5555-5555-555555555555', 'Settings', NULL, 'settings', NULL, 7);

-- Then, insert child menus (with parent_id)
INSERT INTO public.menus (id, name, path, icon, parent_id, sort_order) VALUES
  -- Masters children
  ('77777777-7777-7777-7777-777777777771', 'Locations', '/dashboard/masters/locations', 'map-pin', '77777777-7777-7777-7777-777777777777', 1),

  -- HR Management children
  ('22222222-2222-2222-2222-222222222221', 'Employees', '/employees', 'user', '22222222-2222-2222-2222-222222222222', 1),
  ('22222222-2222-2222-2222-222222222222', 'Departments', '/departments', 'building', '22222222-2222-2222-2222-222222222222', 2),
  ('22222222-2222-2222-2222-222222222223', 'Attendance', '/attendance', 'clock', '22222222-2222-2222-2222-222222222222', 3),

  -- Finance children
  ('33333333-3333-3333-3333-333333333331', 'Payroll', '/payroll', 'credit-card', '33333333-3333-3333-3333-333333333333', 1),
  ('33333333-3333-3333-3333-333333333332', 'Expenses', '/expenses', 'receipt', '33333333-3333-3333-3333-333333333333', 2),
  ('33333333-3333-3333-3333-333333333333', 'Budgets', '/budgets', 'pie-chart', '33333333-3333-3333-3333-333333333333', 3),

  -- Reports children
  ('44444444-4444-4444-4444-444444444441', 'Employee Reports', '/reports/employees', 'file-text', '44444444-4444-4444-4444-444444444444', 1),
  ('44444444-4444-4444-4444-444444444442', 'Financial Reports', '/reports/financial', 'trending-up', '44444444-4444-4444-4444-444444444444', 2),

  -- Settings children
  ('55555555-5555-5555-5555-555555555551', 'User Management', '/settings/users', 'user-plus', '55555555-5555-5555-5555-555555555555', 1),
  ('55555555-5555-5555-5555-555555555552', 'System Config', '/settings/system', 'cog', '55555555-5555-5555-5555-555555555555', 2);

-- Sample user menu permissions
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your auth.users table
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

-- For demonstration, let's assume user ID is: 12345678-1234-1234-1234-123456789012
-- Grant access to Dashboard, HR Management (and its children), and Finance (and its children)

INSERT INTO public.user_menu_permissions (user_id, menu_id) VALUES
  -- Dashboard access
  ('12345678-1234-1234-1234-123456789012', '11111111-1111-1111-1111-111111111111'),
  
  -- Products access
  ('12345678-1234-1234-1234-123456789012', '66666666-6666-6666-6666-666666666666'),
  
  -- Masters section access
  ('12345678-1234-1234-1234-123456789012', '77777777-7777-7777-7777-777777777771'), -- Locations

  -- HR Management section access (children will be auto-fetched by the Sidebar component)
  ('12345678-1234-1234-1234-123456789012', '22222222-2222-2222-2222-222222222221'), -- Employees
  ('12345678-1234-1234-1234-123456789012', '22222222-2222-2222-2222-222222222222'), -- Departments
  ('12345678-1234-1234-1234-123456789012', '22222222-2222-2222-2222-222222222223'), -- Attendance
  
  -- Finance section access
  ('12345678-1234-1234-1234-123456789012', '33333333-3333-3333-3333-333333333331'), -- Payroll
  ('12345678-1234-1234-1234-123456789012', '33333333-3333-3333-3333-333333333332'); -- Expenses

-- To use this data:
-- 1. Replace '12345678-1234-1234-1234-123456789012' with your actual user ID
-- 2. Run this SQL in your Supabase SQL editor
-- 3. The sidebar will automatically fetch and display the hierarchical menu structure

-- To get your user ID, run this query first:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com'; 