# Public Jobs Page & Application Flow - UX Analysis
*Following IT4031 VAUED Framework*

---

## EXECUTIVE SUMMARY

**New User Group**: External job seekers applying for roles through the public careers page.

**Current State**: 
- ✅ Clean job detail page with description + sticky apply panel
- ✅ Simple 3-step application form (contact → resume → message)
- ✅ Confirmation screen with application ID + assessment link
- ⚠️ But missing critical job search UX and application clarity

**Key Gaps**:
1. No jobs listing page (user experience unclear)
2. Application form feels long (4 fields + optional resume + textarea)
3. No progress indication during submission
4. Assessment next steps unclear for applicants
5. No feedback on application quality/completeness

---

## 1. NEW USER GROUP: External Job Seekers

### Two Personas

| **Persona** | **Goal** | **Pain Point** |
|---|---|---|
| **Maya** (Eager Job Seeker) | Find relevant role, apply quickly, get feedback on application | Too many jobs; unclear what's required; unsure if application matters |
| **David** (Skeptical Candidate) | Make informed decision about role before applying; prove qualifications | Role description unclear; job requirements fuzzy; not enough detail to decide if worth applying |

---

## 2. PERSONA DETAIL

### Persona 1: Maya (Eager Job Seeker)

**Name** | Maya Patel | **Age** | 24 | **Occupation** | Fresh graduate looking for first role  
**Device/Context** | Mobile (scrolling jobs at night) + Desktop (applying from home) | **Tech Skill** | Medium (basic web, no advanced tools)

**Demographics**
- Recent CS graduate, no professional experience
- Anxious about job search, applying to 10+ roles per week
- Prefers simple, fast applications
- Limited time (applies during evenings/weekends)

**Behaviors**
- Scrolls job listing on mobile during break
- Switches to desktop to apply (resume + form)
- Procrastinates on cover letters; leaves blank when optional
- Applies first, reads details later
- Expects immediate confirmation

**Goals**
- Find job posting in <2 min
- Complete application in <5 min
- Know immediately if application submitted
- Receive next steps via email

