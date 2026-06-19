# Contributing to AgentIA-Ecriture-Template

Thank you for your interest in contributing! Here are the guidelines.

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

## Commit Convention

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description in English, imperative, no caps, no period

- Types: feat, fix, docs, style, refactor, test, chore
- Language: English
- Max 72 characters on the first line
- Reference issues: "Closes #42" or "Ref #42"
```

Examples:
```
feat(editor): add dark mode toggle                # Closes #12
fix(auth): handle token expiry gracefully          # Closes #8
docs(readme): update installation steps            # Closes #4
chore(deps): update opencode to v2.1.0
```

## Branch Naming

Create branches from `main` following this convention:

| Prefix | Purpose |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `hotfix/` | Urgent production fix |
| `release/v*.*.*` | Version preparation |
| `spike/` | Exploration / research |

Example: `feature/quotas-byok`, `fix/auth-s18-s23`, `docs/readme-update`

## Pull Request Process

1. **Create a branch** from `main` with the correct prefix
2. **One commit = one logical change** — keep it focused
3. **Open a Pull Request** against `main`
4. **Reference the related issue** in the PR description (e.g., "Closes #6")
5. **Ensure CI passes** before requesting review
6. **A maintainer reviews and merges**

### PR Template

When opening a PR, include:
- What this PR does
- Why it's needed (link to issue)
- How to test it
- Screenshots (if UI change)

## Reporting Bugs

Use the **Bug Report** template in Issues. Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, version, commit hash)
- Logs or screenshots if available

## Suggesting Features

Use the **User Story** template in Issues. Include:
- Role: "As a..."
- Goal: "I want..."
- Benefit: "So that..."
- Acceptance criteria

## Project Structure

```
.opencode/             # Agents, skills, and workflows
  agent/               # 28 agents (7 orchestrators + 21 sub-agents)
  skills/              # 22 stackable skills
projets/               # Your writing projects (gitignored content)
knowledge/             # Shared references & sorted notes
echantillons/          # Raw text samples for style analysis
interface/             # Web dashboard (Node/Express)
```

## Need Help?

Open a discussion or issue — we're happy to guide you.
