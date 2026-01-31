# Cleanup Action Plan
**Created:** 2025-11-13
**Status:** 📋 READY TO EXECUTE

---

## Quick Summary

**Total Cleanup Time:** 2-3 days
**Priority:** HIGH
**Risk:** LOW (no production impact)

---

## Phase 1: Quick Wins (Day 1 - 8 hours)

### Morning (4 hours)

**Step 1: Delete Debug Scripts (30 min)**
```bash
# Create cleanup script
chmod +x cleanup-phase1.sh
./cleanup-phase1.sh

# Manual verification
git status
# Should see ~50 deleted files
```

**Step 2: Organize Remaining Files (30 min)**
```bash
# Move SQL migrations
mkdir -p supabase/migrations/applied
mv coaching_schema.sql supabase/migrations/applied/
mv coaching_payment_restructure.sql supabase/migrations/applied/
# ... etc (see audit for full list)

# Move utility scripts
mkdir -p scripts/utilities
mv backdate_elo.py scripts/utilities/
mv elo_*.py scripts/utilities/
# ... etc
```

**Step 3: Delete Dead Code (5 min)**
```bash
rm src/components/Coaching/Admin/SessionManagement.js
git add .
git commit -m "Remove unused SessionManagement component (241 lines)"
```

**Step 4: Fix Console Statements (2 hours)**

Find and remove all console.log:
```bash
# Find all console statements
grep -r "console\." src/ --include="*.js"

# Remove manually or use sed:
# sed -i '' '/console\.log/d' src/hooks/useAuth.js
# (Repeat for each file)
```

Files to clean:
- src/hooks/useAuth.js
- src/hooks/useSeasonManager.js
- src/hooks/useCoaching.js
- src/utils/versionManager.js
- (See audit for full list - 40 files total)

Keep only `console.error()` for critical failures.

### Afternoon (4 hours)

**Step 5: Fix Hard Reloads (3 hours)**

Replace `window.location.reload()` with proper state management:

Files to fix:
1. `src/utils/versionManager.js` (4 instances)
2. `src/components/Modals/EnhancedScoreModal.js` (2 instances)
3. `src/components/Auth/PasswordUpdate.js` (1 instance)
4. `src/components/shared/ErrorBoundary.js` (1 instance)
5. `src/components/shared/UpdateNotification.js` (2 instances)
6. `src/components/shared/LoadingScreen.js` (1 instance)
7. `src/App.js` (1 instance)

**Example fix:**
```javascript
// BEFORE
setTimeout(() => window.location.reload(), 2000);

// AFTER
setTimeout(() => {
  if (refetch?.allData) refetch.allData();
  if (refetch?.seasons) refetch.seasons();
  setShowModal(false);
}, 2000);
```

**Step 6: Consolidate Documentation (1 hour)**

Delete outdated docs:
```bash
rm README.md  # Will replace with new one
rm PROJECT-STATUS.md
rm COACHING_IMPROVEMENT_PLAN.md
rm SPRINT_5_DASHBOARD_PLAN.md
rm PAYMENT_REMINDER_BUG_RESOLVED.md
# ... (see audit for full list)

# Keep only:
# - CLAUDE.md (good!)
# - CODEBASE_AUDIT_2025-11-13.md (this audit)
# - CLEANUP_ACTION_PLAN.md (this file)
# Note: SUPABASE_SCHEMA.md deleted - query live database instead

# Create new README.md
# (See NEW_README.md in this repo)
```

**End of Day 1 Checkpoint:**
- ✅ Clean root directory (~20 files instead of 150+)
- ✅ No console statements in production
- ✅ No hard page reloads
- ✅ Single authoritative README

---

## Phase 2: Refactoring (Days 2-3 - 16 hours)

### Day 2 Morning (4 hours): Split ProfileTab.js

**Current:** 1,856 lines with 14 nested components
**Target:** Main file ~200 lines + 8-10 sub-components

**Steps:**
1. Create directory: `src/components/Profile/subcomponents/`
2. Extract components one by one:
   - CombinedEloCard.js
   - StatsCard.js
   - MatchHistory.js
   - BestPartners.js
   - Nemesis.js
   - HeadToHead.js
   - StatsDetailModal.js
   - MatchDetailModal.js
3. Update imports in ProfileTab.js
4. Test thoroughly

### Day 2 Afternoon (4 hours): Split useApp.js

**Current:** 1,757 lines managing too many concerns
**Target:** Split into 4 focused hooks

**New structure:**
- `useApp.js` - Main hook (users, current season) ~400 lines
- `useSeasonPlayers.js` - Season-specific player data ~400 lines
- `useMatchData.js` - Fixtures and results ~400 lines
- `useAvailability.js` - Availability management ~300 lines

