-- Sample configuration for testing the locations master page
-- This creates the necessary tables and sample data

-- 1. Create the company_locations table for testing
CREATE TABLE IF NOT EXISTS public.company_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create a view for form configurations (if it doesn't exist)
CREATE OR REPLACE VIEW public.form_configurations_view AS
SELECT 
    'locations'::text as slug,
    'Location'::text as form_title,
    'company_locations'::text as primary_table_name,
    '{
        "default_columns": [
            {
                "header": "Name",
                "accessorKey": "name",
                "type": "text"
            },
            {
                "header": "City",
                "accessorKey": "city",
                "type": "text"
            },
            {
                "header": "State",
                "accessorKey": "state",
                "type": "text"
            },
            {
                "header": "Status",
                "accessorKey": "status",
                "type": "status"
            },
            {
                "header": "Created At",
                "accessorKey": "created_at",
                "type": "date"
            }
        ]
    }'::jsonb as datatable_config,
    '[
        {
            "section_title": "Basic Information",
            "fields": [
                {
                    "name": "name",
                    "label": "Location Name",
                    "type": "text",
                    "required": true,
                    "placeholder": "Enter location name"
                },
                {
                    "name": "address",
                    "label": "Address",
                    "type": "textarea",
                    "required": false,
                    "placeholder": "Enter full address",
                    "rows": 3
                },
                {
                    "name": "city",
                    "label": "City",
                    "type": "text",
                    "required": true,
                    "placeholder": "Enter city name"
                },
                {
                    "name": "state",
                    "label": "State/Province",
                    "type": "text",
                    "required": true,
                    "placeholder": "Enter state or province"
                },
                {
                    "name": "country",
                    "label": "Country",
                    "type": "select",
                    "required": true,
                    "options": [
                        {"value": "US", "label": "United States"},
                        {"value": "CA", "label": "Canada"},
                        {"value": "UK", "label": "United Kingdom"},
                        {"value": "IN", "label": "India"},
                        {"value": "AU", "label": "Australia"}
                    ]
                },
                {
                    "name": "postal_code",
                    "label": "Postal Code",
                    "type": "text",
                    "required": false,
                    "placeholder": "Enter postal/zip code"
                }
            ]
        },
        {
            "section_title": "Contact Information",
            "fields": [
                {
                    "name": "phone",
                    "label": "Phone Number",
                    "type": "text",
                    "required": false,
                    "placeholder": "Enter phone number"
                },
                {
                    "name": "email",
                    "label": "Email Address",
                    "type": "email",
                    "required": false,
                    "placeholder": "Enter email address",
                    "validation": "email"
                },
                {
                    "name": "status",
                    "label": "Status",
                    "type": "select",
                    "required": true,
                    "options": [
                        {"value": "active", "label": "Active"},
                        {"value": "inactive", "label": "Inactive"}
                    ]
                }
            ]
        }
    ]'::jsonb as form_config,
    gen_random_uuid() as id;

-- 3. Insert sample location data
INSERT INTO public.company_locations (name, address, city, state, country, postal_code, phone, email, status) VALUES
    ('Headquarters', '123 Business Ave, Suite 100', 'New York', 'NY', 'US', '10001', '+1-555-0123', 'hq@company.com', 'active'),
    ('West Coast Office', '456 Tech Blvd, Floor 5', 'San Francisco', 'CA', 'US', '94102', '+1-555-0456', 'west@company.com', 'active'),
    ('European Office', '789 International St', 'London', 'London', 'UK', 'SW1A 1AA', '+44-20-7946-0958', 'europe@company.com', 'active'),
    ('Manufacturing Plant', '321 Industrial Way', 'Detroit', 'MI', 'US', '48201', '+1-555-0789', 'plant@company.com', 'inactive'),
    ('R&D Center', '654 Innovation Drive', 'Austin', 'TX', 'US', '73301', '+1-555-0321', 'rd@company.com', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Create an updated_at trigger for the locations table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_company_locations_updated_at ON public.company_locations;
CREATE TRIGGER update_company_locations_updated_at
    BEFORE UPDATE ON public.company_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON public.company_locations TO authenticated;
-- GRANT ALL ON public.form_configurations_view TO authenticated; 