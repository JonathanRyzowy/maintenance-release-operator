# Publishing Guide

## Automated Publishing (Recommended)

Publishing to npm is automated via GitHub Actions when a version tag is pushed.

### Prerequisites

1. **NPM_TOKEN** must be added to repository secrets:
   - Go to: Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN`
   - Value: Your npm automation token (create at https://www.npmjs.com/settings/YOUR_USERNAME/tokens)

### Release Process

```bash
# 1. Run release command (updates version, CHANGELOG, creates tag)
npm run release          # or: mro release patch
# or: npm run release minor
# or: npm run release major

# 2. Push tag to trigger automated publish
git push origin main
git push origin v0.1.2   # (use actual version)

# 3. GitHub Actions will:
#    - Run tests
#    - Publish to npm with provenance
#    - Package will be available within minutes
```

### Manual Publishing (Fallback)

If GitHub Actions is unavailable:

```bash
# 1. Ensure you're logged in
npm whoami

# 2. Run tests
npm test

# 3. Publish
npm publish --access public
```

## Verification

After publish (automated or manual):

```bash
# Check package exists
npm view maintenance-release-operator

# Test installation
npx maintenance-release-operator@latest --help

# Check download stats (after 24h)
npm view maintenance-release-operator downloads
```

## Troubleshooting

### "401 Unauthorized"
- Verify `NPM_TOKEN` is set in repository secrets
- Ensure token has publish permissions
- Token should be an "Automation" token, not "Publish" (legacy)

### "403 Forbidden"
- Check package name isn't taken
- Verify you have publish rights to the package

### "Version already exists"
- Bump version first using `mro release` or `npm version`
- Cannot republish same version

## Security

- Never commit npm tokens to git
- Use automation tokens (not classic tokens)
- Rotate tokens periodically
- Enable 2FA on npm account
