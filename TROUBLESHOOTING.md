# Tennis Ladder App - Troubleshooting Guide

## 🔧 MCP Integration Issues

### Vercel MCP Not Working
**Symptoms**: Claude can't deploy or access Vercel logs
**Solutions**:
1. Check `.mcp.json` configuration:
   ```bash
   cat .mcp.json
   ```
   Verify Vercel token is: `JJQekziXC51YlFBhIK1RKPZE`

2. Test Vercel CLI manually:
   ```bash
   vercel whoami --token JJQekziXC51YlFBhIK1RKPZE
   ```

3. Re-run setup if needed:
   ```bash
   ./scripts/setup-vercel-mcp.sh
   ```

4. **Restart Claude Code** after any MCP configuration changes

### Supabase MCP Not Working
**Symptoms**: Claude can't access database or run queries
**Solutions**:
1. Check Supabase token in `.mcp.json`:
   ```bash
   grep SUPABASE_ACCESS_TOKEN .mcp.json
   ```
   Should show: `sbp_1e915da665c3573755dfef9874ab1c93211c1247`

2. Test Supabase connection:
   ```bash
   npx @supabase/mcp-server-supabase --project-ref=hwpjrkmplydqaxiikupv
   ```

## 🚀 Deployment Issues

### Build Failures
**Symptoms**: Vercel deployment fails with ESLint errors
**Solution**: ESLint is disabled in production via:
- `package.json`: `"build": "DISABLE_ESLINT_PLUGIN=true react-scripts build"`
- `.env.production`: Contains `CI=false`

### Environment Variables Missing
**Symptoms**: App loads but Supabase connection fails
**Check**:
- `.env.local` exists with Supabase credentials
- Vercel environment variables are set (if deploying directly)

### Project Not Linked
**Symptoms**: `vercel` commands fail with "no project found"
**Solution**:
```bash
vercel link --yes --token JJQekziXC51YlFBhIK1RKPZE
```

## 🗄️ Database Issues

### Connection Timeouts
**Symptoms**: Profile loading hangs or fails
**Root Cause**: Database timeout in `useAuth.js:24` (2-second timeout)
**Solution**: Check Supabase project status at https://supabase.com/dashboard

### Missing RLS Policies
**Symptoms**: Permission denied errors in console
**Status**: ❌ CRITICAL - RLS not fully implemented
**Solution**: Run security fixes (Priority #1 issue)

## 🔐 Security Issues Status

### Current Critical Issues:
1. **Environment Variables Exposed**: `.env.local` in repository
2. **19 Database Security Warnings**: From Supabase advisors
3. **RLS Not Implemented**: Tables accessible without proper permissions
4. **Auth Configuration**: OTP expiry too long, password protection disabled

### Security Fix Priority:
This is **Issue #1** from the top 3 critical issues and must be addressed before multi-user launch.

## 📱 Application Issues

### App Not Loading
1. Check console for JavaScript errors
2. Verify Supabase connection in Network tab
3. Check authentication flow in `useAuth.js`

### Authentication Problems
1. Verify Supabase project settings
2. Check email confirmation settings
3. Review auth redirect URLs

### Performance Issues
**Known Issues**:
- Missing database indexes
- Complex joins without optimization
- No query performance monitoring

## 🛠️ Quick Fixes

### Reset Everything
```bash
# 1. Re-install dependencies
npm install

# 2. Reset Vercel connection
rm -rf .vercel
vercel link --yes --token JJQekziXC51YlFBhIK1RKPZE

# 3. Test build
npm run build

# 4. Deploy
vercel --prod --yes --token JJQekziXC51YlFBhIK1RKPZE
```

### Reset MCP Configuration
```bash
# 1. Run setup script
./scripts/setup-vercel-mcp.sh

# 2. Restart Claude Code
# (This must be done manually)

# 3. Test MCP access
# (Claude should now have direct deployment access)
```

## 📞 Getting Help

### Useful Commands
```bash
# Check deployment status
vercel ls --token JJQekziXC51YlFBhIK1RKPZE

# View recent logs
vercel logs --token JJQekziXC51YlFBhIK1RKPZE

# Test local build
npm run build

# Check Supabase status
npx supabase status
```

### Key URLs
- **Production App**: https://tennis-ladder-llw0ervod-jons-projects-9634d9db.vercel.app
- **Vercel Dashboard**: https://vercel.com/jons-projects-9634d9db/tennis-ladder-app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv

### Configuration Files
- **MCP Config**: `.mcp.json` (contains tokens for both Supabase and Vercel)
- **Vercel Config**: `vercel.json` (deployment settings)
- **Environment**: `.env.local` (Supabase credentials)
- **Build Config**: `package.json` (ESLint disabled for production)

---

**Remember**: After any MCP configuration changes, Claude Code must be restarted to activate the new settings.