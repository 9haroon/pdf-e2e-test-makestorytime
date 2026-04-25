# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

---

## How this repo is organised

```
.specify/
├── memory/
│   └── constitution.md        # Project principles — read by speckit.* commands
├── templates/                 # Spec Kit prompt templates
│   └── deploy/{{DEPLOY_PLATFORM}}/  # Platform-specific scaffold
└── scripts/bash/              # run-constitution.sh, run-specify.sh, run-plan.sh, …
DEPLOY.md                      # Deployment instructions for {{DEPLOY_PLATFORM}}
README.md                      # This file
```

Specification, planning, and requirement task content live in **Ideva Kit** (see the link below) — not in this repo. The developer's local `speckit.*` commands create and push per-feature `specs/` folders.

---

## Local development with Spec Kit

### Prerequisites

1. Install [Gemini CLI](https://github.com/google-gemini/gemini-cli): `npm install -g @google/gemini-cli`
2. Clone this repository and open it in Cursor (or VS Code with the Spec Kit extension).

### Workflow

```bash
# 1. Clone the repo (already done if you're reading this)
git clone <repo-url>
cd <repo-slug>

# 2. Generate a feature specification (creates specs/NNN-feature/spec.md)
speckit.specify

# 3. Generate the implementation plan
speckit.plan

# 4. Generate coding tasks (creates specs/NNN-feature/tasks.md)
speckit.tasks

# 5. Implement tasks locally
speckit.implement

# 6. Push — the Ideva Kit webhook syncs spec tasks back to the Kanban
git add specs/ && git commit -m "feat: add feature spec" && git push
```

After pushing, coding tasks from `specs/NNN-<slug>/tasks.md` appear on the Kanban in Ideva Kit with status `implemented`.

---

## Deployment

See [DEPLOY.md](./DEPLOY.md) for platform-specific setup instructions.

This project is configured for **{{DEPLOY_PLATFORM}}**.

---

## Project planning lives in Ideva Kit

Requirements, specification, plan, and requirement tasks are managed in Ideva Kit:

👉 [Open project in Ideva Kit]({{IDEVA_KIT_PROJECT_URL}})

The Kanban shows both stakeholder-facing requirement tasks (from the Business team review) and developer coding tasks (synced from this repo via webhook).
