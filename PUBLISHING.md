# Publishing

A checklist for publishing this package to GitHub and npm.

## 1. Replace the placeholders

Before the first release, adjust these if your GitHub handle or legal name differs:

- `package.json` → `repository.url`, `homepage`, `bugs.url`, `author`.
- `README.md` and `SECURITY.md` → GitHub links.
- `LICENSE` → copyright holder.
- The npm package name (`dsh-mail-plugin`) if it is taken by the time you publish.

The name `dsh-mail-plugin` was available when this file was written. Check again:

```bash
npm view dsh-mail-plugin version
```

If it is taken, choose a scope such as `@yourname/dsh-mail` and update:

- `package.json` `name`
- `cordis.patch.yml` `name`
- install examples in `README.md`

## 2. Create the GitHub repository

On GitHub: **New repository** → name `dsh-mail-plugin` → Public → do **not** initialize with a README, license, or `.gitignore` (they already exist here).

Or with the GitHub CLI:

```bash
gh repo create dsh-mail-plugin --public --source=. --remote=origin
```

## 3. Commit and push

```bash
cd dsh-mail-plugin
git init
git add .
git commit -m "Initial release: dsh-mail-plugin 1.0.0"
git branch -M main
git remote add origin https://github.com/<your-github-user>/dsh-mail-plugin.git
git push -u origin main
```

If Git asks for an identity first:

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

## 4. Verify the package before publishing

```bash
node test/smoke.mjs
node test/protocol.mjs
npm pack --dry-run
```

The file list must contain only runtime files, docs, the icon, locale, license, and readme. It must not contain tests, `node_modules`, credentials, or local data.

Optionally build the tarball and inspect it:

```bash
npm pack
tar -tf dsh-mail-plugin-1.0.0.tgz
```

## 5. Publish to npm

Create an npm account and enable two-factor authentication first: <https://www.npmjs.com/>.

```bash
npm login
npm publish
```

For a scoped name, publish publicly:

```bash
npm publish --access public
```

For a stronger supply-chain signal, publish from GitHub Actions with npm provenance (`npm publish --provenance`) after configuring trusted publishing for the repository.

## 6. Create a GitHub release

```bash
git tag -a v1.0.0 -m "dsh-mail-plugin 1.0.0"
git push origin v1.0.0
```

Then on GitHub: **Releases → Draft a new release** → choose tag `v1.0.0` → title `1.0.0` → paste the `CHANGELOG.md` section → publish.

## 7. Install from the published package

In DSH, use **Plugins → Add plugin** with:

```text
dsh-mail-plugin@1.0.0
```

Or through the agent tool:

```text
plugin_manager action=install_bundle target=dsh-mail-plugin@1.0.0
```

Verify the bundle row is active and the **Mail** sidebar entry appears.

## 8. Optional: list it in a plugin market index

DSH's Discover page reads plugin-market indexes that users configure. There is no central upload button. You can:

- host a format-1 index yourself and share its URL, or
- ask the maintainer of a community or official index to list the package.

The index format is validated by `@deepseek-ai/dsh-plugin-market-index`. Each version's install target for an npm release is the package name and version, for example `dsh-mail-plugin@1.0.0`.

## 9. After publishing

- Watch GitHub issues and security advisories.
- Keep `engines.dsh` current as DSH releases change.
- Re-run both test files and `npm pack --dry-run` before every release.
- Bump the version, update `CHANGELOG.md`, commit, tag, and publish.
- Never commit mailbox passwords, `$DSH_HOME` data, or built tarballs.

## Release checklist

- [ ] `package.json` name, repository, author, license are correct
- [ ] `cordis.patch.yml` row name matches the package name
- [ ] `engines.dsh` still matches the tested DSH version
- [ ] tests pass
- [ ] `npm pack --dry-run` contains no secrets or tests
- [ ] README security section is current
- [ ] GitHub release and npm version match
- [ ] installation from the published spec verified in a clean profile
