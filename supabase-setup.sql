-- Create the Job table for SignFlow
CREATE TABLE Job (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  displayId TEXT UNIQUE NOT NULL,
  clientName TEXT,
  clientContact TEXT,
  jobDescription TEXT,
  orderDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paymentDate TIMESTAMP WITH TIME ZONE,
  targetDate TIMESTAMP WITH TIME ZONE,
  currentStatus TEXT DEFAULT 'Quote/Pending',
  assignedTo TEXT,
  proofLink TEXT,
  materialsNeeded TEXT,
  installationDate TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (optional - can disable if not needed)
ALTER TABLE Job ENABLE ROW LEVEL SECURITY;

-- Allow full access (since we're using password protection on frontend)
CREATE POLICY "Allow all" ON Job FOR ALL USING (true) WITH CHECK (true);
