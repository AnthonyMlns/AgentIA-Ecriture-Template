# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.4] — 2026-06-19

### Added
- Full pipeline for 7 genres: novel, poetry, theatre, essay, short story, mobile text, academic writing
- 22 stackable skills (14 tested, 3 anchored, 5 speculative)
- Web dashboard with auth, multi-user support, file upload
- Automatic PDF generation
- Interactive pre-flight dialogue (step 0.6)
- Inactivity watchdog for long generations (step 0.7)
- Security hardening S1-S17
- `CONTRIBUTING.md` with commit/branch/PR conventions
- `CHANGELOG.md` (this file)
- `LICENSE` (MIT)
- `PULL_REQUEST_TEMPLATE.md`
- `CODEOWNERS` for auto-review assignment
- GitHub Actions CI workflow (commit lint + branch naming)
- Issue templates with improved frontmatter

### Changed
- README: added Contributing section, version badge, aligned versioning
- Bug report template: added logs/screenshots and version fields
- User story template: added projects field in frontmatter

### Fixed
- Versioning alignment: README, milestones, and ROADMAP.md now agree on v0.x
- Issue templates now include milestone and projects in frontmatter

## [0.3] — 2026-06-18

### Added
- Interface: continue streaming via SSE, tolerant progress detection
- Watchdog + SSE heartbeat for long generations
- Security: S15-S17 hardening

### Fixed
- opencode bridge: session resume, --session flag
- Windows spawn: .bat workaround, cmd.exe /c fallback

## [0.2] — 2026-06-17

### Added
- Nouvelle (short story) pipeline with agents and skills
- Scenario pipeline (placeholder)

### Changed
- Architecture: skills regrouped into Forms / Influences / Voices
- Voice workflow: agent-style generates custom voice skills from samples

## [0.1] — 2026-06-15

### Added
- Initial project structure
- Novel and poetry pipelines
- Core agents: orchestrator, writer, editor, scribe, auditor
- Template system for genres and skills
- OpenCode configuration
