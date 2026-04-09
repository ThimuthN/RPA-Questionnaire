# Question Simplification Review

Generated: 2026-04-07

Related extracts:
- [question_inventory_2026-04-07.json](./question_inventory_2026-04-07.json)
- [question_inventory_2026-04-07.md](./question_inventory_2026-04-07.md)
- [question_bank_metrics_2026-04-07.json](./question_bank_metrics_2026-04-07.json)

## Objective

The assessment should test job judgment, technical thinking, and applied reasoning.
It should not accidentally test:

- how quickly a candidate decodes dense English
- how well a candidate handles stacked qualifiers and abstract wording
- how well a candidate survives several option-heavy questions in a row

## End Result

The clean target state for this question bank should be:

- most screening items use `single_select`
- `multi_select` is used sparingly, not as a default difficulty booster
- no screening `multi_select` requires 4 correct answers
- prompts test one decision, not a checklist of controls
- answer options use parallel grammar and comparable length
- technical terms remain only when they measure role knowledge directly
- unnecessary words like "strongest", "safest", "primary", and "best next" are used carefully, not stacked repeatedly
- associate-level papers avoid senior-architecture phrasing unless the role truly requires it
- matching and ordering are used only when sequence or pairing is the real skill being tested

## Review Standard

Use these rules when rewriting:

1. Keep the concept. Remove the extra prose.
2. Use one idea per sentence when possible.
3. Avoid two or more hidden decisions inside one prompt.
4. Keep options short enough to compare without rereading four times.
5. If jargon is required, prefer the most common industry word and avoid synonym stacking.
6. If the candidate can fail because two options sound "almost right", the wording is probably too clever.
7. One-point questions should not require reading like a paragraph-based exam unless the format truly demands it.

## Bank Verdicts

### Core Bank JSON
Source: [question-bank.json](../src/lib/data/question-bank.json)

Current shape:
- 120 items
- average prompt length is moderate, not extreme
- format mix is broad and mostly usable for screening
- wording quality is inconsistent because this is a legacy-style bank

What is good:
- generally more direct than `Core 2.0`
- more practical for baseline screening
- many items already test one decision only

What is weak:
- some options still carry embedded answer letters like `A.` and `B.` as content
- some matching and ordering items are structurally clunky
- some prompts sound exam-like instead of operational
- terminology is inconsistent across levels

Recommendation:
- keep this bank active
- simplify gradually
- prioritize consistency and plain wording over conceptual redesign

### General Capability Assessment
Source: [questions.ts](../src/features/general-capability/questions.ts)

Current shape:
- 15 items
- strongest general screening bank in the repo
- mostly fair, readable, and role-agnostic

What is good:
- concepts are relevant and transferable
- most items are short enough
- the bank is already close to a strong screening style

What is weak:
- a few `multi_select` items still ask for 3 correct answers
- some prompts use "strongest" or "weakest" framing where a more direct prompt would be clearer
- matching is slightly too long for a universal screener

Recommendation:
- keep most items
- tighten a small set
- do not rewrite this bank broadly

Priority items to tighten:
- `gca_q3`
- `gca_q8`
- `gca_q11`
- `gca_q14`
- `gca_q15`

### Business Analysis Assessment
Source: [questions.ts](../src/features/business-analysis/questions.ts)

Current shape:
- 12 items
- conceptually solid
- more jargon-heavy than necessary for Associate-level screening

What is good:
- the domain signal is real
- many questions measure requirement quality, ownership, mapping, and scope correctly

What is weak:
- phrases like `source of truth`, `acceptance criterion`, `downstream outputs`, and `change control` are valid, but the bank uses them densely
- a few prompts ask for too much BA maturity in one item
- `multi_select`, `matching`, and `ordering` increase reading load more than they need to

Recommendation:
- keep the domain
- simplify the language
- convert checklist-style items into sharper single-decision items where possible

Priority items to tighten:
- `ba_q2`
- `ba_q4`
- `ba_q5`
- `ba_q11`
- `ba_q12`

### Core 2.0
Source: [questions.ts](../src/features/core2/questions.ts)

Current shape:
- 16 items per stack variant
- highest density of technical jargon
- highest clustering of difficult formats
- the main source of candidate readability complaints

What is good:
- the underlying concepts are strong
- the bank does test reliability judgment and mature automation thinking

