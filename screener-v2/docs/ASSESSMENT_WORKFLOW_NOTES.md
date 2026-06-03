# Assessment Workflow Notes — Batch 15AO

## Overview

This batch consolidates assessment management entry points and clarifies the workflow separation: workspace-level assessment creation independent of candidates, with candidate linking deferred to Screening/Advanced Review stages.

## Changes

### 1. Department Assessment Hub (`/departments/[id]/assessments`)

**File:** `src/app/departments/[id]/assessments/page.tsx`

**Changes:**
- "Create / Assign Assessment" card now routes to `/create-test` (workspace-level assessment creation)
- Copy updated: "Create a screening assessment at workspace level. Link to candidates during screening or advanced review."
- "Assessment Results" card updated to route to `/results` (global results page instead of candidate-filtered view)
- Footer copy explains workflow: "Assessments can be created at workspace level and linked to candidates during Screening or Advanced Review."

**Motivation:**
- Separates workspace-level assessment management from candidate-specific operations
- Aligns with hiring workflow: create assessments first, assign to candidates during review stages
- Reduces confusion about "assignment" being a separate candidate action

### 2. Admin-Level Assessment Hub (`/assessments`)

**Status:** Already correctly implemented in earlier batch
- Routes to `/create-test` for assessment creation
- Routes to `/addons` for templates
- Routes to `/results` for completed assessments

### 3. Assessment Creation Route (`/create-test`)

**Status:** Already exists and supports:
- Optional `?candidateId=<id>` parameter for pre-linking
- Optional `?milestoneId=<id>` parameter
- Creates assessments at workspace level that can later be linked to candidates

### 4. Assessment Results Route (`/results`)

**Status:** Exists as admin-level results view

## Workflow Decision

**Stage 1: Create & Manage (Workspace Level)**
- Access `/departments/<id>/assessments` or `/assessments`
- Browse existing assessments and templates
- Create new assessments independently of any candidate

**Stage 2: Link to Candidates (During Screening/Review)**
- In Candidate Profile, Assessment Evidence card offers "Assign assessment"
- Links to `/create-test?candidateId=<id>` to create and link in one step
- Or select from existing workspace assessments in future (not yet implemented)

**Stage 3: Track Results**
- View assessment results on candidate profile
- Access admin results page for workspace-wide visibility
- No external result entry workflow yet (deferred to 15AR or later)

## Deferred / Not Changed

- ❌ External assessment result entry (no webhook/invite system yet)
- ❌ Assessment assignment to multiple candidates at once
- ❌ Candidate-batch assessment workflows
- ❌ Integration with external assessment platforms beyond current addon catalog
- ❌ Department-scoped assessment result filtering (global `/results` page used)

## Related Docs

- [UNIFIED_ATS_WORKSPACE_PLAN.md](UNIFIED_ATS_WORKSPACE_PLAN.md) — Overall workspace architecture
- [RESPONSIBLE_TEAM_ASSIGNMENTS.md](RESPONSIBLE_TEAM_ASSIGNMENTS.md) — Team assignment workflow
- [REAL_ATS_READINESS_GATE.md](REAL_ATS_READINESS_GATE.md) — Readiness checklist

## Next Batch

**Batch 15AL: Team, user creation, access roles, and hiring-team assignment**

Candidate-facing assessment integration will remain unchanged until team/user/access model is complete.
