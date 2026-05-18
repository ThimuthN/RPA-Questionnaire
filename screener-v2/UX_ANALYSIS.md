# Innobot Premium Screener v1 - UX Analysis
*Following IT4031 VAUED UX Design Framework*

---

## EXECUTIVE SUMMARY

**App Purpose**: An assessment platform that enables companies to efficiently screen, test, and evaluate candidates through timed assessments, while managing teams, departments, and hiring workflows.

**Core Value Proposition**: 
- Reduce hiring time & bias through standardized testing
- Enable collaborative hiring decisions (recruiter + hiring manager + interviewer)
- Scale candidate evaluation across multiple roles and departments

---

## 1. SCENARIO TOOLKIT: USER GROUPS

### Four Key User Groups (Education/Hiring Context)

| User Group | Goal | Pain Point |
|---|---|---|
| **Workspace Admin** | Manage workspace, users, departments; ensure compliance | Too many permission settings; department setup overhead; onboarding friction |
| **Recruiter** | Register candidates, send assessments, track pipeline | Manual candidate entry tedious; unclear assessment status; poor candidate filtering |
| **Hiring Manager** | Review results, make pass/fail decisions | Too many clicks to see decision history; confusing result layout; slow result comparison |
| **Interviewer** | Attend interviews assigned by recruiters | No visibility into interview schedule; notification gaps |
| **Candidate (External)** | Take assessment, receive results | Unclear instructions; timer anxiety; no progress indication; unsure about scoring |

---

## 2. PERSONA TEMPLATE (Using IT4031 Format)

### Persona 1: Sarah (Recruiter)

**Name** | Sarah Chen | **Age** | 32 | **Occupation** | Senior Recruiter  
**Device/Context** | Desktop @ office + Mobile during commute | **Tech Skill** | Medium (Gmail, Sheets, some no-code tools)

**Demographics**
- 5+ years recruiting experience
- Manages 15-30 candidate pipelines monthly
- Works in fast-paced 15-person recruiting team

**Behaviors**
- Mobile-first during candidate sourcing
- Multitasking: email + spreadsheet + screening platform
- Procrastinates on candidate note-taking until end-of-day
- Prefers simple workflows over feature-rich interfaces

**Goals**
- Register candidates in <2 minutes per person
- Track assessment status at a glance
- Export results for hiring manager review
- Reduce manual follow-up emails

**Pain Points**
- No bulk candidate upload → manual entry for 10+ candidates takes >30min
- Assessment status unclear (sent? started? completed?)
- Candidate filtering by department/role tedious
- Notes UI buried in modal → avoids adding context
- No CSV export ready-made for hiring manager

---

### Persona 2: James (Hiring Manager)

**Name** | James Patel | **Age** | 45 | **Occupation** | Engineering Manager  
**Device/Context** | Desktop @ office + Tablet @ home | **Tech Skill** | Low (clicks simple buttons; avoids new tools)

**Demographics**
- First time using assessment tool (previously just interviewed)
- Owns hiring for 5-person team
- Limited time; prefers async communication

**Behaviors**
- Visits tool 2-3 times per week
- Skims results rather than deep-reads
- Compares candidates side-by-side mentally
- Trusts recruiter's summary over full data

**Goals**
- See pass/fail decision in 10 seconds
- Understand why candidate scored low
- Compare top candidates quickly
- Export finalist list for offers

**Pain Points**
- Result layout has too much text → overwhelmed
- No visual comparison (side-by-side results missing)
- Scoring logic unexplained → doesn't trust scores
- Decision history hidden → can't see prior notes/changes
- Export format doesn't match offer template

---

### Persona 3: Rani (Admin)

**Name** | Rani Kumar | **Age** | 28 | **Occupation** | People Ops Manager  
**Device/Context** | Desktop @ office | **Tech Skill** | High (spreadsheets, databases, API basics)

**Demographics**
- New to company (3 months)
- Managing user onboarding and department structure
- Responsible for compliance, access control
- 200+ total users across 5 departments

**Behaviors**
- Sets up systems once, expects them to stay stable
- Likes documentation and audit trails
- Proactive (checks permissions weekly)
- Low tolerance for bugs in system of record

**Goals**
- Onboard users without manual code/tokens
- Assign users to departments clearly
- Audit who accessed what assessment
- Prevent unauthorized access

