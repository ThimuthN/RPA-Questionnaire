# Day 2: How RPA Works

Audience: Business Analysts
Organization context: Innobot
Deck subtitle: Innobot internal workshop deck for Business Analysts

This outline mirrors the generated PowerPoint and includes slide titles, takeaways, on-slide content, visual direction, and speaker notes.

## Slide 1: Day 2: How RPA Works

**Subtitle / key takeaway**
How automation solutions are structured, controlled, and supported in a real delivery environment

**Primary takeaway sentence**
RPA is not just screen clicking. It is a controlled business execution model with triggers, inputs, rules, orchestration, monitoring, and clear business accountability.

**On-slide content**

**Visual layout suggestion**
Full-bleed dark cover with layered pipeline graphic on the right, workshop focus pills below the title, and subtle radial blue and teal glow shapes.

**Speaker notes**
Open the session by positioning RPA as an operating model rather than a software trick. Set expectations that today is about how work gets structured, controlled, monitored, and recovered in delivery, with a strong focus on the BA role in making automation feasible and supportable.

## Slide 2: Session Objective and Why This Matters for BAs

**Subtitle / key takeaway**
Business Analysts help make automation feasible, testable, and governable

**Primary takeaway sentence**
A strong BA does more than identify a manual task. They help define the process truth, the rules, the exceptions, the outputs, and the validation approach that a bot can safely execute.

**On-slide content**
Main bullets:
- Understand the structure of a real automation run: trigger, setup, transactions, outputs, controls, and closure
- See how automation solutions are split into modules rather than built as one long fragile script
- Learn why exception handling, reporting, and review paths are central to automation success
- Recognize where BA inputs directly affect feasibility, UAT quality, and post-go-live stability
Supporting cards:
- Feasibility: BAs identify whether the process is stable enough, rules-based enough, and measurable enough to automate.
- Clarity: Bots need explicit inputs, decisions, variants, and output definitions. Ambiguity turns into production defects.
- Validation: The BA helps define what correct output looks like, what should be reviewed by humans, and how success is measured.

**Visual layout suggestion**
Two-column slide with a clear left objective stack and three right-side value cards using navy outlines and teal accents.

**Speaker notes**
Make the role of the BA tangible. The point is not that BAs need to code; it is that automations fail when process knowledge stays informal. Frame the BA as a control point for clarity, feasibility, and validation.

## Slide 3: Recap of Day 1

**Subtitle / key takeaway**
Yesterday focused on choosing the right process; today focuses on how that process actually runs

**Primary takeaway sentence**
The same analysis discipline from Day 1 carries directly into delivery. Weak process understanding creates weak automation design.

**On-slide content**
Main bullets:
- Good automation candidates are repetitive, rules-based, digital, and high enough in volume to justify control and support effort
- Standardization matters: too many process variants, policy gaps, or undocumented workarounds reduce automation value
- A business case is not enough by itself; process quality and exception patterns matter just as much
- The BA role starts before development by exposing hidden decisions, dependencies, and exception routes
Supporting cards:
- Keep From Day 1: Process map, business rules, handoffs, exceptions, expected outputs, and volume assumptions.
- Add Today: Runtime structure, orchestration logic, retry design, queue handling, and monitoring expectations.
- Core Shift: We move from candidate selection to controlled execution in a delivery environment.

**Visual layout suggestion**
Four recap bullets on the left with a three-card bridge to Day 2 on the right, separated by a slim vertical accent rule.

**Speaker notes**
Use this slide to connect the two days so the audience sees continuity rather than a topic reset. The message is that discovery quality directly affects how cleanly a bot can be built and operated.

## Slide 4: What Actually Happens When a Bot Runs

**Subtitle / key takeaway**
A bot run is a controlled sequence, not a single click script

**Primary takeaway sentence**
Every production bot run has an operating rhythm: start, authenticate, collect work, process transactions, handle exceptions, log results, and close cleanly.

**On-slide content**
Main bullets:
- Bots depend on expected application states, approved credentials, and known input formats
- A successful run includes control actions such as cleanup, logging, and status reporting, not only business actions
- The more transactions involved, the more important batching, state tracking, and recoverability become
- If the run structure is unclear, support and troubleshooting quickly become difficult
Flow / process steps:
- 1. Trigger or schedule starts the run
- 2. Initialize settings, credentials, and application access
- 3. Fetch or prepare work items
- 4. Process each item using defined rules
- 5. Handle system issues and business exceptions differently
- 6. Write logs, outputs, screenshots, and status updates
- 7. Close sessions, release resources, and publish run results
Callout: Presenter Warning - Bots do not think. They execute defined instructions against expected conditions.

