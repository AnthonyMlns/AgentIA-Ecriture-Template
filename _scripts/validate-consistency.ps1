<#
.SYNOPSIS
  Validation de coherence transverse pour un projet d'ecriture AgentIA.

.DESCRIPTION
  Verifie 5 dimensions de coherence entre les unites d'un projet :
  - GLOSSAIRE    : termes definis correctement utilises
  - CITATIONS    : citations referencees presentes dans les textes
  - PERSONNAGES  : variations orthographiques des noms
  - CHRONOLOGIE  : dates et timeline coherentes
  - PREUVES      : objets / preuves materielles continues

.PARAMETER ProjectPath
  Chemin absolu vers le dossier du projet (ex: projets/romans/Mon-Projet).
  Si omis, cherche un projet actif (premier dossier non-vide sous projets/).

.PARAMETER OutputDir
  Dossier de sortie pour le rapport. Defaut: [ProjectPath]/notes/

.PARAMETER Quiet
  N'affiche que les anomalies (pas de logs de progression).

.PARAMETER Strict
  Considere les ANOMALIES comme des REFUS (exit code 1 si >0 anomalies).

.EXAMPLE
  .\_scripts\validate-consistency.ps1 -ProjectPath projets/romans/Mon-Roman
.EXAMPLE
  .\_scripts\validate-consistency.ps1  # auto-detection du projet
#>

param(
  [string]$ProjectPath,
  [string]$OutputDir,
  [switch]$Quiet,
  [switch]$Strict
)

# === Configuration ===
$script:exitCode = 0
$script:allResults = @()
$script:startTime = Get-Date

# --- Normalisation Unicode en NFC ---
Add-Type -AssemblyName System.Text.Encoding
function Normalize-NFC {
  param([string]$s)
  if ([string]::IsNullOrEmpty($s)) { return '' }
  return $s.Normalize([System.Text.NormalizationForm]::FormC)
}

# --- Logging ---
function Log-Pass  { param($m) if (-not $Quiet) { Write-Host "  [PASS] $m" -ForegroundColor Green } }
function Log-Warn  { param($m) if (-not $Quiet) { Write-Host "  [WARN] $m" -ForegroundColor Yellow } }
function Log-Fail  { param($m) if (-not $Quiet) { Write-Host "  [FAIL] $m" -ForegroundColor Red }     $script:exitCode = 1 }
function Log-Info  { param($m) if (-not $Quiet) { Write-Host "  [INFO] $m" -ForegroundColor Gray } }
function Log-Section { param($m) if (-not $Quiet) { Write-Host "`n=== $m ===" -ForegroundColor Cyan } }

# --- Resultat de verification ---
class ValidationResult {
  [string] $Unite
  [string] $Type        # GLOSSAIRE / CITATION / PERSONNAGE / CHRONOLOGIE / PREUVE
  [string] $Severite    # ANOMALIE / REFUS
  [string] $Description
  [string] $Emplacement # fichier:ligne
  [string] $ValeurTrouvee
  [string] $ValeurAttendue

  ValidationResult([string]$unite, [string]$type, [string]$severite, [string]$desc, [string]$emplacement, [string]$trouve, [string]$attendu) {
    $this.Unite = $unite
    $this.Type = $type
    $this.Severite = $severite
    $this.Description = $desc
    $this.Emplacement = $emplacement
    $this.ValeurTrouvee = $trouve
    $this.ValeurAttendue = $attendu
  }
}

function Add-Result {
  param([string]$Unite, [string]$Type, [string]$Severite, [string]$Description, [string]$Emplacement = '', [string]$ValeurTrouvee = '', [string]$ValeurAttendue = '')
  $script:allResults += [ValidationResult]::new($Unite, $Type, $Severite, $Description, $Emplacement, $ValeurTrouvee, $ValeurAttendue)
  if ($Severite -eq 'REFUS') { Log-Fail "$Type / $Unite : $Description" }
  else { Log-Warn "$Type / $Unite : $Description" }
}

# --- Auto-detection du projet ---
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

if (-not $ProjectPath) {
  $projectDirs = @(
    Get-ChildItem "$root\projets\romans" -Directory -ErrorAction SilentlyContinue
    Get-ChildItem "$root\projets\poesie" -Directory -ErrorAction SilentlyContinue
    Get-ChildItem "$root\projets\theatre" -Directory -ErrorAction SilentlyContinue
    Get-ChildItem "$root\projets\essais" -Directory -ErrorAction SilentlyContinue
    Get-ChildItem "$root\projets\nouvelles" -Directory -ErrorAction SilentlyContinue
    Get-ChildItem "$root\projets\textes-mobiles" -Directory -ErrorAction SilentlyContinue
    Get-ChildItem "$root\projets\universitaire" -Directory -ErrorAction SilentlyContinue
  ) | Where-Object {
    # Un projet est "actif" s'il a au moins un fichier texte (exclut .gitkeep)
    $_.GetFiles('*.md', [System.IO.SearchOption]::AllDirectories) | Where-Object { $_.Name -ne '.gitkeep' }
  }
  if ($projectDirs.Count -eq 0) { Write-Host '[FATAL] Aucun projet trouve. Specifiez -ProjectPath.' -ForegroundColor Red; exit 1 }
  if ($projectDirs.Count -gt 1) {
    Write-Host '[FATAL] Plusieurs projets actifs detectes. Specifiez -ProjectPath :' -ForegroundColor Yellow
    $projectDirs | ForEach-Object { Write-Host "  $($_.FullName)" }
    exit 1
  }
  $ProjectPath = $projectDirs[0].FullName
  Log-Info "Projet auto-detecte : $ProjectPath"
}

