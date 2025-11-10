# Attendance Stats Issue - Root Cause & Resolution
**Date**: 2025-11-10
**Status**: ✅ **RESOLVED**

## Problem Summary

After deploying the attendance stats feature, the badges and smart sorting were not visible in production, despite:
- No console errors
- Feature working in code
- Data existing in database

## Root Cause Discovered

The database function `get_player_attendance_stats_by_type()` had an incorrect WHERE clause:

### ❌ Original (Broken) Logic:
```sql
WHERE EXISTS (
  SELECT 1 FROM coaching_access
  WHERE coaching_access.player_id = p.id
  AND coaching_access.revoked_at IS NULL
)
```

**Problem**: This filtered to only players with `coaching_access` grants.

### The Reality:
- `coaching_access` table was **empty** (0 records)
- Admins were manually adding players to sessions without creating access grants
- Players like Aidan, Julie S, Holly L, Sal, Liz, Di, Monty H, Edward F had **attendance records** but no **access grants**
- Function returned only 1 player (Jon) instead of 8+ actual attendees

## Diagnostic Process

### 1. Database Verification
- Checked production database directly
- Found 0 coaching sessions (RLS policies blocked anon key)
- Realized data existed but was behind authentication

### 2. Added Debug Logging
Deployed v1.0.163 with console logs to trace:
```javascript
[useCoaching] Calling get_player_attendance_stats_by_type...
[useCoaching] RPC response: { dataLength: 1, sampleData: [...] }
[MarkAttendance] Stats map size: 1 players with stats
[MarkAttendance] Top 5 players: [{name: "Aidan", attendanceCount: 0}, ...]
```

**Key Finding**: Function returned only 1 player despite 64+ players in system and 8+ with attendance history.

### 3. Root Cause Identified
The WHERE clause excluded players without `coaching_access` records, even though they had actual attendance records.

## The Fix

### ✅ Corrected Logic (v2):
```sql
WHERE EXISTS (
  SELECT 1 FROM coaching_attendance
  WHERE coaching_attendance.player_id = p.id
)
```

**Solution**: Filter to players who have **actually attended sessions**, regardless of access grants.

### Why This Works:
1. Includes all players who have attendance records
2. Admin can manually add anyone to a session
3. Function returns everyone with attendance history
4. Badges show up for frequent attendees
5. Smart sorting works correctly

## Files Updated

### SQL Fix:
- `fix_attendance_stats_function_v2.sql` - Corrected WHERE clause

### Debug Logging (Temporary):
- `src/hooks/useCoaching.js` - Added then removed debug logs
- `src/components/Coaching/Modals/MarkAttendanceModal.js` - Added then removed debug logs

### Final Clean Deployment:
- Version 1.0.164 (clean, no debug logs)
- Feature working as designed

## Verification

After applying `fix_attendance_stats_function_v2.sql`:

**Before Fix**:
```
RPC response: { dataLength: 1, sampleData: [...] }
Stats map size: 1 players with stats
All players: attendanceCount: 0
```

**After Fix**:
```
✅ Stats badges visible
✅ Green attendance count badges (e.g., "5x", "3x")
✅ TrendingUp icons showing
✅ Frequent attendees sorted to top
✅ Smart sorting by session type working
```

## Lessons Learned

1. **Assumption Mismatch**: Function assumed all attendees would have `coaching_access` records
2. **Admin Flexibility**: Admins were manually adding players without formal access grants
3. **RLS Complexity**: Row Level Security policies can obscure data during debugging
4. **Debug Logging**: Console logs were essential to identify the exact issue
5. **Data Reality Check**: Always verify assumptions about what data exists in production

## Final Solution

The correct approach is:
- **Don't require `coaching_access` records** to show stats
- **Base stats on actual attendance** (`coaching_attendance` table)
- **Let admins manually add anyone** to sessions
- **Show badges for anyone with attendance history**

This matches the actual usage pattern: admins can add any player to a session, and the stats should reflect whoever has actually attended, regardless of formal access grants.

---

## Result

✅ Feature now working perfectly in production
✅ Badges showing attendance counts
✅ Smart sorting by session type
✅ Frequent attendees at top of list
✅ Clean code without debug logs

**User Feedback**: "Yay! I can see the stats now. Amazing"

---

Generated: 2025-11-10
Issue Resolved by: Claude Code with debugging assistance
