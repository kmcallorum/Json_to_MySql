# GitHub Setup Guide

This guide walks you through publishing your JSON-to-SQL Flattener project as an open source project on GitHub with full CI/CD and Codecov integration.

## Prerequisites

- [x] GitHub account
- [x] Git installed locally
- [x] Codecov GitHub App installed (you mentioned you already have this)
- [x] All tests passing locally

## Step 1: Initialize Git Repository (if not already done)

```bash
cd /Users/kmcallorum/Projects/Json-Flattner

# Initialize git if not already initialized
git init

# Check current status
git status
```

## Step 2: Create .gitignore (Already Done ✅)

The `.gitignore` file is already configured to exclude:
- node_modules/
- .env files
- coverage/
- build artifacts
- IDE files

## Step 3: Create GitHub Repository

### Option A: Via GitHub Website

1. Go to https://github.com/new
2. Repository name: `Json-Flattener` (or your preferred name)
3. Description: "Production-ready tool for transforming nested JSON data from Elasticsearch into normalized SQL tables"
4. Visibility: **Public** (for open source)
5. **DO NOT** initialize with README, .gitignore, or license (you already have these)
6. Click "Create repository"

### Option B: Via GitHub CLI

```bash
# Install GitHub CLI if needed: https://cli.github.com/

gh repo create Json-Flattener \
  --public \
  --description "Production-ready tool for transforming nested JSON data from Elasticsearch into normalized SQL tables" \
  --source=. \
  --remote=origin
```

## Step 4: Update README Badges

After creating the repository, update the badges in `README.md` to replace `YOUR_USERNAME` with your actual GitHub username:

```bash
# Example: If your username is "johndoe"
# Replace: YOUR_USERNAME/Json-Flattener
# With:    johndoe/Json-Flattener
```

Edit these lines in `README.md`:
- Line 3: CI badge URL
- Line 4: Codecov badge URL

## Step 5: Initial Commit and Push

```bash
# Add all files
git add .

# Create initial commit
git commit -m "feat: initial commit - JSON to SQL Flattener with full test coverage

- Complete backend with TSyringe DI
- React frontend with drag-and-drop UI
- 150 tests with 100% coverage on critical services
- GitHub Actions CI/CD workflow
- Codecov integration
- Comprehensive documentation"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/Json-Flattener.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 6: Configure GitHub Repository Settings

### 6.1 Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Under "Actions permissions", select **Allow all actions and reusable workflows**
4. Click **Save**

### 6.2 Add Codecov Secret

1. Get your Codecov repository token:
   - Go to https://codecov.io/
   - Sign in with GitHub
   - Find your repository
   - Copy the **Upload Token** (or it will be auto-detected via GitHub App)

2. Add the token to GitHub Secrets:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: [paste your Codecov token]
   - Click **Add secret**

   > **Note:** If you have the Codecov GitHub App installed, the token might not be required. Try without it first.

### 6.3 Configure Branch Protection (Optional but Recommended)

1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select status checks: `backend-tests`, `frontend-tests`, `build`
   - ✅ Require conversation resolution before merging
5. Click **Create**

## Step 7: Verify CI/CD Pipeline

After pushing, GitHub Actions should automatically:

1. Run backend tests (unit + integration)
2. Run frontend tests (unit + integration + E2E)
3. Build both backend and frontend
4. Upload coverage to Codecov

Check the status:
```bash
# View in browser
gh repo view --web