### Day 3 Morning (3 hours): Split useCoaching.js

**Current:** 1,034 lines
**Target:** Split into 4 hooks

**New structure:**
- `useCoachingSchedules.js` ~250 lines
- `useCoachingSessions.js` ~300 lines
- `useCoachingAttendance.js` ~250 lines
- `useCoachingPayments.js` ~250 lines

### Day 3 Afternoon (3 hours): Create CoachingContext

Reduce props drilling by creating context:

```javascript
// src/contexts/CoachingContext.js
export const CoachingProvider = ({ children, userId, isAdmin }) => {
  const schedules = useCoachingSchedules(userId, isAdmin);
  const sessions = useCoachingSessions(userId, isAdmin);
  const attendance = useCoachingAttendance(userId, isAdmin);
  const payments = useCoachingPayments(userId, isAdmin);

  return (
    <CoachingContext.Provider value={{
      schedules,
      sessions,
      attendance,
      payments
    }}>
      {children}
    </CoachingContext.Provider>
  );
};
```

### Day 3: Remaining Tasks (2 hours)

1. Rename `ScheduleModal.js` duplicates
2. Fix "Will be moved to League/LeagueTab later" comment
3. Run build and fix any broken imports
4. Test all features manually

**End of Phase 2 Checkpoint:**
- ✅ All files <500 lines
- ✅ Components testable
- ✅ Better performance (can memoize now)
- ✅ Reduced props drilling

---

## Phase 3: Performance (Optional - 1-2 days)

**Only do this if Phase 1 & 2 go smoothly**

### Tasks:
1. Add React.memo to 40+ components (4 hrs)
2. Add useMemo to expensive calculations (2 hrs)
3. Add code splitting (lazy loading) (2 hrs)
4. Add pagination to large queries (2 hrs)
5. Add loading skeletons (2 hrs)

**Total:** 12 hours

---

## Testing Checklist (After Each Phase)

After Phase 1:
- [ ] App builds successfully
- [ ] No console errors in browser
- [ ] Authentication still works
- [ ] Match submission works
- [ ] Coaching features work
- [ ] Payment confirmation works

After Phase 2:
- [ ] All features from Phase 1 still work
- [ ] Profile tab renders correctly
- [ ] Match data displays
- [ ] Coaching admin tab works
- [ ] No performance regressions

After Phase 3:
- [ ] App feels faster
- [ ] Initial load time improved
- [ ] Large lists scroll smoothly

---

## Rollback Plan

If anything breaks:

```bash
# Rollback to before cleanup
git log --oneline -10
git reset --hard <commit-before-cleanup>
git push origin claude/code-audit-cleanup-plan-01SCRDJFPhDxeMQ21pNGPY6s --force

# Restore production
vercel --prod
```

**Important:** Commit after EACH major step so you can rollback granularly.

---

## Commit Strategy

**Small, frequent commits:**

Phase 1:
```bash
git commit -m "Delete 50+ debug scripts"
git commit -m "Remove console.log statements (259 instances)"
git commit -m "Replace window.location.reload() with state management (12 instances)"
git commit -m "Consolidate documentation (delete 18 outdated files)"
git commit -m "Delete SessionManagement.js unused component"
```

Phase 2:
```bash
git commit -m "Extract ProfileTab subcomponents (1856 → 200 lines)"
git commit -m "Split useApp into 4 focused hooks"
git commit -m "Split useCoaching into 4 focused hooks"
git commit -m "Create CoachingContext to reduce props drilling"
```

Phase 3:
```bash
git commit -m "Add React.memo to modal components"
git commit -m "Add useMemo to expensive calculations"
git commit -m "Add code splitting for lazy loading"
```

---

## Success Criteria

### After Phase 1:
- Root directory has <30 files
- Zero console.log in src/
- Zero window.location.reload()
- One authoritative README.md

### After Phase 2:
- Largest file is <500 lines
- Components are testable
- Hooks have single responsibility
- Props drilling reduced

### After Phase 3:
- App loads 20%+ faster
- Smooth scrolling on mobile
- Better perceived performance

---

## Need Help?

If you get stuck:

1. **Check the audit:** `CODEBASE_AUDIT_2025-11-13.md` has detailed explanations
2. **Rollback:** Use git to go back to last working state
3. **Ask for help:** Bring in another developer to pair

---

## Ready to Start?

```bash
# 1. Create a new branch for cleanup
git checkout -b cleanup/phase1-quick-wins

# 2. Start with file cleanup
chmod +x cleanup-phase1.sh
./cleanup-phase1.sh

# 3. Commit
git add .
git commit -m "Phase 1: Delete debug scripts and organize root directory"

# 4. Continue with console.log removal...
```

---

**LET'S CLEAN THIS UP! 🧹**
