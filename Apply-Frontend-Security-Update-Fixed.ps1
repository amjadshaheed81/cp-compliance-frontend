# CAFM frontend security patch (no deployment). Compatible with Windows PowerShell 5.1.
# Extract this ZIP OUTSIDE the frontend repository before running it.
param(
    [Parameter(Mandatory = $true)]
    [string]$FrontendRoot
)

$ErrorActionPreference = "Stop"
$FrontendRoot = (Resolve-Path -LiteralPath $FrontendRoot -ErrorAction Stop).Path
$patchRoot = (Resolve-Path -LiteralPath $PSScriptRoot -ErrorAction Stop).Path

if ($FrontendRoot -eq $patchRoot) {
    throw "The patch is inside the frontend root. Extract this ZIP to a separate directory (for example Desktop), then run the script there. Do not overwrite application files by extracting the patch into frontend."
}

$packagePath = Join-Path $FrontendRoot "package.json"
$lockPath = Join-Path $FrontendRoot "package-lock.json"
$proxyPath = Join-Path $FrontendRoot "src\setupProxy.js"
$patchedPackagePath = Join-Path $patchRoot "package.json"
$patchedProxyPath = Join-Path $patchRoot "src\setupProxy.js"
$readerPath = Join-Path $patchRoot "Check-Frontend-State.cjs"

foreach ($file in @($packagePath, $lockPath, $proxyPath, $patchedPackagePath, $patchedProxyPath, $readerPath)) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Missing file: $file"
    }
}

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw "Node.js (node.exe) is required. Check Node.js installation and PATH."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "npm.cmd is required. Check npm installation and PATH."
}

# SHA-256 of unmodified 19 October 2026 17:46 frontend ZIP and this patch.
$expectedPackageOriginal = "15C4EFEBCEAA9A60524BC4E1EDFA2DD228E781D43894CEE71CB1F4DD5B5F4E36"
$expectedPackagePatch = "830DEB2B27BB7776D8A4617A53980FF1DDA0D8622E708827FB99E63EA4D79B91"
$expectedLockOriginal = "177D1D8606A3620764B0042EC9886DEB2B15EDC6823A04A9CE24364EA4A9A142"
$expectedProxyOriginal = "07B0AE869409A8BBE6576EA61D14EB23D3BC6AAD8EFFDCD807D5C28639B3FE1B"
$expectedProxyPatch = "D064DC41298FA5CA82E9AEB80D7372ACEA1B34A86C9A8BC5261D7B5243F17908"

function FileHash([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()
}

if ((FileHash $patchedPackagePath) -ne $expectedPackagePatch -or
    (FileHash $patchedProxyPath) -ne $expectedProxyPatch) {
    throw "The extracted patch files do not match the reviewed package. Stop and obtain a fresh ZIP."
}

# Run the reader in Node; do not use ConvertFrom-Json on package-lock.json.
$state = @(& node.exe $readerPath $FrontendRoot)
if ($LASTEXITCODE -ne 0 -or $state.Count -ne 3) {
    throw "Could not read the frontend dependency state. No files were modified."
}
$packageName = $state[0]
$declaredAxios = $state[1]
$lockedAxios = $state[2]

if ($packageName -ne "cp-compliance") {
    throw "Wrong frontend repository: expected cp-compliance. No files modified."
}
if ($declaredAxios -notin @("^1.7.7", "1.20.0") -or
    $lockedAxios -notin @("1.7.7", "1.20.0")) {
    throw "Unexpected Axios versions (package=$declaredAxios; lock=$lockedAxios). Stop and review."
}

$packageHash = FileHash $packagePath
$lockHash = FileHash $lockPath
$proxyHash = FileHash $proxyPath

if ($packageHash -notin @($expectedPackageOriginal, $expectedPackagePatch)) {
    throw "Local package.json differs from the reviewed source and patch. No files modified."
}
if ($proxyHash -notin @($expectedProxyOriginal, $expectedProxyPatch)) {
    throw "Local src/setupProxy.js differs from the reviewed source and patch. No files modified."
}
if ($lockedAxios -eq "1.7.7" -and $lockHash -ne $expectedLockOriginal) {
    throw "The local package-lock.json was changed since the 17:46 upload. Stop and review."
}

Write-Host "Baseline checked: $packageName, declared Axios $declaredAxios, locked Axios $lockedAxios" -ForegroundColor Cyan
if ($packageHash -eq $expectedPackagePatch -or $proxyHash -eq $expectedProxyPatch) {
    Write-Host "Note: One or more patch files are already present in the frontend folder. Continuing only because their hashes match exactly." -ForegroundColor Yellow
}

$backup = Join-Path $FrontendRoot (".cafm-security-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $packagePath -Destination (Join-Path $backup "package.json")
Copy-Item -LiteralPath $lockPath -Destination (Join-Path $backup "package-lock.json")
Copy-Item -LiteralPath $proxyPath -Destination (Join-Path $backup "setupProxy.js")

$pushed = $false
try {
    # Preserve any already-applied, byte-for-byte identical patch file.
    if ($packageHash -ne $expectedPackagePatch) {
        Copy-Item -LiteralPath $patchedPackagePath -Destination $packagePath -Force
    }
    if ($proxyHash -ne $expectedProxyPatch) {
        Copy-Item -LiteralPath $patchedProxyPath -Destination $proxyPath -Force
    }

    Push-Location -LiteralPath $FrontendRoot
    $pushed = $true

    # Generate a genuine lockfile from the npm registry. Do not edit integrity hashes manually.
    & npm.cmd install "axios@1.20.0" --save-exact --package-lock-only --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        throw "npm could not update package-lock.json."
    }

    $after = @(& node.exe $readerPath $FrontendRoot)
    if ($LASTEXITCODE -ne 0 -or $after.Count -ne 3 -or
        $after[0] -ne "cp-compliance" -or $after[1] -ne "1.20.0" -or $after[2] -ne "1.20.0") {
        throw "Axios version verification failed."
    }

    if ((FileHash $proxyPath) -ne $expectedProxyPatch) {
        throw "Development proxy version verification failed."
    }
    Write-Host "PASS: Axios pinned to 1.20.0 in package.json and package-lock.json" -ForegroundColor Green
    Write-Host "PASS: Development proxy now routes /api to Site Service" -ForegroundColor Green
    Write-Host "Backup: $backup" -ForegroundColor Green
    Write-Host "NEXT: run npm ci and a production build before any Azure deployment."
}
catch {
    Write-Warning "Update failed; restoring all three source files from backup."
    Copy-Item -LiteralPath (Join-Path $backup "package.json") -Destination $packagePath -Force
    Copy-Item -LiteralPath (Join-Path $backup "package-lock.json") -Destination $lockPath -Force
    Copy-Item -LiteralPath (Join-Path $backup "setupProxy.js") -Destination $proxyPath -Force
    throw
}
finally {
    if ($pushed) {
        Pop-Location
    }
}
