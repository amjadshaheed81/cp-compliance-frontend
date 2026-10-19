# CAFM frontend security patch — corrected PowerShell 5.1 script (19 October 2026)

Based on the newer, verified `frontend(20261019-174630).zip`. **No Azure deployment is performed.**

## Why the previous script failed

Windows PowerShell 5.1's `ConvertFrom-Json` cannot parse the legal empty-string property name in npm v3's `package-lock.json` (`packages[""]`). The previous script stopped at line 18 before its backup or update. This replacement reads the lockfile with Node.js, not PowerShell JSON parsing.

## Important: check whether the previous ZIP overwrote your files

You ran the original script from inside `C:\Data\cp-compliance\git-clean\frontend`. If you extracted the previous patch's `package.json` or `src\setupProxy.js` directly over the repository files, those files **might already have been changed during extraction**. The new script recognises only the exact reviewed original and patched files, and stops if anything else has changed.

Inspect Git status first:

```powershell
cd 'C:\Data\cp-compliance\git-clean\frontend'
git status --short -- package.json package-lock.json src/setupProxy.js
```

## Run fixed script

1. Extract **this ZIP outside** your frontend repository, for example `C:\Users\<you>\Desktop\CAFM-Frontend-Fix`.
2. In a normal PowerShell window with Node.js and npm installed, run:

```powershell
& "$HOME\Desktop\CAFM-Frontend-Fix\Apply-Frontend-Security-Update-Fixed.ps1" -FrontendRoot "C:\Data\cp-compliance\git-clean\frontend"
```

You may see the Windows 'run once' warning for downloaded scripts. Review the script and use your organisation's approved execution method. **Do not overwrite the frontend when extracting this package**; do not loosen system-wide script execution policy.

The script validates SHA-256 fingerprints, checks the original or partially patched state, backs up 3 files, updates Axios with npm (lockfile metadata only), verifies the versions, and restores the backups if npm fails. The patch sends local `/api` requests to Site Service at localhost:8080; production routes are unchanged by this step.

## Validate after success

```powershell
cd 'C:\Data\cp-compliance\git-clean\frontend'
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd ls axios
.\node_modules\.bin\react-scripts.cmd build
npm.cmd audit --omit=dev --audit-level=moderate
```

Build validation only: the `react-scripts` direct invocation avoids the project's `prebuild` version increment. If a build/test step fails, retain its output and do not deploy. The security report includes additional findings not cleared solely by Axios.
