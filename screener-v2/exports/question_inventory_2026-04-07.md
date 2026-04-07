# Question Inventory

Generated: 2026-04-07

## Banks

- applied_logic_exam_python: 11
- applied_logic_exam_uipath: 11
- business_analysis_exam: 12
- core_2_exam_automation_anywhere: 16
- core_2_exam_power_automate: 16
- core_2_exam_python: 16
- core_2_exam_uipath: 16
- core_bank_json: 120
- general_capability_exam: 15
- practical_exam_core_automationanywhere: 5
- practical_exam_core_powerautomate: 5
- practical_exam_core_python: 5
- practical_exam_core_uipath: 5
- practical_exam_senior_lead_automationanywhere: 5
- practical_exam_senior_lead_powerautomate: 5
- practical_exam_senior_lead_python: 5
- practical_exam_senior_lead_uipath: 5
- rcm_exam: 20

## applied_logic_exam_python

### logic_reasoning_Python_Associate_meta
- Category: Applied Logic & Reasoning
- Format: logic_reasoning_pack
- Prompt: Answer each logical thinking question. Select one answer for each item.

### logic_q1_incident_priority
- Category: 1. Incident Priority
- Format: single_select
- Prompt blocks: A team fixes system problems using these rules: | Problems affecting all customers are fixed before problems affecting one customer. | Security problems are fixed before non-security problems at the same level. | Blocked problems cannot be worked on. | If more than one valid problem remains, fix the oldest one first. | Problems: Problem / Impact / Type / Status / Age :: A / All customers / Security / Open / 4 | B / All customers / Security / Open / 9 | C / All customers / Non-security / Open / 12 | D / One customer / Security / Open / 15 | E / All customers / Security / Blocked / 20 | Which problem should be fixed first?
- Options:
  - A. A
  - B. B
  - C. C
  - D. D

### logic_q2_request_processing_rules
- Category: 2. Request Processing Rules
- Format: single_select
- Prompt blocks: A system processes requests using these rules in order: | If Compliance Hold = Yes → HOLD the request | Else if Required information missing → RETURN FOR INFO | Else if Fraud Flag = Yes → REJECT | Else if Duplicate request → SKIP | Otherwise → APPROVE | Request R: Compliance Hold = No | Required information missing = Yes | Fraud Flag = Yes | Duplicate request = Yes | What happens to Request R?
- Options:
  - A. Reject
  - B. Skip
  - C. Return for info
  - D. Approve

### logic_q3_deployment_steps
- Category: 3. Deployment Steps
- Format: single_select
- Prompt blocks: A software update must follow these rules: | Code review happens before testing | Testing finishes before deployment | Security scan happens after testing but before deployment | Backup must exist before deployment | Monitoring starts right after deployment | Which order is correct?
- Options:
  - A. Code Review → Testing → Security Scan → Backup → Deployment → Monitoring
  - B. Backup → Code Review → Testing → Security Scan → Deployment → Monitoring
  - C. Code Review → Testing → Backup → Deployment → Security Scan → Monitoring
  - D. Code Review → Security Scan → Testing → Backup → Deployment → Monitoring

### logic_q4_processing_speed
- Category: 4. Processing Speed
- Format: single_select
- Prompt blocks: A system processes 180 tasks per hour. | A new update causes: 10 minutes downtime, then | processing becomes 20% faster | A queue must be escalated if total processing time is more than 2 hours. | There are 420 tasks waiting. | What should the team do?
- Options:
  - A. Continue normally
  - B. Escalate immediately
  - C. Wait and monitor
  - D. Cannot determine

### logic_q5_approval_rules
- Category: 5. Approval Rules
- Format: single_select
- Prompt blocks: Rules: Requests above $10,000 need manager approval | Requests with missing documents are flagged first | Duplicate requests are rejected | Flagged requests cannot be approved until documents are added | Request X: Amount = $15,000 | Manager approval = Yes | Documents missing = Yes | Duplicate = No | Which statement is true?
- Options:
  - A. The request will eventually be approved
  - B. The request will be rejected
  - C. The request cannot be approved yet
  - D. Another manager approval is needed

### logic_q6_case_status_check
- Category: 6. Case Status Check
- Format: single_select
- Prompt blocks: Rules: A case must go to Review before Approval | Once Released, it cannot go back to Review | If Cancelled, nothing can happen after that | Case logs: Case A: New → Review → Approved → Released | Case B: New → Review → Approved → Released → Review | Case C: New → Approved → Review → Released | Case D: New → Review → Cancelled → Released | Case E: New → Review → Approved → Released → Closed | Which case follows all the rules?
- Options:
  - A. Case A
  - B. Case B
  - C. Case D
  - D. Case E

### logic_q7_logical_reasoning
- Category: 7. Logical Reasoning
- Format: single_select
- Prompt blocks: Statements: If a task is automated, it must have a script. | If a task has a script, it must pass testing. | Some tasks that pass testing are not automated. | Task T passed testing. | What must be true?
- Options:
  - A. Task T is automated
  - B. Task T has a script
  - C. Task T may or may not be automated
  - D. Task T failed testing

### logic_q8_task_assignment
- Category: 8. Task Assignment
- Format: single_select
- Prompt blocks: Four tasks must be assigned: A, B, C, D | Rules: Task A needs SQL knowledge | Task B needs Python knowledge | Task C needs both SQL and Python | Task D needs no special skills | Team members: Alex: knows SQL only | Ben: knows Python only | Cara: knows SQL and Python | Dana: knows neither | Extra rules: Cara cannot take Task C if Alex takes Task A | Dana must take Task D if Ben takes Task B | Each person can take only one task | Which assignment works?
- Options:
  - A. Alex → A, Ben → B, Cara → C, Dana → D
  - B. Alex → A, Ben → C, Cara → B, Dana → D
  - C. Alex → D, Ben → B, Cara → C, Dana → A
  - D. Alex → A, Ben → D, Cara → C, Dana → B

### logic_q9_system_alert
- Category: 9. System Alert
- Format: single_select
- Prompt blocks: System rules: If a system failure happens, an alert is always created. | If an alert is created, it appears in the dashboard. | Sometimes alerts appear during system tests, even when there is no failure. | Observation: An alert appeared in the dashboard. | What can we conclude?
- Options:
  - A. A system failure happened
  - B. A system test happened
  - C. Either failure or test happened
  - D. We cannot know if a failure happened

### logic_q10_guaranteed_approval
- Category: 10. Guaranteed Approval
- Format: single_select
- Prompt blocks: Transaction rules: If Maintenance Window = Yes → HOLD | Else if Risk Score > 30 → REJECT | Else if Amount > $5000 → MANUAL REVIEW | Otherwise → Auto-approve only if documents are complete OR vendor is trusted | Which condition guarantees automatic approval?
- Options:
  - A. Risk ≤ 30 and Amount ≤ $5000
  - B. Trusted vendor = Yes
  - C. Risk ≤ 30, Amount ≤ $5000, Trusted vendor = Yes
  - D. Maintenance window = No, Risk ≤ 30, Amount ≤ $5000, Trusted vendor = Yes

## applied_logic_exam_uipath

### logic_reasoning_UiPath_Associate_meta
- Category: Applied Logic & Reasoning
- Format: logic_reasoning_pack
- Prompt: Answer each logical thinking question. Select one answer for each item.

### logic_q1_incident_priority
- Category: 1. Incident Priority
- Format: single_select
- Prompt blocks: A team fixes system problems using these rules: | Problems affecting all customers are fixed before problems affecting one customer. | Security problems are fixed before non-security problems at the same level. | Blocked problems cannot be worked on. | If more than one valid problem remains, fix the oldest one first. | Problems: Problem / Impact / Type / Status / Age :: A / All customers / Security / Open / 4 | B / All customers / Security / Open / 9 | C / All customers / Non-security / Open / 12 | D / One customer / Security / Open / 15 | E / All customers / Security / Blocked / 20 | Which problem should be fixed first?
- Options:
  - A. A
  - B. B
  - C. C
  - D. D

### logic_q2_request_processing_rules
- Category: 2. Request Processing Rules
- Format: single_select
- Prompt blocks: A system processes requests using these rules in order: | If Compliance Hold = Yes → HOLD the request | Else if Required information missing → RETURN FOR INFO | Else if Fraud Flag = Yes → REJECT | Else if Duplicate request → SKIP | Otherwise → APPROVE | Request R: Compliance Hold = No | Required information missing = Yes | Fraud Flag = Yes | Duplicate request = Yes | What happens to Request R?
- Options:
  - A. Reject
  - B. Skip
  - C. Return for info
  - D. Approve

### logic_q3_deployment_steps
- Category: 3. Deployment Steps
- Format: single_select
- Prompt blocks: A software update must follow these rules: | Code review happens before testing | Testing finishes before deployment | Security scan happens after testing but before deployment | Backup must exist before deployment | Monitoring starts right after deployment | Which order is correct?
- Options:
  - A. Code Review → Testing → Security Scan → Backup → Deployment → Monitoring
  - B. Backup → Code Review → Testing → Security Scan → Deployment → Monitoring
  - C. Code Review → Testing → Backup → Deployment → Security Scan → Monitoring
  - D. Code Review → Security Scan → Testing → Backup → Deployment → Monitoring

### logic_q4_processing_speed
- Category: 4. Processing Speed
- Format: single_select
- Prompt blocks: A system processes 180 tasks per hour. | A new update causes: 10 minutes downtime, then | processing becomes 20% faster | A queue must be escalated if total processing time is more than 2 hours. | There are 420 tasks waiting. | What should the team do?
- Options:
  - A. Continue normally
  - B. Escalate immediately
  - C. Wait and monitor
  - D. Cannot determine

### logic_q5_approval_rules
- Category: 5. Approval Rules
- Format: single_select
- Prompt blocks: Rules: Requests above $10,000 need manager approval | Requests with missing documents are flagged first | Duplicate requests are rejected | Flagged requests cannot be approved until documents are added | Request X: Amount = $15,000 | Manager approval = Yes | Documents missing = Yes | Duplicate = No | Which statement is true?
- Options:
  - A. The request will eventually be approved
  - B. The request will be rejected
  - C. The request cannot be approved yet
  - D. Another manager approval is needed

### logic_q6_case_status_check
- Category: 6. Case Status Check
- Format: single_select
- Prompt blocks: Rules: A case must go to Review before Approval | Once Released, it cannot go back to Review | If Cancelled, nothing can happen after that | Case logs: Case A: New → Review → Approved → Released | Case B: New → Review → Approved → Released → Review | Case C: New → Approved → Review → Released | Case D: New → Review → Cancelled → Released | Case E: New → Review → Approved → Released → Closed | Which case follows all the rules?
- Options:
  - A. Case A
  - B. Case B
  - C. Case D
  - D. Case E

### logic_q7_logical_reasoning
- Category: 7. Logical Reasoning
- Format: single_select
- Prompt blocks: Statements: If a task is automated, it must have a script. | If a task has a script, it must pass testing. | Some tasks that pass testing are not automated. | Task T passed testing. | What must be true?
- Options:
  - A. Task T is automated
  - B. Task T has a script
  - C. Task T may or may not be automated
  - D. Task T failed testing

### logic_q8_task_assignment
- Category: 8. Task Assignment
- Format: single_select
- Prompt blocks: Four tasks must be assigned: A, B, C, D | Rules: Task A needs SQL knowledge | Task B needs Python knowledge | Task C needs both SQL and Python | Task D needs no special skills | Team members: Alex: knows SQL only | Ben: knows Python only | Cara: knows SQL and Python | Dana: knows neither | Extra rules: Cara cannot take Task C if Alex takes Task A | Dana must take Task D if Ben takes Task B | Each person can take only one task | Which assignment works?
- Options:
  - A. Alex → A, Ben → B, Cara → C, Dana → D
  - B. Alex → A, Ben → C, Cara → B, Dana → D
  - C. Alex → D, Ben → B, Cara → C, Dana → A
  - D. Alex → A, Ben → D, Cara → C, Dana → B

### logic_q9_system_alert
- Category: 9. System Alert
- Format: single_select
- Prompt blocks: System rules: If a system failure happens, an alert is always created. | If an alert is created, it appears in the dashboard. | Sometimes alerts appear during system tests, even when there is no failure. | Observation: An alert appeared in the dashboard. | What can we conclude?
- Options:
  - A. A system failure happened
  - B. A system test happened
  - C. Either failure or test happened
  - D. We cannot know if a failure happened

### logic_q10_guaranteed_approval
- Category: 10. Guaranteed Approval
- Format: single_select
- Prompt blocks: Transaction rules: If Maintenance Window = Yes → HOLD | Else if Risk Score > 30 → REJECT | Else if Amount > $5000 → MANUAL REVIEW | Otherwise → Auto-approve only if documents are complete OR vendor is trusted | Which condition guarantees automatic approval?
- Options:
  - A. Risk ≤ 30 and Amount ≤ $5000
  - B. Trusted vendor = Yes
  - C. Risk ≤ 30, Amount ≤ $5000, Trusted vendor = Yes
  - D. Maintenance window = No, Risk ≤ 30, Amount ≤ $5000, Trusted vendor = Yes

## business_analysis_exam

### ba_q1
- Category: Workflow Design
- Format: single_select
- Prompt: A stakeholder says, 'The report should be fast and easy to use.' Which acceptance criterion is strongest?
- Options:
  - At least 80% of pilot users should say the report feels faster than the current one
  - The report loads in under 3 seconds for the standard monthly dataset on the supported corporate laptop profile
  - The report should open quickly enough that finance users do not complain during month-end
  - The report should require fewer clicks than the current version for common tasks

### ba_q2
- Category: Data Handling & Validation
- Format: multi_select
- Prompt: Which signs suggest the requirement set is still unsafe to build from? Select all that apply.
- Options:
  - Different stakeholders use the same term to mean different things
  - The current-state process includes a manual workaround that is documented and consistently applied
  - A required decision path has no business owner
  - An output field has no agreed source of truth
  - The delivery date is ambitious but the scope is clearly defined

