param(
    [Parameter(Mandatory=$true)]
    [string]$InputMd,
    [Parameter(Mandatory=$true)]
    [string]$OutputPdf,
    [string]$Title = ""
)

$ErrorActionPreference = "Stop"

# --- Vérification des dépendances (fail-fast, messages clairs) ---
if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
    throw "pandoc introuvable sur le PATH. Installer : https://pandoc.org/installing.html"
}
$edgePath = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edgePath) {
    throw "Microsoft Edge introuvable (cherché dans Program Files et Program Files (x86))."
}

# Force UTF-8 with BOM for all encoding
$utf8BOM = New-Object System.Text.UTF8Encoding $true

# Resolve paths
$inputPath = Resolve-Path $InputMd
$outputDir = Split-Path -Parent $OutputPdf
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }
$outputFile = (Resolve-Path $outputDir).Path + "\" + (Split-Path -Leaf $OutputPdf)

# Temp files — GetRandomFileName ne crée aucun fichier (pas d'orphelin .tmp dans %TEMP%)
$tempBase = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.IO.Path]::GetRandomFileName())
$tempHtml = "$tempBase.html"
$tempMd = "$tempBase.md"

# Read input with correct encoding, write to temp with BOM
$content = Get-Content -LiteralPath $inputPath -Raw -Encoding UTF8
[System.IO.File]::WriteAllText($tempMd, $content, $utf8BOM)

# CSS
$css = @"
<style>
body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
h1 { font-size: 22pt; margin-top: 2em; margin-bottom: 0.5em; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
h2 { font-size: 16pt; margin-top: 1.5em; margin-bottom: 0.5em; }
h3 { font-size: 13pt; margin-top: 1.2em; margin-bottom: 0.3em; }
p { margin: 0.5em 0; text-align: justify; }
blockquote { border-left: 4px solid #ccc; margin: 1em 0; padding: 0.5em 1em; color: #555; background: #f9f9f9; }
code { font-family: 'Consolas', 'Courier New', monospace; font-size: 9pt; background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; }
pre code { display: block; padding: 1em; background: #f5f5f5; border: 1px solid #ddd; border-radius: 5px; }
hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 0.5em; text-align: left; }
th { background: #f0f0f0; }
.title-page { text-align: center; padding-top: 30%; }
.title-page h1 { font-size: 28pt; border: none; }
.title-page .subtitle { font-size: 14pt; color: #666; margin-top: 1em; }
.title-page .date { font-size: 11pt; color: #999; margin-top: 3em; }
.page-break { page-break-before: always; }
</style>
"@

# Title page
$titlePage = ""
if ($Title) {
    $titlePage = @"
<div class="title-page">
    <h1>$Title</h1>
    <div class="subtitle">Projet d'écriture assistée</div>
    <div class="date">Généré le $(Get-Date -Format "dd/MM/yyyy")</div>
</div>
<div class="page-break"></div>
"@
}

# Convert to HTML with pandoc (disable YAML parsing to avoid --- issues)
$htmlBody = & "pandoc" "-f" "markdown-yaml_metadata_block" "-t" "html" "--ascii" "--wrap=preserve" $tempMd 2>&1
if ($LASTEXITCODE -ne 0) { throw "Pandoc error: $htmlBody" }

# Build full HTML
$fullHtml = "<!DOCTYPE html><html><head><meta charset='utf-8'>$css</head><body>$titlePage$htmlBody</body></html>"
[System.IO.File]::WriteAllText($tempHtml, $fullHtml, $utf8BOM)

# Convert to PDF via Edge headless ($edgePath résolu en tête de script)
$edgeArgs = @(
    "--headless",
    "--disable-gpu",
    "--no-margins",
    "--print-to-pdf=`"$outputFile`"",
    "file:///$($tempHtml.Replace('\','/'))"
)

$proc = Start-Process -FilePath $edgePath -ArgumentList $edgeArgs -NoNewWindow -Wait -PassThru
Start-Sleep -Seconds 2

# Cleanup
Remove-Item -LiteralPath $tempHtml -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $tempMd -Force -ErrorAction SilentlyContinue

if (Test-Path $outputFile) {
    $sizeKB = [math]::Round((Get-Item $outputFile).Length / 1KB, 0)
    Write-Output "OK:$((Get-Item $outputFile).Name):${sizeKB}KB"
} else {
    Write-Output "FAIL:$OutputPdf"
}
