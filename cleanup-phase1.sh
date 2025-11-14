#!/bin/bash

# Phase 1 Cleanup Script - Delete debug scripts and organize root directory
# Created: 2025-11-13
# Run with: chmod +x cleanup-phase1.sh && ./cleanup-phase1.sh

echo "======================================"
echo "Phase 1: Root Directory Cleanup"
echo "======================================"
echo ""

# Safety check
echo "⚠️  WARNING: This will delete 50+ debug scripts from root directory"
echo "Press Ctrl+C within 5 seconds to abort..."
sleep 5

echo ""
echo "🗑️  Deleting debug SQL scripts..."

# Debug SQL scripts (one-time diagnostics - no longer needed)
rm -f check_all_liz_sessions.py
rm -f check_all_sessions.py
rm -f check_jon_best_token_click.sql
rm -f check_liz_attendance_simple.sql
rm -f check_liz_coaching_data.sql
rm -f check_sarah_attendance_detail.sql
rm -f check_sarah_nutbrown_status.sql
rm -f check_specific_token.sql
rm -f diagnose_payment_token_issue.sql
rm -f diagnose_sarah_payment_bug.sql
rm -f diagnose_why_link_didnt_work.sql
rm -f find_sarah_data.sql
rm -f find_sarah_old_id.sql
rm -f test_token_validation.sql
rm -f verify_payment_fix.sql
rm -f reassign_liz_myers_to_liz.sql
rm -f reassign_liz_beginners_FINAL.sql
rm -f reassign_liz_coaching_sessions.sql
rm -f reassign_liz_sessions.py
rm -f fix_sarah_null_payment_status.sql
rm -f fix_sarah_nutbrown_coaching.sql
rm -f simple_recovery.sql
rm -f recover_from_logs.sql
rm -f payment_reminder_diagnostic.sql
rm -f payment_system_check.sql
rm -f check_rpc_logic.sql
rm -f check_current_rls_policies.sql
rm -f check_cascade_delete.sql
rm -f check_sarah_nutbrown_status.sql
rm -f audit_all_merges.sql
rm -f create_payment_from_sessions.sql
rm -f check_all_liz_sessions.py
rm -f check_all_sessions.py

echo "✅ Deleted debug SQL scripts"
echo ""

echo "🗑️  Deleting outdated documentation..."

# Outdated documentation (will be replaced with single README)
rm -f PROJECT-STATUS.md
rm -f COACHING_IMPROVEMENT_PLAN.md
rm -f SPRINT_5_DASHBOARD_PLAN.md
rm -f PAYMENT_REMINDER_BUG_RESOLVED.md
rm -f PAYMENT_REMINDER_FIX_GUIDE.md
rm -f PAYMENT_REMINDER_IMPLEMENTATION_GUIDE.md
rm -f COACHING_PAYMENT_RESTRUCTURE_README.md
rm -f BUG_FIX_REPORT_SAMUEL_PAYMENT.md
rm -f BUG_REPORT_PARTIAL_PAYMENTS.md
rm -f COACHING_ACCESS_REMOVAL_SUMMARY.md
rm -f COACHING_IMPROVEMENTS_COMPLETED.md
rm -f COACHING_IMPORT_COMPLETE.md
rm -f CREDENTIALS-SETUP.md
rm -f MIGRATION_INSTRUCTIONS.md
rm -f MCP-INTEGRATION.md
rm -f SQL_README.md
rm -f TROUBLESHOOTING.md
rm -f PLAYERS_GUIDE.md
rm -f COACHING_DOCUMENTATION.md

echo "✅ Deleted outdated documentation"
echo ""

echo "📁 Organizing utility scripts..."

# Create directories if they don't exist
mkdir -p scripts/utilities
mkdir -p supabase/migrations/applied