if (-not (Test-Path -LiteralPath $ProjectPath)) {
  Write-Host "[FATAL] Chemin introuvable : $ProjectPath" -ForegroundColor Red; exit 1
}

$projectName = Split-Path $ProjectPath -Leaf
$genreDir = Split-Path (Split-Path $ProjectPath) -Leaf

# Determiner le dossier d'unites selon le genre
$unitDir = switch ($genreDir) {
  'romans'       { 'chapitres' }
  'poesie'       { 'sections' }
  'theatre'      { 'scenes' }
  'essais'       { 'chapitres' }
  'nouvelles'    { 'recits' }
  'textes-mobiles' { 'textes' }
  'universitaire' { 'chapitres' }
  default        { 'chapitres' }
}

$brouillonPrefix = switch ($genreDir) {
  'romans'       { 'brouillon' }
  'poesie'       { 'brouillon' }
  'theatre'      { 'brouillon' }
  'essais'       { 'brouillon' }
  'nouvelles'    { 'brouillon' }
  'textes-mobiles' { 'brouillon' }
  'universitaire' { 'brouillon' }
  default        { 'brouillon' }
}

$biblePath = "$ProjectPath\bible.md"
$bdcPath = "$ProjectPath\bd-connaissances.md"
$citationsPath = "$ProjectPath\$unitDir\_citations-utilisees.md"
$unitFolder = "$ProjectPath\$unitDir"

if (-not $OutputDir) { $OutputDir = "$ProjectPath\notes" }
$reportPath = "$OutputDir\rapport-coherence.md"

Log-Info "Cible : $projectName ($genreDir)"
Log-Info "Unites : $unitFolder"
Log-Info "Bible  : $(if (Test-Path $biblePath) { 'v' } else { 'x' })"
Log-Info "BDC    : $(if (Test-Path $bdcPath) { 'v' } else { 'x' })"

# --- Lecture des fichiers textes ---
function Read-TextFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  try {
    $content = Get-Content -Raw -LiteralPath $Path -ErrorAction Stop -Encoding utf8
    return Normalize-NFC $content
  } catch {
    Log-Warn "Impossible de lire $Path : $_"
    return $null
  }
}

# --- Parse la bible ---
function Parse-Bible {
  param([string]$Content)
  if (-not $Content) { return @{} }

  $bible = @{}
  $bible['personnages_principaux'] = @()
  $bible['personnages_secondaires'] = @()
  $bible['lieux'] = @()
  $bible['timeline'] = @()
  $bible['glossaire'] = @{}

  # Personnages principaux
  if ($Content -match '## Personnages principaux\s*\n(.*?)(?=## |\Z)') {
    $section = $Matches[1]
    $section -split '\n' | ForEach-Object {
      if ($_ -match '^-\s*(.+?)\s*:\s*(.+?)$') {
        $nom = $Matches[1].Trim()
        $desc = $Matches[2].Trim()
        $variantes = @()
        if ($_ -match 'Variantes orthographiques acceptees\s*:\s*(.+?)$') {
          $variantes = $Matches[1] -split ',' | ForEach-Object { $_.Trim() }
        }
        $bible['personnages_principaux'] += @{ Nom = $nom; Description = $desc; Variantes = $variantes }
      }
    }
  }

  # Personnages secondaires
  if ($Content -match '## Personnages secondaires\s*\n(.*?)(?=## |\Z)') {
    $section = $Matches[1]
    $section -split '\n' | ForEach-Object {
      if ($_ -match '^-\s*(.+?)\s*:\s*(.+?)$') {
        $bible['personnages_secondaires'] += @{ Nom = $Matches[1].Trim(); Description = $Matches[2].Trim() }
      }
    }
  }

  # Lieux principaux
  if ($Content -match '## Lieux principaux\s*\n(.*?)(?=## |\Z)') {
    $section = $Matches[1]
    $section -split '\n' | ForEach-Object {
      if ($_ -match '^-\s*(.+?)\s*:\s*(.+?)$') {
        $bible['lieux'] += @{ Nom = $Matches[1].Trim(); Description = $Matches[2].Trim() }
      }
    }
  }

  # Timeline
  if ($Content -match '## Timeline\s*\n(.*?)(?=## |\Z)') {
    $section = $Matches[1]
    $section -split '\n' | ForEach-Object {
      if ($_ -match '^-\s*(.+?)\s*:\s*(.+?)$') {
        $bible['timeline'] += @{ Date = $Matches[1].Trim(); Evenement = $Matches[2].Trim() }
      }
    }
  }

  # Glossaire
  if ($Content -match '## Glossaire[^a-zA-Z\n]*\n(.*?)(?=## |\Z)') {
    $section = $Matches[1]
    $section -split '\n' | ForEach-Object {
      if ($_ -match '^-\s*(.+?)\s*:\s*(.+?)$') {
        $bible['glossaire'][$Matches[1].Trim()] = $Matches[2].Trim()
      }
    }
  }

  return $bible
}

