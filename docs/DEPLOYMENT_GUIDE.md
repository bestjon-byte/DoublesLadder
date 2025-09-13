# Deployment and Configuration Guide

## Deployment Architecture

### Overview
The Tennis Ladder application uses a modern, automated deployment pipeline with the following components:
- **Source Control**: Git with GitHub hosting
- **Frontend**: React SPA with Create React App
- **Backend**: Supabase (PostgreSQL + Authentication + Real-time)
- **Hosting**: Vercel (inferred from deployment scripts)
- **CDN**: Automatic through Vercel's global edge network

---

## Automated Deployment System

### Primary Deployment Methods

#### 1. One-Command Deployment
```bash
./deploy
```
**Features**:
- Auto-increment version numbers
- AI-generated commit messages
- Automatic cache busting
- User notification system
- Complete git workflow automation

#### 2. Custom Message Deployment  
```bash
./deploy "Fix season deletion bug - availability records now deleted correctly"
```

#### 3. Advanced Deployment
```bash
./scripts/auto-deploy.sh patch|minor|major
```

### Deployment Scripts Structure
```
scripts/
├── auto-deploy.sh       # Comprehensive deployment with file analysis
├── quick-deploy.sh      # Fast deployment with minimal prompts
├── deploy.sh           # Version management only
└── .claude/
    ├── deploy-to-live.sh   # Claude Code integration
    └── commands.md         # Custom deployment commands
```

---

## Configuration Files

### 1. Application Configuration

#### package.json
- **Version**: 1.0.49 (auto-managed)
- **Dependencies**: React 18.2.0, Supabase client, Lucide icons
- **Scripts**: Standard Create React App scripts
- **Build**: Optimized for production deployment

#### .mcp.json
- **Purpose**: MCP (Model Context Protocol) configuration
- **Features**: Supabase integration for Claude Code assistant
- **Database**: Direct PostgreSQL access for development

### 2. Supabase Configuration

#### supabaseClient.js
**Features**:
- Environment-based configuration
- Real-time subscriptions
- Authentication integration
- Row-Level Security (RLS) support

**Required Environment Variables**:
```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Progressive Web App (PWA)

#### public/sw.js (Service Worker)
- **Version Management**: Auto-updated with each deployment
- **Cache Strategy**: Network-first for real-time data
- **Update Notifications**: Automatic user notifications
- **Offline Support**: Limited offline functionality

#### public/manifest.json
- **App Identity**: Tennis Ladder branding
- **Install Prompts**: Mobile installation support
- **Icons**: Multi-resolution PWA icons

---

## Version Management System

### Automatic Version Control
1. **Files Updated**:
   - `package.json` - Package version
   - `public/sw.js` - Service worker version
   - `src/utils/versionManager.js` - Application version
   - `public/build-info.json` - Build timestamp

2. **Increment Strategy**:
   - **Default**: Patch (1.0.49 → 1.0.50)
   - **Minor**: Feature additions (1.0.49 → 1.1.0)
   - **Major**: Breaking changes (1.0.49 → 2.0.0)

### User Update Experience
1. **Detection**: Automatic check every 5 minutes
2. **Notification**: Browser notification with haptic feedback
3. **Update Process**: One-click refresh with cache clearing
4. **Fallback**: Manual refresh if service worker fails

---

## Environment Setup

### Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Test production build locally
npx serve -s build
```