### ba_q3
- Category: Workflow Design
- Format: best_next_step
- Prompt: Two stakeholders disagree on whether a request should auto-approve above $5,000. Delivery is blocked. What is the best next step?
- Options:
  - Document the conflict, identify the final decision owner, and resolve the rule before it is committed to build
  - Model both rule variants and let engineering choose the safer one during implementation
  - Use the stricter rule for launch, then revisit the threshold after go-live data arrives
  - Set a temporary midpoint threshold and capture the disagreement as a post-release improvement

### ba_q4
- Category: Workflow Design
- Format: matching
- Prompt: Match each BA artifact to its strongest primary purpose.
- Left items:
  - Process map
  - User story
  - Acceptance criteria
  - Data mapping
- Right items:
  - Describe step flow, decision points, and handoffs across the process
  - Capture a user goal plus the slice of value being requested
  - Define the observable conditions that determine pass or fail
  - Map source, target, transformation, and default behavior for each field
  - Rank backlog items by estimated effort and sprint capacity

### ba_q5
- Category: Workflow Design
- Format: ordering
- Prompt: Put these BA activities in the strongest order for a net-new workflow feature.
- Items:
  - Clarify objective, scope, and decision owner
  - Map the current state and pain points
  - Define future-state rules and exceptions
  - Write acceptance criteria and data rules
  - Validate with stakeholders before build

### ba_q6
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the most likely analysis gap from this UAT defect log?
- Options:
  - The approval threshold was implemented with the wrong numeric comparison
  - The rule interaction between contract status and amount threshold was not fully specified or tested
  - The UAT cases were run in an environment with inconsistent seed data
  - The contract flag is probably mapped to the wrong source column in one scenario

### ba_q7
- Category: Workflow Design
- Format: case_triage
- Prompt: Which change should be prioritized first by business impact?
- Options:
  - A dashboard label typo in an internal operations screen
  - A missing audit field on customer approvals required for traceability
  - A new shortcut requested by senior reviewers to save one click per case
  - A reporting widget that refreshes 10 minutes later than users would prefer

### ba_q8
- Category: Data Handling & Validation
- Format: trace_execution
- Prompt: A rule says: reject if country is blank or if tax ID is blank for Vendors; otherwise if tax ID is blank, send for review; otherwise approve. What happens for Country = 'US', Tax ID = blank, Onboarding Type = 'Employee'?
- Options:
  - Reject
  - Send for review
  - Approve
  - Cannot determine

### ba_q9
- Category: Workflow Design
- Format: fill_blank_constrained
- Prompt: A good acceptance criterion should be measurable and ____ enough that two testers would reach the same pass/fail result.
- Options:
  - repeatable
  - popular
  - broad
  - aspirational

### ba_q10
- Category: Workflow Design
- Format: single_select
- Prompt: A stakeholder asks for 'one export button' but there are three export destinations with different field rules. What is the strongest BA response?
- Options:
  - Keep one requirement but add a note that downstream destinations may vary slightly
  - Split the requirement by destination and define the field rules, validations, and ownership for each path
  - Design the most common destination now and treat the others as edge cases after release
  - Force a single common export structure even if the destinations use different mandatory fields

### ba_q11
- Category: Data Handling & Validation
- Format: multi_select
- Prompt: When validating a data mapping, which questions matter most? Select all that apply.
- Options:
  - What is the source of truth for each target field?
  - What transformation or default rule applies when the source is blank?
  - Who requested the mapping first and how quickly do they need it?
  - How are duplicates detected or prevented?
  - Whether the target UI layout might change in a later release

### ba_q12
- Category: Workflow Design
- Format: best_next_step
- Prompt: Mid-sprint, a stakeholder asks for one extra field and 'just a tiny rule change,' but the new rule affects three downstream outputs. What is the best next step?
- Options:
  - Accept the field now and schedule the downstream impact assessment after the sprint demo
  - Assess downstream impact, update scope explicitly, and route the decision through change control
  - Reject the request outright because any sprint change creates delivery risk
  - Implement the field and apply the new rule only where it causes no obvious breakage

## core_2_exam_automation_anywhere

### core2_q1
- Category: Architecture & Design (Senior+)
- Format: single_select
- Prompt: An API call sometimes times out after the external system has already accepted the request. What is the safest retry design?
- Options:
  - Retry with exponential backoff and a strict max-attempt limit
  - Retry only after reconciling whether the business action already completed by transaction key
  - Treat every timeout as a business exception and wait for manual confirmation
  - Retry after a fixed delay if the upstream availability probe turns green

### core2_q2
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the most likely root issue?
- Options:
  - The retry policy is running before the process proves whether the first side effect already committed
  - The timeout threshold is too aggressive and is causing harmless duplicate submissions
  - The ledger check is likely reading from an eventually consistent replica so the replay is unavoidable
  - The first attempt should have been ignored because timeouts cannot be trusted as accepted requests

### core2_q3
- Category: Framework & Maintainability (Senior+)
- Format: multi_select
- Prompt: Which controls are strong signs that a transaction process is replay-safe? Select all that apply.
- Options:
  - Each item has a durable business key or idempotency key
  - Checkpoint state is persisted outside process memory
  - Recovery depends mainly on a fixed sleep before retry
  - The process can verify whether a prior side effect already completed
  - Failures are classified so retries differ from business exceptions

### core2_q4
- Category: Architecture & Design (Senior+)
- Format: matching
- Prompt: Match the engineering pattern to its primary purpose.
- Left items:
  - Outbox pattern
  - Dead-letter queue
  - Circuit breaker
  - Checkpoint state
- Right items:
  - Persist an intent to publish so delivery can resume without losing committed state
  - Quarantine repeatedly failing items so the main flow can continue
  - Open after repeated failures so new calls stop hitting the dependency for a period
  - Store restart position and item state so work resumes from the last proven boundary
  - Guarantee that all downstream systems will commit or roll back as one transaction

### core2_q5
- Category: CI/CD & Release Strategy (Lead-only or Senior+)
- Format: ordering
- Prompt: Arrange these steps for a safe production hotfix.
- Items:
  - Reproduce and confirm the failure mode
  - Implement the fix and add a focused regression check
  - Deploy to a limited target first
  - Monitor production behavior and failure signals
  - Expand rollout after stability is confirmed

### core2_q6
- Category: Queues / Work Items
- Format: trace_execution
- Prompt: A worker posts a shipment request, crashes before marking the queue item complete, then on restart finds the carrier reference already exists. What is the safest completion path?
- Options:
  - Repost the shipment because internal completion state was never written
  - Reconcile the carrier state, persist the recovery evidence, and then mark the item successful
  - Mark the item retryable and let the platform attempt it again from the start
  - Route the item to manual review because any crash makes the transaction ambiguous

### core2_q7
- Category: Operations & Monitoring (Senior+)
- Format: fill_blank_constrained
- Prompt: To trace one transaction across bot, queue, and API logs, emit the same ____ ID at every step.
- Options:
  - session
  - correlation
  - sequence
  - browser

### core2_q8
- Category: Performance & Stability
- Format: case_triage
- Prompt: Backlog catch-up floods a dependency, 429 errors spike, and retries make both queue depth and database load worse. What is the best next step?
- Options:
  - Increase worker count but reduce retry attempts so the backlog clears sooner
  - Shape throughput with bounded concurrency, backoff, and queue pacing to match dependency capacity
  - Pause all retries until the backlog is gone, then replay the failed items in one batch
  - Move throttled items straight to business exception to protect the queue database

### core2_q9
- Category: Queues / Work Items
- Format: single_select
- Prompt: A performer marks a queue item successful before the external business action is confirmed. What is the main problem?
- Options:
  - The queue may show a completed transaction even though the real business side effect never committed
  - The queue throughput becomes artificially limited by downstream confirmation latency
  - The platform can no longer attach technical logs to the item after success
  - The process loses the ability to classify failures as business exceptions

### core2_q10
- Category: Performance & Stability
- Format: multi_select
- Prompt: Which controls reduce corruption when multiple runners work in parallel? Select all that apply.
- Options:
  - Use unique run-scoped working directories
  - Write final output atomically after validation
  - Share one intermediate temp file across all runners
  - Use durable item IDs so retries target the same unit of work
  - Rely on a fixed 10-second delay before every write

### core2_q11
- Category: Operations & Monitoring (Senior+)
- Format: best_next_step
- Prompt: A few items always fail with the same malformed payload while healthy items continue. What is the best handling strategy?
- Options:
  - Retry the malformed items with a longer delay so the downstream schema has time to stabilize
  - Route the poisoned items to a dead-letter path, capture the failure reason, and keep the healthy flow moving
  - Pause the queue and require a full data cleanse before any additional healthy items run
  - Skip the items after three failures and monitor whether business users raise them manually

### core2_q12
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the strongest conclusion from these incident notes?
- Options:
  - The logging model lacks end-to-end correlation, so support cannot connect symptoms into one causal chain
  - The worker restart policy is the main issue because it obscures whether app latency matters
  - The queue backlog is expected and the real problem is short-term log retention
  - The app latency spike is likely secondary because queue depth rose first

### core2_q13
- Category: Architecture & Design (Senior+)
- Format: case_triage
- Prompt: A process updates three systems. The first update succeeds, the second times out, and the worker crashes before writing audit state. What is the best recovery design?
- Options:
  - Replay the full transaction from the first step every time
  - Reconcile each side effect by transaction key and continue from the last proven safe boundary
  - Mark the whole transaction as failed and never retry multi-system items
  - Ignore the audit state because the business systems are the source of truth

### core2_q14
- Category: Framework & Maintainability (Senior+)
- Format: single_select
- Prompt: Which improvement gives the best long-term resilience signal?
- Options:
  - Adding targeted delays around the most unstable dependency calls
  - Replacing blind retries with explicit state checks, reconciliation, and commit boundaries
  - Lowering warning log volume so real failures stand out more clearly
  - Provisioning larger runners so intermittent latency no longer triggers timeouts

### core2_aa_q1
- Category: Automation Anywhere Specific
- Format: single_select
- Prompt: Two Automation Anywhere runners write intermediate files to one shared folder and overwrite each other. What is the best fix?
- Options:
  - Increase file retry count so transient file locks resolve naturally
  - Give each runner a unique working directory and publish final output atomically
  - Serialize the final write step but keep shared intermediate files
  - Ask operations to archive the shared folder before each batch window

### core2_aa_q2
- Category: Automation Anywhere Specific
- Format: best_next_step
- Prompt: One Automation Anywhere bot works on Runner A but fails on Runner B after a credential rotation. What is the best next step?
- Options:
  - Hardcode the new password in the bot temporarily so both runners can proceed
  - Check vault access, package version, and runner config parity before rerun
  - Promote the package again so both runners definitely use the same runtime history
  - Delete the failed run history and reschedule all affected jobs on Runner A only

## core_2_exam_power_automate

### core2_q1
- Category: Architecture & Design (Senior+)
- Format: single_select
- Prompt: An API call sometimes times out after the external system has already accepted the request. What is the safest retry design?
- Options:
  - Retry with exponential backoff and a strict max-attempt limit
  - Retry only after reconciling whether the business action already completed by transaction key
  - Treat every timeout as a business exception and wait for manual confirmation
  - Retry after a fixed delay if the upstream availability probe turns green

### core2_q2
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the most likely root issue?
- Options:
  - The retry policy is running before the process proves whether the first side effect already committed
  - The timeout threshold is too aggressive and is causing harmless duplicate submissions
  - The ledger check is likely reading from an eventually consistent replica so the replay is unavoidable
  - The first attempt should have been ignored because timeouts cannot be trusted as accepted requests

### core2_q3
- Category: Framework & Maintainability (Senior+)
- Format: multi_select
- Prompt: Which controls are strong signs that a transaction process is replay-safe? Select all that apply.
- Options:
  - Each item has a durable business key or idempotency key
  - Checkpoint state is persisted outside process memory
  - Recovery depends mainly on a fixed sleep before retry
  - The process can verify whether a prior side effect already completed
  - Failures are classified so retries differ from business exceptions

### core2_q4
- Category: Architecture & Design (Senior+)
- Format: matching
- Prompt: Match the engineering pattern to its primary purpose.
- Left items:
  - Outbox pattern
  - Dead-letter queue
  - Circuit breaker
  - Checkpoint state
- Right items:
  - Persist an intent to publish so delivery can resume without losing committed state
  - Quarantine repeatedly failing items so the main flow can continue
  - Open after repeated failures so new calls stop hitting the dependency for a period
  - Store restart position and item state so work resumes from the last proven boundary
  - Guarantee that all downstream systems will commit or roll back as one transaction

### core2_q5
- Category: CI/CD & Release Strategy (Lead-only or Senior+)
- Format: ordering
- Prompt: Arrange these steps for a safe production hotfix.
- Items:
  - Reproduce and confirm the failure mode
  - Implement the fix and add a focused regression check
  - Deploy to a limited target first
  - Monitor production behavior and failure signals
  - Expand rollout after stability is confirmed

### core2_q6
- Category: Queues / Work Items
- Format: trace_execution
- Prompt: A worker posts a shipment request, crashes before marking the queue item complete, then on restart finds the carrier reference already exists. What is the safest completion path?
- Options:
  - Repost the shipment because internal completion state was never written
  - Reconcile the carrier state, persist the recovery evidence, and then mark the item successful
  - Mark the item retryable and let the platform attempt it again from the start
  - Route the item to manual review because any crash makes the transaction ambiguous

### core2_q7
- Category: Operations & Monitoring (Senior+)
- Format: fill_blank_constrained
- Prompt: To trace one transaction across bot, queue, and API logs, emit the same ____ ID at every step.
- Options:
  - session
  - correlation
  - sequence
  - browser

### core2_q8
- Category: Performance & Stability
- Format: case_triage
- Prompt: Backlog catch-up floods a dependency, 429 errors spike, and retries make both queue depth and database load worse. What is the best next step?
- Options:
  - Increase worker count but reduce retry attempts so the backlog clears sooner
  - Shape throughput with bounded concurrency, backoff, and queue pacing to match dependency capacity
  - Pause all retries until the backlog is gone, then replay the failed items in one batch
  - Move throttled items straight to business exception to protect the queue database

