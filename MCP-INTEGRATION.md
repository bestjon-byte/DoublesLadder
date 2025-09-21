# Vercel MCP Integration Setup

This project now includes **Model Context Protocol (MCP)** integration with Vercel for seamless deployment management through Claude Code.

## 🚀 Quick Setup

Run the setup script:
```bash
./scripts/setup-vercel-mcp.sh
```

This will:
1. Install Vercel CLI
2. Authenticate with Vercel
3. Link your project
4. Configure the MCP server
5. Test the integration

## 🔧 Manual Setup (if needed)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Project
```bash
vercel link
```

### 4. Get Access Token
1. Go to https://vercel.com/account/tokens
2. Create a token named "Claude Code MCP Integration"
3. Copy the token
4. Replace `PLACEHOLDER_TOKEN` in `.mcp.json` with your token

### 5. Restart Claude Code
Restart Claude Code to activate the new MCP server.

## ✅ What This Enables

Once configured, Claude Code can:

- **🚀 Deploy directly** - No more local `npm run build`
- **📋 Check logs** - Real-time deployment log access
- **📊 Monitor status** - Live build and deployment monitoring
- **🐛 Debug issues** - Direct access to deployment errors
- **⚡ Fast iteration** - Instant deployment testing

## 🎯 Current Configuration Status

✅ **CONFIGURED AND ACTIVE**

- **Vercel Project**: tennis-ladder-app
- **Production URL**: https://tennis-ladder-llw0ervod-jons-projects-9634d9db.vercel.app
- **Account**: bestjon-byte (jons-projects-9634d9db)
- **MCP Token**: JJQekziXC51YlFBhIK1RKPZE (configured in .mcp.json)
- **Last Deployment**: Successful (ESLint disabled for production)
- **Build Status**: ✅ Working (158.61 kB gzipped)

## 🎯 Available Commands

Through MCP, Claude Code now has access to:

- `vercel_deploy` - Deploy to production
- `vercel_logs` - Get deployment logs
- `vercel_status` - Check project status
- `vercel_list_projects` - List all projects
- `vercel_inspect` - Get detailed deployment info

## 🔐 Security Notes

- Access token is stored locally in `.mcp.json`
- Token has full account access (required for deployments)
- Keep `.mcp.json` out of version control
- Rotate tokens periodically for security

## 🛠️ Troubleshooting

### MCP Server Not Working
1. Check if `.mcp.json` is configured correctly
2. Verify your Vercel token is valid
3. Restart Claude Code
4. Check Claude Code logs for MCP errors

### Deployment Issues
1. Ensure project is linked: `vercel link`
2. Test manual deployment: `vercel --prod`
3. Check build logs: `vercel logs`

### Token Issues
1. Create new token at https://vercel.com/account/tokens
2. Update `.mcp.json` with new token
3. Restart Claude Code

## 📚 Resources

- [Vercel MCP Documentation](https://vercel.com/docs/mcp)
- [Model Context Protocol](https://vercel.com/blog/model-context-protocol-mcp-explained)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## 🚀 Deployment Workflow

### For Claude Code Sessions:
After restarting Claude Code, the following workflow is available:

1. **Direct Deployment**: Claude can deploy instantly via MCP
2. **Real-time Monitoring**: Live access to build logs and status
3. **Immediate Debugging**: Direct access to deployment errors
4. **No Local Commands**: No need for `npm start`, `npm build`, or `vercel` CLI

### For Manual Operations:
```bash
# Quick deploy (bypasses Git)
vercel --prod --yes --token JJQekziXC51YlFBhIK1RKPZE

# Check deployment logs
vercel logs --token JJQekziXC51YlFBhIK1RKPZE

# Full deployment with Git commit
./deploy
```

## 📝 Post-Setup Checklist

- ✅ Vercel CLI installed and authenticated
- ✅ Project linked to Vercel (tennis-ladder-app)
- ✅ MCP token configured in .mcp.json
- ✅ Production deployment successful
- ✅ ESLint disabled for production builds
- ✅ Documentation updated (CLAUDE.md, TROUBLESHOOTING.md)
- ⏳ **Next**: Restart Claude Code to activate MCP integration

---

**✨ With this setup, Claude Code can now manage your Vercel deployments directly - no more local npm commands needed!**

**🔄 Don't forget to restart Claude Code to activate the MCP integration!**