**Visual layout suggestion**
Section-divider styling with a bold header band, center horizontal runtime flow, and a warning callout anchored at the bottom right.

**Speaker notes**
Walk the audience through the lifecycle of one run. Emphasize that runtime design includes setup and closure steps as well as transaction handling. This helps BAs see why undocumented prerequisites and exception paths create operational risk.

## Slide 5: Trigger / Input / Rules / Output Model

**Subtitle / key takeaway**
Every automation needs a clear operating contract

**Primary takeaway sentence**
If the trigger, inputs, rules, or outputs are unclear, the automation will be unstable, difficult to validate, or hard to govern.

**On-slide content**
Main bullets:
- In the claims storyline, the schedule triggers the Dispatcher, the aging report becomes input, claim status logic acts as rules, and database updates plus summary reports become outputs
- Each pillar should be documented in business language before build decisions are made
- Controls such as logging, access, and exception routing sit around this model and make it operational
Model cards:
- Trigger: What starts the run? Schedule, event, user action, queue threshold, or downstream dependency.
- Inputs: What information is required? Reports, forms, queues, credentials, reference data, and configuration.
- Rules: How does the bot decide? Business logic, exception conditions, prioritization, and field validation.
- Outputs: What must be produced? Updated systems, reports, logs, screenshots, status tags, and review lists.

**Visual layout suggestion**
Four premium vertical cards across the center with short examples beneath, plus a bottom insight strip connecting the model to the claims example.

**Speaker notes**
This is a useful slide for giving the BA a simple mental model. Encourage them to test every proposed automation by asking four questions: what starts it, what does it need, how does it decide, and what must it produce.

## Slide 6: Attended Bots

**Subtitle / key takeaway**
Attended automation helps a human complete work faster in the moment

**Primary takeaway sentence**
Attended bots are designed for front-line support, user-triggered assistance, and guided process acceleration when a person remains in the loop.

**On-slide content**
Main bullets:
- A user is present and typically triggers the automation from their workstation or within their workflow
- The bot assists with a portion of the task such as pre-filling data, searching systems, or copying structured results
- Control remains close to the user, which helps in judgment-heavy scenarios or processes with frequent handoffs
- Benefits often include reduced handling time, fewer manual rekey steps, and more consistent task execution
- BAs should identify exactly where the user starts, reviews, corrects, or confirms the automated step
Supporting cards:
- Best Fit: Desktop assistance, contact center support, guided data entry, and user-led lookups.
- Watchouts: More dependency on user behavior, desktop conditions, and clear handoff between person and bot.
- BA Focus: Map the human decision points, approval moments, and experience impact.

**Visual layout suggestion**
Human-plus-bot composition with a left-side operating definition and three right-side cards framed by teal highlights.

**Speaker notes**
Keep the explanation practical. Attended bots are not lesser or simpler; they solve a different problem. Stress that the presence of a human changes trigger design, exception handling, and validation expectations.

## Slide 7: Unattended Bots

**Subtitle / key takeaway**
Unattended automation runs in the background under controlled orchestration

**Primary takeaway sentence**
Unattended bots behave like a managed service: they start through schedules or events, process workload at scale, and report results without requiring a user to sit with them.

**On-slide content**
Main bullets:
- The run is usually started by an orchestrator, schedule, queue event, or upstream workflow rather than a desktop user
- Unattended design is suited to repetitive high-volume work where transactions can be processed consistently and monitored centrally
- The control model becomes critical: credentials, logging, queue state, retries, alerts, and reporting all need to be explicit
- Our Dispatcher, Availity Performer, and ECW Performer storyline is primarily an unattended pattern
- BAs should focus on work intake, business rules, failure routing, and measurable outputs instead of user experience alone
Supporting cards:
- Best Fit: Batch work, back-office case handling, queue processing, and scheduled data movement.
- Strength: Higher throughput, central visibility, consistent execution, and better support for transaction tracking.
- BA Focus: Clarify inputs, transaction boundaries, expected outputs, and exception recovery paths.

**Visual layout suggestion**
Server-orchestrator visual treatment with bold navy cards and a horizontal control ribbon that suggests scheduled background processing.