### core2_q9
- Category: Queues / Work Items
- Format: single_select
- Prompt: A performer marks a queue item successful before the external business action is confirmed. What is the main problem?
- Options:
  - The queue may show a completed transaction even though the real business side effect never committed
  - The queue throughput becomes artificially limited by downstream confirmation latency
  - The platform can no longer attach technical logs to the item after success
  - The process loses the ability to classify failures as business exceptions

### core2_q10
- Category: Performance & Stability
- Format: multi_select
- Prompt: Which controls reduce corruption when multiple runners work in parallel? Select all that apply.
- Options:
  - Use unique run-scoped working directories
  - Write final output atomically after validation
  - Share one intermediate temp file across all runners
  - Use durable item IDs so retries target the same unit of work
  - Rely on a fixed 10-second delay before every write

### core2_q11
- Category: Operations & Monitoring (Senior+)
- Format: best_next_step
- Prompt: A few items always fail with the same malformed payload while healthy items continue. What is the best handling strategy?
- Options:
  - Retry the malformed items with a longer delay so the downstream schema has time to stabilize
  - Route the poisoned items to a dead-letter path, capture the failure reason, and keep the healthy flow moving
  - Pause the queue and require a full data cleanse before any additional healthy items run
  - Skip the items after three failures and monitor whether business users raise them manually

### core2_q12
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the strongest conclusion from these incident notes?
- Options:
  - The logging model lacks end-to-end correlation, so support cannot connect symptoms into one causal chain
  - The worker restart policy is the main issue because it obscures whether app latency matters
  - The queue backlog is expected and the real problem is short-term log retention
  - The app latency spike is likely secondary because queue depth rose first

### core2_q13
- Category: Architecture & Design (Senior+)
- Format: case_triage
- Prompt: A process updates three systems. The first update succeeds, the second times out, and the worker crashes before writing audit state. What is the best recovery design?
- Options:
  - Replay the full transaction from the first step every time
  - Reconcile each side effect by transaction key and continue from the last proven safe boundary
  - Mark the whole transaction as failed and never retry multi-system items
  - Ignore the audit state because the business systems are the source of truth

### core2_q14
- Category: Framework & Maintainability (Senior+)
- Format: single_select
- Prompt: Which improvement gives the best long-term resilience signal?
- Options:
  - Adding targeted delays around the most unstable dependency calls
  - Replacing blind retries with explicit state checks, reconciliation, and commit boundaries
  - Lowering warning log volume so real failures stand out more clearly
  - Provisioning larger runners so intermittent latency no longer triggers timeouts

### core2_pa_q1
- Category: Power Automate Specific
- Format: best_next_step
- Prompt: A Power Automate flow updates a Dataverse row, which retriggers the same flow and creates duplicate downstream actions. What is the best fix?
- Options:
  - Add a delay after every row update so the next trigger sees the final state
  - Use trigger conditions or state flags so self-generated updates do not re-enter the same path
  - Split the flow into two flows so each one owns half of the state transition
  - Disable retries on the flow so duplicates do not repeat after transient errors

### core2_pa_q2
- Category: Power Automate Specific
- Format: single_select
- Prompt: Connector throttling starts returning 429 responses and overlapping runs create duplicated approvals. What is the strongest control?
- Options:
  - Increase trigger concurrency so older approvals clear before they overlap again
  - Use bounded retry/backoff and reduce concurrency to match connector capacity
  - Turn off run history during the incident to reduce connector overhead
  - Allow duplicate approvals temporarily and rely on users to reject extras

## core_2_exam_python

### core2_q1
- Category: Architecture & Design (Senior+)
- Format: single_select
- Prompt: An API call sometimes times out after the external system has already accepted the request. What is the safest retry design?
- Options:
  - Retry with exponential backoff and a strict max-attempt limit
  - Retry only after reconciling whether the business action already completed by transaction key
  - Treat every timeout as a business exception and wait for manual confirmation
  - Retry after a fixed delay if the upstream availability probe turns green

### core2_q2
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the most likely root issue?
- Options:
  - The retry policy is running before the process proves whether the first side effect already committed
  - The timeout threshold is too aggressive and is causing harmless duplicate submissions
  - The ledger check is likely reading from an eventually consistent replica so the replay is unavoidable
  - The first attempt should have been ignored because timeouts cannot be trusted as accepted requests

### core2_q3
- Category: Framework & Maintainability (Senior+)
- Format: multi_select
- Prompt: Which controls are strong signs that a transaction process is replay-safe? Select all that apply.
- Options:
  - Each item has a durable business key or idempotency key
  - Checkpoint state is persisted outside process memory
  - Recovery depends mainly on a fixed sleep before retry
  - The process can verify whether a prior side effect already completed
  - Failures are classified so retries differ from business exceptions

### core2_q4
- Category: Architecture & Design (Senior+)
- Format: matching
- Prompt: Match the engineering pattern to its primary purpose.
- Left items:
  - Outbox pattern
  - Dead-letter queue
  - Circuit breaker
  - Checkpoint state
- Right items:
  - Persist an intent to publish so delivery can resume without losing committed state
  - Quarantine repeatedly failing items so the main flow can continue
  - Open after repeated failures so new calls stop hitting the dependency for a period
  - Store restart position and item state so work resumes from the last proven boundary
  - Guarantee that all downstream systems will commit or roll back as one transaction

### core2_q5
- Category: CI/CD & Release Strategy (Lead-only or Senior+)
- Format: ordering
- Prompt: Arrange these steps for a safe production hotfix.
- Items:
  - Reproduce and confirm the failure mode
  - Implement the fix and add a focused regression check
  - Deploy to a limited target first
  - Monitor production behavior and failure signals
  - Expand rollout after stability is confirmed

### core2_q6
- Category: Queues / Work Items
- Format: trace_execution
- Prompt: A worker posts a shipment request, crashes before marking the queue item complete, then on restart finds the carrier reference already exists. What is the safest completion path?
- Options:
  - Repost the shipment because internal completion state was never written
  - Reconcile the carrier state, persist the recovery evidence, and then mark the item successful
  - Mark the item retryable and let the platform attempt it again from the start
  - Route the item to manual review because any crash makes the transaction ambiguous

### core2_q7
- Category: Operations & Monitoring (Senior+)
- Format: fill_blank_constrained
- Prompt: To trace one transaction across bot, queue, and API logs, emit the same ____ ID at every step.
- Options:
  - session
  - correlation
  - sequence
  - browser

### core2_q8
- Category: Performance & Stability
- Format: case_triage
- Prompt: Backlog catch-up floods a dependency, 429 errors spike, and retries make both queue depth and database load worse. What is the best next step?
- Options:
  - Increase worker count but reduce retry attempts so the backlog clears sooner
  - Shape throughput with bounded concurrency, backoff, and queue pacing to match dependency capacity
  - Pause all retries until the backlog is gone, then replay the failed items in one batch
  - Move throttled items straight to business exception to protect the queue database

### core2_q9
- Category: Queues / Work Items
- Format: single_select
- Prompt: A performer marks a queue item successful before the external business action is confirmed. What is the main problem?
- Options:
  - The queue may show a completed transaction even though the real business side effect never committed
  - The queue throughput becomes artificially limited by downstream confirmation latency
  - The platform can no longer attach technical logs to the item after success
  - The process loses the ability to classify failures as business exceptions

### core2_q10
- Category: Performance & Stability
- Format: multi_select
- Prompt: Which controls reduce corruption when multiple runners work in parallel? Select all that apply.
- Options:
  - Use unique run-scoped working directories
  - Write final output atomically after validation
  - Share one intermediate temp file across all runners
  - Use durable item IDs so retries target the same unit of work
  - Rely on a fixed 10-second delay before every write

### core2_q11
- Category: Operations & Monitoring (Senior+)
- Format: best_next_step
- Prompt: A few items always fail with the same malformed payload while healthy items continue. What is the best handling strategy?
- Options:
  - Retry the malformed items with a longer delay so the downstream schema has time to stabilize
  - Route the poisoned items to a dead-letter path, capture the failure reason, and keep the healthy flow moving
  - Pause the queue and require a full data cleanse before any additional healthy items run
  - Skip the items after three failures and monitor whether business users raise them manually

### core2_q12
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the strongest conclusion from these incident notes?
- Options:
  - The logging model lacks end-to-end correlation, so support cannot connect symptoms into one causal chain
  - The worker restart policy is the main issue because it obscures whether app latency matters
  - The queue backlog is expected and the real problem is short-term log retention
  - The app latency spike is likely secondary because queue depth rose first

### core2_q13
- Category: Architecture & Design (Senior+)
- Format: case_triage
- Prompt: A process updates three systems. The first update succeeds, the second times out, and the worker crashes before writing audit state. What is the best recovery design?
- Options:
  - Replay the full transaction from the first step every time
  - Reconcile each side effect by transaction key and continue from the last proven safe boundary
  - Mark the whole transaction as failed and never retry multi-system items
  - Ignore the audit state because the business systems are the source of truth

### core2_q14
- Category: Framework & Maintainability (Senior+)
- Format: single_select
- Prompt: Which improvement gives the best long-term resilience signal?
- Options:
  - Adding targeted delays around the most unstable dependency calls
  - Replacing blind retries with explicit state checks, reconciliation, and commit boundaries
  - Lowering warning log volume so real failures stand out more clearly
  - Provisioning larger runners so intermittent latency no longer triggers timeouts

### core2_python_q1
- Category: Python Automation
- Format: multi_select
- Prompt: Which controls make a Python API-posting batch safer to replay? Select all that apply.
- Options:
  - Persist per-record state outside process memory
  - Use an idempotency key or business key on each POST
  - Catch all exceptions and continue only if the record can be retried safely without audit loss
  - Reconcile destination state before replaying uncertain records
  - Handle throttling, validation, and timeout failures with the same recovery path

### core2_python_q2
- Category: Python Automation
- Format: single_select
- Prompt: A batch sometimes reads an input file before the upstream process is finished writing it. What is the best protection?
- Options:
  - Retry parsing until the JSON loads successfully twice in a row
  - Check for a reliable completion signal or atomic handoff before processing the file
  - Ignore the final block if parsing fails and let downstream validation catch partial records
  - Poll file size changes for a few seconds and assume the write is complete if growth stops

## core_2_exam_uipath

### core2_q1
- Category: Architecture & Design (Senior+)
- Format: single_select
- Prompt: An API call sometimes times out after the external system has already accepted the request. What is the safest retry design?
- Options:
  - Retry with exponential backoff and a strict max-attempt limit
  - Retry only after reconciling whether the business action already completed by transaction key
  - Treat every timeout as a business exception and wait for manual confirmation
  - Retry after a fixed delay if the upstream availability probe turns green

### core2_q2
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the most likely root issue?
- Options:
  - The retry policy is running before the process proves whether the first side effect already committed
  - The timeout threshold is too aggressive and is causing harmless duplicate submissions
  - The ledger check is likely reading from an eventually consistent replica so the replay is unavoidable
  - The first attempt should have been ignored because timeouts cannot be trusted as accepted requests

### core2_q3
- Category: Framework & Maintainability (Senior+)
- Format: multi_select
- Prompt: Which controls are strong signs that a transaction process is replay-safe? Select all that apply.
- Options:
  - Each item has a durable business key or idempotency key
  - Checkpoint state is persisted outside process memory
  - Recovery depends mainly on a fixed sleep before retry
  - The process can verify whether a prior side effect already completed
  - Failures are classified so retries differ from business exceptions

### core2_q4
- Category: Architecture & Design (Senior+)
- Format: matching
- Prompt: Match the engineering pattern to its primary purpose.
- Left items:
  - Outbox pattern
  - Dead-letter queue
  - Circuit breaker
  - Checkpoint state
- Right items:
  - Persist an intent to publish so delivery can resume without losing committed state
  - Quarantine repeatedly failing items so the main flow can continue
  - Open after repeated failures so new calls stop hitting the dependency for a period
  - Store restart position and item state so work resumes from the last proven boundary
  - Guarantee that all downstream systems will commit or roll back as one transaction

### core2_q5
- Category: CI/CD & Release Strategy (Lead-only or Senior+)
- Format: ordering
- Prompt: Arrange these steps for a safe production hotfix.
- Items:
  - Reproduce and confirm the failure mode
  - Implement the fix and add a focused regression check
  - Deploy to a limited target first
  - Monitor production behavior and failure signals
  - Expand rollout after stability is confirmed

### core2_q6
- Category: Queues / Work Items
- Format: trace_execution
- Prompt: A worker posts a shipment request, crashes before marking the queue item complete, then on restart finds the carrier reference already exists. What is the safest completion path?
- Options:
  - Repost the shipment because internal completion state was never written
  - Reconcile the carrier state, persist the recovery evidence, and then mark the item successful
  - Mark the item retryable and let the platform attempt it again from the start
  - Route the item to manual review because any crash makes the transaction ambiguous

### core2_q7
- Category: Operations & Monitoring (Senior+)
- Format: fill_blank_constrained
- Prompt: To trace one transaction across bot, queue, and API logs, emit the same ____ ID at every step.
- Options:
  - session
  - correlation
  - sequence
  - browser

### core2_q8
- Category: Performance & Stability
- Format: case_triage
- Prompt: Backlog catch-up floods a dependency, 429 errors spike, and retries make both queue depth and database load worse. What is the best next step?
- Options:
  - Increase worker count but reduce retry attempts so the backlog clears sooner
  - Shape throughput with bounded concurrency, backoff, and queue pacing to match dependency capacity
  - Pause all retries until the backlog is gone, then replay the failed items in one batch
  - Move throttled items straight to business exception to protect the queue database

### core2_q9
- Category: Queues / Work Items
- Format: single_select
- Prompt: A performer marks a queue item successful before the external business action is confirmed. What is the main problem?
- Options:
  - The queue may show a completed transaction even though the real business side effect never committed
  - The queue throughput becomes artificially limited by downstream confirmation latency
  - The platform can no longer attach technical logs to the item after success
  - The process loses the ability to classify failures as business exceptions

