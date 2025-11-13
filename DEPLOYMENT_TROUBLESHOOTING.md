## Quick Fix for Deployment Error

The error about 'PoundSterling' suggests a build cache issue. Here's what to try:

### Option 1: Clear Vercel Build Cache
1. Go to Vercel Dashboard: https://vercel.com/jons-projects-9634d9db/ladder/settings
2. Navigate to Settings → General
3. Click 'Clear Build Cache'
4. Trigger a new deployment

### Option 2: Apply Database Migration First
The app might be failing because the database migration hasn't been applied yet.

1. Go to Supabase Dashboard SQL Editor
2. Run the migration: `migrations/remove_coaching_access_control.sql`
3. This will update RLS policies and remove coaching_access table

### Option 3: Check Which Branch is Deployed
- Production URL (cawood-tennis.vercel.app) should point to 'main' branch
- Feature branch should have its own preview URL
- Check Vercel dashboard to see which branch/commit is deployed

### The PoundSterling Error
This icon doesn't exist in our codebase. This suggests:
- Old build cache being used
- Browser cache needs clearing  
- Deployment using stale node_modules

### Recommended Steps:
1. **Apply database migration first** (see MIGRATION_INSTRUCTIONS.md)
2. **Clear Vercel build cache**
3. **Redeploy from clean state**
4. **Clear browser cache** (Cmd/Ctrl + Shift + R)