# Move utility scripts
[ -f backdate_elo.py ] && mv backdate_elo.py scripts/utilities/
[ -f elo_calculator_helper.py ] && mv elo_calculator_helper.py scripts/utilities/
[ -f elo_simulation.py ] && mv elo_simulation.py scripts/utilities/
[ -f apply_coach_payment_migration.py ] && mv apply_coach_payment_migration.py scripts/utilities/
[ -f enhanced_elo_deletion.js ] && mv enhanced_elo_deletion.js scripts/utilities/
[ -f query-user.js ] && mv query-user.js scripts/utilities/
[ -f update-role.js ] && mv update-role.js scripts/utilities/
[ -f test-name-shortening.js ] && mv test-name-shortening.js scripts/utilities/
[ -f setup_elo_backdating.py ] && mv setup_elo_backdating.py scripts/utilities/
[ -f supabase_elo_backdating.py ] && mv supabase_elo_backdating.py scripts/utilities/

echo "✅ Moved utility scripts to scripts/utilities/"
echo ""

echo "📁 Organizing SQL migrations..."

# Move SQL migrations that have been applied
[ -f coaching_schema.sql ] && mv coaching_schema.sql supabase/migrations/applied/
[ -f coaching_payment_restructure.sql ] && mv coaching_payment_restructure.sql supabase/migrations/applied/
[ -f coaching_attendance_stats_function.sql ] && mv coaching_attendance_stats_function.sql supabase/migrations/applied/
[ -f coaching_session_generation_function.sql ] && mv coaching_session_generation_function.sql supabase/migrations/applied/
[ -f payment_reminder_session_based.sql ] && mv payment_reminder_session_based.sql supabase/migrations/applied/
[ -f payment_reminder_system.sql ] && mv payment_reminder_system.sql supabase/migrations/applied/
[ -f payment_reminder_system_fix.sql ] && mv payment_reminder_system_fix.sql supabase/migrations/applied/
[ -f elo_management_functions.sql ] && mv elo_management_functions.sql supabase/migrations/applied/
[ -f fix_ambiguous_player_id.sql ] && mv fix_ambiguous_player_id.sql supabase/migrations/applied/
[ -f fix_payment_id_constraint.sql ] && mv fix_payment_id_constraint.sql supabase/migrations/applied/
[ -f fix_payment_reminder_session_based.sql ] && mv fix_payment_reminder_session_based.sql supabase/migrations/applied/
[ -f fix_payment_token_function.sql ] && mv fix_payment_token_function.sql supabase/migrations/applied/
[ -f fix_player_mark_payment_rls.sql ] && mv fix_player_mark_payment_rls.sql supabase/migrations/applied/
[ -f fix_player_mark_payment_ambiguous_columns.sql ] && mv fix_player_mark_payment_ambiguous_columns.sql supabase/migrations/applied/
[ -f fix_rls_for_non_admin.sql ] && mv fix_rls_for_non_admin.sql supabase/migrations/applied/
[ -f fix_anon_rls_access.sql ] && mv fix_anon_rls_access.sql supabase/migrations/applied/
[ -f coaching-import.sql ] && mv coaching-import.sql supabase/migrations/applied/
[ -f coaching_payment_tracking.sql ] && mv coaching_payment_tracking.sql supabase/migrations/applied/
[ -f update_generate_sessions_selective.sql ] && mv update_generate_sessions_selective.sql supabase/migrations/applied/
[ -f cleanup_cancelled_sessions_coach_payment.sql ] && mv cleanup_cancelled_sessions_coach_payment.sql supabase/migrations/applied/

echo "✅ Moved SQL migrations to supabase/migrations/applied/"
echo ""

echo "🗑️  Deleting dead code..."

# Delete unused component
rm -f src/components/Coaching/Admin/SessionManagement.js

echo "✅ Deleted SessionManagement.js (unused - 241 lines)"
echo ""

echo "======================================"
echo "✅ Phase 1 Cleanup Complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "  - Deleted ~50 debug scripts"
echo "  - Deleted ~20 outdated docs"
echo "  - Organized utility scripts"
echo "  - Organized SQL migrations"
echo "  - Deleted dead code"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Verify app still works: npm start"
echo "  3. Commit: git add . && git commit -m 'Phase 1: Clean root directory'"
echo ""
echo "📖 See CLEANUP_ACTION_PLAN.md for next steps (Phase 2: Refactoring)"