### core2_q10
- Category: Performance & Stability
- Format: multi_select
- Prompt: Which controls reduce corruption when multiple runners work in parallel? Select all that apply.
- Options:
  - Use unique run-scoped working directories
  - Write final output atomically after validation
  - Share one intermediate temp file across all runners
  - Use durable item IDs so retries target the same unit of work
  - Rely on a fixed 10-second delay before every write

### core2_q11
- Category: Operations & Monitoring (Senior+)
- Format: best_next_step
- Prompt: A few items always fail with the same malformed payload while healthy items continue. What is the best handling strategy?
- Options:
  - Retry the malformed items with a longer delay so the downstream schema has time to stabilize
  - Route the poisoned items to a dead-letter path, capture the failure reason, and keep the healthy flow moving
  - Pause the queue and require a full data cleanse before any additional healthy items run
  - Skip the items after three failures and monitor whether business users raise them manually

### core2_q12
- Category: Debugging & Logs
- Format: log_analysis_single_select
- Prompt: What is the strongest conclusion from these incident notes?
- Options:
  - The logging model lacks end-to-end correlation, so support cannot connect symptoms into one causal chain
  - The worker restart policy is the main issue because it obscures whether app latency matters
  - The queue backlog is expected and the real problem is short-term log retention
  - The app latency spike is likely secondary because queue depth rose first

### core2_q13
- Category: Architecture & Design (Senior+)
- Format: case_triage
- Prompt: A process updates three systems. The first update succeeds, the second times out, and the worker crashes before writing audit state. What is the best recovery design?
- Options:
  - Replay the full transaction from the first step every time
  - Reconcile each side effect by transaction key and continue from the last proven safe boundary
  - Mark the whole transaction as failed and never retry multi-system items
  - Ignore the audit state because the business systems are the source of truth

### core2_q14
- Category: Framework & Maintainability (Senior+)
- Format: single_select
- Prompt: Which improvement gives the best long-term resilience signal?
- Options:
  - Adding targeted delays around the most unstable dependency calls
  - Replacing blind retries with explicit state checks, reconciliation, and commit boundaries
  - Lowering warning log volume so real failures stand out more clearly
  - Provisioning larger runners so intermittent latency no longer triggers timeouts

### core2_uipath_q1
- Category: UiPath Specific
- Format: best_next_step
- Prompt: A UiPath bot clicks a virtualized grid row successfully, then after scroll acts on the wrong row because the DOM re-renders. What is the best fix?
- Options:
  - Add a post-scroll wait and retry the same selector once the grid settles
  - Target rows by stable business data or extracted row identity instead of visual position
  - Capture the row by screen coordinates before each scroll and reapply the click
  - Switch the final click to image automation while keeping positional row targeting

### core2_uipath_q2
- Category: UiPath Specific
- Format: single_select
- Prompt: A UiPath performer marks a queue item successful, then the ERP crashes before the invoice is actually posted. What should change?
- Options:
  - Move the success mark to after the ERP post is confirmed and recovery state is written
  - Keep the success mark early but add a compensating queue item when ERP posting fails
  - Increase robot memory allocation so the ERP client is less likely to crash
  - Keep the current success timing and retry the ERP post separately if it fails

## core_bank_json

### RPA-ASC-0013
- Category: Workflow Design
- Format: single_choice
- Prompt: You are automating invoice entry into an internal system. Login, navigation, and validation logic are duplicated in 4 places. What is the best improvement?
- Options:
  - Add more comments
  - Extract common steps into reusable workflows/components
  - Copy the logic into 2 more places for consistency
  - Add random delays

### RPA-ASC-0014
- Category: Data Handling & Validation
- Format: single_choice
- Prompt: A bot reads pending claims from a database. Which SQL query is most appropriate?
- Options:
  - SELECT * FROM Claims WHERE Status = 'Pending'
  - DELETE FROM Claims
  - DROP TABLE Claims
  - SELECT Pending FROM Status

### RPA-ASC-0015
- Category: Workflow Design
- Format: fill_in_blank_constrained
- Prompt: Complete the sentence. Keep environment URLs, paths, and secrets in ____ so the same workflow can run in dev, UAT, and prod.
- Options:
  - configuration
  - source comments
  - hardcoded literals
  - personal notebook

### RPA-ASC-0016
- Category: Exception Handling & Retries
- Format: trace_execution
- Prompt: Trace this queue transaction flow and choose the final status.
- Options:
  - Business exception
  - Manual stop required
  - System exception retried then success
  - Permanent failure with no log

### RPA-ASC-0017
- Category: Workflow Design
- Format: case_triage
- Prompt: Case: Sprint has two hotfixes, one new feature, and one UAT defect. Team capacity is limited. What is the best planning action?
- Options:
  - Start all items in parallel with no owner
  - Prioritize by business risk and assign clear owners
  - Skip defect work until next release
  - Let developers choose work randomly

### RPA-ASC-0018
- Category: Workflow Design
- Format: multi_select
- Prompt: Which are valid signs of good workflow organization? Select all that apply.
- Options:
  - A. Reusable components
  - B. Clear transaction boundaries
  - C. Hardcoded file paths everywhere
  - D. Consistent logging
  - E. Separate config handling

### RPA-ASC-0019
- Category: Deployment & Configuration
- Format: multi_select
- Prompt: A bot works in UAT but fails in production. Which checks are valid? Select all that apply.
- Options:
  - A. Compare selectors/UI versions
  - B. Check credentials and permissions
  - C. Confirm production input data shape
  - D. Rewrite the whole solution first
  - E. Review environment-specific config values

### RPA-ASC-0020
- Category: Deployment & Configuration
- Format: match_pairs
- Prompt: Match the item to the most appropriate purpose. Git branch Business exception Config file Retry mechanism A. Handle temporary failures in controlled fashion B. Separate work safely before merge C. Store environment-specific values D. Invalid input/rule violation
- Left items:
  - Git branch
  - Business exception
  - Config file
  - Retry mechanism
- Right items:
  - A. Handle temporary failures in controlled fashion
  - B. Separate work safely before merge
  - C. Store environment-specific values
  - D. Invalid input/rule violation

### RPA-ASC-0021
- Category: Deployment & Configuration
- Format: ordering
- Prompt: Arrange these deployment-related steps.
- Items:
  - Validate requirements with business
  - Build and unit test
  - UAT
  - Production deployment
  - Fix issues found in testing

### RPA-ASC-0022
- Category: Exception Handling & Retries
- Format: match_pairs
- Prompt: Classify each issue. Categories: Business exception System exception Items: Mandatory claim ID missing Application server not responding Invalid invoice amount format from source file Database connection timeout
- Left items:
  - Mandatory claim ID missing
  - Application server not responding
  - Invalid invoice amount format from source file
  - Database connection timeout
- Right items:
  - Business exception
  - System exception

### RPA-ASC-0023
- Category: Data Handling & Validation
- Format: log_analysis_single_choice
- Prompt: What is the best conclusion?
- Options:
  - Selector issue in the target app
  - Bot should be removed from production
  - Repeated data-quality problem in source input
  - Git branch conflict

### RPA-ASC-0024
- Category: Exception Handling & Retries
- Format: single_choice
- Prompt: A workflow processes transactions from a queue. One transaction fails because the application freezes temporarily. What is the best handling choice?
- Options:
  - Mark as business exception immediately
  - Skip all future transactions
  - Remove logging to improve speed
  - Retry according to controlled system-exception logic

### RPA-ASC-0069
- Category: UiPath Specific
- Format: best_next_step
- Prompt: A UiPath process repeats the same login steps in five workflows. What is the best improvement?
- Options:
  - Create one reusable login workflow and call it
  - Copy the same steps into two more workflows
  - Remove login logs to save time
  - Ask operations to log in manually

### RPA-ASC-0070
- Category: UiPath Specific
- Format: trace_execution
- Prompt: Trace this UiPath deployment check and choose the right fix.
- Options:
  - Keep one shared URL for all environments
  - Ask user to edit workflow each release
  - Load URL from environment-specific config
  - Hardcode production URL in main flow

### RPA-ASC-0071
- Category: Automation Anywhere Specific
- Format: case_triage
- Prompt: Case: An AA bot credential leaks in a local file shared by mistake. What is the best immediate action?
- Options:
  - Keep file but hide extension
  - Rotate leaked secret and move to Credential Vault
  - Store credential in task comments
  - Continue using leaked credential for now

### RPA-ASC-0072
- Category: Automation Anywhere Specific
- Format: best_next_step
- Prompt: An Automation Anywhere bot downloads 100 reports. One report fails due to network timeout. What should it do?
- Options:
  - Retry failed report with limit, log, continue others
  - Stop the whole run on first timeout
  - Delete all downloaded reports
  - Ignore the timeout without logging

### RPA-ASC-0073
- Category: Python Automation
- Format: fill_in_blank_constrained
- Prompt: Complete the Python validation rule. If policyId is missing, ____ the record and continue processing.
- Options:
  - log and skip
  - crash
  - delete input file
  - guess random id

### RPA-ASC-0074
- Category: Python Automation
- Format: best_next_step
- Prompt: A Python automation works locally but fails on server due to package version mismatch. Best fix?
- Options:
  - Install latest packages on every run
  - Copy local site-packages folder manually
  - Use pinned requirements and controlled environment setup
  - Disable virtual environments

### RPA-ASC-0075
- Category: Power Automate Specific
- Format: best_next_step
- Prompt: Three Power Automate flows repeat the same approval steps. Best design improvement?
- Options:
  - Keep copying steps in each flow
  - Move common steps into a child flow
  - Remove approval from two flows
  - Ask approvers to work by email only

### RPA-ASC-0076
- Category: Power Automate Specific
- Format: trace_execution
- Prompt: Trace this Power Automate HTTP call behavior and choose the correct action.
- Options:
  - Apply exponential backoff retry policy
  - Disable retries on 429
  - Ignore 429 and mark success
  - Add random delay without policy

### RPA-INT-0001
- Category: Core RPA Concepts
- Format: single_choice
- Prompt: A team wants to automate copying customer IDs from an Excel file into a web portal every morning. Which factor most strongly suggests this is a good candidate for RPA?
- Options:
  - The process needs legal judgment
  - The portal changes every day
  - The process is repetitive and rule-based
  - The output is always unstructured handwriting

### RPA-INT-0002
- Category: Exception Handling & Retries
- Format: single_choice
- Prompt: A bot fails because an invoice file is missing a required field that the business user forgot to enter. What is the best classification?
- Options:
  - System exception
  - Deployment issue
  - Selector failure
  - Business exception

### RPA-INT-0003
- Category: Core RPA Concepts
- Format: fill_in_blank_constrained
- Prompt: Complete the sentence. Teams use ____ to track changes, review work, and roll back safely when needed.
- Options:
  - version control
  - manual file overwrite
  - shared USB copy
  - email attachments only

### RPA-INT-0004
- Category: Workflow Design
- Format: trace_execution
- Prompt: Trace this run and choose the final result.
- Options:
  - Run fails and stops before any test
  - Run completes after one fixed data issue
  - Run loops forever
  - Run skips all rows

### RPA-INT-0005
- Category: Core RPA Concepts
- Format: case_triage
- Prompt: Case: A production run fails because one field selector changed after a minor UI update. You have 15 minutes before next scheduled run. What is the best first action?
- Options:
  - Disable selector checks and rerun
  - Delete all failed transactions
  - Verify the changed field and update selector safely
  - Retry the same old selector many times

### RPA-INT-0006
- Category: Deployment & Configuration
- Format: multi_select
- Prompt: A bot works on one machine but not on another. Which checks are reasonable first steps? Select all that apply.
- Options:
  - A. Compare application versions
  - B. Check user permissions
  - C. Delete the entire project
  - D. Verify file paths and environment settings
  - E. Assume the business rule is wrong

### RPA-INT-0007
- Category: Core RPA Concepts
- Format: multi_select
- Prompt: Which tasks are suitable for a beginner intern to help with under guidance? Select all that apply.
- Options:
  - A. Testing a workflow with sample inputs
  - B. Documenting process steps
  - C. Designing enterprise automation architecture alone
  - D. Fixing simple selector issues
  - E. Identifying basic validation rules

### RPA-INT-0008
- Category: Core RPA Concepts
- Format: match_pairs
- Prompt: Match each term to the best description. Business exception System exception Test case Repository A. A stored place for project versions B. Failure caused by invalid business data C. A defined condition used to verify behavior D. Failure caused by application/system issue
- Left items:
  - Business exception
  - System exception
  - Test case
  - Repository
- Right items:
  - A. A stored place for project versions
  - B. Failure caused by invalid business data
  - C. A defined condition used to verify behavior
  - D. Failure caused by application/system issue

### RPA-INT-0009
- Category: Workflow Design
- Format: ordering
- Prompt: Arrange the steps in the best development order.
- Items:
  - Build workflow
  - Gather requirements
  - Test with sample data
  - Deploy
  - Review expected output

### RPA-INT-0010
- Category: Core RPA Concepts
- Format: match_pairs
- Prompt: Place each item into the correct category. Categories: Good fit for RPA Poor fit for RPA Items: Daily copy-paste of fixed-format data A process with undocumented rules changing every day Sending standard email alerts on SLA breaches Human negotiation of disputed insurance claims
- Left items:
  - Daily copy-paste of fixed-format data
  - A process with undocumented rules changing every day
  - Sending standard email alerts on SLA breaches
  - Human negotiation of disputed insurance claims
- Right items:
  - Good fit for RPA
  - Poor fit for RPA

### RPA-INT-0011
- Category: Debugging & Logs
- Format: log_analysis_single_choice
- Prompt: A bot ran 4 times. What is the most likely first area to investigate?
- Options:
  - Business rules in invoice validation
  - Email subject line formatting
  - Excel formula accuracy
  - Portal/environment availability

### RPA-INT-0012
- Category: Data Handling & Validation
- Format: single_choice
- Prompt: A bot reads 20 rows from Excel and sends one email per row. Row 8 has an invalid email address. What is the best basic behavior?
- Options:
  - Crash immediately and send nothing
  - Delete the Excel file
  - Skip row 8, log it, continue remaining rows
  - Retry forever

