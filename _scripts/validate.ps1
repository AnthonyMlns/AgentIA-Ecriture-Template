param([switch]$Quiet)
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$exitCode = 0
function Log-Pass($m) { if (-not $Quiet) { Write-Host "  [PASS] $m" -ForegroundColor Green } }
function Log-Fail($m) { if (-not $Quiet) { Write-Host "  [FAIL] $m" -ForegroundColor Red } $global:exitCode = 1 }
function Log-Warn($m) { if (-not $Quiet) { Write-Host "  [WARN] $m" -ForegroundColor Yellow } }
Write-Host "=== Pipeline Health Check v4.6 ===" -ForegroundColor Cyan

# 1. Agent references
$opencode = Get-Content -Raw "$root\opencode.json" | ConvertFrom-Json
$agentFiles = Get-ChildItem "$root\.opencode\agent\*.md" | Where-Object { $_.BaseName -ne 'TEMPLATE-ORCHESTRATEUR' }
$definedAgents = $opencode.agent | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
$missingInJson = @(); $missingInFiles = @()
foreach ($f in $agentFiles) { if ($f.BaseName -notin $definedAgents) { $missingInJson += $f.BaseName } }
foreach ($a in $definedAgents) { if (-not (Test-Path "$root\.opencode\agent\$a.md")) { $missingInFiles += $a } }
if ($missingInJson.Count -eq 0 -and $missingInFiles.Count -eq 0) { Log-Pass "Agent refs OK" }
else { foreach ($m in $missingInJson) { Log-Fail "Agent $m.md not in opencode.json" }
       foreach ($m in $missingInFiles) { Log-Fail "Agent $m in JSON has no file" } }

# 2. Permissions (no invalid names; orchestrators must have read)
$validPerms = @('read','edit','bash','task')
foreach ($af in (Get-ChildItem "$root\.opencode\agent\*.md")) {
    $c = Get-Content -Raw $af.FullName
    if ($c -notmatch 'permission:') { continue }
    $lines = $c -split "`n"; $inPerm = $false; $pCount = 0
    foreach ($line in $lines) {
        if ($line -match 'permission:') { $inPerm = $true; continue }
        if ($inPerm -and $line -match '(\w+):') { if ($Matches[1] -in $validPerms) { $pCount++ } else { Log-Fail "$($af.BaseName): invalid perm $($Matches[1])" } }
        if ($inPerm -and $line -match '^---') { break }
    }
    if ($af.BaseName -match '^orchestrateur' -and $pCount -lt 3) { Log-Fail "$($af.BaseName): missing read perm" }
}
Log-Pass "Permissions OK"

# 3. PDF integrity
$emptyPdfs = Get-ChildItem -Recurse "$root\*.pdf" | Where-Object { $_.Length -eq 0 }
if ($emptyPdfs.Count -eq 0) { Log-Pass "All PDFs valid ($((Get-ChildItem -Recurse "$root\*.pdf").Count) files)" }
else { foreach ($p in $emptyPdfs) { Log-Fail "Empty PDF: $($p.FullName)" } }

# 4. Critical files exist
$required = @("$root\knowledge\global.md","$root\knowledge\style.md","$root\knowledge\global-poesie.md","$root\knowledge\style-poesie.md","$root\knowledge\analyse-style-utilisateur.md","$root\knowledge\rex-template.md","$root\AGENTS.md","$root\opencode.json","$root\_scripts\convert-to-pdf.ps1")
$missing = @()
foreach ($f in $required) { if (-not (Test-Path $f)) { $missing += $f } }
if ($missing.Count -eq 0) { Log-Pass "All $($required.Count) critical files exist" }
else { foreach ($m in $missing) { Log-Fail "Missing: $m" } }

# 5. Knowledge notes structure
$noteDirs = @('style','scenes','idees','univers','personnages','formes')
foreach ($d in $noteDirs) { if (-not (Test-Path "$root\knowledge\notes\$d")) { Log-Warn "Missing knowledge/notes/$d" } }
Log-Pass "Notes structure OK"

# 6. No orphaned files in skills (only SKILL.md allowed)
$orphans = Get-ChildItem -Recurse "$root\.opencode\skills" -File | Where-Object { $_.Name -ne 'SKILL.md' -and $_.Name -ne '.gitkeep' }
if ($orphans.Count -eq 0) { Log-Pass "Skills clean ($((Get-ChildItem "$root\.opencode\skills" -Directory).Count) skills)" }
else { foreach ($o in $orphans) { Log-Warn "Orphan in skills: $($o.Name)" } }

# 7. No suspicious dir names
$sus = Get-ChildItem -Recurse "$root" -Directory | Where-Object { $_.Name -match '^(nnotes|note|verson|chaptre|sectoin)$' }
if ($sus.Count -eq 0) { Log-Pass "No suspicious dirs" }
else { foreach ($s in $sus) { Log-Warn "Suspicious dir: $($s.FullName)" } }

# 8. Git status
$status = git -C $root status --porcelain
if ([string]::IsNullOrEmpty($status)) { Log-Pass "Git clean" }
else { Log-Warn "Uncommitted changes (run git status)" }

# 9. Project structure
foreach ($proj in (Get-ChildItem "$root\projets\romans","$root\projets\poesie" -Directory -ErrorAction SilentlyContinue)) {
    if (-not (Test-Path "$($proj.FullName)\bible.md")) { Log-Warn "$($proj.Name): missing bible.md" }
    if (-not (Test-Path "$($proj.FullName)\bd-connaissances.md")) { Log-Warn "$($proj.Name): missing bd-connaissances.md" }
}
Log-Pass "Project structure OK"

# 10. Skill cross-refs
$available = Get-ChildItem "$root\.opencode\skills" -Directory | Select-Object -ExpandProperty Name
$referenced = Select-String -Path "$root\.opencode\agent\orchestrateur-poesie.md" -Pattern '`((?:poesie|roman)-[\w-]+)`' | ForEach-Object { $_.Matches.Groups[1].Value }
$missingSkills = $referenced | Where-Object { $_ -notin $available } | Select-Object -Unique
if ($missingSkills.Count -eq 0) { Log-Pass "Skill refs OK" }
else { foreach ($m in $missingSkills) { Log-Warn "Missing skill ref: $m" } }

Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($exitCode -eq 0) { Write-Host "All checks passed. Pipeline healthy." -ForegroundColor Green; exit 0 }
else { Write-Host "Some checks failed." -ForegroundColor Red; exit 1 }
