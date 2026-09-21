# GitHub Enterprise Setup Guide - EBDESIGN
**Status:** Ready for immediate deployment  
**Time Required:** 30-45 minutes to complete all steps  
**Difficulty:** Intermediate

---

## WHAT'S BEEN CREATED FOR YOU

✅ **GitHub Workflows (Automated):**
- `.github/workflows/ci.yml` — Code linting, testing, builds
- `.github/workflows/deploy.yml` — Staging & production deployments

✅ **Configuration Files:**
- `.github/CODEOWNERS` — Team-based code review requirements
- `.github/pull_request_template.md` — Standardized PR format

✅ **Documentation:**
- This setup guide
- Security best practices
- Branch protection rules configuration

---

## STEP-BY-STEP SETUP (30-45 minutes)

### Step 1: Push Workflow Files to GitHub (5 minutes)

```bash
cd /path/to/EBDESIGN

# Verify files exist
ls -la .github/workflows/
ls -la .github/CODEOWNERS

# Commit and push
git add .github/
git commit -m "feat: Configure GitHub Enterprise CI/CD

- Add CI workflow (linting, testing, builds)
- Add deployment workflow (staging & production)
- Add CODEOWNERS for team-based reviews
- Add PR template for standardization

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

git push origin main
```

✅ **Verify:** Go to https://github.com/subhesco/EBDESIGN/actions — you should see "CI/CD" workflow running

---

### Step 2: Configure GitHub Secrets (10 minutes)

**Go to:** `GitHub → Settings → Secrets and variables → Actions`

#### Create these secrets:

```
Name: ANTHROPIC_API_KEY
Value: [Your NEW API key - NOT the old one]
```

```
Name: SLACK_WEBHOOK
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
(Optional - only if you want Slack notifications)
```

```
Name: DATABASE_URL
Value: postgresql://user:password@host:5432/ebdesign
(For production deployments)
```

✅ **Verify:** Go to "Secrets and variables" → "Actions" — you should see the secrets listed

---

### Step 3: Enable Branch Protection (10 minutes)

**Go to:** `GitHub → Settings → Branches → Add rule`

#### For `main` branch:

```
Branch name pattern: main

☑️  Require a pull request before merging
    ☑️  Require approvals: 2
    ☑️  Dismiss stale pull request approvals when new commits pushed
    ☑️  Require code review from Code Owners

☑️  Require status checks to pass before merging
    ☑️  Require branches to be up to date before merging
    Required status checks:
      □  Lint & Format Check
      □  Backend Unit Tests
      □  Frontend Unit Tests
      □  Build Verification
      □  Security Audit
      (Check these as they appear in CI runs)

☑️  Require conversation resolution before merging

☑️  Require signed commits

☑️  Lock branch
    ☑️  Allow deletions: No
    ☑️  Allow force pushes: No
```

#### For `develop` branch:

```
Branch name pattern: develop

☑️  Require a pull request before merging
    ☑️  Require approvals: 1
    ☑️  Dismiss stale pull request approvals when new commits pushed

☑️  Require status checks to pass before merging
    ☑️  Require branches to be up to date before merging

(Same status checks as main)
```

✅ **Verify:** Try creating a test PR to `main` — it should require 2 approvals and pass all checks

---

### Step 4: Setup GitHub Environments (10 minutes)

**Go to:** `GitHub → Settings → Environments`

#### Create Environment: `staging`

```
Environment name: staging

Deployment branches: Selected branches
  ☑️  develop
  ☑️  hotfix/*

Environment variables:
  ENVIRONMENT: staging
  API_BASE_URL: https://api.staging.ebdesign.local
  FRONTEND_URL: https://staging.ebdesign.local
  NODE_ENV: staging

Protection rules:
  Required reviewers: 1 (Senior Developer)
  Wait timer: 5 minutes
  ☑️  Restrict who can deploy: Only allow deployments from the main repository
```

#### Create Environment: `production`

```
Environment name: production

Deployment branches: Selected branches
  ☑️  main

Environment variables:
  ENVIRONMENT: production
  API_BASE_URL: https://api.ebdesign.local
  FRONTEND_URL: https://ebdesign.local
  NODE_ENV: production

Protection rules:
  Required reviewers: 2 (Lead + Operations)
  Wait timer: 30 minutes
  ☑️  Restrict who can deploy: Only allow deployments from the main repository
```

✅ **Verify:** Go to Environments → you should see `staging` and `production` listed

---

### Step 5: Create Issue Templates (5 minutes)

**Create file:** `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Report a bug
labels: bug
---

## Description
<!-- Describe the bug -->

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Environment
- OS: 
- Browser: 
- Node version: 

## Logs/Screenshots
<!-- Add any relevant logs or screenshots -->
```

**Create file:** `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature Request
about: Suggest a new feature
labels: enhancement
---

## Description
<!-- Describe the feature -->

## Use Case
<!-- Why would this feature be useful? -->

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Additional Context
<!-- Any other context -->
```

✅ **Verify:** Create a new issue — you should see these templates available

---

### Step 6: Configure GitHub Pages (Optional - 5 minutes)

**If you want automatic deployment of docs:**

**Go to:** `GitHub → Settings → Pages`

```
Source: Deploy from branch
Branch: main
Folder: /docs
```

---

## TESTING THE SETUP

### Test 1: Verify CI Runs on Push

```bash
# Make a small change
echo "# Test" >> test.md

# Commit and push
git add test.md
git commit -m "test: Verify GitHub Actions"
git push origin main

# Go to GitHub → Actions
# You should see "CI/CD - Code Quality & Testing" running
```