### RPA-INT-0061
- Category: UiPath Specific
- Format: best_next_step
- Prompt: In UiPath, a Click works in Studio but fails on robot machine. The selector uses a changing id. What is the best next step?
- Options:
  - Use stable selector attributes and validate in UI Explorer
  - Use image clicks for the whole process
  - Add a 30-second delay before every click
  - Run only when no one uses the machine

### RPA-INT-0062
- Category: UiPath Specific
- Format: trace_execution
- Prompt: Trace this UiPath queue item handling and pick the final status.
- Options:
  - System exception retried then success
  - Business exception logged and next item continues
  - Queue item deleted with no trace
  - Whole queue run stops

### RPA-INT-0063
- Category: Automation Anywhere Specific
- Format: best_next_step
- Prompt: An Automation Anywhere step fails because the app window is not ready after login. What is the best fix?
- Options:
  - Increase mouse speed
  - Remove login from the task
  - Add wait for the window state before next action
  - Turn off logs

### RPA-INT-0064
- Category: Automation Anywhere Specific
- Format: case_triage
- Prompt: Case: Automation Anywhere table extraction fails only for one dynamic column. What is the best first action?
- Options:
  - Switch entire process to coordinate clicks
  - Delete the table step permanently
  - Run without saving extracted data
  - Re-map the column with object capture and test again

### RPA-INT-0065
- Category: Python Automation
- Format: best_next_step
- Prompt: A Python bot calling an API gets temporary HTTP 503 errors. What should it do?
- Options:
  - Retry with short backoff and a max retry count
  - Ignore status code and continue
  - Retry forever with no limit
  - Exit with no log

### RPA-INT-0066
- Category: Python Automation
- Format: fill_in_blank_constrained
- Prompt: Complete the sentence for Python file handling. To avoid broken names like Jose in CSV, use ____ encoding.
- Options:
  - UTF-8
  - ASCII-only
  - binary random
  - screen text capture

### RPA-INT-0067
- Category: Power Automate Specific
- Format: trace_execution
- Prompt: Trace this Power Automate incident and pick the best conclusion.
- Options:
  - Trigger schedule is too fast
  - Flow needs more parallel branches
  - Connector token became invalid after password reset
  - Mailbox does not exist

### RPA-INT-0068
- Category: Power Automate Specific
- Format: best_next_step
- Prompt: A flow creates duplicate tickets when the same email is forwarded twice. What is the best protection?
- Options:
  - Turn off mailbox forwarding
  - Split into two separate flows
  - Remove error handling
  - Add idempotency check using message id before create

### RPA-SE-0025
- Category: Workflow Design
- Format: single_choice
- Prompt: A business process updates records in a web portal, but the portal also exposes stable APIs. Which option is generally better for a production-grade solution?
- Options:
  - UI automation only, because it looks more visible
  - API-first where feasible, with UI only where needed
  - Screen scraping for all cases
  - Manual updates in parallel forever

### RPA-SE-0026
- Category: Workflow Design
- Format: single_choice
- Prompt: A bot contains repeated login, file-read, and logging patterns across multiple projects. What should an engineer do?
- Options:
  - Build reusable components/libraries
  - Leave duplication to save time
  - Put everything into one giant workflow
  - Remove logs to simplify maintenance

### RPA-SE-0027
- Category: Debugging & Logs
- Format: fill_in_blank_constrained
- Prompt: Complete the logging rule. Every transaction log should include a ____ so support can trace one item across systems.
- Options:
  - correlation id
  - random emoji
  - screen resolution
  - machine wallpaper

### RPA-SE-0028
- Category: Deployment & Configuration
- Format: trace_execution
- Prompt: Trace the release sequence and choose the final outcome.
- Options:
  - Release succeeds with no checks
  - Release rolls back after two weeks
  - Release blocked before production due to failed smoke check
  - Release skips UAT and passes

### RPA-SE-0029
- Category: Workflow Design
- Format: case_triage
- Prompt: Case: One API call in a batch job is timing out, but others pass. SLA still allows completion in 30 minutes. What is the best action?
- Options:
  - Mark whole batch failed immediately
  - Retry only the failed call with backoff and continue
  - Remove timeout handling to save time
  - Disable logs until run ends

### RPA-SE-0030
- Category: Workflow Design
- Format: multi_select
- Prompt: Which are good indicators that an engineer is thinking end-to-end? Select all that apply.
- Options:
  - A. Environment-specific configuration strategy
  - B. Monitoring/logging plan
  - C. Reusable error handling
  - D. Ignoring deployment concerns until production
  - E. Recovery/fallback behavior

### RPA-SE-0031
- Category: Workflow Design
- Format: multi_select
- Prompt: You are reviewing a fragile bot. Which changes are likely to improve maintainability? Select all that apply.
- Options:
  - A. Move common logic into reusable components
  - B. Replace stable selectors with image clicks everywhere
  - C. Centralize config handling
  - D. Introduce structured exception handling
  - E. Add clear logging around critical steps

### RPA-SE-0032
- Category: Workflow Design
- Format: match_pairs
- Prompt: Match each design concept to the best description. Reusable component Config-driven design Transaction isolation Structured logging A. Records meaningful execution details for support B. Separates each item so one failure does not break all work C. Common functionality used across solutions D. Behavior controlled through external settings
- Left items:
  - Reusable component
  - Config-driven design
  - Transaction isolation
  - Structured logging
- Right items:
  - A. Records meaningful execution details for support
  - B. Separates each item so one failure does not break all work
  - C. Common functionality used across solutions
  - D. Behavior controlled through external settings

### RPA-SE-0033
- Category: Workflow Design
- Format: ordering
- Prompt: Arrange these solution steps for a robust automation effort.
- Items:
  - Identify integration options
  - Analyze requirements and edge cases
  - Design reusable structure
  - Build and test
  - Prepare deployment/config strategy

### RPA-SE-0034
- Category: Workflow Design
- Format: match_pairs
- Prompt: Place each item into the best category. Categories: Better handled by API/integration Better handled by UI automation Items: Stable endpoint for member-status updates Legacy desktop app with no service layer Bulk record retrieval via documented service Human-facing internal app with no backend access
- Left items:
  - Stable endpoint for member-status updates
  - Legacy desktop app with no service layer
  - Bulk record retrieval via documented service
  - Human-facing internal app with no backend access
- Right items:
  - Better handled by API/integration
  - Better handled by UI automation

### RPA-SE-0035
- Category: Debugging & Logs
- Format: log_analysis_single_choice
- Prompt: What is the most likely root cause?
- Options:
  - API authentication/config issue
  - Missing business data
  - PDF parsing failure
  - Selector drift

### RPA-SE-0036
- Category: Exception Handling & Retries
- Format: single_choice
- Prompt: A bot loops through transactions. Which approach is best?
- Options:
  - Put all records in one try-catch so one error stops all
  - Handle each transaction individually with logging and status update
  - Disable exception handling to improve speed
  - Store production credentials inside code comments

### RPA-SE-0077
- Category: UiPath Specific
- Format: best_next_step
- Prompt: A UiPath selector keeps breaking because row index changes daily. What is the best selector strategy?
- Options:
  - Keep strict index in selector
  - Replace with full-image automation
  - Use stable attributes/anchors instead of volatile index
  - Add fixed waits only

### RPA-SE-0078
- Category: UiPath Specific
- Format: trace_execution
- Prompt: Trace this UiPath transaction sequence and choose final handling.
- Options:
  - Business exception and no retry
  - Drop item without status
  - Stop whole process immediately
  - System exception retried per policy

### RPA-SE-0079
- Category: Automation Anywhere Specific
- Format: case_triage
- Prompt: Case: AA bot works in UAT but executable path differs in production. What is best engineering fix?
- Options:
  - Use environment config variable for app path
  - Duplicate workflow for each environment
  - Ask operator to browse path manually every run
  - Hardcode production path in one step

### RPA-SE-0080
- Category: Automation Anywhere Specific
- Format: best_next_step
- Prompt: Automation Anywhere bot uses Send Keys right after opening app and fails randomly. Best fix?
- Options:
  - Add wait for ready state before typing
  - Add fixed delays after every action regardless UI state
  - Type before verifying the target field is ready
  - Switch to coordinate typing without object checks

### RPA-SE-0081
- Category: Python Automation
- Format: fill_in_blank_constrained
- Prompt: Complete API paging rule. Keep requesting next page until ____ is empty.
- Options:
  - next page token
  - first page only
  - manual note
  - random counter

### RPA-SE-0082
- Category: Python Automation
- Format: best_next_step
- Prompt: Where should a production Python bot keep API secrets?
- Options:
  - Hardcoded in source file
  - In plain text config in repo
  - Secret manager or secure environment variables
  - Inside run logs

### RPA-SE-0083
- Category: Power Automate Specific
- Format: best_next_step
- Prompt: A Power Automate flow updates the same record from parallel runs and causes conflicts. Best control?
- Options:
  - Increase trigger frequency
  - Enable concurrency control/locking for the update path
  - Remove conflict handling
  - Duplicate the update step

### RPA-SE-0084
- Category: Power Automate Specific
- Format: trace_execution
- Prompt: Trace this Power Automate deployment path and choose the final outcome.
- Options:
  - Controlled promotion using solution-aware ALM
  - Uncontrolled hotfix in production
  - Flow copied manually with missing refs
  - Personal account owns production flow

### RPA-SEN-0037
- Category: Framework & Maintainability (Senior+)
- Format: single_choice
- Prompt: A junior developer built a bot with repeated logic, weak logs, and no config separation. What is the best senior-level response?
- Options:
  - Approve it because it works once
  - Reject it without explanation
  - Guide refactoring toward reusability, config separation, and logging standards
  - Deploy first and fix later

### RPA-SEN-0038
- Category: Architecture & Design (Senior+)
- Format: case_triage
- Prompt: Case: You can ship quickly with fragile selectors, or ship two days later with reusable API-first design. Process is business-critical. Best call?
- Options:
  - Ship fragile selectors now
  - Cancel all automation
  - Use OCR for every step
  - Choose API-first design for long-term stability

### RPA-SEN-0039
- Category: Operations & Monitoring (Senior+)
- Format: single_choice
- Prompt: After a framework cleanup, which metric best proves production quality improved?
- Options:
  - Fewer repeat failures and faster recovery time
  - Number of meetings held
  - Number of comments in code
  - Size of the release note document

### RPA-SEN-0040
- Category: UI Automation Reliability (Selectors/Waits)
- Format: log_analysis_single_choice
- Prompt: Based on this incident log, what should be fixed first?
- Options:
  - Selector strategy in ClaimsBot
  - Email template wording
  - Dashboard color theme
  - Robot machine wallpaper

### RPA-SEN-0041
- Category: Framework & Maintainability (Senior+)
- Format: fill_in_blank_constrained
- Prompt: Complete the sentence. Senior ownership means defining standards and ____ so team quality rises consistently.
- Options:
  - mentoring
  - shortcuts
  - random fixes
  - manual workarounds

### RPA-SEN-0042
- Category: Framework & Maintainability (Senior+)
- Format: multi_select
- Prompt: Which actions best reduce rework across multiple automations? Select all that apply.
- Options:
  - A. Standard component templates
  - B. Common exception-handling pattern
  - C. Environment-specific hardcoding
  - D. Review checklist for deployments
  - E. Shared logging conventions

### RPA-SEN-0043
- Category: Architecture & Design (Senior+)
- Format: multi_select
- Prompt: A senior engineer is evaluating a new automation opportunity. Which factors should be considered? Select all that apply.
- Options:
  - A. Process stability
  - B. Rule clarity
  - C. Expected exception profile
  - D. Whether the process owner likes blue dashboards
  - E. Integration complexity

### RPA-SEN-0044
- Category: Framework & Maintainability (Senior+)
- Format: match_pairs
- Prompt: Match the issue to the best preventive action. High duplication across bots Frequent production failures with poor diagnosis Slow onboarding of junior devs Repeated deployment mistakes A. Create reusable libraries/framework patterns B. Standardize logs and support diagnostics C. Introduce release checklist and deployment standards D. Add mentoring guides and design examples
- Left items:
  - High duplication across bots
  - Frequent production failures with poor diagnosis
  - Slow onboarding of junior devs
  - Repeated deployment mistakes
- Right items:
  - A. Create reusable libraries/framework patterns
  - B. Standardize logs and support diagnostics
  - C. Introduce release checklist and deployment standards
  - D. Add mentoring guides and design examples

### RPA-SEN-0045
- Category: Framework & Maintainability (Senior+)
- Format: ordering
- Prompt: Arrange these senior-level improvement steps.
- Items:
  - Identify repeated quality problems
  - Define standards/patterns
  - Coach team on adoption
  - Review implementations against standards
  - Measure reduction in failures/rework

### RPA-SEN-0046
- Category: Framework & Maintainability (Senior+)
- Format: match_pairs
- Prompt: Classify each activity. Categories: Senior engineer ownership Mid-level engineer ownership Items: Define reusable exception-handling standard Build a single moderate workflow independently Mentor junior dev through design flaws Implement a validated module based on agreed architecture
- Left items:
  - Define reusable exception-handling standard
  - Build a single moderate workflow independently
  - Mentor junior dev through design flaws
  - Implement a validated module based on agreed architecture
- Right items:
  - Senior engineer ownership
  - Mid-level engineer ownership

### RPA-SEN-0047
- Category: Operations & Monitoring (Senior+)
- Format: log_analysis_single_choice
- Prompt: What should be the highest-priority senior action?
- Options:
  - Rewrite MailBot first
  - Improve selector strategy and resilience in ClaimsBot
  - Remove all business validations
  - Stop code reviews

### RPA-SEN-0048
- Category: Architecture & Design (Senior+)
- Format: trace_execution
- Prompt: Trace this modular workflow and pick the final status.
- Options:
  - Two systems update, third fails, transaction marked retry
  - Run stops at first validation warning
  - All systems skipped
  - Run deletes all queued work

### RPA-SEN-0085
- Category: UiPath Specific
- Format: best_next_step
- Prompt: Different UiPath teams use different naming and exception patterns. As a senior engineer, what should you do first?
- Options:
  - Let each team keep their own style
  - Focus only on new features
  - Remove shared libraries
  - Define a common template and review checklist