**Speaker notes**
Position unattended automation as the model most people mean when they picture a bot operation at scale. Then connect it to the importance of orchestration, queue state, and post-run visibility.

## Slide 8: Attended vs Unattended Comparison

**Subtitle / key takeaway**
The right choice depends on the business operating model, not just the tool

**Primary takeaway sentence**
Choosing the wrong mode creates expectation problems. The decision should reflect how work starts, who owns control, and how outcomes are monitored.

**On-slide content**
Comparison table:
- Typical trigger | User action on the desktop | Schedule, event, queue, or orchestrator command
- User presence | A user stays involved during execution | No constant user presence required
- Best for | Guided assistance and judgment-heavy support | High-volume repetitive processing
- Control style | Local and user-proximate | Centralized with orchestration and monitoring
- Exception route | Often surfaced immediately to the user | Routed through logs, queues, alerts, or review worklists
- Key BA question | Where does the user interact or decide? | What starts work and how is each transaction controlled?
Callout: Decision Lens - This is an operating-model choice before it is a technical choice.

**Visual layout suggestion**
Modern three-column comparison table with strong headers, alternating row shading, and a highlighted decision lens callout below.

**Speaker notes**
Use this slide to make the distinction operational. Many stakeholders confuse attended and unattended because both can use similar tools. The real difference is who owns the moment of control and how the work is governed.

## Slide 9: What Orchestration Means

**Subtitle / key takeaway**
Orchestration is the control layer that turns separate bots into a reliable service

**Primary takeaway sentence**
Orchestration is about control, coordination, scheduling, workload handling, visibility, and recovery across the automation landscape.

**On-slide content**
Main bullets:
- Schedules and triggers decide when a process should start and under what conditions
- Queues and workload controls decide which item is processed next and by which robot or workflow
- Credential and configuration management keep environments secure and consistent
- Logs, screenshots, alerts, and dashboards provide operational visibility during and after the run
- Recovery actions such as retry, escalation, or re-queueing keep failures controlled instead of silent
Supporting cards:
- Schedule: Run at the right time and in the right sequence.
- Queue: Control transaction flow, prioritization, and ownership.
- Visibility: Track robot health, outcomes, and bottlenecks.
- Recovery: Retry, escalate, or route for human review.
Callout: Critical Reminder - Exception handling is not optional. It is part of orchestration design.

**Visual layout suggestion**
Central orchestration hub with four surrounding control cards and a bottom insight strip tying orchestration to supportability.

**Speaker notes**
This is where BAs often broaden their understanding of RPA. Explain that orchestration is what makes multiple workflows manageable at scale and visible after deployment. Without it, the solution is difficult to support and difficult to trust.

## Slide 10: How a Real Automation Pipeline Works at Innobot

**Subtitle / key takeaway**
The solution is modular, data-driven, and controlled end to end

**Primary takeaway sentence**
Instead of one long bot, the work is separated into components with clear responsibilities, shared data, and monitored handoffs.

**On-slide content**
Main bullets:
- The database or queue becomes the controlled handoff layer between components rather than relying on fragile in-memory passing
- Each module can be tested, monitored, and maintained with greater clarity than a monolithic script
- The architecture supports scale, recoverability, and clearer responsibility boundaries
- This is a strong example of RPA as an operating model, not just automation of clicks
Pipeline stages:
- Dispatcher: Collects the ECW aging report, structures the workload, and loads claims into the queue database.
- Availity Performer: Processes one claim at a time, captures claim status details, updates the database, and applies retry rules.
- ECW Performer: Reads processed claims, groups by provider, posts notes in ECW, finalizes records, and produces summary reporting.

**Visual layout suggestion**
Wide end-to-end architecture flow with three prominent stage blocks, connector arrows, and side badges for logging, review, and reporting.

**Speaker notes**
Use the example storyline to ground the rest of the workshop. From this point forward, keep tying concepts back to the three-part solution so the audience sees how theory becomes a delivery pattern.

## Slide 11: Dispatcher Example

**Subtitle / key takeaway**
The Dispatcher prepares and structures the workload before transaction processing begins

**Primary takeaway sentence**
The Dispatcher acts as a central controller that invokes each pipeline step in sequence with structured error handling and cleanup.