**Pain Points**
- User invitation requires manual password setup → UX friction
- Department dropdown shows inactive departments → confusion
- No audit log of permission changes → compliance risk
- Adding new assessment type requires backend help → not self-service

---

### Persona 4: Alex (Candidate - External)

**Name** | Alex Rodriguez | **Age** | 26 | **Occupation** | Job Seeker (Software Engineer)  
**Device/Context** | Mobile (phone) + Laptop (home) | **Tech Skill** | Medium (uses Slack, Figma, dev tools)

**Demographics**
- Applying to 5+ companies concurrently
- Anxious about technical assessments
- First time using Innobot screener
- 30-45 minutes available for assessment

**Behaviors**
- Starts assessment at last minute (day before deadline)
- Switches between devices mid-test (phone → laptop)
- Expects autosave but doesn't trust it
- Worries about time running out

**Goals**
- Complete assessment without technical issues
- Understand what's being scored
- See real-time progress
- Receive confirmation when submitted

**Pain Points**
- No clear instructions (what's expected?)
- Timer creates anxiety (no time buffer shown)
- No progress bar → doesn't know if halfway through
- Submitted but no confirmation email → unclear if test saved
- Questions unclear; no way to flag confusing wording

---

## 3. JOURNEY MAP + PAIN SOLUTIONS

### Journey: Sarah (Recruiter) - Register & Send Assessment

| **Stage** | **Action** | **Emotion** | **Pain Point** | **Current Solution** | **Better Solution** |
|---|---|---|---|---|---|
| **Discover** | Sourced candidate from LinkedIn | Excited | N/A | N/A | N/A |
| **Register** | Click "Add Candidate" → fill form → upload resume | Neutral → Frustrated | Form too long (6 fields); resume upload slow | Form with tabs | Add candidate in 30 sec: (1) name+email, (2) optional resume |
| **Assign** | Select role + assessment type + deadline | Neutral | Unclear which assessment to pick; many options | Dropdown list | Show role-based recommended assessment + preview questions |
| **Send** | Click "Send Assessment" → generate link | Confident | No confirmation; unclear if candidate got email | Generic success message | Show: "Email sent to alex@..., expires in 7 days, resend?" |
| **Track** | Check status in table (pending/started/completed) | Frustrated | Status doesn't update; must refresh page | Manual refresh | Real-time status badge + auto-refresh every 30 sec |
| **Follow-up** | Send reminder email after 3 days | Stressed | No reminder automation; manual email search | Copy-paste email | Auto-prompt: "Reminder unsent - send now?" after 3 days |
| **Review** | Check result when candidate completes | Relief | Too much detail; doesn't know what hiring manager sees | Full result page with all data | Show top-3-insights + hiring manager summary + raw data tab |

**Deepest emotional dip**: Register stage (friction at first interaction)  
**Root cause**: Multi-step form + unclear assessment choice  
**Priority fix**: 2-step simplified form + role-based assessment recommendation

---

### Journey: James (Hiring Manager) - Review Results & Decide

| **Stage** | **Action** | **Emotion** | **Pain Point** | **Current Solution** | **Better Solution** |
|---|---|---|---|---|---|
| **Notify** | Recruiter sends "Results ready" email | Neutral | Takes 10+ min to navigate to result page | Email link to result | Breadcrumb path + back button |
| **Scan** | Open result; see full data dump | Overwhelmed | Too many details; no visual hierarchy | All fields shown equally | Show: Pass/Fail badge + reason, hide raw score details |
| **Interpret** | Find score explanation | Confused | Scoring logic unexplained; random number (87/100) | Score shown without context | Show: "87/100 = Above average (top 35%), Strengths: X, Y" |
| **Compare** | Need to compare with other candidates | Frustrated | Must open each result separately; no side-by-side view | Single candidate view only | Add "Compare Mode": checkbox candidates → slide-by-slide comparison |
| **Decide** | Click pass/fail; add decision note | Confident | Decision history mixed with system notes; cluttered | All notes in one timeline | Separate: Decision timeline (top) + Full activity log (bottom, collapsible) |
| **Export** | Export finalists for offer team | Relieved | CSV format doesn't match offer template; manual copy-paste | Generic CSV download | Download options: (1) CSV, (2) Offer template, (3) Custom fields |

**Deepest emotional dip**: Scan stage (information overload)  
**Root cause**: No filtering/prioritization of result data  
**Priority fix**: Visual hierarchy (badge first, details second) + decision vs. activity separation

---

### Journey: Alex (Candidate) - Take Assessment

| **Stage** | **Action** | **Emotion** | **Pain Point** | **Current Solution** | **Better Solution** |
|---|---|---|---|---|---|
| **Receive** | Get email with assessment link + deadline | Anxious | Unclear: what test? how long? what's next? | Email shows link only | Email shows: test type, duration, deadline, "no score cutoff" reassurance |
| **Prepare** | Click link; read instructions | Confused | Instructions vague; no practice question | Text instructions only | 30-sec video walkthrough + 1 practice question |
| **Start** | Click "Begin Assessment" | Nervous | No confirmation; starts immediately | Immediate start | Confirmation: "You have 45 min. You can pause, but timer continues. Ready? [Start]" |
| **Progress** | Answer first 5 questions | Anxious | No progress bar; don't know how many questions left | Timer + question count buried in header | Visible progress: "5 of 25 questions (20%)" + time remaining highlighted |
| **Midpoint** | Answer 15/25 questions | Stressed | Timer anxiety; no time buffer shown | Raw countdown timer | Show: "You have 20 min left. Average pace = on time ✓" |
| **Pause** | Internet glitches; refreshes page | Panicked | Does response save? Data lost? No recovery UX | Unclear recovery | Auto-recovery banner: "We recovered your last response (Q15). Pick up where you left off [Resume]" |
| **Submit** | Click "Submit Assessment" → done | Unsure | No confirmation; unclear if submitted | Page redirects to thank you | Confirmation: "✓ Assessment submitted at 2:30pm. Check email for results. Thank you!" |

**Deepest emotional dip**: Midpoint (timer anxiety) & Submit (submission uncertainty)  
**Root cause**: No progress visualization + no submission feedback  
**Priority fixes**: (1) Real-time progress bar, (2) Auto-recovery on refresh, (3) Submit confirmation

---

## 4. GOALS + USER STORIES + HMW

### Sarah (Recruiter) Goals & Stories

**Macro Goal**: Quickly register candidates and send assessment, then track completion without manual follow-ups

**Micro Goals** (supporting):
1. Register candidate in <2 min
2. Upload resume without waiting
3. Auto-recommend correct assessment for role
4. View assessment status without refreshing
5. Send reminder automatically

**User Stories**:

```
Story 1: Register
As a recruiter,
I want to add a candidate in 2 quick steps (name+email, then optional details),
So that I can focus on sourcing rather than data entry.

Acceptance Criteria:
- Form splits into: (1) Required (name, email), (2) Optional (resume, notes)
- Tab shows "Step 1 of 2" → "Step 2 of 2"
- Resume upload is non-blocking (can finish form without it)
- Success shows: "Sarah added, Assign assessment?"

Story 2: Auto-Recommend Assessment
As a recruiter,
I want to see the correct assessment pre-selected when I assign a role,
So that I don't accidentally send the wrong test.

Acceptance Criteria:
- Role dropdown triggers assessment auto-fill based on role
- Show assessment preview: "Python + Data Science, 45 min"
- Allow manual override if needed
- Shows: "Last used for 12 candidates"

Story 3: Real-Time Status
As a recruiter,
I want to see live status updates (sent/started/completed) without refreshing,
So that I trust the platform and don't double-send assessments.

Acceptance Criteria:
- Status badges auto-update every 30 seconds
- Visual change: gray (pending) → blue (started) → green (completed)
- Tooltip shows: "Started 2:30pm by alex@..."

Story 4: Auto-Reminder
As a recruiter,
I want to be reminded when candidate hasn't started assessment after 3 days,
So that I can follow up without manual email tracking.

Acceptance Criteria:
- System checks daily if candidate status = "sent" + 3 days old
- Show prompt in UI: "Alex Rodriguez hasn't started. [Send Reminder] [Snooze 3 days]"
- Candidate receives email: "Reminder: complete assessment by [date]"
- Recruiter sees sent timestamp in activity log
```

**HMW (How Might We)**:
- HMW help recruiters send assessments in bulk without losing track of individual candidates?
- HMW reassure recruiters that candidates are receiving assessment emails?
- HMW reduce the cognitive load of choosing correct assessment per role?

---

### James (Hiring Manager) Goals & Stories

**Macro Goal**: Review assessment results and make pass/fail decisions confidently, with clear reasoning

**Micro Goals**:
1. See pass/fail decision in 10 seconds
2. Understand scoring logic
3. Compare candidates side-by-side
4. Track prior decisions/notes
5. Export finalists in offer-ready format

**User Stories**:

```
Story 1: Result Summary (Glanceable)
As a hiring manager,
I want to see a large pass/fail badge and top-3 strengths on result page,
So that I can make a decision in 10 seconds without reading pages of data.

Acceptance Criteria:
- Top of result page: Large green/red badge (PASS/FAIL)
- Immediate below: "Why: Strong in Python, Problem-solving, Communication"
- Tap "View Details" to see full result breakdown
- Works on mobile + desktop

Story 2: Scoring Explanation
As a hiring manager,
I want to understand why the score is 87/100 (not just the number),
So that I trust the assessment and can explain it to executives.

Acceptance Criteria:
- Show: "87/100 = Top 35% for Senior Engineer role"
- Breakdown: "Section 1: 90/100, Section 2: 82/100, Section 3: 88/100"
- Compare to cohort: "Average for this role: 72/100"
- Explanation text: "Score reflects strong technical depth but slower problem-solving time"

Story 3: Side-by-Side Comparison
As a hiring manager,
I want to compare top 3 candidates' results on one screen,
So that I can identify the best fit without context-switching.

Acceptance Criteria:
- Candidate list has checkboxes (select 2-4)
- "Compare" button reveals side-by-side layout
- Show columns: Name, Score, Top Strengths, Weak Areas, Decision Status
- Can sort by any column
- One-click "Expand" to see full result per candidate

Story 4: Decision Timeline
As a hiring manager,
I want to see my prior decision and all notes, separate from system activity,
So that I remember why I rejected/accepted and stay consistent.

Acceptance Criteria:
- Result page shows 2 tabs: "Decision History" | "Activity Log"
- Decision History shows: [Date] You decided: PASS, reason: "Strong communicator, ready for team"
- Activity Log shows: system events (sent, started, completed)
- Can edit decision + reason anytime
- Timestamp shows when decision changed (audit trail)

Story 5: Export Finalists
As a hiring manager,
I want to export selected candidates in offer-ready format,
So that I don't have to manually copy data to HR template.

Acceptance Criteria:
- Bulk action: "Export Selected" (2+ candidates)
- Download options: "CSV" | "Google Sheets" | "Offer Template"
- Offer template includes: name, email, score, start date, salary range
- Pre-fills from result data where possible
```

**HMW**:
- HMW reduce decision-making anxiety when scores are borderline (75-85)?
- HMW help hiring managers compare candidates without losing individual context?
- HMW make scoring logic transparent so non-technical managers trust results?

---

### Rani (Admin) Goals & Stories

**Macro Goal**: Onboard users and manage departments without requiring manual code/help, while maintaining audit trail

**Micro Goals**:
1. Add user without custom password setup
2. Assign users to departments clearly
3. View audit log of permission changes
4. Self-service assessment templates
5. Prevent accidental access misconfigurations

**User Stories**:

```
Story 1: Invite User (Magic Link)
As an admin,
I want to send user invitation link that auto-sets password,
So that I don't manage passwords and users feel secure.

Acceptance Criteria:
- Add user form: name, email, role, department
- No password field
- System sends: "Welcome to Innobot! Set your password: [link expires in 7 days]"
- User clicks link → password reset page → can now login
- Resend option if link expires
- Admin sees user status: "Invited (expires 3 days)" → "Active"

Story 2: Department Assignment with Validation
As an admin,
I want to assign users to departments with clear options (no inactive departments showing),
So that I prevent access mistakes.

Acceptance Criteria:
- Department dropdown shows only ACTIVE departments
- Visual indicator: "✓ Sales (15 members)" vs grayed out "Finance (inactive)"
- Can't assign user to inactive department
- Bulk action: select users → assign to department in one click
- Confirmation: "Assigned 5 users to Sales Department"

Story 3: Audit Log
As an admin,
I want to see who changed permissions, when, and what changed,
So that I can audit access for compliance.

Acceptance Criteria:
- Admin dashboard has "Audit Log" section
- Show entries: "[2025-05-18] Rani Kumar changed Sarah Chen from 'recruiter' to 'hiring_manager'"
- Filters: by user, by change type (role, department, permissions)
- Export audit log as CSV
- Entries go back 1 year minimum

Story 4: Self-Service Assessment Setup
As an admin,
I want to see pre-built assessment templates (Python, Data Science, UX, etc.),
So that I don't have to ask engineering for every new role.

Acceptance Criteria:
- Assessment library page shows 15+ templates
- Each shows: duration, question count, skills covered
- Admin can duplicate + customize (add/remove questions)
- Version control: original vs. custom marked clearly
- Track which roles use which assessment

Story 5: Permission Audit (Who Can See What)
As an admin,
I want a matrix showing: User | Role | Can See Results? | Can Export? | Can Edit Users?,
So that I spot permission inconsistencies.

Acceptance Criteria:
- Table: User name | Department | Access Level | See Results | Export Data | Manage Users | Manage Assessments
- Color-coded: Green (can) | Gray (can't)
- Filter by department
- One-click edit user permissions
- Export permission matrix as CSV
```

**HMW**:
- HMW make onboarding frictionless so new team members never ask for password help?
- HMW prevent accidental over-permission (e.g., recruiter seeing hiring manager notes)?
- HMW make audit trails useful for compliance without overwhelming admin?

---

### Alex (Candidate) Goals & Stories

**Macro Goal**: Complete assessment with confidence, knowing instructions are clear and progress is visible

**Micro Goals**:
1. Understand what's expected before starting
2. See real-time progress
3. Know time remaining without panic
4. Handle technical hiccups (refresh, lost connection)
5. Get confirmation that submission worked

**User Stories**:

```
Story 1: Clear Instructions + Practice
As a candidate,
I want to watch a 30-second walkthrough before starting the real assessment,
So that I know what to expect and feel confident.

Acceptance Criteria:
- Assessment page shows: "How this works" video (30-60 sec)
- Video covers: question types, timer, scoring, scoring doesn't matter for grade
- Option to skip video (shows "You can always replay this")
- Follow-up: 1 practice question (same format as real questions)
- Button: "I'm ready. Start Assessment"

Story 2: Real-Time Progress Bar
As a candidate,
I want to see a progress bar showing questions completed and time remaining,
So that I don't panic about running out of time.

Acceptance Criteria:
- Top of screen: "5 of 25 questions (20%)" with progress bar
- Time remaining: "23 min 14 sec" (updates every second)
- Color coding: Green (plenty of time) → Yellow (5 min left) → Red (running out)
- No stress: "You're on pace ✓" message when ahead
- "You're behind pace - next 3 questions have 90 sec each" when behind

Story 3: Submission Confirmation
As a candidate,
I want to see explicit confirmation that assessment submitted,
So that I don't stress about whether my work saved.

Acceptance Criteria:
- Click "Submit Assessment"
- Page shows: "✓ Assessment submitted at 2:45pm"
- Show: "You answered 25/25 questions, Score: 87/100"
- Email sent confirming: "Assessment completed. Results emailed to you."
- Page shows: "You'll see results by May 25. Check your email for next steps."

Story 4: Auto-Recovery on Refresh
As a candidate,
I want the system to recover my work if I accidentally refresh the page,
So that I don't lose progress.

Acceptance Criteria:
- Browser refresh → page detects mid-test session
- Banner appears: "We recovered your last response (Question 12 of 25). Pick up where you left off? [Resume] [Start Over]"
- If internet dropped → "Connection lost. Your answer was saved. Reconnecting..."
- Auto-reconnect every 5 sec until success
- Show last auto-save timestamp: "Saved at 2:30:45pm"

Story 5: Question Clarity (Flag Confusing Question)
As a candidate,
I want to flag confusing or ambiguous questions,
So that admins know which questions need clarification.

Acceptance Criteria:
- Each question has "Flag question" button
- Clicking shows: "Why is this confusing? [text box]"
- Optional: doesn't affect scoring
- Flag is visible to assessment admin in results review
- Show count: "This question was flagged 3 times by candidates"
```

**HMW**:
- HMW eliminate timer anxiety while keeping fairness (same time for all)?
- HMW make candidates feel confident their work is saved?
- HMW help candidates understand what "good" performance looks like?

---

## 5. UX PRINCIPLES + QUICK DIAGNOSIS

### Applying 6 UX Principles

| **Principle** | **Current State** | **Issue** | **Fix** |
|---|---|---|---|
| **Useful** | App solves hiring problem (tests screen candidates) | ✓ Core value is solid | Ensure every feature adds to hiring value, not clutter |
| **Usable** | UI is modern but has friction | ✗ 6-field form, 3-click assessment send | Reduce to 2-step workflows; remove optional fields from main view |
| **Desirable** | Clean UI, but feels corporate/cold | Partial | Add micro-interactions (success animations, progress celebration) |
| **Findable** | Table navigation; modal structure | Partial | Add breadcrumbs, clearer visual hierarchy, sidebar for context |
| **Accessible** | Color/contrast looks good visually | Unknown | AUDIT NEEDED: test with screen reader, keyboard nav |
| **Credible** | Real data, real scoring | Partial | Add scoring explanation; show cohort comparisons; transparency helps trust |

**Diagnosis Recap**:
- **Cannot find candidates** → IA/labeling issue (filters buried, column headers unclear)
- **Too confusing (result page)** → Usability issue (information overload, no hierarchy)
- **No trust in scoring** → Credibility issue (logic unexplained, no context)
- **Users don't complete assessment** → Desirability + usability issue (unclear instructions, timer stress)

---

## 6. RESEARCH METHODS RECOMMENDED

### For Recruiter (Sarah) Pain: "Assessment status unclear"

**Research Goal**: How do recruiters currently track assessment status? Do they use refresh, email, spreadsheet?

**Method**: Qualitative - Diary study or contextual interview
- **Why qual**: Understanding "why" they use workarounds (fear of missing response, email habit, etc.)
- **Sample**: 3-5 recruiters
- **Output**: Confirm status visibility is #1 pain or discover deeper underlying need

**Then**:  
**Quantitative** - Survey/analytics  
- "How many times per day do you refresh assessment status?" 
- "How many candidates don't complete because of unclear deadlines?"
- Validate with 20+ recruiters before building solution

---

### For Hiring Manager (James) Pain: "Result layout overwhelming"

**Research Goal**: What information matters most for hiring decisions? What can we hide?

**Method**: Evaluative - Usability testing
- **Task**: "You have 5 minutes. Decide if this candidate is a PASS or FAIL and explain why."
- **Setup**: Show current full result page vs. simplified badge-first layout
- **Sample**: 4-6 hiring managers (mix of experienced + new)
- **Measure**: Task completion time, decision confidence score, which information they actually looked at
- **Tools**: Eye-tracking or click-heatmap to see what draws attention

**Then**:  
**A/B Test** - Simplify page, measure adoption  
- Control: full result page
- Treatment: badge-first + details-on-demand
- Measure: decision speed, export rate, satisfaction score

---

### For Candidate (Alex) Pain: "Timer anxiety"

**Research Goal**: Does the timer create so much stress that candidates perform worse? What timing transparency helps?

**Method**: Quantitative - A/B test + analytics
- Control: current timer (countdown, no context)
- Treatment 1: Progress bar + "You're on pace ✓"
- Treatment 2: Hide timer, show only progress
- **Measure**: task completion rate, error rate, post-assessment NPS, time spent per question
- **Sample**: 100+ candidates per variant

**Insight Goal**: Does reducing timer visibility improve performance or create missed deadlines?

---

## 7. DESIGN IMPROVEMENTS ROADMAP

### Priority 1 (High Impact + High Feasibility)
- [ ] **Simplify recruiter form**: 2-step candidate registration (required vs. optional fields)
- [ ] **Result page hierarchy**: Move pass/fail badge to top, collapse details into tabs
- [ ] **Assessment status**: Real-time badge updates without refresh (CSS polling or WebSocket)
- [ ] **Progress bar**: Candidate assessment with real-time progress + time warning

### Priority 2 (Medium Impact + Medium Feasibility)
- [ ] **Decision separation**: Split decision history from system activity log
- [ ] **Assessment auto-recommend**: Role selection triggers assessment pre-fill
- [ ] **Side-by-side comparison**: Bulk action to compare 2-3 candidates
- [ ] **Auto-recovery**: Session restore on page refresh during assessment

### Priority 3 (Nice-to-Have + Requires Investment)
- [ ] **Magic link invites**: Passwordless user onboarding
- [ ] **Audit log**: Admin dashboard showing permission changes
- [ ] **Scoring explanation**: Show cohort comparison + section breakdown
- [ ] **Export templates**: Offer-ready CSV download
- [ ] **Question flagging**: Candidate can mark confusing questions

---

## 8. NEEDS VS. WANTS (Maslow's UX Pyramid)

### Recruiter (Sarah)

| **Level** | **Need** | **Implementation** |
|---|---|---|
| **Physiological** (Basic usability) | Fast form, works on mobile, no lag | ✓ App is responsive; form is responsive issue |
| **Safety** (Trust) | Know candidate got email, work saves | ✓ Add send confirmation; email receipt status |
| **Belonging** | Collaborate with hiring manager | Partial - no comment/note sharing |
| **Esteem** | See recruiting metrics (candidates sent, completion rate) | Not built - could add dashboard |
| **Self-actualization** | Customize workflows per team | Not built - one-size-fits-all |

**Fix physiological first**: Simplify form, add email confirmation → everything else builds on this

---

### Hiring Manager (James)

| **Level** | **Need** | **Implementation** |
|---|---|---|
| **Physiological** | See pass/fail in 10 sec, no cognitive load | ✗ Current result page is overloaded |
| **Safety** | Trust scoring logic, know decision is final | Partial - logic unexplained, decision editable but no audit |
| **Belonging** | See recruiter's notes, collaborate | ✓ Notes shown; but decision separation missing |
| **Esteem** | See hiring outcome (hired/rejected follow-up) | Not built - no feedback loop |
| **Self-actualization** | Customize result view by role | Not built |

**Fix physiological first**: Badge-first result layout → then add scoring transparency

---

### Candidate (Alex)

| **Level** | **Need** | **Implementation** |
|---|---|---|
| **Physiological** | Clear instructions, timer works, no crashes | Partial - instructions vague; timer anxiety high |
| **Safety** | Know work is saved, submission confirmed | ✗ No confirmation, unclear autosave |
| **Belonging** | See others' average score (anonymous) | Not built |
| **Esteem** | See feedback on what I did well | Not built - only pass/fail |
| **Self-actualization** | Retake assessment to improve | Not built - one attempt only |

**Fix physiological first**: Instructions + progress bar + confirmation → candidate stress drops

---

## 9. EMOTION MAPPING

### Sarah (Recruiter) Emotional Journey

```
Sourcing candidate → [Excited] 
Register in platform → [Frustrated - form tedious] 
Choose assessment → [Uncertain - many options]
Send → [Relieved - done]
Check status → [Annoyed - need to refresh]
Candidate completes → [Happy - pipeline moving]
```

**Intervention**: 2-step form + role-recommended assessment + live status = shift from Frustrated → Confident → Happy

---

### James (Hiring Manager) Emotional Journey

```
See "results ready" email → [Neutral]
Open result page → [Overwhelmed - too much data]
Try to find score → [Confused - logic unexplained]
Compare with other candidates → [Frustrated - manual context switching]
Make decision → [Uncertain - no clear "why I chose this"]
Export finalists → [Annoyed - wrong format]
```

**Intervention**: Badge-first layout + scoring explanation + comparison mode + decision audit = shift from Overwhelmed → Confident → Satisfied

---

### Alex (Candidate) Emotional Journey

```
Receive email → [Anxious - unclear what's expected]
Read instructions → [Confused - vague]
Start timer → [Nervous - time ticking]
Halfway through → [Stressed - timer anxiety peaks]
Submit → [Unsure - did it save?]
Wait for results → [Anxious - no confirmation]
```

**Intervention**: Video walkthrough + progress bar + submit confirmation + recovery UX = shift from Anxious → Confident → Relief

---

## 10. PAIN POINTS SUMMARY TABLE

| **User** | **Pain Point** | **Severity** | **Root Cause** | **Quick Win Fix** | **Long-term Fix** |
|---|---|---|---|---|---|
| Sarah | Candidate form tedious (6 fields) | High | All fields required upfront | Move optional to step 2 | 2-step split form |
| Sarah | Assessment status unclear | High | No real-time updates | Browser polling every 30s | WebSocket live updates |
| Sarah | Assessment choice confusing | Medium | All assessments shown equally | Role → auto-recommend assessment | Smart recommendation engine |
| James | Result page overwhelming | High | All data shown (no hierarchy) | Move badge to top; hide details | Tab-based result layout |
| James | No candidate comparison | High | Single-result view only | Add checkboxes + compare button | Persistent comparison pane |
| James | Scoring not explained | High | Raw score shown, no context | Add "87/100 = Top 35%" | Full scoring explanation + cohort data |
| Rani | User invite friction | Medium | Manual password setup required | Send invite link instead | Magic link passwordless |
| Rani | Department assignment unclear | Medium | Inactive departments shown | Filter out inactive | Visual active/inactive indicator |
| Rani | No audit trail | High | System doesn't log permission changes | Add audit log table | Real-time audit log with export |
| Alex | Instructions unclear | High | Text only, no context | Add 30-sec video | Interactive walkthrough + FAQ |
| Alex | Timer causes anxiety | High | Countdown with no context | Add progress + pace feedback | Confidence-building pace indicators |
| Alex | No submission confirmation | High | Page redirects, unclear if saved | Show confirmation banner | Confirmation email + results link |

---

## 11. FAST ANSWER TEMPLATE (For Your UX Decisions)

When facing a design decision, follow this template from your reference sheet:

**Define problem** → **List possible solutions** → **Apply to scenario** → **Give example** → **Conclude**

### Example: "Should we hide detailed scores on the hiring manager result page?"

**Define**: Hiring managers are overwhelmed by raw scores and supporting data, slowing decisions.

**Solutions**:
1. Hide all details; show only pass/fail badge *(risk: too minimal for some users)*
2. Show badge + top 3 insights; hide rest in tabs *(balanced)*
3. Show all current data; improve visual hierarchy *(risk: still overload)*

**Apply to scenario**: James (hiring manager) needs 10-sec decision time. Option 2 (badge + tab) lets him decide fast while accessing details if needed.

**Example**: James opens result → sees green PASS badge + "Strengths: Python, Problem-solving, Communication" → decides in 8 seconds. If unsure, clicks "Details" tab for scoring breakdown.

**Conclude**: Option 2 best balances speed + transparency. Build badge-first layout; hide scoring details in collapsible tab.

---

## 12. PERSONA COMPARISON MATRIX

|   | **Sarah (Recruiter)** | **James (Hiring Manager)** | **Rani (Admin)** | **Alex (Candidate)** |
|---|---|---|---|---|
| **Primary Goal** | Quick candidate registration + tracking | Fast pass/fail decision | Secure user/department management | Complete assessment confidently |
| **Time per session** | 5-15 min | 10-20 min | 30-60 min | 30-45 min |
| **Visit frequency** | Daily | 2-3x weekly | Weekly | One-time |
| **Tech comfort** | Medium | Low | High | Medium |
| **Biggest pain** | Status tracking | Result overload | No audit trail | Timer anxiety |
| **Emotional goal** | Confident (assessment will reach candidate) | Assured (decision is right) | Controlled (access is secure) | Calm (clear expectations) |
| **Device preference** | Mobile + desktop | Desktop | Desktop | Mobile |
| **Interaction style** | Quick/efficient | Skimming | Deep/thorough | Task-focused |

---

## 13. NEXT STEPS: APPLY THIS FRAMEWORK

1. **Validation**: Show personas & journeys to 3 actual users in each group. Iterate.
2. **Research**: Pick top 3 pain points → run usability tests (guerrilla testing: 1-2 hours, 5 users per pain).
3. **Prioritize**: Rank fixes by impact (user count × pain severity × feasibility).
4. **Design**: Create wireframes for Priority 1 fixes (recruiter form, result page hierarchy, progress bar).
5. **Test**: A/B test designs with real users before full build.
6. **Iterate**: Re-run research after each major change to validate improvement.

---

## Appendix: IT4031 Framework Checklist

✓ **UX Core**: Defined UX goals (useful, usable, desirable, findable, accessible, credible)  
✓ **Principles**: Applied 6 principles to current state  
✓ **IA**: Navigation clarity issues identified (result page, candidate filters)  
✓ **Design Thinking**: Empathize → Define → Ideate → Prototype → Test (roadmap in section 7)  
✓ **Scenario Toolkit**: 4 user groups defined with goals + pain points  
✓ **Personas**: 4 personas with demographics, behaviors, goals, pain points  
✓ **Journey Maps**: 3 detailed journey maps with emotions, pain points, solutions  
✓ **User Stories + HMW**: 15+ user stories with acceptance criteria; HMW questions  
✓ **Needs vs. Wants**: Maslow pyramid applied to each user  
✓ **Emotion Mapping**: Emotional curves mapped; interventions identified  
✓ **Research Methods**: Specific research methods recommended per pain point  
✓ **Metrics**: Task success rate, time on task, decision confidence, NPS proposed  
✓ **Mistakes to Avoid**: Identified common pitfalls (too much detail, no hierarchy, unexplained scores)
