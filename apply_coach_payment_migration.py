#!/usr/bin/env python3
"""
Apply coach payment tracking migration to Supabase database
"""
import os
import sys
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://hwpjrkmplydqaxiikupv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGpya21wbHlkcWF4aWlrdXB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUxNTA2OCwiZXhwIjoyMDcxMDkxMDY4fQ.EtGQNV0Hd0xqrxcJq3z5wVlZz3VPNnNpjsYlQy5MkHg"  # Service role key

def apply_migration():
    """Apply the migration SQL file"""
    print("Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Read the SQL file
    sql_file = "coaching_payment_tracking.sql"
    print(f"Reading {sql_file}...")
    with open(sql_file, 'r') as f:
        sql = f.read()

    print("Applying migration...")
    try:
        # Execute the SQL
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("✓ Migration applied successfully!")
        return True
    except Exception as e:
        # If exec_sql doesn't exist, try splitting into individual statements
        print(f"exec_sql function not available, trying alternative method...")

        # Split into individual statements (rough split by semicolon)
        statements = []
        current_stmt = []
        in_function = False

        for line in sql.split('\n'):
            line_stripped = line.strip()

            # Track if we're inside a function definition
            if 'CREATE OR REPLACE FUNCTION' in line or 'CREATE FUNCTION' in line:
                in_function = True
            elif in_function and line_stripped.startswith('$$'):
                if '$$;' in line or (current_stmt and '$$' in ''.join(current_stmt)):
                    in_function = False

            current_stmt.append(line)

            # If we hit a semicolon outside a function, that's a statement boundary
            if line_stripped.endswith(';') and not in_function:
                stmt = '\n'.join(current_stmt).strip()
                if stmt and not stmt.startswith('--'):
                    statements.append(stmt)
                current_stmt = []

        # Add any remaining statement
        if current_stmt:
            stmt = '\n'.join(current_stmt).strip()
            if stmt and not stmt.startswith('--'):
                statements.append(stmt)

        print(f"Executing {len(statements)} SQL statements...")

        for i, stmt in enumerate(statements, 1):
            if not stmt.strip() or stmt.strip().startswith('--'):
                continue

            try:
                # Try using query for DDL statements
                supabase.postgrest.session.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                    json={"query": stmt},
                    headers={
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}"
                    }
                )
                print(f"  ✓ Statement {i}/{len(statements)}")
            except Exception as stmt_error:
                print(f"  ✗ Statement {i} failed: {stmt_error}")
                print(f"    Statement: {stmt[:100]}...")
                return False

        print("✓ Migration completed!")
        return True

if __name__ == "__main__":
    try:
        success = apply_migration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