### RPA-SEN-0086
- Category: UiPath Specific
- Format: trace_execution
- Prompt: Trace this design decision and choose expected result.
- Options:
  - UI-only design always more stable
  - OCR-only path reduces all failures
  - API-first with UI fallback reduces break rate
  - No impact on reliability

### RPA-SEN-0087
- Category: Automation Anywhere Specific
- Format: best_next_step
- Prompt: Automation Anywhere bots fail under peak load due to shared resource contention. Best senior-level fix?
- Options:
  - Run all bots at same start time
  - Use queue-based workload distribution and controlled runner limits
  - Increase bot speed setting only
  - Disable logs to improve performance

### RPA-SEN-0088
- Category: Automation Anywhere Specific
- Format: case_triage
- Prompt: Case: Long AA job fails at record 420/1000. Business asks restart now. Best design choice for future runs?
- Options:
  - Add checkpoint per transaction with restart-safe state
  - Restart full 1000 each time
  - Disable failure logging to speed run
  - Split into random manual chunks

### RPA-SEN-0089
- Category: Python Automation
- Format: fill_in_blank_constrained
- Prompt: Complete maintainability rule. Reused Python helpers should be packaged as ____ modules with tests.
- Options:
  - versioned
  - hidden
  - one-off
  - temporary

### RPA-SEN-0090
- Category: Python Automation
- Format: best_next_step
- Prompt: Support team cannot trace failed Python transactions across systems. What should be added?
- Options:
  - Random debug prints only
  - Structured logs with correlation id per transaction
  - Fewer logs to reduce file size
  - Screenshot on every line of code

### RPA-SEN-0091
- Category: Power Automate Specific
- Format: best_next_step
- Prompt: Critical Power Automate flow fails at night and business sees delay in morning. Best improvement?
- Options:
  - Wait for users to report manually
  - Disable run history
  - Add failure alerts and controlled retry/reprocess path
  - Move flow to personal account

### RPA-SEN-0092
- Category: Power Automate Specific
- Format: trace_execution
- Prompt: Trace this Power Automate environment model and pick the best conclusion.
- Options:
  - Single environment gives strongest control
  - Personal connectors are best for enterprise
  - Production-first build is safest
  - Separate dev/test/prod improves release safety

### RPA-TL-0049
- Category: Governance & Security (Lead-only)
- Format: single_choice
- Prompt: A team uses different naming, logging, and exception patterns across projects. What should the technical lead do first?
- Options:
  - Ignore it until failures increase more
  - Ask every developer to invent their own framework
  - Remove reusable components
  - Define architecture and engineering standards for consistency

### RPA-TL-0050
- Category: Governance & Security (Lead-only)
- Format: case_triage
- Prompt: Case: Three squads deliver fast but with inconsistent quality and rising rework. What should you do first as tech lead?
- Options:
  - Allow each squad to keep own standards
  - Set shared standards, review gates, and reusable patterns
  - Pause all releases for one quarter
  - Focus only on UI naming style

### RPA-TL-0051
- Category: Architecture & Design (Senior+)
- Format: fill_in_blank_constrained
- Prompt: Complete the platform decision rule. Select tools based on integration fit, security, scale, and ____.
- Options:
  - team capability
  - personal preference
  - logo color
  - vendor popularity only

### RPA-TL-0052
- Category: CI/CD & Release Strategy (Lead-only or Senior+)
- Format: log_analysis_single_choice
- Prompt: Review this release log. What control should be strengthened first?
- Options:
  - Reduce logging to speed release
  - Skip peer review for urgent items
  - Deploy directly from developer machines
  - Enforce release checklist with rollback and smoke gates

### RPA-TL-0053
- Category: Governance & Security (Lead-only)
- Format: single_choice
- Prompt: Which KPI best shows a tech lead is improving team delivery quality?
- Options:
  - Better standard adoption and lower production defect rate
  - Personal lines of code
  - Number of status meetings
  - Size of email inbox

### RPA-TL-0054
- Category: Governance & Security (Lead-only)
- Format: multi_select
- Prompt: Which actions support scalable RPA delivery at team level? Select all that apply.
- Options:
  - A. Standard architecture templates
  - B. Shared reusable libraries
  - C. Team-wide code review process
  - D. Different logging approach for every developer
  - E. CI/CD-aware deployment discipline

### RPA-TL-0055
- Category: Architecture & Design (Senior+)
- Format: multi_select
- Prompt: A lead is deciding whether to use UiPath, Power Automate, or another platform for a client. Which factors matter? Select all that apply.
- Options:
  - A. Existing ecosystem/integration fit
  - B. Security/governance needs
  - C. Team capability and maintainability
  - D. Random personal preference
  - E. Scale and support requirements

### RPA-TL-0056
- Category: Governance & Security (Lead-only)
- Format: match_pairs
- Prompt: Match the lead responsibility to the most relevant outcome. Code review coverage Reusable library investment Governance standards Mentoring junior engineers A. Improved consistency and lower defect leakage B. Faster delivery through shared building blocks C. Better long-term team capability growth D. Stronger alignment and predictable engineering quality
- Left items:
  - Code review coverage
  - Reusable library investment
  - Governance standards
  - Mentoring junior engineers
- Right items:
  - A. Improved consistency and lower defect leakage
  - B. Faster delivery through shared building blocks
  - C. Better long-term team capability growth
  - D. Stronger alignment and predictable engineering quality

### RPA-TL-0057
- Category: CI/CD & Release Strategy (Lead-only or Senior+)
- Format: ordering
- Prompt: Arrange these lead-level rollout steps for a new automation framework.
- Items:
  - Assess recurring delivery pain points
  - Define target architecture and standards
  - Build reusable shared components
  - Train project teams
  - Track adoption and quality metrics

### RPA-TL-0058
- Category: Governance & Security (Lead-only)
- Format: match_pairs
- Prompt: Place each item into the best category. Categories: Governance artifact Solution artifact Items: Naming standard for workflows Reusable login component Release checklist Claims API integration module
- Left items:
  - Naming standard for workflows
  - Reusable login component
  - Release checklist
  - Claims API integration module
- Right items:
  - Governance artifact
  - Solution artifact

### RPA-TL-0059
- Category: Operations & Monitoring (Senior+)
- Format: log_analysis_single_choice
- Prompt: Which initiative should be prioritized first?
- Options:
  - Cosmetic document cleanup only
  - Ignore duplicated code
  - Standardize reusable components and logging conventions
  - Focus only on status email formatting

### RPA-TL-0060
- Category: Architecture & Design (Senior+)
- Format: trace_execution
- Prompt: Trace this program rollout and choose the outcome.
- Options:
  - All bots become manual processes
  - No measurable change possible
  - Quality improves after shared standards and monitoring adoption
  - Audit controls are removed

### RPA-TL-0093
- Category: UiPath Specific
- Format: best_next_step
- Prompt: UiPath projects across teams have inconsistent quality and high rework. What should a tech lead do first?
- Options:
  - Set common architecture standards, templates, and review gates
  - Let each team optimize alone
  - Freeze all automation work
  - Focus only on UI styling

### RPA-TL-0094
- Category: UiPath Specific
- Format: trace_execution
- Prompt: Trace this UiPath capacity plan and pick the expected outcome.
- Options:
  - Month-end jobs collide and fail randomly
  - Queue priority plus schedule windows stabilizes peak runs
  - All jobs require manual trigger
  - Monitoring no longer needed

### RPA-TL-0095
- Category: Automation Anywhere Specific
- Format: best_next_step
- Prompt: Multiple Automation Anywhere teams are rebuilding similar components. What should a lead implement?
- Options:
  - Keep separate team solutions forever
  - Block reuse to protect autonomy
  - Shared reusable component library with governance ownership
  - Require manual work for common steps

### RPA-TL-0096
- Category: Automation Anywhere Specific
- Format: case_triage
- Prompt: Case: Production incidents rise after AA releases. What should be implemented first?
- Options:
  - Release straight to prod to save time
  - Disable run history
  - Remove release checklist
  - Staged rollout with smoke checks and rollback plan

### RPA-TL-0097
- Category: Python Automation
- Format: fill_in_blank_constrained
- Prompt: Complete security baseline. For Python bots handling PII, enforce least privilege, secret storage, and ____ logs.
- Options:
  - audit
  - silent
  - temporary
  - personal

### RPA-TL-0098
- Category: Python Automation
- Format: best_next_step
- Prompt: Nightly Python workload grows from 100k to 1M records. What architecture is best next step?
- Options:
  - Keep single-thread script and hope hardware solves it
  - Queue-based worker model with idempotency and retry controls
  - Split file manually every night
  - Remove validation checks

### RPA-TL-0099
- Category: Power Automate Specific
- Format: best_next_step
- Prompt: Hundreds of Power Automate flows are built by many teams with little control. What is the best first governance action?
- Options:
  - Allow all connectors everywhere
  - Turn off run history
  - Apply DLP policies and managed solution process
  - Remove environment separation

### RPA-TL-0100
- Category: Power Automate Specific
- Format: trace_execution
- Prompt: Trace this Power Automate operations model and pick the best conclusion.
- Options:
  - Weekly manual checks are enough for SLA flows
  - Disable alerts to reduce noise
  - Incidents should be handled ad hoc
  - Central monitoring and alert routing improves MTTR

### RPA-INT-0101
- Category: Exception Handling & Retries
- Format: trace_execution
- Prompt: Trace this bot retry flow and choose the best final status.
- Options:
  - Business exception because the file was bad
  - Manual intervention required immediately
  - System exception retried, then the transaction succeeded
  - Delete the file and continue without logging

### RPA-INT-0102
- Category: Workflow Design
- Format: multi_select
- Prompt: A support handover note for a bot should include which items? Select all that apply.
- Options:
  - A. Input and output locations
  - B. Recovery steps for common failures
  - C. Personal passwords kept by the developer
  - D. Support contact or owner
  - E. Schedule or trigger details

### RPA-INT-0103
- Category: UiPath Specific
- Format: best_next_step
- Prompt: A UiPath click selector includes a changing invoice number, so it fails on the next case. What is the best fix?
- Options:
  - Use stable attributes or an anchor-based selector
  - Add a 30-second delay before every click
  - Ask the user to click the field manually
  - Keep the selector and rerun until it works

### RPA-INT-0104
- Category: Python Automation
- Format: fill_in_blank_constrained
- Prompt: Complete the rule. When reading a finance CSV, validate required columns before ____ each row.
- Options:
  - processing
  - renaming
  - emailing
  - deleting

### RPA-ASC-0105
- Category: Queues / Work Items
- Format: log_analysis_single_choice
- Prompt: What is the best conclusion from this queue log?
- Options:
  - The queue item was processed twice because duplicate protection is missing
  - The process should delete the queue item after the first timeout
  - The issue is definitely caused by Git merge conflict
  - There is no issue because every line says success

### RPA-ASC-0106
- Category: Deployment & Configuration
- Format: match_pairs
- Prompt: Match each item to its most appropriate use. Environment config Retry policy Queue name Correlation ID A. Track one transaction across logs B. Control behavior for temporary failures C. Point the same package to the right environment values D. Identify the work list used by the bot
- Left items:
  - Environment config
  - Retry policy
  - Queue name
  - Correlation ID
- Right items:
  - A. Track one transaction across logs
  - B. Control behavior for temporary failures
  - C. Point the same package to the right environment values
  - D. Identify the work list used by the bot

### RPA-ASC-0107
- Category: Power Automate Specific
- Format: case_triage
- Prompt: Case: A Power Automate flow sends approval emails twice when an operator retries a timed-out run. What is the best improvement?
- Options:
  - Remove timeout handling so retries are impossible
  - Add a status check or idempotency guard before sending the email again
  - Increase the email body length to make duplicates obvious
  - Ask users to ignore duplicate emails during busy periods

### RPA-ASC-0108
- Category: Automation Anywhere Specific
- Format: best_next_step
- Prompt: An Automation Anywhere bot uses a hardcoded download folder, so it fails on another runner. What is the best fix?
- Options:
  - Store the path in environment-aware config or a device variable
  - Create a different bot for every machine
  - Ask support to rename folders before every run
  - Disable file validation checks

### RPA-SE-0109
- Category: Debugging & Logs
- Format: ordering
- Prompt: Arrange these incident-triage actions for a failing automation.
- Items:
  - Capture the correlation ID and failing transaction details
  - Check recent logs and screenshots for the exact failure point
  - Apply a safe workaround or retry if appropriate
  - Document the root cause and preventive fix

### RPA-SE-0110
- Category: Performance & Stability
- Format: case_triage
- Prompt: Case: During month-end, an API returns rate-limit errors and retries cause more congestion. What is the best next step?
- Options:
  - Increase parallel calls so the backlog clears faster
  - Add throttle control with backoff and queue pacing
  - Disable logging to reduce API latency
  - Retry forever with no upper limit

### RPA-SE-0111
- Category: UiPath Specific
- Format: log_analysis_single_choice
- Prompt: What is the best conclusion from this UiPath deployment log?
- Options:
  - The issue is environment credentials only
  - The selector relies on unstable UI position and should be redesigned
  - The package should be copied manually into production
  - The logs show a database problem

### RPA-SE-0112
- Category: Python Automation
- Format: multi_select
- Prompt: Which controls improve file handoff reliability between Python automation stages? Select all that apply.
- Options:
  - A. Write to a temp file and rename atomically when complete
  - B. Use a ready marker or completion signal
  - C. Read files while they are still growing
  - D. Validate checksum or record count before processing
  - E. Depend only on a fixed sleep delay

### RPA-SEN-0113
- Category: Architecture & Design (Senior+)
- Format: match_pairs
- Prompt: Match each engineering pattern to its primary purpose. Idempotency key Queue decoupling Circuit breaker Feature flag A. Stop hammering an unhealthy dependency B. Prevent duplicate side effects on retry C. Separate intake from workers for smoother scaling D. Turn risky changes on gradually
- Left items:
  - Idempotency key
  - Queue decoupling
  - Circuit breaker
  - Feature flag
