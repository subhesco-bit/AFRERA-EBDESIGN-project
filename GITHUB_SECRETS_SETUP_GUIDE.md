# GitHub Secrets Setup Guide for Claude AI Integration

## Overview
This guide walks you through configuring the necessary GitHub secrets for integrating Claude AI with your EBDESIGN project through GitHub Actions.

## Required GitHub Secrets

### 1. ANTHROPIC_API_KEY (Required)
**Purpose:** Enables Claude AI API calls in GitHub Actions workflows

**How to create:**
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `sk-ant-`)

**Add to GitHub:**
1. Go to your repository: https://github.com/subhesco-bit/AFRERA-EBDESIGN-project
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `ANTHROPIC_API_KEY`
5. Value: Paste your Anthropic API key
6. Click "Add secret"

**Note:** The current backend `.env` file contains a placeholder key that needs to be replaced with your actual Anthropic API key.

### 2. GITHUB_TOKEN (Automatic)
**Purpose:** Built-in GitHub token for repository operations

**Status:** Automatically provided by GitHub Actions - no manual setup needed

**Usage:** Automatically available in all workflows as `${{ secrets.GITHUB_TOKEN }}`

### Optional GitHub Secrets

### 3. DATABASE_URL (Optional - for deployments)
**Purpose:** Database connection string for deployment environments

**Format:** `postgresql://username:password@host:port/database`

**Add to GitHub:**
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `DATABASE_URL`
4. Value: Your production database connection string
5. Click "Add secret"

### 4. SLACK_WEBHOOK (Optional - for notifications)
**Purpose:** Send deployment notifications to Slack

**How to create:**
1. Go to https://api.slack.com/apps
2. Create a new Slack app or use existing
3. Enable Incoming Webhooks
4. Create a webhook URL
5. Copy the webhook URL

**Add to GitHub:**
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `SLACK_WEBHOOK`
4. Value: Paste your Slack webhook URL
5. Click "Add secret"

## Environment-Specific Secrets

### Staging Environment
Create these secrets for the staging environment:

**STAGING_DATABASE_URL:** Database connection for staging
**STAGING_API_BASE_URL:** API base URL for staging
**STAGING_FRONTEND_URL:** Frontend URL for staging

### Production Environment
Create these secrets for the production environment:

**PROD_DATABASE_URL:** Database connection for production
**PROD_API_BASE_URL:** API base URL for production
**PROD_FRONTEND_URL:** Frontend URL for production

## Step-by-Step Setup Process

### Step 1: Create Anthropic API Key
```bash
# 1. Visit https://console.anthropic.com/
# 2. Sign up/sign in
# 3. Navigate to API Keys
# 4. Create new key
# 5. Copy the key (format: sk-ant-...)
```

### Step 2: Add Secret to GitHub
```bash
# Via GitHub UI:
# 1. Go to https://github.com/subhesco-bit/AFRERA-EBDESIGN-project/settings/secrets/actions
# 2. Click "New repository secret"
# 3. Name: ANTHROPIC_API_KEY
# 4. Value: [paste your key]
# 5. Click "Add secret"
```

### Step 3: Update Local Environment
```bash
# Update backend/.env file
# Replace the placeholder with your actual key:
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Step 4: Test the Integration
```bash
# Trigger the Claude AI integration workflow manually:
# 1. Go to GitHub Actions tab
# 2. Select "Claude AI Integration" workflow
# 3. Click "Run workflow"
# 4. Select branch and click "Run workflow"
# 5. Monitor the results
```

## Verification Steps

### 1. Verify Secret is Set
```bash
# Via GitHub CLI (if installed):
gh secret list

# You should see ANTHROPIC_API_KEY in the list
```

### 2. Test Claude AI Connection
```bash
# Run the Claude AI integration workflow:
# GitHub → Actions → Claude AI Integration → Run workflow

# Check the logs for:
# ✅ Claude API connection successful
# ✅ Claude AI Coordinator loaded successfully
```

### 3. Test Full CI/CD Pipeline
```bash
# Make a small change and push:
git add .
git commit -m "test: verify Claude AI integration"
git push origin main

# Monitor the Actions tab for all workflows to pass
```

## Security Best Practices

1. **Never commit secrets to repository** - Always use GitHub Secrets
2. **Rotate API keys regularly** - Update secrets when rotating keys
3. **Use environment-specific secrets** - Different keys for dev/staging/prod
4. **Monitor usage** - Check Anthropic console for API usage
5. **Limit permissions** - Give API keys minimum required permissions

## Troubleshooting

### "ANTHROPIC_API_KEY not found"
- Ensure the secret is added to GitHub repository settings
- Check the secret name matches exactly: `ANTHROPIC_API_KEY`
- Verify you're adding it to the correct repository

### "Claude API connection failed"
- Verify the API key is valid and active
- Check if the key has sufficient credits/quotas
- Ensure the key has the correct permissions

### "Workflow permission denied"
- Check workflow permissions in repository settings
- Ensure "Actions" has permission to read/write secrets
- Verify the repository settings allow GitHub Actions

### "Secret not accessible in workflow"
- Ensure the secret is referenced correctly: `${{ secrets.ANTHROPIC_API_KEY }}`
- Check the secret name has no typos
- Verify the workflow has access to repository secrets

## Next Steps After Setup

1. ✅ **Test the Claude AI integration workflow** - Manual trigger
2. ✅ **Verify CI/CD pipeline works** - Push a test commit
3. ✅ **Configure branch protection rules** - Enable required checks
4. ✅ **Set up GitHub environments** - Staging and production
5. ✅ **Configure deployment targets** - Add your deployment infrastructure

## Workflow Files Created

The following GitHub Actions workflows have been created:

1. **`.github/workflows/ci.yml`** - Main CI/CD pipeline
   - Linting, testing, building
   - Security scanning
   - Claude AI integration tests

2. **`.github/workflows/deploy.yml`** - Deployment pipeline
   - Build and push Docker images
   - Deploy to staging and production
   - Claude AI validation

3. **`.github/workflows/claude-ai-integration.yml`** - Claude AI specific tests
   - Validate Claude AI coordinator
   - Test library knowledge service
   - Test AI collaboration service
   - GitHub integration tests

## Current Claude AI Integration Status

**Infrastructure:** ✅ Complete
- Claude AI coordinator service implemented
- Library knowledge service integrated
- AI collaboration service active
- GitHub Actions workflows created

**Configuration:** ⏳ Pending
- ANTHROPIC_API_KEY secret needs to be added
- Optional deployment secrets need configuration

**Testing:** ⏳ Pending
- Claude AI workflow needs manual trigger test
- Full CI/CD pipeline needs verification
- End-to-end integration testing required

## Support

For issues with:
- **GitHub Secrets:** Check GitHub Actions documentation
- **Anthropic API:** Visit https://docs.anthropic.com/
- **GitHub Actions:** Check workflow logs in Actions tab
- **This project:** Refer to `.ai/` documentation

---

*This guide ensures your Claude AI integration is properly configured through GitHub Actions for the EBDESIGN project.*