What is weak:
- too many abstract controls and architecture terms in one section
- too many prompts ask candidates to process multiple recovery ideas at once
- `multi_select`, `matching`, `ordering`, log analysis, and stack-specific items are clustered too tightly
- several items sound like senior engineering review prompts, not screening prompts

Recommendation:
- highest rewrite priority in the repo
- keep the intent, simplify the form
- reduce abstract language and checklist-style questions first

Replace first:
- `core2_q3`
- `core2_q10`
- `core2_python_q1`

Tighten next:
- `core2_q2`
- `core2_q4`
- `core2_q5`
- `core2_q12`
- `core2_q13`

Keep mostly as-is:
- `core2_q1`
- `core2_q6`
- `core2_q8`
- `core2_q11`
- `core2_q14`
- `core2_python_q2`

### Applied Logic & Reasoning
Source: [packs.ts](../src/features/logic-reasoning/packs.ts)

Current shape:
- 10 subtasks inside one logic pack
- deterministic and fair in concept
- not jargon-heavy, but some items are too packed with conditions

What is good:
- objective answerability
- low domain dependency
- good fit for reasoning measurement

What is weak:
- several items ask candidates to hold too many rules in working memory
- some prompts feel like puzzle density rather than reasoning quality
- the wording is not overly technical, but still heavier than necessary

Recommendation:
- keep the bank
- simplify packed rule wording
- reduce unnecessary condition stacking

Priority items to tighten:
- `logic_q3_deployment_steps`
- `logic_q4_processing_speed`
- `logic_q8_task_assignment`
- `logic_q10_guaranteed_approval`

### Practical Packs
Source: [packs.ts](../src/features/practical/packs.ts)

Current shape:
- short scenario packs by stack
- direct operational language
- generally the cleanest specialized bank in the repo

What is good:
- short prompts
- concrete failure/control mapping
- less English-heavy than other banks

What is weak:
- some labels could be simplified further
- a few options still sound slightly formal

Recommendation:
- low priority for rewrite
- keep mostly as-is

### RCM Assessment
Source: [questions.ts](../src/features/rcm/questions.ts)

Current shape:
- 20 items
- highest specialist jargon density in the repo
- appropriate only if the role truly needs RCM domain knowledge

What is good:
- domain specificity is real
- measures meaningful RCM judgment

What is weak:
- many prompts rely on payer, denial, remittance, and workflow terms in the same item
- several options are too long and too similar
- this can easily become an English-and-jargon decoding exercise for otherwise strong candidates

Recommendation:
- keep only for truly RCM-aligned roles
- simplify aggressively for Associate-level use
- shorten options before changing concepts

Priority items to tighten:
- `rcm_q1`
- `rcm_q2`
- `rcm_q4`
- `rcm_q6`
- `rcm_q11`
- `rcm_q13`
- `rcm_q18`

## First Rewrite Queue

Highest ROI sequence:

1. `core2_q3`
2. `core2_q10`
3. `core2_python_q1`
4. `gca_q3`
5. `gca_q14`
6. `ba_q2`
7. `ba_q11`
8. `logic_q3_deployment_steps`
9. `logic_q8_task_assignment`
10. `rcm_q2`

## Practical Rewrite Constraints

When we start replacing items, follow this:

- replace one question at a time
- preserve format unless the format itself is the problem
- prefer converting overloaded `multi_select` to `single_select`
- keep scoring simple for screening banks
- do not rewrite multiple banks in one batch
- after each rewrite batch, recheck for duplicated concepts or repeated answer logic

## End-State Recommendation By Bank

- `core_bank_json`: simplify and normalize over time, not a full rewrite
- `general_capability_exam`: minor cleanup only
- `business_analysis_exam`: simplify language, keep domain
- `core_2_exam_*`: major wording cleanup priority
- `applied_logic_exam`: tighten packed items, keep structure
- `practical_exam_*`: mostly keep
- `rcm_exam`: simplify aggressively and use only where domain fit is explicit

## Bottom Line

The repo does not have an "all questions are bad" problem.
It has a concentration problem:

- `Core 2.0` is too dense
- `RCM` is too jargon-heavy
- `BA` is moderately too formal
- `GCA` is mostly fine
- `Practical` is mostly fine
- `Logic` is fair but should be lighter in a few places

That is the right starting point for replacements.