# Or go to: https://github.com/YOUR_USERNAME/Json-Flattener/actions
```

You should see a workflow run for your initial commit. It should show:
- ✅ backend-tests
- ✅ frontend-tests
- ✅ lint
- ✅ build

## Step 8: Verify Codecov Integration

1. Go to https://codecov.io/gh/YOUR_USERNAME/Json-Flattener
2. You should see coverage reports for both backend and frontend
3. Coverage badges should appear on your README

Expected coverage:
- **Backend**: ~99-100% coverage
- **Frontend**: ~90%+ coverage

## Step 9: Add Topics to Repository (Optional)

Add relevant topics to help people discover your project:

1. Go to your repository on GitHub
2. Click the gear icon ⚙️ next to "About"
3. Add topics:
   - `typescript`
   - `nodejs`
   - `react`
   - `mysql`
   - `elasticsearch`
   - `etl`
   - `json`
   - `sql`
   - `data-pipeline`
   - `tsyringe`
   - `dependency-injection`
4. Click **Save changes**

## Step 10: Create First Release

After verifying everything works:

```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release v1.0.0 - Production-ready JSON to SQL Flattener"
git push origin v1.0.0
```

Or via GitHub web interface:
1. Go to **Releases** → **Create a new release**
2. Tag version: `v1.0.0`
3. Release title: `v1.0.0 - Production Ready`
4. Description:
```markdown
## 🎉 First Production Release

Production-ready JSON-to-SQL Flattener with comprehensive testing and dependency injection.

### Features
- ✅ Visual field mapping with drag-and-drop UI
- ✅ Automatic relationship detection
- ✅ TSyringe dependency injection
- ✅ 150 tests with 100% coverage on critical services
- ✅ Automated daily ETL workflows
- ✅ Full CI/CD pipeline with GitHub Actions
- ✅ Codecov integration

### Installation
See [README.md](README.md) for installation and setup instructions.

### Documentation
- [Contributing Guide](CONTRIBUTING.md)
- [Testing Documentation](TESTING_AND_DI_COMPLETE.md)
```
5. Click **Publish release**

## Step 11: Share Your Project

Your project is now ready to share! You can:

### Add to Your GitHub Profile
Pin the repository to your GitHub profile:
1. Go to your GitHub profile
2. Click **Customize your pins**
3. Select your repository
4. Click **Save pins**

### Share on Social Media
Example announcement:
```
🚀 Just open-sourced JSON-to-SQL Flattener!

Transform nested JSON from Elasticsearch into normalized SQL tables with:
✅ 100% test coverage
✅ Dependency injection (TSyringe)
✅ React drag-and-drop UI
✅ Automated ETL pipelines
✅ Full CI/CD

Check it out: https://github.com/YOUR_USERNAME/Json-Flattener

#TypeScript #React #OpenSource #ETL
```

### Submit to Awesome Lists
Consider submitting to relevant awesome lists:
- awesome-typescript
- awesome-react
- awesome-etl

## Troubleshooting

### CI Failing - MySQL Connection
If the GitHub Actions workflow fails on database tests:
- Check the MySQL service configuration in `.github/workflows/ci.yml`
- Verify the database initialization SQL is correct
- Check the environment variables

### Codecov Not Uploading
If coverage isn't appearing on Codecov:
1. Verify `CODECOV_TOKEN` is set in GitHub Secrets
2. Check that coverage reports are being generated (`coverage/lcov.info`)
3. Review the GitHub Actions logs for upload errors

### E2E Tests Failing in CI
E2E tests might fail in CI due to timing issues:
- Increase timeouts in Playwright config
- Ensure the dev server has time to start
- Check browser installation logs

## Next Steps

Now that your project is on GitHub:

1. **Monitor Issues** - Respond to bug reports and feature requests
2. **Review PRs** - Accept contributions from the community
3. **Update Documentation** - Keep README and guides current
4. **Tag Releases** - Create semantic versioned releases
5. **Engage Community** - Star, fork, and share the project

## Maintenance Checklist

Weekly:
- [ ] Review and respond to new issues
- [ ] Review open pull requests
- [ ] Check CI/CD pipeline health
- [ ] Monitor Codecov reports

Monthly:
- [ ] Update dependencies (`npm update`)
- [ ] Review and update documentation
- [ ] Check for security vulnerabilities (`npm audit`)

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)
- [Semantic Versioning](https://semver.org/)
- [Open Source Guides](https://opensource.guide/)

---

**Congratulations! Your project is now a professional open source project on GitHub!** 🎉