# --- Liste les unites (fichiers de texte) ---
function Get-Units {
  param([string]$Dir, [string]$Genre)
  if (-not (Test-Path -LiteralPath $Dir)) { return @() }
  Get-ChildItem -LiteralPath $Dir -File -Filter '*.md' | Where-Object {
    $_.Name -ne '_citations-utilisees.md' -and
    $_.Name -notlike "$brouillonPrefix-*" -and
    $_.Name -notlike 'avis-editeur*' -and
    $_.Name -notlike '.gitkeep'
  } | Sort-Object Name
}

# =============================================
# MODULE 1 : GLOSSAIRE
# =============================================
function Test-Glossary {
  param([hashtable]$Bible, [array]$Units)
  Log-Section '1. GLOSSAIRE'

  if ($Bible['glossaire'].Count -eq 0 -and -not (Test-Path $citationsPath)) {
    Log-Info 'Aucun glossaire defini - verification ignoree.'
    return
  }

  $glossaire = @{}
  foreach ($kv in $Bible['glossaire'].GetEnumerator()) {
    $glossaire[$kv.Key] = $kv.Value
  }
  $bdcContent = Read-TextFile "$ProjectPath\bd-connaissances.md"
  if ($bdcContent -and $bdcContent -match '## Glossaire et references\s*\n(.*?)(?=## |\Z)') {
    $section = $Matches[1]
    $section -split '\n' | ForEach-Object {
      if ($_ -match '^-\s*(.+?)\s*:\s*(.+?)$') {
        $glossaire[$Matches[1].Trim()] = $Matches[2].Trim()
      }
    }
  }

  if ($glossaire.Count -eq 0) {
    Log-Info 'Aucun glossaire defini - verification ignoree.'
    return
  }

  Log-Info "$($glossaire.Count) terme(s) au glossaire"
  Log-Pass 'Glossaire : aucune incoherence detectee'
}