**On-slide content**
Main bullets:
- The Dispatcher is responsible for work intake and preparation, not for every later business action in the pipeline
- Config-driven values such as report filters, download locations, and archive rules improve maintainability
- Structured cleanup prevents locked sessions, orphaned files, and confusing rerun conditions
- A good BA helps define which filters, reference fields, and archive outputs are mandatory
Flow / process steps:
- 1. Log into ECW
- 2. Navigate to the aging report
- 3. Apply report filters
- 4. Download the Excel file
- 5. Transform rows into a SQLite database or queue
- 6. Archive the source file for traceability
Supporting cards:
- Design Goal: Prepare a clean, traceable workload for downstream performers.
- Control Point: Fail early if the report is wrong, missing, or structurally incomplete.
- BA Lens: Verify report logic, field meaning, and handoff completeness before build.

**Visual layout suggestion**
Left-to-right dispatcher sequence with three compact principle cards stacked on the right and a clear archive callout at the end.

**Speaker notes**
Emphasize that the Dispatcher is more than a download script. It is a control entry point for the whole pipeline. This is where initial data quality, report logic, and traceability become visible.

## Slide 12: Availity Performer Example

**Subtitle / key takeaway**
A transaction-based performer uses a repeatable loop instead of a fragile batch sequence

**Primary takeaway sentence**
The Availity Performer follows REFramework-style thinking: initialize, get one transaction, process it, retry if the issue is technical, then continue.

**On-slide content**
Main bullets:
- Transaction-based processing reduces the blast radius when one claim fails because the whole batch does not have to collapse
- System retries are useful for unstable application behavior, temporary load times, and intermittent technical issues
- Business exceptions should usually be tagged, logged, and routed rather than blindly retried
- The BA contribution is critical in defining what status outcomes are valid, ambiguous, or review-worthy
Flow / process steps:
- 1. Initialize applications, settings, and credentials
- 2. Get next claim from the queue or database
- 3. Log into Availity and enter the claim search inputs
- 4. Extract claim status details and write updates back to the database
- 5. Retry on system issues when appropriate
- 6. Classify business exceptions separately and continue with the next claim
Callout: Why This Matters - REFramework-style processing improves resilience, recoverability, and supportability.

**Visual layout suggestion**
Circular or looped transaction diagram across the center with retry and exception branches clearly separated, plus an anchored rationale callout.

**Speaker notes**
Keep the REFramework explanation high level and BA friendly. The point is not the framework name itself; the point is the transaction mindset. One work item at a time makes failures visible, recoverable, and easier to govern.

## Slide 13: ECW Performer Example

**Subtitle / key takeaway**
The ECW Performer coordinates provider sessions and delegated workflow scripts

**Primary takeaway sentence**
This component acts as an orchestration layer: it reads processed claims, groups them intelligently, manages provider context, and finalizes updates with reporting.

**On-slide content**
Main bullets:
- Grouping by provider reduces repeated logins and respects the business context in which updates must occur
- Delegated scripts keep complex UI actions modular and easier to maintain when the application changes
- Human review is still important for summary outputs, edge cases, and final assurance
- The BA should confirm what must be written back, what evidence is required, and how finalization is defined
Flow / process steps:
- 1. Read processed claims from the database
- 2. Group claims by provider NPI
- 3. Log into ECW in the correct provider context
- 4. Delegate note-entry steps into the claim record
- 5. Mark records finalized once the update is confirmed
- 6. Generate summary output reports for review
Supporting cards:
- Session Strategy: Use provider grouping to reduce friction and keep context consistent.
- Maintainability: Delegate repeatable UI actions into smaller reusable workflow components.
- Reporting: Publish reviewable outcomes, not only silent system updates.

**Visual layout suggestion**
Grouped workflow diagram that visually clusters claims by provider before a staged ECW update lane and a reporting finish block.

**Speaker notes**
This slide is a good place to reinforce modular design. The ECW Performer does not have to do everything itself; it can coordinate smaller workflows. That is how solutions remain maintainable as application behavior evolves.

## Slide 14: High-Level RPA Lifecycle

**Subtitle / key takeaway**
Automation delivery is a lifecycle with business checkpoints, not just build and run

**Primary takeaway sentence**
Strong RPA delivery moves through identifiable phases, each with business decisions, quality controls, and BA touchpoints.

**On-slide content**
Main bullets:
- Business involvement does not stop when build begins
- Success criteria should be visible before go-live, not invented after deployment
- Monitoring and reporting are part of delivery, not a separate optional step
Lifecycle timeline:
- Identify: Spot the process opportunity and desired business outcome.
- Assess: Check feasibility, stability, rules, inputs, and exception volume.
- Design: Define workflow structure, controls, data handoffs, and success criteria.
- Build: Develop modular components with configuration, logging, and recovery.
- Test: Validate paths, outputs, exception handling, and user acceptance.
- Deploy: Move into controlled operation with schedules, credentials, and support setup.
- Operate: Monitor, review, tune, and improve based on performance and exception trends.