- Right items:
  - A. Stop hammering an unhealthy dependency
  - B. Prevent duplicate side effects on retry
  - C. Separate intake from workers for smoother scaling
  - D. Turn risky changes on gradually

### RPA-SEN-0114
- Category: Exception Handling & Retries
- Format: trace_execution
- Prompt: Trace this payment-posting flow and choose the best final conclusion.
- Options:
  - Duplicate payment was created because retries are always unsafe
  - The retry failed because logs were too detailed
  - The system safely retried and avoided a duplicate by checking an idempotency key
  - The payment should never be retried under any condition

### RPA-SEN-0115
- Category: Power Automate Specific
- Format: log_analysis_single_choice
- Prompt: What is the best conclusion from this Power Automate run log?
- Options:
  - The flow needs more random retries only
  - The design needs controlled concurrency or batching to avoid connector throttling
  - The issue is definitely user permissions
  - The fastest fix is to disable retry tracking

### RPA-SEN-0116
- Category: Python Automation
- Format: fill_in_blank_constrained
- Prompt: Complete the reliability rule. For safe re-runs, write and check an ____ key before posting a payment to an API.
- Options:
  - idempotency
  - animation
  - temporary
  - debug

### RPA-TL-0117
- Category: Governance & Security (Lead-only)
- Format: multi_select
- Prompt: Which controls support scalable enterprise automation governance? Select all that apply.
- Options:
  - A. Shared engineering standards and templates
  - B. Clear service ownership for shared components
  - C. Secret management and connector/DLP guardrails
  - D. Unreviewed production access for every squad
  - E. Release metrics and incident-review feedback loops

### RPA-TL-0118
- Category: Operations & Monitoring (Senior+)
- Format: log_analysis_single_choice
- Prompt: Which initiative should the tech lead prioritize first from this portfolio report?
- Options:
  - Cosmetic dashboard cleanup
  - Establish service ownership and operational KPIs for live automations
  - Remove reporting to reduce overhead
  - Delay all fixes until the next quarter

### RPA-TL-0119
- Category: UiPath Specific
- Format: case_triage
- Prompt: Case: UiPath queues from multiple squads compete for the same runners during month-end, causing SLA misses. What should the lead do first?
- Options:
  - Let every squad keep its own unmanaged schedule
  - Introduce central capacity rules with queue priority and runner windows
  - Disable queue metrics so contention is less visible
  - Move all jobs to manual start

### RPA-TL-0120
- Category: Power Automate Specific
- Format: best_next_step
- Prompt: Hundreds of Power Automate flows depend on one on-premises gateway with frequent drift and unclear ownership. What is the best next step?
- Options:
  - Keep the single shared gateway and let teams change it ad hoc
  - Establish owned gateway operations with environment separation and controlled changes
  - Turn off gateway monitoring to reduce noise
  - Move every production flow to personal accounts

## general_capability_exam

### gca_q1
- Category: logical_reasoning
- Format: single_select
- Prompt: All Neralis are Peliks. Some Torvens are Peliks. No Peliks are Jorans.  Which statement must be true?
- Options:
  - No Neralis are Jorans
  - Some Neralis are Peliks
  - All Torvens are not Jorans
  - Some Jorans are Torvens

### gca_q2
- Category: pattern_recognition
- Format: fill_blank_constrained
- Prompt: Complete the sequence: 4, 12, 15, 45, 48, __
- Options:
  - 132
  - 141
  - 144
  - 156

### gca_q3
- Category: data_judgment
- Format: multi_select
- Prompt: A team dashboard shows: - Output volume up 35% - Average handling time down 20% - Rework rate up from 4% to 11% - Customer escalations up 30%  Which conclusions are justified? Select all that apply.
- Options:
  - The team may be trading quality for speed
  - The process clearly improved overall
  - Rework and escalations suggest a quality issue
  - Faster handling time alone is enough to declare success
  - More investigation is needed before calling the change effective

### gca_q4
- Category: prioritization_under_pressure
- Format: best_next_step
- Prompt: You are 45 minutes from submitting a high-visibility deliverable. At the same time: - a client reports a possible billing issue affecting a small number of accounts - your manager asks for a 2-minute status note for an upcoming leadership meeting  What is the best immediate next step?
- Options:
  - Pause the deliverable and investigate the billing issue in full before doing anything else
  - Send a brief status note, gather enough information to size the billing risk, and continue the deliverable unless the risk is confirmed as severe
  - Ignore both until the deliverable is submitted to avoid losing focus
  - Reply to the manager first, then continue the deliverable and revisit the client issue afterward

### gca_q5
- Category: impact_assessment
- Format: case_triage
- Prompt: Assign priority levels using: P1 = immediate business-critical impact P2 = significant but manageable impact P3 = limited impact / workaround exists  Cases: 1. Incorrect invoices being sent to many customers 2. Internal reporting dashboard loads slowly for staff 3. One customer cannot export data, but a manual workaround exists
- Options:
  - 1=P1, 2=P2, 3=P3
  - 1=P2, 2=P2, 3=P1
  - 1=P1, 2=P3, 3=P2
  - 1=P2, 2=P3, 3=P3

### gca_q6
- Category: diagnostic_reasoning
- Format: log_analysis_single_select
- Prompt: What is the most likely primary issue?
- Options:
  - Authentication instability
  - Downstream service latency causing response delays
  - Invalid user request format
  - UI rendering failure

### gca_q7
- Category: problem_solving_sequence
- Format: ordering
- Prompt: Put the actions in the strongest order for handling a recurring operational issue.
- Items:
  - Confirm the issue pattern is real and repeatable
  - Identify the most likely root cause
  - Apply the fix
  - Monitor whether the fix worked
  - Document or implement prevention steps

### gca_q8
- Category: situational_judgment
- Format: matching
- Prompt: Match each situation to the strongest response.
- Left items:
  - Requirements are incomplete and the stakeholder is unavailable
  - A task is urgent but no owner is clearly assigned
  - A dependency is blocking a deadline-critical deliverable
  - The same problem keeps returning after temporary fixes
- Right items:
  - Assign explicit ownership immediately
  - Proceed with defined assumptions and make them visible
  - Escalate or create an alternate path quickly
  - Stop patching and investigate root cause

### gca_q9
- Category: structured_thinking
- Format: trace_execution
- Prompt: Start with value = 8  Step 1: multiply by 2 Step 2: if result is greater than 10, subtract 5 Step 3: divide by 1 Step 4: add 7  What is the final value?
- Options:
  - 13
  - 18
  - 23
  - 24

### gca_q10
- Category: decision_tradeoffs
- Format: single_select
- Prompt: A task can be delivered today with moderate risk of error, or tomorrow with a high chance of being correct.  The deadline is somewhat flexible, but client-facing errors would be costly.  What is the best choice?
- Options:
  - Deliver today because speed is usually valued more highly
  - Deliver tomorrow because the cost of client-facing errors outweighs the modest delay
  - Deliver today and fix any errors if customers report them
  - Delay the decision until more pressure forces a clear answer

### gca_q11
- Category: integrity_and_uncertainty
- Format: multi_select
- Prompt: You find that two internal reports show materially different numbers for the same metric, and leadership expects an update soon.  Which actions are appropriate? Select all that apply.
- Options:
  - State that the numbers are not yet reliable and explain that validation is in progress
  - Pick the cleaner-looking dataset so leadership has something to use
  - Investigate the discrepancy before making strong claims
  - Present one number confidently to avoid creating confusion
  - Share the uncertainty clearly if an update cannot be delayed

### gca_q12
- Category: ambiguity_handling
- Format: best_next_step
- Prompt: You receive a request with unclear success criteria. You can either: - start now with reasonable assumptions - wait for clarification that may not arrive until late - push back and ask for the request to be reassigned  What is the best next step?
- Options:
  - Start with explicit assumptions, keep scope controlled, and surface the assumptions early
  - Wait for full clarification so rework is minimized
  - Push back because unclear requests should not be accepted
  - Start broadly so you are more likely to cover what was intended

### gca_q13
- Category: communication_quality
- Format: single_select
- Prompt: Choose the strongest stakeholder update for a delayed deliverable.
- Options:
  - We are delayed due to blockers. Will share more soon.
  - The deliverable is delayed by one day due to dependency X. Current mitigation is Y. Next update at 4 PM.
  - There are some challenges, but the team is working hard to solve them.
  - The timeline slipped. We will update when we know more.

### gca_q14
- Category: criticality_detection
- Format: multi_select
- Prompt: Select all scenarios that should be treated as P1.
- Options:
  - Incorrect charges affecting multiple customers
  - A small UI misalignment on one settings page
  - Risk of production data loss
  - Internal report takes 15 seconds longer than usual to load
  - A single user needs a manual workaround for a non-critical export

### gca_q15
- Category: quality_of_judgment
- Format: single_select
- Prompt: A team changed its process and now completes more work per day, but defects and follow-up corrections also increased.  Which response is the weakest?
- Options:
  - Compare the gain in output against the added cost of defects before deciding the change was successful
  - Investigate where the defects are entering the process and whether speed targets changed behavior
  - Treat the increase in completed work as the main success metric because defects can be handled separately
  - Review both throughput and quality measures before keeping the new process

## practical_exam_core_automationanywhere

### core_AutomationAnywhere_meta
- Category: Automation Anywhere Incident Drill
- Format: practical_pack
- Prompt: An Automation Anywhere bot creates daily reports and uploads them to a portal. After a password change and runner issues, some reports fail and some reruns overwrite files.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Stop scheduled runs, verify the updated credential, and isolate the affected reports
  - Hardcode the new password so reports can resume quickly
  - Add more runners before checking the failures

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - A credential is stored in a file on the runner
  - One upload fails because the network drops
  - The bot works on one runner but fails on another
- Right items:
  - Move it to Credential Vault and update the bot to use it
  - Retry only the failed report using checkpointed progress
  - Compare bot version, config, and runner setup before rerun

### execution_control
- Category: Best Automation Anywhere execution control
- Format: single_select
- Options:
  - Use checkpoints and track each report so finished work is not rerun
  - Restart the whole batch when one report fails
  - Keep going without tracking completed reports

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Run a small pilot, check report accuracy and overwrite rate, then scale up
  - Return it to all runners after one successful run
  - Resume and wait for operations to report issues

## practical_exam_core_powerautomate

### core_PowerAutomate_meta
- Category: Power Automate Incident Drill
- Format: practical_pack
- Prompt: A Power Automate flow creates approvals from a SharePoint list. During connector throttling, retries and overlapping runs started creating duplicate approvals.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Turn off the trigger, identify duplicate runs, and isolate the affected items
  - Increase trigger concurrency so pending approvals process faster
  - Remove all retries from the flow immediately

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - A connector starts returning 429 errors
  - The same approval email is sent twice after retry
  - The flow behaves differently in Dev and Prod
- Right items:
  - Use bounded retry/backoff and reduce concurrency pressure
  - Add a check so the flow confirms whether an approval already exists before sending again
  - Check connection references, environment variables, and dependencies

### stack_control
- Category: Best Power Automate execution control
- Format: single_select
- Options:
  - Use controlled execution with limited concurrency and duplicate-safe checks
  - Ask operators to manually retrigger failed runs
  - Disable run history during the incident

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Re-enable on a small pilot, confirm approvals are unique, then expand
  - Re-enable full flow once one item works
  - Resume and wait for users to report issues

## practical_exam_core_python

### core_Python_meta
- Category: Python Automation Incident Drill
- Format: practical_pack
- Prompt: A Python batch job reads records from a file and sends them to an API. During temporary failures, retries sometimes create duplicate submissions, and one input file is sometimes incomplete.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Pause the batch, identify affected record IDs, and check for duplicate submissions before replay
  - Increase thread count so backlog finishes faster
  - Catch all exceptions and let the batch continue

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - The API starts returning HTTP 429
  - The batch reads a file before the upstream copy is complete
  - A POST may already have succeeded before retry
- Right items:
  - Use bounded retries with backoff and slow down requests
  - Check that the file is complete before processing
  - Use an idempotency key or duplicate check before posting again

### stack_control
- Category: Best Python execution control
- Format: single_select
- Options:
  - Use per-record retries with backoff, clear tracking, and duplicate-safe posting
  - Add a fixed sleep before every API call
  - Restart the whole batch whenever one record fails

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Run a small monitored batch, check duplicates and errors, then scale up
  - Resume all partitions once one record succeeds
  - Turn off alerts during catch-up

## practical_exam_core_uipath

### core_UiPath_meta
- Category: UiPath Incident Drill
- Format: practical_pack
- Prompt: A UiPath bot posts invoices into an ERP. After a short ERP issue, retries caused some invoices to be posted twice.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Pause the queue, find the affected transaction references, and stop more duplicates
  - Increase retry settings in Orchestrator so the backlog clears faster
  - Let the bot continue and fix duplicate invoices later

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - Selector breaks after an ERP screen update
  - The bot times out after clicking Save, but the invoice may already be posted
  - The same invoice gets processed twice after a retry
- Right items:
  - Fix the selector using stable attributes and test before rerun
  - Check whether the invoice was already posted before retrying
  - Add a unique invoice check before posting again

### execution_control
- Category: Best UiPath execution control
- Format: single_select
- Options:
  - Use transaction-based processing with duplicate checks and controlled retries
  - Put the full queue in one Try Catch and restart the whole job on error
  - Add a delay after every activity

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Run a small test batch, confirm no duplicates, then resume slowly
  - Resume the full queue once the selector is fixed
  - Restart robots on full load immediately

## practical_exam_senior_lead_automationanywhere

### senior_lead_AutomationAnywhere_meta
- Category: Automation Anywhere Incident Drill
- Format: practical_pack
- Prompt: An Automation Anywhere bot creates daily reports and uploads them to a portal. After a password change and runner issues, some reports fail and some reruns overwrite files.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Stop scheduled runs, verify the updated credential, and isolate the affected reports
  - Hardcode the new password so reports can resume quickly
  - Add more runners before checking the failures

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - A credential is stored in a file on the runner
  - One upload fails because the network drops
  - The bot works on one runner but fails on another
- Right items:
  - Move it to Credential Vault and update the bot to use it
  - Retry only the failed report using checkpointed progress
  - Compare bot version, config, and runner setup before rerun