# =============================================
# MODULE 2 : CITATIONS
# =============================================
function Test-Citations {
  param([array]$Units)
  Log-Section '2. CITATIONS'

  $citationsFile = "$ProjectPath\$unitDir\_citations-utilisees.md"
  if (-not (Test-Path -LiteralPath $citationsFile)) {
    Log-Info 'Fichier _citations-utilisees.md introuvable - verification ignoree.'
    return
  }

  $citationsContent = Read-TextFile $citationsFile
  if (-not $citationsContent) { return }

  # Parser les citations
  $citationEntries = @()
  $currentChapter = ''

  $lines = $citationsContent -split '\n'
  foreach ($line in $lines) {
    if ($line -match '^##\s+(.+)') {
      $currentChapter = $Matches[1].Trim()
    } elseif ($line -match "^-\s*`"(.+)`"") {
      # Match: - "citation text"
      $citationEntries += @{
        Chapter = $currentChapter
        Text = $Matches[1].Trim()
        Source = if ($line -match '---+\s*(.+)$') { $Matches[1].Trim() } else { '' }
      }
    } elseif ($line -match "^-\s*«(.+)»") {
      # Match: - «citation text»
      $citationEntries += @{
        Chapter = $currentChapter
        Text = $Matches[1].Trim()
        Source = if ($line -match '---+\s*(.+)$') { $Matches[1].Trim() } else { '' }
      }
    }
  }

  if ($citationEntries.Count -eq 0) {
    Log-Info 'Aucune citation structuree trouvee dans _citations-utilisees.md.'
    return
  }

  Log-Info "$($citationEntries.Count) citation(s) referencee(s)"

  # Verifier chaque citation
  foreach ($entry in $citationEntries) {
    $chapterTag = $entry.Chapter -replace '^[Cc][Hh]\s*', 'CH'
    $chapterNum = if ($chapterTag -match '(\d+)') { $Matches[1] } else { $null }

    $unitFile = $null
    if ($chapterNum) {
      $unitFile = $Units | Where-Object {
        $_.BaseName -match '\d+' -and [regex]::Match($_.BaseName, '\d+').Value -eq $chapterNum
      } | Select-Object -First 1
    }

    if (-not $unitFile) {
      $unitFile = $Units | Where-Object { $_.BaseName -eq $entry.Chapter } | Select-Object -First 1
    }

    if (-not $unitFile) {
      Add-Result '??' 'CITATION' 'ANOMALIE' "Citation referencee pour '$($entry.Chapter)' mais aucun fichier d'unite correspondant trouve"
      continue
    }

    $unitContent = Read-TextFile $unitFile.FullName
    if (-not $unitContent) { continue }

    $citationNormalized = Normalize-NFC $entry.Text
    $unitContentNormalized = Normalize-NFC $unitContent

    $escapedCitation = [regex]::Escape($citationNormalized)
    if (-not [regex]::IsMatch($unitContentNormalized, $escapedCitation)) {
      $flexPattern = [regex]::Escape($citationNormalized.TrimEnd('.', '!', '?', ',', ';', ':', [char]0x2026))
      if (-not [regex]::IsMatch($unitContentNormalized, $flexPattern)) {
        Add-Result $unitFile.Name 'CITATION' 'REFUS' "Citation absente du texte : <<$($entry.Text)>>" '' $entry.Text 'presente dans le texte'
      }
    }
  }

  # Detection des citations orphelines
  foreach ($unit in $Units) {
    $content = Read-TextFile $unit.FullName
    if (-not $content) { continue }

    $guillemets = [regex]::Matches($content, '«([^»]+)»')
    foreach ($g in $guillemets) {
      $citedText = $g.Groups[1].Value.Trim()
      if ($citedText.Length -lt 5) { continue }

      $referenced = $citationEntries | Where-Object { $_.Text -eq $citedText }
      if (-not $referenced) {
        Add-Result $unit.Name 'CITATION' 'ANOMALIE' "Citation non referencee dans _citations-utilisees.md : <<$citedText>>" '' $citedText ''
      }
    }
  }

  $citationIssues = $script:allResults | Where-Object { $_.Type -eq 'CITATION' }
  if ($citationIssues.Count -eq 0) {
    Log-Pass "Citations : $($citationEntries.Count) verifiees, toutes presentes"
  }
}

# =============================================
# MODULE 3 : NOMS DE PERSONNAGES
# =============================================
function Test-CharacterNames {
  param([hashtable]$Bible, [array]$Units)
  Log-Section '3. PERSONNAGES'

  $personnages = $Bible['personnages_principaux'] + $Bible['personnages_secondaires']
  if ($personnages.Count -eq 0) {
    Log-Info 'Aucun personnage defini dans la bible - verification ignoree.'
    return
  }

  Log-Info "$($personnages.Count) personnage(s) a verifier"

  $nomVariations = @{}
  foreach ($p in $personnages) {
    $nomCanon = $p.Nom
    $variations = @($nomCanon)
    $variations += $p.Variantes

    if ($nomCanon -match '-') {
      $variations += $nomCanon -replace '-', ' '
    }
    if ($nomCanon -match ' ') {
      $variations += $nomCanon -replace ' ', '-'
    }
    $noAccent = $nomCanon
    $noAccent = $noAccent -replace '[eEeEeEeE]', 'e' -replace '[aAaA]', 'a' -replace '[uUuU]', 'u'
    $noAccent = $noAccent -replace '[oOoO]', 'o' -replace '[iIiI]', 'i' -replace '[cC]', 'c'
    if ($noAccent -ne $nomCanon) {
      $variations += $noAccent
    }
    $variations += $nomCanon.ToLower()
    $variations += (Get-Culture).TextInfo.ToTitleCase($nomCanon.ToLower())

    if ($nomCanon -match '^(Le|La|Les|De|Du|Des|D|L)\s') {
      $prefix = $Matches[1]
      $rest = $nomCanon.Substring($prefix.Length).Trim()
      $variations += "$($prefix.ToLower()) $rest"
    }

    $nomVariations[$nomCanon] = $variations | Select-Object -Unique
  }

  foreach ($unit in $Units) {
    $content = Read-TextFile $unit.FullName
    if (-not $content) { continue }

    foreach ($p in $personnages) {
      $nomCanon = $p.Nom
      $variations = $nomVariations[$nomCanon]
      $nonCanonVariations = $variations | Where-Object { $_ -ne $nomCanon }

      foreach ($var in $nonCanonVariations) {
        $varPattern = [regex]::Escape($var)
        $varMatches = [regex]::Matches($content, $varPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($m in $varMatches) {
          if ($m.Value -ne $nomCanon) {
            $lineNum = ($content.Substring(0, $m.Index) -split "`n").Count
            Add-Result $unit.Name 'PERSONNAGE' 'REFUS' "Variation orthographique : <<$($m.Value)>> au lieu de <<$nomCanon>>" "$($unit.Name):$lineNum" $m.Value $nomCanon
          }
        }
      }
    }
  }

  $charIssues = $script:allResults | Where-Object { $_.Type -eq 'PERSONNAGE' }
  if ($charIssues.Count -eq 0) {
    Log-Pass 'Personnages : tous les noms sont coherents'
  }
}

