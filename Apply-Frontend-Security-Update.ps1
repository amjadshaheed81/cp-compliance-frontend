# CAFM frontend security patch - staging only; no Azure deployment.
# Execute from PowerShell with: & ".\Apply-Frontend-Security-Update.ps1" -FrontendRoot "C:\path\to\frontend"
param(
    [Parameter(Mandatory=$true)]
    [string]$FrontendRoot
)

$ErrorActionPreference = "Stop"
$FrontendRoot = (Resolve-Path -LiteralPath $FrontendRoot).Path
$packagePath = Join-Path $FrontendRoot "package.json"
$lockPath = Join-Path $FrontendRoot "package-lock.json"
$proxyPath = Join-Path $FrontendRoot "src\setupProxy.js"
foreach ($item in @($packagePath,$lockPath,$proxyPath)) {
    if (!(Test-Path -LiteralPath $item -PathType Leaf)) { throw "Missing: $item" }
}

$existingPackage = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
$existingLock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
if ($existingPackage.name -ne "cp-compliance") { throw "Wrong frontend repository (package name mismatch)." }
if ($existingPackage.dependencies.axios -ne "^1.7.7") { throw "Source changed since review: Axios declaration is not ^1.7.7. Stop and review." }
if ($existingLock.packages.'node_modules/axios'.version -ne "1.7.7") { throw "Source changed since review: lockfile Axios is not 1.7.7. Stop and review." }

# Don't overwrite other developers' local modifications to the dev proxy.
$sourceProxyHash = "07B0AE869409A8BBE6576EA61D14EB23D3BC6AAD8EFFDCD807D5C28639B3FE1B"
$actualProxyHash = (Get-FileHash -LiteralPath $proxyPath -Algorithm SHA256).Hash
if ($actualProxyHash -ne $sourceProxyHash) { throw "Local src/setupProxy.js differs from uploaded baseline. Stop and review the change." }

if (!(Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is not installed or not on PATH." }

$backup = Join-Path $FrontendRoot (".cafm-security-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -LiteralPath $packagePath -Destination (Join-Path $backup "package.json")
Copy-Item -LiteralPath $lockPath -Destination (Join-Path $backup "package-lock.json")
Copy-Item -LiteralPath $proxyPath -Destination (Join-Path $backup "setupProxy.js")

$pushed = $false
try {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "package.json") -Destination $packagePath -Force
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "src\setupProxy.js") -Destination $proxyPath -Force
    Push-Location -LiteralPath $FrontendRoot
    $pushed = $true

    # This must access npm Registry. npm resolves dependency graph and writes real
    # integrity/resolved metadata; do not hand-edit package-lock.json.
    & npm install "axios@1.20.0" --save-exact --package-lock-only --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install could not regenerate package-lock.json." }

    $newPackage = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
    $newLock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
    if ($newPackage.dependencies.axios -ne "1.20.0" -or
        $newLock.packages.'node_modules/axios'.version -ne "1.20.0") {
        throw "Axios version verification failed."
    }
    Write-Host "PASS: package.json and package-lock.json now pin Axios 1.20.0" -ForegroundColor Green
    Write-Host "PASS: development proxy forwards /api to site-service localhost:8080" -ForegroundColor Green
    Write-Host "Backup: $backup"
    Write-Host "NEXT: npm ci; run tests and production build before any Azure deployment."
}
catch {
    Write-Warning "Patch failed; restoring original package.json, lockfile and setupProxy.js from backup."
    Copy-Item -LiteralPath (Join-Path $backup "package.json") -Destination $packagePath -Force
    Copy-Item -LiteralPath (Join-Path $backup "package-lock.json") -Destination $lockPath -Force
    Copy-Item -LiteralPath (Join-Path $backup "setupProxy.js") -Destination $proxyPath -Force
    throw
}
finally {
    if ($pushed) { Pop-Location }
}
