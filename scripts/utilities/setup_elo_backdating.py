#!/usr/bin/env python3
"""
Setup script for ELO backdating
This helps you configure the connection and run the backdating process
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required Python packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'psycopg2-binary'])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        print("💡 Try running manually: pip install psycopg2-binary")
        return False

def get_supabase_connection_details():
    """Get Supabase connection details from user"""
    print("\n🔗 Supabase Connection Setup")
    print("=" * 40)
    print("You can find these details in your Supabase Dashboard:")
    print("Go to: Project Settings > Database > Connection string")
    print()
    
    # Option 1: Connection string (easier)
    print("OPTION 1 (Recommended): Use connection string")
    connection_string = input("Paste your connection string here (starts with postgresql://): ").strip()
    
    if connection_string.startswith('postgresql://'):
        return {'type': 'string', 'value': connection_string}
    
    # Option 2: Individual details
    print("\nOPTION 2: Enter details individually")
    host = input("Host (e.g., abc123.supabase.co): ").strip()
    password = input("Password: ").strip()
    
    if host and password:
        return {
            'type': 'config',
            'value': {
                'host': host,
                'database': 'postgres',
                'user': 'postgres',
                'password': password,
                'port': '5432'
            }
        }
    
    return None

def update_backdate_script(connection_details):
    """Update the backdate_elo.py script with connection details"""
    script_path = 'backdate_elo.py'
    
    try:
        with open(script_path, 'r') as f:
            content = f.read()
        
        if connection_details['type'] == 'string':
            # Add connection string
            connection_line = f'CONNECTION_STRING = "{connection_details["value"]}"'
            content = content.replace(
                '# CONNECTION_STRING = "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"',
                connection_line
            )
        else:
            # Update DB_CONFIG
            config = connection_details['value']
            new_config = f"""DB_CONFIG = {{
    'host': '{config["host"]}',
    'database': '{config["database"]}',
    'user': '{config["user"]}',
    'password': '{config["password"]}',
    'port': '{config["port"]}'
}}"""
            
            # Find and replace the DB_CONFIG section
            import re
            pattern = r"DB_CONFIG = \{[^}]+\}"
            content = re.sub(pattern, new_config, content, flags=re.DOTALL)
        
        with open(script_path, 'w') as f:
            f.write(content)
        
        print("✅ Connection details updated in backdate_elo.py")
        return True
        
    except Exception as e:
        print(f"❌ Error updating script: {e}")
        return False

def run_backdating():
    """Run the ELO backdating process"""
    print("\n🎾 Running ELO Backdating for Winter 25...")
    print("=" * 50)
    
    try:
        result = subprocess.run([sys.executable, 'backdate_elo.py'], 
                              capture_output=True, text=True, cwd='.')
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("✅ ELO backdating completed successfully!")
        else:
            print(f"❌ ELO backdating failed with return code: {result.returncode}")
            
    except Exception as e:
        print(f"❌ Error running backdating: {e}")

def main():
    print("🎾 Tennis Ladder ELO Backdating Setup")
    print("=" * 40)
    print("This script will help you:")
    print("1. Install required Python packages")
    print("2. Configure your Supabase connection")
    print("3. Run the ELO backdating for Winter 25")
    print()
    
    # Step 1: Install dependencies
    if not install_requirements():
        return
    
    # Step 2: Get connection details
    connection_details = get_supabase_connection_details()
    if not connection_details:
        print("❌ No valid connection details provided")
        return
    
    # Step 3: Update script
    if not update_backdate_script(connection_details):
        return
    
    # Step 4: Confirm before running
    print(f"\n⚠️  IMPORTANT:")
    print("This will:")
    print("• Clear any existing ELO history for Winter 25")
    print("• Process all 47 match results in chronological order")
    print("• Create new ELO history records for each match")
    print("• Update final ELO ratings based on match results")
    print()
    
    confirm = input("Continue with ELO backdating? (y/N): ").strip().lower()
    if confirm == 'y':
        run_backdating()
    else:
        print("ELO backdating cancelled")
        print("💡 You can run it manually later with: python3 backdate_elo.py")

if __name__ == "__main__":
    main()