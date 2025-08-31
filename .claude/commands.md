# Claude Code Custom Commands - Tennis Ladder App

## Deployment Commands

### `/deploy` - Deploy to Live
Automatically commits all changes and pushes to GitHub, triggering Vercel deployment.

**Usage**: Just type `/deploy` and I'll handle the complete workflow:
1. Check for changes
2. Add all modified files to git
3. Create timestamped commit message
4. Push to GitHub main branch
5. Vercel automatically deploys from GitHub

### `/status` - Check Deployment Status
Shows current git status and any pending changes.

### `/build` - Test Build Locally
Runs `npm run build` to test the production build locally before deploying.

## Quick Development Workflow

1. **Make changes** to your code
2. **Type `/deploy`** - I'll handle git add, commit, push, and trigger Vercel
3. **Check Vercel dashboard** for deployment progress

## Available Git Commands
- `git status` - Check current changes
- `git log --oneline -5` - See recent commits  
- `git push origin main` - Manual push to GitHub
- `./.claude/deploy-to-live.sh` - Run deployment script directly