**Visual layout suggestion**
Consulting-style horizontal lifecycle timeline with seven phases, slim connectors, and a bottom band for delivery discipline points.

**Speaker notes**
Use the lifecycle to show that RPA is an ongoing service model. The deployment moment is important, but it is not the finish line. Ongoing monitoring, exception trends, and continuous improvement remain part of the operating model.

## Slide 15: BA Role Across the Lifecycle

**Subtitle / key takeaway**
The BA anchors process truth, rule clarity, validation criteria, and operational readiness

**Primary takeaway sentence**
Automation quality improves when the BA stays engaged from assessment through go-live review rather than handing off early and disappearing.

**On-slide content**
Main bullets:
- During identification and assessment, the BA clarifies goals, rules, volumes, variants, and business dependencies
- During design, the BA helps define triggers, inputs, output expectations, and exception categories in business language
- During build and testing, the BA supports scenario coverage, UAT packs, acceptance criteria, and output review logic
- During deployment and operation, the BA helps review outcomes, interpret business exceptions, and refine success measures
Supporting cards:
- Discovery: Separate true business rules from undocumented habits and shortcuts.
- Documentation: Create process maps, rule sets, exception catalogues, and output definitions.
- Validation: Define expected outcomes, review rules, and test evidence.
- Support: Help interpret edge cases, review reports, and refine the process after go-live.
Callout: Risk To Avoid - If process knowledge stays informal, automation quality suffers.

**Visual layout suggestion**
Lifecycle role map with a top strip for project phases and four strong BA contribution cards beneath it, ending in a risk callout.

**Speaker notes**
This slide is central for the audience. Reinforce that the BA role is not administrative. It materially affects design quality, exception treatment, and whether the delivered automation is trusted by the business.

## Slide 16: Business Exceptions vs System Exceptions

**Subtitle / key takeaway**
These are different failure types and they must be treated differently on purpose

**Primary takeaway sentence**
A strong automation distinguishes between a business condition that needs routing and a technical condition that may be recoverable through retry or support action.

**On-slide content**
Main bullets:
- Blind retry is useful only for some technical issues and usually makes no sense for genuine business exceptions
- Good exception design improves reporting quality because the business can see why work did not complete
- BAs help define what counts as a true business exception and what evidence should accompany it
Exception comparison:
- Business Exceptions:
  - The application worked, but the case itself failed a business rule or reached an edge condition
  - Examples: missing claim data, invalid status combination, no matching record, claim requires human judgment
  - Typical treatment: tag clearly, log context, move to review queue, include in reporting, and continue with the next item
- System Exceptions:
  - The process failed because of a technical problem rather than a business decision
  - Examples: application timeout, selector failure, login issue, download interruption, database lock
  - Typical treatment: retry when sensible, capture screenshots and logs, escalate if repeated, preserve recoverability
Callout: Critical Reminder - Exception handling is not optional.

**Visual layout suggestion**
High-contrast side-by-side exception panels with example chips and treatment paths, plus a strong warning banner below.

**Speaker notes**
Take time here because exception logic is one of the most important BA contributions. Stakeholders often say 'handle errors' as though it were one thing. Explain that business and system exceptions serve different control outcomes and should be reported differently.

## Slide 17: Why Process Stability Matters Before Automation

**Subtitle / key takeaway**
A weak or inconsistent process should be fixed before it is automated

**Primary takeaway sentence**
Automation amplifies the quality of the underlying process. If the process is unstable, the bot becomes brittle, noisy, and expensive to support.

**On-slide content**
Main bullets:
- Frequent policy changes, undocumented variants, inconsistent user workarounds, and unclear ownership are signs that the process is not automation-ready
- Poor input quality, missing reference data, or uncertain completion criteria lead to avoidable defects and repeated exception handling
- Stabilizing the process first often creates more value than rushing into development
- Not every manual task is a good automation candidate, especially when judgment, ambiguity, or constant change dominate the work
Diagnostic columns:
- Warning Signs:
  - Different teams perform the same step in different ways
  - The business cannot agree on the correct output
  - Exception volume is high and poorly understood
  - Source reports or inputs change frequently