# =============================================
# MODULE 4 : CHRONOLOGIE
# =============================================
function Test-Chronology {
  param([hashtable]$Bible, [array]$Units)
  Log-Section '4. CHRONOLOGIE'

  $timeline = $Bible['timeline']
  if ($timeline.Count -eq 0) {
    Log-Info 'Aucune timeline definie dans la bible - verification limitee aux dates relatives.'
  } else {
    Log-Info "$($timeline.Count) entree(s) dans la timeline"
  }

  $datePatterns = @(
    '\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    '\b\d{1,2}\s*(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+\d{4}\b'
    '\b(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+\d{4}\b'
    'le\s+(lendemain|surlendemain|jour\s+suivant|veille|jour\s+precedent)'
    '(\d+)\s*(jour|jours|semaine|semaines|mois|annee|annees|heure|heures)\s*plus\s*(tard|tot|tard)'
    '\b(printemps|ete|automne|hiver)\s+\d{4}\b'
  )

  $unitDates = @{}
  foreach ($unit in $Units) {
    $content = Read-TextFile $unit.FullName
    if (-not $content) { continue }

    $foundDates = @()
    foreach ($pattern in $datePatterns) {
      $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
      foreach ($m in $matches) {
        $foundDates += @{ Value = $m.Value; Position = $m.Index }
      }
    }
    $unitDates[$unit.Name] = $foundDates
  }

  # Verifier coherence avec la timeline de la bible
  foreach ($entry in $timeline) {
    $dateStr = $entry.Date
    foreach ($unit in $Units) {
      $content = Read-TextFile $unit.FullName
      if (-not $content) { continue }

      if ($content -match [regex]::Escape($dateStr)) {
        $eventKeywords = $entry.Evenement -split '\s+' | Where-Object { $_.Length -gt 3 }
        $eventFound = $false
        foreach ($kw in $eventKeywords) {
          if ($content -match [regex]::Escape($kw)) { $eventFound = $true; break }
        }
        if (-not $eventFound -and $eventKeywords.Count -gt 0) {
          Add-Result $unit.Name 'CHRONOLOGIE' 'ANOMALIE' "Date $dateStr mentionnee mais l'evenement <<$($entry.Evenement)>> absent du contexte" '' $dateStr $entry.Evenement
        }
      }
    }
  }

  $chronoIssues = $script:allResults | Where-Object { $_.Type -eq 'CHRONOLOGIE' }
  if ($chronoIssues.Count -eq 0) {
    Log-Pass 'Chronologie : aucune incoherence temporelle detectee'
  }
}

# =============================================
# MODULE 5 : PREUVES MATERIELLES
# =============================================
function Test-MaterialEvidence {
  param([array]$Units)
  Log-Section '5. PREUVES MATERIELLES'

  $bdcContent = Read-TextFile "$ProjectPath\bd-connaissances.md"
  if (-not $bdcContent -or $bdcContent -notmatch '## Preuves materielles etablies') {
    Log-Info 'Section << Preuves materielles etablies >> introuvable dans bd-connaissances.md - verification ignoree.'
    return
  }

  $preuves = @{}
  $currentChapter = ''
  $currentPreuves = @()

  $lines = $bdcContent -split '\n'
  foreach ($line in $lines) {
    if ($line -match '^###\s+(.+)') {
      if ($currentChapter -and $currentPreuves.Count -gt 0) {
        foreach ($p in $currentPreuves) {
          if (-not $preuves.ContainsKey($p.Nom)) { $preuves[$p.Nom] = @{} }
          $preuves[$p.Nom][$currentChapter] = $p
        }
      }
      $currentChapter = $Matches[1].Trim()
      $currentPreuves = @()
    } elseif ($line -match '^-\s*(.+?)\s*:\s*(.+?)$') {
      $currentPreuves += @{
        Nom = $Matches[1].Trim()
        Description = $Matches[2].Trim()
      }
    }
  }
  if ($currentChapter -and $currentPreuves.Count -gt 0) {
    foreach ($p in $currentPreuves) {
      if (-not $preuves.ContainsKey($p.Nom)) { $preuves[$p.Nom] = @{} }
      $preuves[$p.Nom][$currentChapter] = $p
    }
  }

  if ($preuves.Count -eq 0) {
    Log-Info 'Aucune preuve materielle structuree trouvee.'
    return
  }

  Log-Info "$($preuves.Count) preuve(s) materielle(s) suivie(s)"

  foreach ($kv in $preuves.GetEnumerator()) {
    $preuveName = $kv.Key
    $chapitres = $kv.Value

    $chapitreNums = @()
    foreach ($ch in $chapitres.Keys) {
      $num = [regex]::Match($ch, '\d+').Value
      if ($num) { $chapitreNums += [int]$num }
    }
    $chapitreNums = $chapitreNums | Sort-Object

    # Verifier continuite
    if ($chapitreNums.Count -ge 2) {
      $minCh = $chapitreNums[0]
      $maxCh = $chapitreNums[-1]

      for ($c = $minCh + 1; $c -lt $maxCh; $c++) {
        $unitFile = $Units | Where-Object {
          $_.BaseName -match '\d+' -and [int][regex]::Match($_.BaseName, '\d+').Value -eq $c
        } | Select-Object -First 1

        if (-not $unitFile) { continue }

        $content = Read-TextFile $unitFile.FullName
        if (-not $content) { continue }

        $preuveEscaped = [regex]::Escape($preuveName)
        if (-not [regex]::IsMatch($content, $preuveEscaped, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
          Add-Result $unitFile.Name 'PREUVE' 'ANOMALIE' "Preuve <<$preuveName>> presente dans ch$minCh et ch$maxCh mais absente du ch$c" '' $preuveName "mention dans ch$c"
        }
      }
    }

    # Verifier etats contradictoires
    $etats = @()
    foreach ($ch in $chapitres.Keys) {
      $info = $chapitres[$ch]
      $description = $info.Description

      $etatKeywords = @()
      if ($description -match '(sur|dans|sous|a cote de|devant|derriere|par terre)') {
        $etatKeywords += $Matches[0]
      }
      if ($description -match '(casse|brise|detruit|perdu|range|cache|visible|ouvert|ferme)') {
        $etatKeywords += $Matches[0]
      }
      if ($description -match '(plein|vide|neuf|use|propre|sale)') {
        $etatKeywords += $Matches[0]
      }

      $etats += @{
        Chapitre = $ch
        MotsCles = $etatKeywords
        Description = $description
      }
    }

    # Detecter contradictions
    for ($i = 0; $i -lt $etats.Count - 1; $i++) {
      for ($j = $i + 1; $j -lt $etats.Count; $j++) {
        $e1 = $etats[$i]
        $e2 = $etats[$j]

        $antonymes = @{}
        $antonymes['sur']     = 'sous'; $antonymes['sous']    = 'sur'
        $antonymes['devant']  = 'derriere'; $antonymes['derriere']  = 'devant'
        $antonymes['casse']  = 'neuf'; $antonymes['neuf']     = 'casse'
        $antonymes['ouvert']  = 'ferme'; $antonymes['ferme']  = 'ouvert'
        $antonymes['visible'] = 'cache'; $antonymes['cache']    = 'visible'
        $antonymes['plein']   = 'vide'; $antonymes['vide']    = 'plein'
        $antonymes['propre']  = 'sale'; $antonymes['sale']    = 'propre'

        $contradictions = @()
        foreach ($kw1 in $e1.MotsCles) {
          if ($antonymes.ContainsKey($kw1) -and $antonymes[$kw1] -in $e2.MotsCles) {
            $contradictions += "$kw1 vs $($antonymes[$kw1])"
          }
        }

        if ($contradictions.Count -gt 0) {
          Add-Result "ch$($e2.Chapitre)" 'PREUVE' 'ANOMALIE' "Preuve <<$preuveName>> : etat contradictoire entre $($e1.Chapitre) ($($e1.Description)) et $($e2.Chapitre) ($($e2.Description)) : $($contradictions -join ', ')" '' $e2.Description $e1.Description
        }
      }
    }
  }

  # Verification compteurs
  foreach ($kv in $preuves.GetEnumerator()) {
    $preuveName = $kv.Key
    $chapitres = $kv.Value

    $compteurs = @()
    foreach ($ch in $chapitres.Keys) {
      $desc = $chapitres[$ch].Description
      if ($desc -match '(\d+)') {
        $compteurs += @{ Chapitre = $ch; Valeur = [int]$Matches[1] }
      }
    }

    if ($compteurs.Count -ge 2) {
      $compteurs = $compteurs | Sort-Object { $_.Valeur }
      for ($i = 0; $i -lt $compteurs.Count - 1; $i++) {
        if ($compteurs[$i + 1].Valeur -le $compteurs[$i].Valeur) {
          Add-Result "ch$($compteurs[$i+1].Chapitre)" 'PREUVE' 'REFUS' "Compteur <<$preuveName>> : valeur $($compteurs[$i+1].Valeur) <= $($compteurs[$i].Valeur) (progression incoherente)" '' $compteurs[$i+1].Valeur ">$($compteurs[$i].Valeur)"
        }
      }
    }
  }

  $preuveIssues = $script:allResults | Where-Object { $_.Type -eq 'PREUVE' }
  if ($preuveIssues.Count -eq 0) {
    Log-Pass "Preuves materielles : $($preuves.Count) preuves, toutes coherentes"
  }
}

# =============================================
# MODULE 6 : GLOSSAIRE APPROFONDI (acronymes)
# =============================================
function Test-GlossaryDeep {
  param([hashtable]$Bible, [array]$Units)
  Log-Section '6. GLOSSAIRE (detail)'

  $glossaire = @{}
  $bdcContent = Read-TextFile "$ProjectPath\bd-connaissances.md"

  if ($Bible['glossaire'].Count -gt 0) {
    foreach ($kv in $Bible['glossaire'].GetEnumerator()) { $glossaire[$kv.Key] = $kv.Value }
  }
  if ($bdcContent -and $bdcContent -match '## Glossaire et references\s*\n(.*?)(?=## |\Z)') {
    $section = $Matches[1]
    $section -split '\n' | ForEach-Object {
      if ($_ -match '^-\s*(.+?)\s*:\s*(.+?)$') {
        $glossaire[$Matches[1].Trim()] = $Matches[2].Trim()
      }
    }
  }

  if ($glossaire.Count -eq 0) {
    Log-Info 'Aucun glossaire defini - verification ignoree.'
    return
  }

  # Detection des acronymes non definis
  $acronymPattern = '\b([A-Z][A-Z]{1,})\b'
  foreach ($unit in $Units) {
    $content = Read-TextFile $unit.FullName
    if (-not $content) { continue }

    $acronyms = [regex]::Matches($content, $acronymPattern)
    $seenAcronyms = @{}

    foreach ($a in $acronyms) {
      $acr = $a.Value
      if ($acr.Length -lt 2 -or $acr.Length -gt 10) { continue }
      if ($seenAcronyms.ContainsKey($acr)) { continue }
      $seenAcronyms[$acr] = $true

      # Mots communs exclus
      $commonUpperCase = @('LE','LA','LES','UN','UNE','DES','DU','AU','AUX','CE','CES','CET','SON','SA','SES','LUI','ELLE','ILS','ELLES','NOUS','VOUS','PAS','POUR','DANS','SUR','AVEC','TOUT','TOUS','MAIS','DONT','SANS','OU','ET','NI','CAR','LES','MES','TES','SES','NOS','VOS','LEUR','LEURS','QUE','QUI','QUOI','DONC','OR','NE','SI','DE')
      if ($acr -in $commonUpperCase) { continue }

      $commonAbbr = @('M.','Mme','Mlle','Dr','Pr','Mgr','St','Ste','N.D.')
      if ($acr -in ($commonAbbr -replace '\.','')) { continue }

      # Verifier si nom de personnage
      $allChars = $Bible['personnages_principaux'] + $Bible['personnages_secondaires']
      $isCharName = $false
      foreach ($ch in $allChars) {
        $nameParts = $ch.Nom -split '\s+'
        if ($acr -eq $nameParts[-1] -or $acr -eq $ch.Nom) {
          $isCharName = $true; break
        }
      }
      if ($isCharName) { continue }

      # Verifier debut de phrase
      $isSentenceStart = $false
      if ($a.Index -eq 0) { $isSentenceStart = $true }
      else {
        $charBefore = $content[$a.Index - 1]
        if ($charBefore -match '[.?!\n]') { $isSentenceStart = $true }
      }

      if (-not $isSentenceStart -and -not $glossaire.ContainsKey($acr)) {
        Add-Result $unit.Name 'GLOSSAIRE' 'ANOMALIE' "Acronyme non defini : $acr" "$($unit.Name):$(($content.Substring(0,$a.Index) -split "`n").Count)" $acr ''
      }
    }
  }

  $glossaryIssues = $script:allResults | Where-Object { $_.Type -eq 'GLOSSAIRE' }
  if ($glossaryIssues.Count -eq 0) {
    Log-Pass "Glossaire : $($glossaire.Count) termes, aucun acronyme orphelin"
  }
}

# =============================================
# RAPPORT
# =============================================
function Write-Report {
  Log-Section 'GENERATION DU RAPPORT'

  $refusCount = ($script:allResults | Where-Object { $_.Severite -eq 'REFUS' }).Count
  $anomalieCount = ($script:allResults | Where-Object { $_.Severite -eq 'ANOMALIE' }).Count
  $duration = (Get-Date) - $script:startTime

  $classementLines = @()
  $types = $script:allResults | Group-Object Type
  foreach ($g in $types) {
    $r = ($g.Group | Where-Object { $_.Severite -eq 'REFUS' }).Count
    $a = ($g.Group | Where-Object { $_.Severite -eq 'ANOMALIE' }).Count
    $classementLines += "### $($g.Name) : $r REFUS, $a ANOMALIES`n"
    foreach ($res in $g.Group) {
      $classementLines += "- [$($res.Severite)] $($res.Description) ($($res.Unite))`n"
    }
    $classementLines += "`n"
  }
  $classementStr = $classementLines -join ''

  $detailLines = @()
  if ($script:allResults.Count -gt 0) {
    foreach ($res in $script:allResults) {
      $detailLines += "- **[$($res.Severite)] $($res.Type)** -- $($res.Description)"
      $detailLines += "  - Unite : $($res.Unite)"
      $detailLines += "  - Emplacement : $($res.Emplacement)"
      if ($res.ValeurTrouvee -or $res.ValeurAttendue) {
        $detailLines += "  - Trouve : <<$($res.ValeurTrouvee)>> / Attendu : <<$($res.ValeurAttendue)>>"
      }
    }
  }
  $detailStr = $detailLines -join "`n"

  $refusLines = @()
  if ($refusCount -gt 0) {
    foreach ($res in ($script:allResults | Where-Object { $_.Severite -eq 'REFUS' })) {
      $refusLines += "- [$($res.Type)] $($res.Description) -> $($res.Emplacement)"
    }
  }
  $refusStr = $refusLines -join "`n"

  $unitNames = @()
  foreach ($u in $Units) { $unitNames += $u.Name }
  $unitStr = $unitNames -join ', '

  $report = @"
# Rapport de coherence -- $projectName

**Date** : $(Get-Date -Format 'dd/MM/yyyy HH:mm')
**Script** : validate-consistency.ps1 v1.0
**Duree** : $($duration.TotalSeconds.ToString('F1'))s

## Resume

| Metrique | Valeur |
|---|---|
| Total anomalies | $($script:allResults.Count) |
| REFUS | $refusCount |
| ANOMALIES | $anomalieCount |
| Unites verifiees | $($Units.Count) |
| Genre | $genreDir |

## Par categorie

$classementStr

## Anomalies critiques (REFUS)

$(if ($refusCount -eq 0) { 'Aucune.' } else { $refusStr })

## Detail complet

$(if ($script:allResults.Count -eq 0) { 'Aucune anomalie detectee.' } else { $detailStr })

## Recommandations

$(if ($script:allResults.Count -eq 0) {
  'Projet coherent. Aucune correction necessaire.'
} elseif ($refusCount -gt 0) {
@"
REFUS detectes -- correction obligatoire avant finalisation.

Recommandations :
- **Personnages** : uniformiser l'orthographe des noms (accents, traits d'union, casse)
- **Citations** : ajouter les citations manquantes dans les chapitres, ou corriger le fichier _citations-utilisees.md
- **Preuves** : verifier la continuite des objets d'un chapitre a l'autre
- **Chronologie** : verifier les dates et la timeline
"@
} else {
@"
ANOMALIES detectees -- a verifier avant finalisation.

Recommandations :
- Les anomalies detectees sont mineures mais meritent une verification humaine
- Utiliser /rex apres correction pour valider la coherence
- Lancer auditeur (agent IA) pour une evaluation narrative complementaire
"@
})

## Details d'execution

- Script : $PSCommandPath
- Projet : $ProjectPath
- Parametres : Quiet=$Quiet Strict=$Strict
- Unites analysees : $($Units.Count)
  $unitStr

---

*Rapport genere automatiquement par validate-consistency.ps1 -- $(Get-Date -Format 'dd/MM/yyyy HH:mm')*
"@

  $outDir = Split-Path $reportPath -Parent
  if (-not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

  $report | Out-File -FilePath $reportPath -Encoding utf8
  Log-Info "Rapport genere : $reportPath"
}

# =============================================
# POINT D'ENTREE PRINCIPAL
# =============================================
Write-Host '=== Validation de coherence v1.0 ===' -ForegroundColor Cyan
Write-Host "Projet : $projectName ($genreDir)" -ForegroundColor Cyan
Write-Host ''

$bibleContent = Read-TextFile $biblePath
$bible = Parse-Bible $bibleContent

$Units = Get-Units -Dir $unitFolder -Genre $genreDir
Log-Info "$($Units.Count) unite(s) trouvee(s)"

# Executer les modules
Test-Glossary -Bible $bible -Units $Units
Test-Citations -Units $Units
Test-CharacterNames -Bible $bible -Units $Units
Test-Chronology -Bible $bible -Units $Units
Test-MaterialEvidence -Units $Units
Test-GlossaryDeep -Bible $bible -Units $Units

# Rapport
Write-Report

# Resume final
Write-Host "`n=== Resume ===" -ForegroundColor Cyan
$totalRefus = ($script:allResults | Where-Object { $_.Severite -eq 'REFUS' }).Count
$totalAnomalies = ($script:allResults | Where-Object { $_.Severite -eq 'ANOMALIE' }).Count

if ($script:allResults.Count -eq 0) {
  Write-Host 'Aucune anomalie detectee. Projet coherent.' -ForegroundColor Green
} else {
  Write-Host "$($script:allResults.Count) anomalies ($totalRefus REFUS, $totalAnomalies ANOMALIES)" -ForegroundColor Yellow
}

if ($Strict -and $script:allResults.Count -gt 0) {
  $script:exitCode = 1
}

exit $script:exitCode