### execution_control
- Category: Best Automation Anywhere execution control
- Format: single_select
- Options:
  - Use checkpoints and track each report so finished work is not rerun
  - Restart the whole batch when one report fails
  - Keep going without tracking completed reports

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Run a small pilot, check report accuracy and overwrite rate, then scale up
  - Return it to all runners after one successful run
  - Resume and wait for operations to report issues

## practical_exam_senior_lead_powerautomate

### senior_lead_PowerAutomate_meta
- Category: Power Automate Incident Drill
- Format: practical_pack
- Prompt: A Power Automate flow creates approvals from a SharePoint list. During connector throttling, retries and overlapping runs started creating duplicate approvals.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Turn off the trigger, identify duplicate runs, and isolate the affected items
  - Increase trigger concurrency so pending approvals process faster
  - Remove all retries from the flow immediately

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - A connector starts returning 429 errors
  - The same approval email is sent twice after retry
  - The flow behaves differently in Dev and Prod
- Right items:
  - Use bounded retry/backoff and reduce concurrency pressure
  - Add a check so the flow confirms whether an approval already exists before sending again
  - Check connection references, environment variables, and dependencies

### stack_control
- Category: Best Power Automate execution control
- Format: single_select
- Options:
  - Use controlled execution with limited concurrency and duplicate-safe checks
  - Ask operators to manually retrigger failed runs
  - Disable run history during the incident

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Re-enable on a small pilot, confirm approvals are unique, then expand
  - Re-enable full flow once one item works
  - Resume and wait for users to report issues

## practical_exam_senior_lead_python

### senior_lead_Python_meta
- Category: Python Automation Incident Drill
- Format: practical_pack
- Prompt: A Python batch job reads records from a file and sends them to an API. During temporary failures, retries sometimes create duplicate submissions, and one input file is sometimes incomplete.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Pause the batch, identify affected record IDs, and check for duplicate submissions before replay
  - Increase thread count so backlog finishes faster
  - Catch all exceptions and let the batch continue

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - The API starts returning HTTP 429
  - The batch reads a file before the upstream copy is complete
  - A POST may already have succeeded before retry
- Right items:
  - Use bounded retries with backoff and slow down requests
  - Check that the file is complete before processing
  - Use an idempotency key or duplicate check before posting again

### stack_control
- Category: Best Python execution control
- Format: single_select
- Options:
  - Use per-record retries with backoff, clear tracking, and duplicate-safe posting
  - Add a fixed sleep before every API call
  - Restart the whole batch whenever one record fails

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Run a small monitored batch, check duplicates and errors, then scale up
  - Resume all partitions once one record succeeds
  - Turn off alerts during catch-up

## practical_exam_senior_lead_uipath

### senior_lead_UiPath_meta
- Category: UiPath Incident Drill
- Format: practical_pack
- Prompt: A UiPath bot posts invoices into an ERP. After a short ERP issue, retries caused some invoices to be posted twice.

### first_action
- Category: Best first action
- Format: single_select
- Options:
  - Pause the queue, find the affected transaction references, and stop more duplicates
  - Increase retry settings in Orchestrator so the backlog clears faster
  - Let the bot continue and fix duplicate invoices later

### failure_mapping
- Category: Map failure to safest control
- Format: matching
- Left items:
  - Selector breaks after an ERP screen update
  - The bot times out after clicking Save, but the invoice may already be posted
  - The same invoice gets processed twice after a retry
- Right items:
  - Fix the selector using stable attributes and test before rerun
  - Check whether the invoice was already posted before retrying
  - Add a unique invoice check before posting again

### execution_control
- Category: Best UiPath execution control
- Format: single_select
- Options:
  - Use transaction-based processing with duplicate checks and controlled retries
  - Put the full queue in one Try Catch and restart the whole job on error
  - Add a delay after every activity

### required_gate
- Category: Required gate before resuming prod
- Format: single_select
- Options:
  - Run a small test batch, confirm no duplicates, then resume slowly
  - Resume the full queue once the selector is fixed
  - Restart robots on full load immediately

## rcm_exam

### rcm_q1
- Category: Denials & Follow-up
- Format: single_select
- Prompt: A claim is denied for missing authorization, but the scheduler notes show authorization was approved two days before the date of service. What is the strongest first action?
- Options:
  - Rebill the claim immediately with the same authorization field because payer data is often delayed
  - Validate whether the approved authorization covered the rendered CPT, servicing location, and DOS span before appeal or corrected claim action
  - Transfer the balance to patient responsibility because the payer rejected the claim after adjudication
  - Void the claim and ask registration to create a new account with the authorization attached

### rcm_q2
- Category: Claim Quality
- Format: multi_select
- Prompt: Which signals suggest a front-end issue is likely driving downstream claim rejections? Select all that apply.
- Options:
  - The same payer rejects multiple claims for subscriber ID formatting across one registration team
  - ERA balances post correctly but secondary claims remain in suspense for COB review
  - Medical necessity denials spike only for one imaging CPT family after a payer bulletin change
  - Eligibility verifies as active, but claims deny for invalid patient demographic combinations captured at check-in
  - Claims hold because charge review has not finalized one provider's documentation

### rcm_q3
- Category: Denials & Follow-up
- Format: best_next_step
- Prompt: A payer denies a high-value outpatient surgery claim as non-covered. The contract matrix shows the procedure is covered only when billed with one of two diagnosis families. What is the best next step?
- Options:
  - Appeal immediately with the operative note because high-dollar claims should skip corrected-claim review
  - Verify whether diagnosis coding and medical necessity documentation actually support one of the covered diagnosis families before selecting rebill or appeal
  - Write off the balance to contractual adjustment because coverage denials are rarely overturned
  - Split the claim into professional and facility components so at least one side can be paid

### rcm_q4
- Category: Workqueues & Controls
- Format: matching
- Prompt: Match the RCM control to its strongest primary purpose.
- Left items:
  - Charge router edit
  - Timely filing watchlist
  - Zero-pay remittance queue
  - Credit balance review
- Right items:
  - Prevent late filing risk from aging silently past payer deadlines
  - Catch encounter issues before claim generation or release
  - Separate adjudicated claims that need underpayment, denial, or carve-out review
  - Detect situations where cash or adjustments may exceed the true account liability
  - Auto-close all self-pay accounts below a small balance threshold

### rcm_q5
- Category: Appeals & Recovery
- Format: ordering
- Prompt: Put these appeal-prep steps in the strongest order for a complex denial.
- Items:
  - Confirm the payer denial reason and filing deadline
  - Validate account facts, coding, authorization, and supporting documentation
  - Choose the correct recovery path: corrected claim, reconsideration, or formal appeal
  - Assemble evidence tied directly to the payer's stated reason
  - Submit and track the case against the payer follow-up date

### rcm_q6
- Category: Remittance Analysis
- Format: log_analysis_single_select
- Prompt: What is the strongest conclusion from this ERA pattern?
- Options:
  - The payer likely treated these claims as bundled or included in another service, so pure patient balance follow-up would be wrong
  - The payer probably misapplied the patient deductible and the balances should transfer to self-pay
  - The claims were denied for eligibility and need registration correction before rebill
  - This is a late-charge issue because allowed and paid amounts cannot both be zero on first pass

### rcm_q7
- Category: Eligibility & COB
- Format: trace_execution
- Prompt: A primary payer ERA posts, but the secondary crossover never occurs. Notes show the primary claim carried subscriber information for the patient, while the secondary policy is under the spouse. What is the most likely next outcome if the account is left untouched?
- Options:
  - The secondary payer will auto-adjudicate after a nightly eligibility refresh
  - The account will likely stall because COB data needed for secondary billing is incomplete or mismatched
  - The balance will transfer to self-pay after the next statement cycle with no revenue impact
  - The payer will reverse the primary payment because spouse policies cannot follow a primary adjudication

### rcm_q8
- Category: Claim Quality
- Format: fill_blank_constrained
- Prompt: A strong RCM workqueue should prioritize by financial risk, filing risk, and ____ clarity rather than simple account age alone.
- Options:
  - liability
  - denial
  - ownership
  - productivity

### rcm_q9
- Category: Authorization & Medical Necessity
- Format: case_triage
- Prompt: Which issue should be escalated first because delay most directly threatens collectible revenue?
- Options:
  - A low-balance self-pay statement template has outdated contact-center hours
  - A prior-authorization workqueue contains tomorrow's scheduled high-dollar cases with unresolved clinical documentation
  - A payment plan report is missing one cosmetic dashboard filter
  - A registrar requests a shorter insurance-verification note template

### rcm_q10
- Category: Denials & Follow-up
- Format: single_select
- Prompt: A payer denies for duplicate claim, but claim history shows only one submission from your system. What is the strongest first hypothesis to test?
- Options:
  - Another provider or clearinghouse path may have already submitted a materially identical claim under the same billable identifiers
  - The payer is applying the claim to a prior authorization and duplicate denials usually self-resolve
  - The patient likely has secondary coverage and the denial means the balance should cross over automatically
  - The charges were probably entered twice and should be reversed before any payer follow-up

### rcm_q11
- Category: Remittance Analysis
- Format: multi_select
- Prompt: When an underpayment is suspected, which checks matter most before escalating to payer recovery? Select all that apply.
- Options:
  - Whether the posted allowed amount matches contract terms for that payer-product and service combination
  - Whether modifiers, units, and contractual carve-outs could explain the variance
  - Whether the patient has already received a statement for the remaining balance
  - Whether coordination of benefits or prior payments changed expected liability
  - Whether the registration rep documented the copay collection conversation

### rcm_q12
- Category: Charge Capture
- Format: best_next_step
- Prompt: A provider repeatedly closes encounters without one ancillary charge that is later added after claim release. What is the best next step?
- Options:
  - Rebill corrected claims case by case and accept the delayed cash impact as operational noise
  - Add a front-end claim edit or encounter completion control so claims cannot release until the required charge relationship is resolved
  - Increase follow-up staffing so late charges are worked faster after denial
  - Move the ancillary charge to a monthly manual adjustment process outside the encounter workflow

### rcm_q13
- Category: Workqueues & Controls
- Format: matching
- Prompt: Match the workqueue signal to the most likely operational risk.
- Left items:
  - No owner and high dollar
  - Past payer filing threshold
  - Repeated zero-pay after rebill
  - Credit balance after refund request
- Right items:
  - Recovery risk is turning into write-off risk because filing rights may already be lost
  - Root-cause correction probably has not been identified and rework is repeating
  - Escalation can stall because accountability for action is unclear despite material exposure
  - Cash, adjustment, or refund sequencing may create compliance and patient-liability risk
  - The account should be moved automatically to bad debt

### rcm_q14
- Category: Appeals & Recovery
- Format: ordering
- Prompt: Put these reimbursement-recovery actions in the strongest order after a payer underpays a clean claim.
- Items:
  - Validate the variance against contract logic and claim detail
  - Confirm whether posting, COB, or prior-payment issues explain the difference
  - Select the right recovery path and collect supporting evidence
  - Submit the payer dispute or reconsideration within deadline
  - Track follow-up and resolution to final disposition

### rcm_q15
- Category: Eligibility & COB
- Format: single_select
- Prompt: Registration verified eligibility three days before service, but the claim denies for coverage terminated on the date of service. What is the strongest operational lesson?
- Options:
  - Eligibility checks are only useful on high-dollar encounters and can be skipped elsewhere
  - Coverage-sensitive workflows may need date-of-service or near-real-time revalidation, not only pre-service verification
  - The denial should be appealed first because earlier eligibility proof overrides the payer's adjudication date
  - The patient should automatically be billed because terminated coverage is always patient liability

### rcm_q16
- Category: Authorization & Medical Necessity
- Format: log_analysis_single_select
- Prompt: What is the strongest conclusion from this pre-service workqueue log?
- Options:
  - The queue is prioritizing documentation correctly because complete cases remain scheduled
  - There is likely a control gap because unresolved authorization cases are not being blocked or escalated before service
  - The real issue is that too many cases were scheduled for the same date
  - The clinical team should stop sending complete documentation until authorization is guaranteed

### rcm_q17
- Category: Claim Quality
- Format: multi_select
- Prompt: Which controls most directly reduce corrected-claim churn? Select all that apply.
- Options:
  - Pre-bill edits for high-frequency payer requirements and known documentation dependencies
  - Clear ownership for charge review, coding validation, and claim release exceptions
  - A general expectation that billers should work rebills within 30 days
  - Feedback loops that trace repeat denial patterns back to the originating workflow
  - More statement cycles so patient cash offsets delayed payer payment

### rcm_q18
- Category: Denials & Follow-up
- Format: best_next_step
- Prompt: A claim is denied for medical necessity, but coding confirms the billed CPT and diagnosis are technically valid. What is the best next step?
- Options:
  - Escalate to coding only, because medical necessity denials always mean the wrong diagnosis code was chosen
  - Review payer policy and supporting clinical documentation to determine whether the service was documented strongly enough for the payer's coverage rule
  - Write off the denial if the claim was coded correctly because payer policy is outside RCM scope
  - Send the full balance to patient responsibility because medical necessity is a non-covered service issue

### rcm_q19
- Category: Remittance Analysis
- Format: case_triage
- Prompt: Which queue should be worked first if you want the strongest near-term cash protection?
- Options:
  - A low-dollar self-pay cleanup queue with many old statement accounts
  - A zero-pay commercial remittance queue containing recently adjudicated high-balance surgical claims still inside all appeal windows
  - A patient-address cleanup queue for returned mail
  - A dashboard-reconciliation queue where reporting totals are off by less than 1%

### rcm_q20
- Category: Denials & Follow-up
- Format: single_select
- Prompt: A team keeps resubmitting denied claims with slightly different notes, but the denial rate on the same root issue is unchanged. What is the strongest interpretation?
- Options:
  - The team is doing the right thing because persistence is the main driver of payer recovery
  - The operation is likely treating follow-up as repetitive volume work instead of isolating and fixing the true denial cause
  - The payer probably needs a longer turnaround time before claim notes are recognized
  - The denials should be pushed to patient balance more quickly to reduce rebill inventory