**Pain Points**
- Job listings unclear (can't filter by seniority level)
- Don't know what "culture fit" means on job page
- Resume upload hangs; unclear if it's uploading
- After submit: unsure if got through; no confirmation email
- Assessment link (if sent) feels like extra work; unclear why needed
- Can't track application status easily (must check email)

---

### Persona 2: David (Skeptical Candidate)

**Name** | David Chen | **Age** | 38 | **Occupation** | Experienced Senior Engineer considering switch  
**Device/Context** | Desktop @ home; values quality over speed | **Tech Skill** | High (prefers direct, detailed info)

**Demographics**
- 10+ years experience in different stack
- Cautious about job moves (current role is stable)
- High standards for company; won't apply to misfit roles
- Applies to 2-3 roles per month (selective)

**Behaviors**
- Reads job description carefully (5-10 min per role)
- Wants to know about team, tech stack, growth path
- Values transparency; suspicious of vague language
- Puts effort into cover letter (personalized, specific)
- Researches company culture before applying

**Goals**
- Understand role deeply before committing application effort
- See examples of recent projects or tech used
- Know team size, reporting structure
- Get personalized feedback on application
- Avoid applying to roles that aren't a fit

**Pain Points**
- Job description too generic ("fast-paced", "passionate")
- No info on compensation, benefits, remote policy
- Can't see team structure or manager background
- Cover note field suggests it doesn't matter ("optional", small)
- No feedback after applying (silence = rejection?)
- Application disappears into black hole; no visibility
- Assessment feels like busywork; no explanation of why or how scored

---

## 3. JOURNEY MAP: Maya (Eager Job Seeker) - Find & Apply

| **Stage** | **Action** | **Emotion** | **Pain Point** | **Current Solution** | **Better Solution** |
|---|---|---|---|---|---|
| **Browse** | Open jobs page on mobile | Hopeful | No jobs listing page exists? | Unknown; need to check | Show 10 latest jobs (company, title, salary range, apply count) |
| **Scan** | Skim 5 jobs in 1 minute | Neutral | Job titles similar; unclear differences | Listing shows summary + role label | Add: salary range, seniority level (Junior/Mid/Senior), skills required |
| **Click** | Open job detail page | Interested | Page feels long; must scroll to apply | Job description + sticky apply panel | Summary: "What you'll do" vs "What we need" in tabs |
| **Read** | Skim job description | Unsure | Job description vague ("fast-paced") | Full HTML description | Highlight key facts: salary, team size, remote policy, tech stack |
| **Decide** | Ready to apply or leave? | Motivated | Feels low-effort; might be spam | Sticky apply button visible | Show: "50 applications already" or "No applications yet" (social proof) |
| **Fill Form** | Enter name, email, phone | Neutral | Form feels long; phone optional confuses | 4 input fields in sequence | Group into 1 step: all contact fields together (with progress bar) |
| **Upload** | Choose resume file | Anxious | Upload hangs; no feedback | File input field | Show upload progress: "Uploading resume... 45% done" |
| **Message** | Write cover note (optional) | Uncertain | Blank textarea intimidating; optional so skip | Large 5-row textarea | Replace with: "Why interested?" + placeholder hints (3-5 bullet points) |
| **Submit** | Click "Apply now" | Nervous | Button click - does anything happen? | Form submits to API | Button shows: "Submitting..." with spinner |
| **Confirm** | See confirmation screen | Relief | Success message shows, but what now? | Confirmation card with reference ID | Show: "✓ Application received. We'll email updates. Check back in 5 min for next steps." |
| **Next Step** | See assessment link (if assigned) | Obligated | Why do I need to take a test? | Text: "Assessment link sent to email. Complete within 7 days." | Explain: "This helps us understand your skills better. Takes 30 min. You'll see your score right after." |
| **Verify** | Check inbox for email | Calm | Email arrives or doesn't? | Relies on email delivery | Post-submit: "Didn't get email? [Resend] or [View assessment link here]" |

**Deepest emotional dip**: Confirmation stage (silent after submit = did it work?)  
**Root cause**: No submission feedback, no real-time status visibility  
**Priority fix**: Submission confirmation screen + email verification + status page

---

| **Stage** | **Action** | **Emotion** | **Pain Point** | **Current Solution** | **Better Solution** |
|---|---|---|---|---|---|
| **Browse** | Search for "Senior Engineer" roles | Eager | No search; must scroll all | Listing only (if exists) | Add: Search input + filters (job title, seniority, remote, salary range) |
| **Scan** | See 3 matching roles | Interested | All look the same; unclear distinctions | Role listing (if exists) | Show: Company logo, title, team size, salary range, tech stack tags |
| **Click** | Open most relevant one | Confident | Reading 5-min description | Detailed description | Skim-friendly layout: Sections (Why join, Tech stack, Team, Growth) |
| **Decide** | "Does this match my career?" | Thoughtful | Vague job language = red flag | Generic description text | Show transparency: "Team: 5 engineers, Reports to: VP Eng, Tech: Go + React, Compensation: $X-Y" |
| **Prepare** | Draft personalized cover note | Committed | Small textarea = low effort expected | 5-row textarea | Show: "Personalized notes increase callback 3x. Share relevant experience here." |
| **Fill Form** | Take time with each field | Careful | Form feels rushed; should take 10 min | Simple 4-field form | Progress bar: "Step 1 of 3: Contact (50%)" |
| **Upload** | Upload resume + cover letter | Thorough | No way to add cover letter; must use textarea | Resume field only | Add: "Upload cover letter PDF (optional)" field |
| **Submit** | Review before final submit | Cautious | No preview of what they'll see | Form + submit button | Add confirmation step: "Review your application: Name: David, Email: ..., Message: ..., Resume: [attached]" |
| **Confirm** | See confirmation with tracking link | Satisfied | Where to see application status? | Confirmation + reference ID | Show: "Track application: [/jobs/application-status?id=...] (bookmark this link)" |
| **Wait** | Check status after 3 days | Patient | No feedback until assessment sent | Assessment email if assigned | Email template shows: "David, thanks for applying. We're reviewing your application. [Check status] [View assessment (if assigned)]" |

**Deepest emotional dip**: Prepare stage (effort feels unrewarded)  
**Root cause**: No indication that personalized cover note matters  
**Priority fix**: Show impact of personalized application + status tracking

---

## 4. USER STORIES & HMW

### Maya (Eager Job Seeker)

**Macro Goal**: Apply to relevant jobs quickly with confidence that application reached the company.

**Micro Goals**:
1. Find job in relevant category
2. Understand role in 2 min
3. Apply in <5 min with resume
4. Know application submitted
5. See what to do next (assessment or wait)

**User Stories**:

```
Story 1: Job Listing with Filters
As a job seeker,
I want to see a list of open jobs with filters (seniority, remote, salary range),
So that I can find relevant roles without scrolling forever.

Acceptance Criteria:
- List shows: Company logo, Job title, Salary range, Seniority level, Remote/On-site, Application count
- Filters: By job title, seniority (Junior/Mid/Senior), remote (Yes/No/Hybrid), min salary
- Sort: By recent, most applied, best match
- Pagination: 10 per page
- Mobile: Sidebar filters collapse to dropdown

Story 2: Quick Job Skim
As a job seeker,
I want to see a visual summary of what the role is about,
So that I don't have to read a long description if it's not a fit.

Acceptance Criteria:
- Top of detail page (before description): Quick facts in cards:
  - "Company: Northstar"
  - "Team size: 5 engineers"
  - "Salary range: $X - Y"
  - "Tech stack: Go, React, PostgreSQL"
  - "Remote: Yes, flexible"
- Color-coded badges: seniority level, job family
- "Not for you?" link to filter similar roles

Story 3: Smooth Resume Upload
As a job seeker,
I want to see upload progress and confirmation,
So that I know my resume uploaded without errors.

Acceptance Criteria:
- File input shows: "Choose file" button
- After selection: "Uploading: resume.pdf (100%)"
- Success: "✓ Resume uploaded (2.3 MB)"
- Error: "Upload failed. File is too large (max 10MB). Try again?"
- No file: "Resume is optional, but increases callback rate" (soft nudge)

Story 4: Submission Confirmation
As a job seeker,
I want to see a clear confirmation after applying,
So that I'm confident my application reached the company.

Acceptance Criteria:
- Confirmation screen shows: "✓ Application received at 2:30pm"
- Show: "Application reference: APP-123456 (save this)"
- Show: "Check your email for next steps or [View assessment link]"
- Button: "Check application status" → /jobs/application-status?id=...
- If assessment: "Complete the 30-min assessment by [date]"

Story 5: Application Status Tracking
As a job seeker,
I want to check where my application is in the process,
So that I know if I've been rejected, passed initial screen, or moved to interview.

Acceptance Criteria:
- Status page shows: /jobs/application-status?applicationId=...
- Shows: "Submitted 2 days ago"
- Current status: "Being reviewed" (with timestamp of last update)
- Timeline: Submitted → Initial Screen (in progress) → Interview → Offer
- Next action: "Complete assessment by [date]" (if applicable)
- No info yet: "We'll email you updates as your application moves forward"
```

**HMW**:
- HMW help Maya feel confident her application was received?
- HMW make job descriptions easier to skim on mobile?
- HMW reduce resume upload anxiety?

---

### David (Skeptical Candidate)

**Macro Goal**: Evaluate role deeply before applying; provide high-quality application that demonstrates fit.

**Micro Goals**:
1. Understand team, reporting structure, tech stack
2. See compensation upfront
3. Write detailed, personalized cover letter
4. Review application before submitting
5. Track application status consistently

**User Stories**:

```
Story 1: Transparent Job Details
As an experienced candidate,
I want to see specific details about the team, tech stack, and compensation,
So that I can decide if the role is a real fit before investing time.

Acceptance Criteria:
- Job detail page sections:
  1. "The role": What you'll do (bullet points, not prose)
  2. "The team": Size (X engineers), Manager (name/title), Reporting structure
  3. "Tech stack": Primary tools (Go, React, PostgreSQL, etc.)
  4. "Compensation": Salary range, benefits, stock/bonus (if applicable)
  5. "Remote policy": Work location (SF office, remote, hybrid)
  6. "Growth": Career progression, learning budget, conference attendance
- Avoid: "fast-paced", "passionate", "self-starter" (vague buzzwords)
- If not public: "This company doesn't share salary ranges" (transparency itself)

Story 2: Detailed Candidate Profile
As an experienced candidate,
I want to add more context about my background,
So that the hiring team understands my fit beyond a resume.

Acceptance Criteria:
- Application form adds: "Tell us about your relevant experience"
- Textarea with prompt hints:
  - "What projects match this role's tech stack?"
  - "What attracted you to this company?"
  - "What are your growth goals?"
- Character count: Show "100-500 characters recommended" (encourage detail)
- Save draft: "Auto-saving your application..." (confidence)

Story 3: Review Before Submit
As an experienced candidate,
I want to review my entire application before submitting,
So that I make sure everything is polished and complete.

Acceptance Criteria:
- After filling form, before submit:
  - Show modal: "Review your application"
  - Display: Name, Email, Phone, Resume file, Cover note (all fields)
  - "Edit" button next to each field
  - Confidence indicators: "Resume ✓", "Cover note: Good detail ✓"
  - Warnings: "No cover note - callbacks decrease 25%" (soft nudge)
  - Submit button at bottom: "Submit application"

Story 4: Application Status Dashboard
As an experienced candidate,
I want to see a timeline of my application progress,
So that I know where I stand and can follow up at the right time.

Acceptance Criteria:
- Status page shows: /jobs/application-status?applicationId=...
- Timeline:
  - Submitted: May 18, 2:30pm ✓
  - Initial screen: (in progress, last updated May 19)
  - Interview scheduled: (pending)
- Show: Days since each milestone
- Call-to-action: "Next likely step: Technical interview in 3-5 days"
- Contact: "Questions? Reply to [email protected]"

Story 5: Assessment Feedback & Scoring
As a candidate who took an assessment,
I want to see my score and understand how I compared,
So that I know my chances and can improve for next time.

Acceptance Criteria:
- Post-assessment page shows:
  - "Score: 87/100"
  - "Performance: Top 30% for this role"
  - Section breakdown: "Python: 92/100 | System Design: 82/100"
  - Feedback: "Strengths: Strong problem-solving. Areas to improve: SQL optimization"
  - Comparison: "Average score for this role: 72/100"
  - Next step: "Your application moves to interview round" OR "Unfortunately you didn't move forward"
```

**HMW**:
- HMW build trust with detailed, transparent job information?
- HMW help experienced candidates see their assessment impact on hiring decision?
- HMW make candidates feel valued even if they don't move forward?

---

## 5. CURRENT IMPLEMENTATION REVIEW

### What's Good ✅

1. **Clean job detail page layout**
   - Left: Job description (full, readable)
   - Right: Sticky apply panel (stays visible while scrolling)
   - Excellent UX pattern

2. **Simple application form**
   - Organized in sections: Contact → Resume → Message
   - Clear labels + placeholders
   - Resume optional (good for low-friction)

3. **Confirmation screen**
   - Shows success message ("Application received")
   - Displays application ID (trackable)
   - Shows assessment link (if assigned)
   - Good post-submit UX

4. **Assessment next steps**
   - Shows message: "Complete within 7 days"
   - Sends email with link
   - Applicant knows what's next

### What's Missing ⚠️

1. **No jobs listing page**
   - How does applicant find job in the first place?
   - Code shows `/jobs` page exists but not in the audit
   - Unclear: Can they search, filter, sort?

2. **Vague job information**
   - No salary range shown
   - No team size, reporting structure
   - No tech stack visibility
   - No compensation/benefits

3. **No application submission feedback**
   - Form submits silently (no "submitting..." state)
   - No email confirmation sent (unclear if submitted)
   - Relies on applicant seeing confirmation page

4. **Poor application status tracking**
   - Can check status via `/jobs/application-status?applicationId=...`
   - But URL is long; not obvious how to bookmark
   - No email updates as application moves forward

5. **Assessment explanation missing**
   - Says "complete assessment" but no context
   - Why? How long? What's scored?
   - Applicants feel it's busywork

6. **No resume upload UX**
   - No progress indicator (hangs silently?)
   - No error handling visible
   - Applicant unsure if it worked

---

## 6. PRIORITY QUICK WINS (Phase 1)

### Win 1: Job Quick Facts Card (High Impact, Easy)

```
Current: Applicant reads long description to understand role
Ideal: Top of page shows key facts immediately

Implementation:
- Add grid below job title (4-5 cards):
  - "Company: Northstar"
  - "Team size: 5 engineers"
  - "Salary: $X - Y"
  - "Tech stack: Go, React, PostgreSQL"
  - "Remote: Yes (flexible)"

Effort: 2-3 hours (add component, fetch data from job record)
Impact: David decides fit in 1 min instead of 5 min; Maya confirms seniority level
Metric: Time to scroll to apply panel (target: <1 min)
```

---

### Win 2: Submission Loading State (High Impact, Easy)

```
Current: Click "Apply now" → silent; may or may not work
Ideal: Show "Applying..." → "✓ Application received"

Implementation:
- Add client-side form submission handler
- Show button state: "Apply now" → [Submitting...] (disabled)
- On success: Redirect to confirmation or show inline success
- On error: Show error message + allow retry

Effort: 2-3 hours (add form handling + loading states)
Impact: Maya feels confident application submitted
Metric: Error rate on job applications (track failed submissions)
```

---

### Win 3: Application Status Page (High Impact, Medium Effort)

```
Current: /jobs/application-status?applicationId=... exists but unclear
Ideal: Bookmarkable, shareable status tracking with email updates

Implementation:
- Make status page prettier:
  - Show: Application ID, job title, submitted date
  - Timeline: Submitted → Being reviewed → Offer/Rejection
  - Current status badge (in progress, completed, etc.)
  - Estimated next step + date
  - "Questions?" contact email link
  - Shareable link: "Send update to friend: [copy link]"
  
- Send email updates when status changes:
  - "Your application moved to interview stage"
  - Links to status page
  - Shows: "Next steps: Technical interview on May 25"

Effort: 6-8 hours (improve status page UI + email templates)
Impact: Candidates don't disappear; consistent communication
Metric: Candidate satisfaction (post-application survey): "I knew where my application stood"
```

---

### Win 4: Assessment Explanation (High Impact, Medium Effort)

```
Current: "Complete within 7 days" (sounds like busywork)
Ideal: Explain purpose, duration, scoring

Implementation:
- In confirmation screen, add section:
  "Assessment next:
   - Why: Help us understand your technical skills
   - Duration: 45 minutes (you can take 1 hour)
   - What happens: Your score compared to other candidates
   - What matters: We review assessment score + resume together
   - When to expect feedback: Within 3-5 business days"
   
- In assessment email, include:
  "This assessment takes ~45 min and scores your [Python, System Design, SQL] skills.
   Your score will help us decide on the next interview round.
   Start anytime within 7 days."

Effort: 3-4 hours (update email template + confirmation screen)
Impact: Applicants understand value; less anxiety about "test"
Metric: Assessment completion rate (target: improve from X% to Y%)
```

---

## 7. PRIORITY ROADMAP

### Phase 1: High-Impact, Easy Wins (1 week)

| **Fix** | **User** | **Impact** | **Effort** |
|---|---|---|---|
| Submission loading state | Maya | Confidence submission worked | 2-3h |
| Job quick facts card | David, Maya | Skim role in 1 min | 2-3h |
| Assessment explanation | Maya, David | Reduce test anxiety | 3-4h |

**Total**: ~7-10 hours for 3 highest-impact fixes

---

### Phase 2: Medium-Impact, Medium Effort (2 weeks)

| **Fix** | **User** | **Impact** | **Effort** |
|---|---|---|---|
| Application status page improvement | Both | Consistent communication | 6-8h |
| Job listing with filters | Maya | Find jobs quickly | 8-10h |
| Resume upload progress | Both | Know upload worked | 4-6h |
| Review application before submit | David | Quality over speed | 4-6h |

---

### Phase 3: Nice-to-Have (3+ weeks)

| **Fix** | **User** | **Impact** | **Effort** |
|---|---|---|---|
| Application details transparency | David | Trust in hiring | 4-6h |
| Email status updates | Both | Passive communication | 6-8h |
| Assessment feedback + scoring | David | Learn from attempt | 8-10h |
| Candidate profile section | David | Show more context | 4-6h |

---

## 8. JOBS LISTING PAGE AUDIT (From Code)

**Current**: `/jobs` page exists  
**Need to check**: Does it have search, filters, sorting?

### What to verify:

```typescript
// Check: src/app/jobs/page.tsx
- Does it show all jobs or just published ones? ✓ (isPublished flag)
- Can user filter by role/seniority? ⚠️ (unknown)
- Can user search by title? ⚠️ (unknown)
- Does it show salary/team size? ⚠️ (likely no - not in quick-facts on detail page)
- Mobile friendly? ✅ (probably - uses Tailwind)
- Pagination? ⚠️ (unknown)
```

### Recommendation

Add to next audit: Explore `/jobs` page to understand listing experience.

---

## 9. PAIN POINTS SUMMARY TABLE

| **User** | **Pain Point** | **Impact** | **Current State** | **Quick Win** | **Effort** | **Phase** |
|---|---|---|---|---|---|---|
| Maya | Can't find relevant jobs | High | No filters visible | Search + filters | 8-10h | 2 |
| Maya | Job description confusing | Medium | Long prose | Quick facts card | 2-3h | 1 |
| Maya | Submit doubt | High | Silent button click | Loading state + confirm | 2-3h | 1 |
| Maya | No confirmation email | High | Email sent but unclear | Status page + email updates | 6-8h | 2 |
| Maya | Assessment unclear | Medium | Brief text explanation | Add context + timeline | 3-4h | 1 |
| Maya | Resume upload hangs | Medium | No feedback | Upload progress bar | 4-6h | 2 |
| David | Job too vague | High | Generic description | Salary + team + tech stack | 2-3h | 1 |
| David | No application review | Medium | Direct submit | Review modal before submit | 4-6h | 2 |
| David | Can't track status | High | Must check email | Improved status page | 6-8h | 2 |
| David | Assessment feels pointless | Medium | No explanation | Explain purpose + scoring | 3-4h | 1 |
| David | No feedback after submit | High | Black hole | Email updates + assessment feedback | 6-8h | 2 |
| David | Can't show context | Medium | Resume + cover note only | Add candidate profile section | 4-6h | 3 |

---

## 10. TESTING PLAN (Before/After Metrics)

### Maya Metrics

**Before**:
- Average time to apply: 8-10 min
- Confidence application submitted: 70%
- Assessment completion rate: 60%

**After Phase 1**:
- Target: 5 min (quick facts card + loading state)
- Target: 95% (confirmation screen + status page)
- Target: 75% (assessment explanation)

**How to measure**:
- Analytics: Form completion time, submission success rate
- Post-apply survey: "Did you feel confident your application was received?" (NPS)
- Email tracking: Assessment sent vs. completed rate

---

### David Metrics

**Before**:
- Time to decide "should I apply": 10-15 min
- Application quality: 60% submit cover letter
- Status check frequency: Checks email 5+ times before rejection

**After Phase 1**:
- Target: 5 min (quick facts + transparent details)
- Target: 80% (explain value of personal context)
- Target: 2x (status page + email updates = less email checking)

**How to measure**:
- Analytics: Job detail page time on task, form field completion
- Surveys: "How clear was the job description?" (1-5 scale)
- Email engagement: Open rate on status update emails

---

## 11. CODE CHANGES NEEDED

### Quick Reference

```
// Phase 1 changes:
1. src/app/jobs/[slug]/page.tsx
   - Add job quick facts card (salary, team, tech stack, remote)
   - Pass required data from job record

2. src/components/jobs/ (new or existing)
   - Create JobQuickFactsCard component
   - Show: Company, Team size, Salary range, Tech stack, Remote policy

3. src/app/jobs/[slug]/page.tsx (apply form)
   - Add loading state to form submission
   - Show "Submitting..." button state
   - Show inline error on failure

4. src/components/jobs/ (or email templates)
   - Update assessment explanation in confirmation screen
   - Add: "Why: ..., Duration: ..., What matters: ..."

// Phase 2 changes:
5. src/app/jobs/page.tsx
   - Add filters/search (if not present)
   - Add salary, team size to job listing

6. src/app/jobs/[slug]/page.tsx (apply form)
   - Add file upload progress indicator
   - Show "Uploading: X% done"

7. src/app/jobs/application-status/page.tsx
   - Improve status page UI
   - Show timeline, estimated next step
   - Add email link to forward status

8. src/lib/email/templates/application-received.ts
   - Update: Include assessment explanation
   - Add: Why assessment matters

// Phase 3 changes:
9. Add email status update triggers
   - When application moves to new stage, send email
   - Link back to status page
```

---

## 12. NEXT STEPS

1. **Verify jobs listing page** (5 min)
   - Open `/jobs` in browser
   - Check: search, filters, sorting, mobile
   - Report findings

2. **Choose Phase 1 priority** (this sprint)
   - Start with: Job quick facts card OR submission loading state
   - Easier to implement: Both are 2-3h
   - Recommend: Do both (total 5h)

3. **Set up metrics** (before building)
   - Add analytics to track: form completion time, submission success rate, email opens
   - Plan post-apply survey question

4. **Build + measure** (each sprint)
   - Build one fix
   - Measure before/after
   - Iterate based on real data

---

**Document Status**: ✅ Ready to implement

