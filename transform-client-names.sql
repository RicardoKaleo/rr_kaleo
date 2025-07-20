-- Transform clients table: Split name field into first_name and last_name
-- This script safely transforms existing data and updates the table structure

-- Step 1: Add the new columns
ALTER TABLE clients ADD COLUMN first_name TEXT;
ALTER TABLE clients ADD COLUMN last_name TEXT;

-- Step 2: Split existing name data into first_name and last_name
-- This handles cases where there might be multiple spaces or special characters
UPDATE clients 
SET 
  first_name = CASE 
    WHEN name ~ '^[A-Za-z]+$' THEN name  -- Single word names
    WHEN name ~ '^[A-Za-z]+\s+[A-Za-z]+$' THEN SPLIT_PART(name, ' ', 1)  -- Two word names
    WHEN name ~ '^[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+$' THEN SPLIT_PART(name, ' ', 1)  -- Three word names (take first)
    ELSE SPLIT_PART(name, ' ', 1)  -- Default: take first word
  END,
  last_name = CASE 
    WHEN name ~ '^[A-Za-z]+$' THEN ''  -- Single word names get empty last name
    WHEN name ~ '^[A-Za-z]+\s+[A-Za-z]+$' THEN SPLIT_PART(name, ' ', 2)  -- Two word names
    WHEN name ~ '^[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+$' THEN 
      SPLIT_PART(name, ' ', 2) || ' ' || SPLIT_PART(name, ' ', 3)  -- Three word names (combine last two)
    ELSE 
      SUBSTRING(name FROM POSITION(' ' IN name) + 1)  -- Default: everything after first space
  END;

-- Step 3: Make the new columns NOT NULL (after data is populated)
ALTER TABLE clients ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE clients ALTER COLUMN last_name SET NOT NULL;

-- Step 4: Drop the old name column
ALTER TABLE clients DROP COLUMN name;

-- Step 5: Add indexes for better performance on name searches
CREATE INDEX idx_clients_first_name ON clients(first_name);
CREATE INDEX idx_clients_last_name ON clients(last_name);
CREATE INDEX idx_clients_full_name ON clients(first_name, last_name);

-- Step 6: Update any existing RLS policies that might reference the old 'name' column
-- (Note: You may need to update your application code to use first_name and last_name instead of name)

-- Optional: Add a computed column for full name if needed
-- ALTER TABLE clients ADD COLUMN full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED; 