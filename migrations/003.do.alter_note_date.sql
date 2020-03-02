ALTER TABLE noteful_notes
Add Column 
    date_modified TIMESTAMPTZ DEFAULT NOW() NOT NULL;