### Environment Variables
Create `.env.local` file:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_VERSION=1.0.49
```

### Database Setup
1. **Supabase Project**: Production database with multi-season support
2. **Tables**: 14 core tables (see DATABASE_SCHEMA.md)
3. **RLS**: Enabled on sensitive tables (challenges, conflicts)
4. **Migrations**: Available through MCP integration

---

## Deployment Checklist

### Pre-Deployment
- [ ] Test all major features locally
- [ ] Run `npm run build` successfully
- [ ] Check for console errors
- [ ] Verify database connectivity
- [ ] Test authentication flow

### Deployment Process
1. **Commit Changes**:
   ```bash
   ./deploy "Description of changes"
   ```

2. **Verify Build**: Check Vercel dashboard
3. **Test Live**: Verify all functionality on production URL
4. **Monitor**: Check for errors in browser console
5. **User Communications**: Notify users if major changes

### Post-Deployment
- [ ] Verify PWA update notifications work
- [ ] Check database performance
- [ ] Monitor user feedback
- [ ] Update documentation if needed

---

## Production Monitoring

### Performance Monitoring
- **Build Size**: Monitored through Create React App
- **Bundle Analysis**: Available via webpack-bundle-analyzer
- **Loading Performance**: Service worker cache optimization

### Error Monitoring
- **Frontend**: Browser console and error boundary
- **Backend**: Supabase dashboard and logs
- **Real-time**: Connection stability monitoring

### User Analytics
- **Update Adoption**: Service worker version tracking
- **Feature Usage**: Component-level tracking available
- **Performance**: Core Web Vitals through Vercel

---

## Security Configuration

### Authentication Security
- **Supabase Auth**: Industry-standard JWT tokens
- **Session Management**: Automatic refresh and validation
- **Password Security**: Supabase-managed with reset flow

### Database Security
- **RLS Policies**: Protect sensitive challenge/conflict data
- **UUID Primary Keys**: Prevent enumeration attacks
- **Environment Variables**: Keep secrets out of code

### Frontend Security
- **HTTPS Only**: Enforced in production
- **CSP Headers**: Content Security Policy (Vercel default)
- **Input Validation**: Client and server-side validation

---

## Troubleshooting Guide

### Common Deployment Issues

#### "No changes to deploy"
- **Cause**: All changes already committed
- **Solution**: Make changes or force deploy

#### "Push failed"
- **Cause**: Network or authentication issues
- **Solutions**:
  ```bash
  git config --list  # Check credentials
  git remote -v      # Verify remote
  git push origin main  # Manual push
  ```

#### Script Permission Errors
```bash
chmod +x deploy
chmod +x scripts/*.sh
```

### Runtime Issues

#### Database Connection Timeout
- **Check**: Environment variables
- **Verify**: Supabase project status
- **Test**: MCP connection via Claude Code

#### Service Worker Not Updating
- **Solution**: Hard refresh (Ctrl+Shift+R)
- **Debug**: Check browser Application tab
- **Force**: Clear application cache

#### User Authentication Issues
- **Check**: Supabase Auth settings
- **Verify**: JWT token validity
- **Reset**: Clear browser storage

---

## Development Workflow Best Practices

### Feature Development
1. **Create Feature Branch** (optional)
2. **Develop and Test Locally**
3. **Deploy to Production**: `./deploy "Feature: description"`
4. **Monitor and Iterate**

### Bug Fixes
1. **Identify Issue**: User reports or monitoring
2. **Fix Locally**: Test thoroughly
3. **Deploy**: `./deploy "Fix: specific issue"`
4. **Verify**: Test on production

### Emergency Deployments
1. **Quick Fix**: Address critical issues
2. **Fast Deploy**: `./scripts/quick-deploy.sh "Hotfix: description"`
3. **Monitor**: Watch for resolution
4. **Follow Up**: Document and prevent recurrence

---

## Future Enhancements

### Deployment Pipeline
- **Staging Environment**: Separate testing environment
- **Automated Testing**: Unit/integration test integration
- **Blue-Green Deployment**: Zero-downtime deployments

### Monitoring Improvements
- **Error Tracking**: Sentry or similar service
- **Performance Monitoring**: Real User Monitoring (RUM)
- **Uptime Monitoring**: Service availability tracking

### Security Enhancements
- **Dependency Scanning**: Automated vulnerability checks
- **Security Headers**: Enhanced CSP and security policies
- **Access Controls**: Role-based deployment permissions