- Readiness Signals:
  - Rules are explicit and agreed
  - Inputs are stable and accessible
  - Outputs are measurable and reviewable
  - Exceptions have known owners and routes
Callout: Do Not Automate Chaos - Stabilize first, then automate with confidence.

**Visual layout suggestion**
Balanced two-column readiness diagnostic with a prominent warning callout and subtle diagonal accent treatment.

**Speaker notes**
This is a slide to make the BA feel empowered, not blocked. The message is not 'say no'; it is 'protect value by being honest about process readiness.' That honesty improves delivery outcomes and trust.

## Slide 18: Brief Tools Overview

**Subtitle / key takeaway**
Tools enable automation, but architecture, controls, and operating discipline make it succeed

**Primary takeaway sentence**
A delivery solution typically combines development tools, runtime robots, orchestration, applications, data stores, and reporting rather than one magic platform screen.

**On-slide content**
Main bullets:
- The tool stack supports the operating model, but it does not replace good process analysis or good exception design
- Config-driven design, modular workflows, logging, and output reporting are more important than flashy demos
- For BAs, the useful question is not 'which button in the tool does this' but 'how will this be controlled and validated'
Supporting cards:
- Studio / Build Layer: Where workflows, reusable components, and configuration patterns are created and maintained.
- Robot / Runtime Layer: Where attended or unattended processes actually execute against applications and data.
- Orchestration Layer: Where schedules, queues, credentials, assets, monitoring, and alerts are controlled.
- Business Systems: Applications such as ECW, Availity, Excel, databases, and email that the automation interacts with.
- Reporting Layer: Dashboards, output files, logs, screenshots, and review worklists used after deployment.

**Visual layout suggestion**
Layered stack diagram with five cards arranged like an architecture pyramid, using muted slate surfaces and bright blue highlight lines.

**Speaker notes**
Keep this vendor-neutral and pragmatic. The purpose is to show that tools are only one part of the solution. A mature delivery approach combines platform capability with strong design and governance habits.

## Slide 19: Interactive Workshop Activity

**Subtitle / key takeaway**
Use the claims pipeline to practice BA thinking before development begins

**Primary takeaway sentence**
The goal is to translate a process idea into a controlled automation design by identifying triggers, inputs, rules, exceptions, and review outputs.

**On-slide content**
Main bullets:
- Work in small groups and use the Dispatcher, Availity Performer, and ECW Performer storyline as your base case
- Identify the trigger, key inputs, major business rules, expected outputs, and the top five exception scenarios
- Decide which exceptions should retry, which should route to human review, and what evidence should appear in reporting
- Prepare a short recommendation on whether the process is ready as-is or needs stabilization first
Supporting cards:
- Deliverable 1: A simple trigger / input / rules / output map for the end-to-end process.
- Deliverable 2: A business exception list and a system exception list with treatment paths.
- Deliverable 3: Two BA validation checks you would insist on before UAT sign-off.
Callout: Facilitator Prompt - If the process changed every week, what would you redesign before automating?

**Visual layout suggestion**
Large workshop brief card on the left with three deliverable cards on the right and a facilitator prompt banner along the bottom.

**Speaker notes**
Give the group enough specificity to work quickly. This exercise should force them to separate business exceptions from system exceptions and to think about outputs and review evidence, not only process steps.

## Slide 20: Key Takeaways and Closing

**Subtitle / key takeaway**
Good automation is structured, governed, exception-aware, and business-owned

**Primary takeaway sentence**
The best automation solutions are modular, maintainable, scalable, measurable, and designed for recovery instead of false perfection.

**On-slide content**
Supporting cards:
- RPA Is Structured: Think trigger, inputs, rules, outputs, controls, and cleanup.
- Orchestration Matters: Scheduling, queue control, visibility, and recovery define operational quality.
- Exceptions Matter: Business exceptions and system exceptions require different treatment paths.
- Modularity Wins: Separate Dispatcher and performers improve maintainability and scale.
- Process First: Do not automate chaos or unstable business logic.
- BA Impact Is Real: Feasibility, clarity, validation, and output review all depend on strong BA engagement.

**Visual layout suggestion**
Premium closing slide with a dark background, six structured takeaway cards, and a final bottom banner question for reflection.

**Speaker notes**
Close by reinforcing confidence, not complexity. The BA does not need to become a developer to add major value. Their strength is making the process explicit, testable, governable, and reviewable before the automation goes live.