### Test 2: Verify PR Requirements

```bash
# Create a feature branch
git checkout -b test/branch-protection

# Make a change
echo "test" >> test.md

# Commit and push
git add test.md
git commit -m "test: Branch protection"
git push origin test/branch-protection

# Create a PR on GitHub
# Verify it requires:
#   ✅ 2 approvals (for main)
#   ✅ Status checks passing
#   ✅ Code owner review
```

### Test 3: Verify Deployments

```bash
# Merge the test PR to develop
# Watch GitHub Actions → deploy workflow
# Should deploy to staging environment

# Then merge to main
# Should deploy to production (after required approvals)
```

---

## WORKFLOW AUTOMATION DETAILS

### What Runs on Push to `main`/`develop`:

```
1. Lint & Format Check
   └─ Runs ESLint on backend & frontend
   └─ Time: ~2 minutes

2. Backend Unit Tests
   └─ Runs Jest tests with PostgreSQL
   └─ Time: ~5 minutes

3. Frontend Unit Tests
   └─ Runs Jest tests
   └─ Time: ~3 minutes

4. Build Verification
   └─ Builds both backend and frontend
   └─ Time: ~5 minutes

5. Security Audit
   └─ Runs `npm audit` on dependencies
   └─ Time: ~2 minutes

6. Docker Build (if applicable)
   └─ Builds container images
   └─ Time: ~10 minutes

Total Time: ~25-30 minutes per push
```

### What Happens on PR:

```
1. All CI checks run (same as above)
2. Requires 2 approvals for main, 1 for develop
3. Requires code owner review
4. Must pass all status checks before merge
5. Requires signed commits
```

### What Happens on Merge to `main`:

```
1. Build Docker images
2. Push to container registry
3. Deploy to staging (5 min wait, 1 approval)
4. Run smoke tests
5. Deploy to production (30 min wait, 2 approvals)
6. Run health checks
7. Send Slack notification
```

---

## CUSTOMIZATION NEEDED

Edit `.github/workflows/deploy.yml` to add your actual deployment commands:

### For Staging Deployment:

```yaml
- name: Deploy to Staging
  run: |
    # Replace this section with your actual deployment
    # Examples:
    
    # Option 1: Docker Compose
    docker-compose -f docker-compose.staging.yml pull
    docker-compose -f docker-compose.staging.yml up -d
    
    # Option 2: Kubernetes
    kubectl set image deployment/backend backend=${{ needs.build-images.outputs.backend-image }}
    kubectl set image deployment/frontend frontend=${{ needs.build-images.outputs.frontend-image }}
    
    # Option 3: Railway/Heroku
    railway environment:set BACKEND_IMAGE=${{ needs.build-images.outputs.backend-image }}
    railway deploy
    
    # Option 4: AWS ECS
    aws ecs update-service --cluster staging --service ebdesign-backend --force-new-deployment
```

### For Production Deployment:

Same as above, but use production configurations.

### For Health Checks:

```yaml
- name: Health Check - Production
  run: |
    # Replace with your actual health check
    # Examples:
    
    # Option 1: HTTP curl
    for i in {1..30}; do
      curl -f https://ebdesign.local/health && exit 0
      sleep 10
    done
    exit 1
    
    # Option 2: Kubernetes
    kubectl rollout status deployment/backend
    kubectl rollout status deployment/frontend
```

### For Slack Notifications:

```yaml
- name: Send Slack Notification
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "🚀 EBDESIGN Deployment",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Deployment Status*\n*Branch*: ${{ github.ref }}\n*Status*: ${{ job.status }}\n*Author*: ${{ github.actor }}"
            }
          }
        ]
      }
```

---

## TROUBLESHOOTING

### "Workflow file not found"
- Ensure files are in `.github/workflows/` (with slash)
- Make sure file names are exactly: `ci.yml` and `deploy.yml`
- Commit and push the files

### "Status checks aren't appearing"
- Workflows take ~2 minutes to start
- Go to `Actions` tab and wait for run to complete
- First run may take longer

### "Can't merge PR - required checks missing"
- Run at least one CI pipeline first
- Then enable branch protection
- Status checks will appear after first run

### "Deployment failed"
- Add your actual deployment commands (see Customization section)
- Workflows are currently placeholders
- You need to wire up your actual deployment system

---

## NEXT STEPS AFTER SETUP

1. ✅ Update deployment commands in `.github/workflows/deploy.yml`
2. ✅ Configure Slack webhook for notifications
3. ✅ Set up your actual deployment infrastructure (Docker, K8s, etc.)
4. ✅ Test full CI/CD pipeline with a test PR
5. ✅ Document your deployment process
6. ✅ Train team on PR process and branch protection
7. ✅ Setup monitoring/logging for deployments

---

## REFERENCE: Your GitHub Actions are Now Live

```
✅ CI Workflow:      .github/workflows/ci.yml
✅ Deploy Workflow:  .github/workflows/deploy.yml
✅ Code Owners:      .github/CODEOWNERS
✅ PR Template:      .github/pull_request_template.md
✅ Secrets:          Configured in Settings
✅ Environments:     staging & production
✅ Branch Protection: main & develop configured
```

---

## Support

For issues or questions:
1. Check GitHub Actions logs: `GitHub → Actions → [workflow name]`
2. Read workflow file comments for hints
3. Verify secrets are set in Settings
4. Ensure files are committed and pushed

---

*This setup provides production-grade CI/CD for EBDESIGN. All workflows are templated and ready to customize for your infrastructure.*

**🚀 Ready to deploy!**
