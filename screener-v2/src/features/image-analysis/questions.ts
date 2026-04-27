import type { ExamQuestion, PromptBlock } from "@/lib/assessment-engine/types";

const diagramPromptBlocksByQuestionId: Record<string, PromptBlock[]> = {
  ba_iq_01: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q01_dot_pattern.png",
      alt: "Dot pattern diagram for question 1.",
      caption: "Scanned diagram for question 01."
    }
  ],
  ba_iq_02: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q02_stick_squares.png",
      alt: "Stick and squares diagram for question 2.",
      caption: "Scanned diagram for question 02."
    }
  ],
  ba_iq_05: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q05_odd_diagram.png",
      alt: "Odd diagram pattern for question 5.",
      caption: "Scanned diagram for question 05."
    }
  ],
  ba_iq_06: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q06_die_rotation.png",
      alt: "Die rotation diagram for question 6.",
      caption: "Scanned diagram for question 06."
    }
  ],
  ba_iq_07: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q07_circle_odd_one_out.png",
      alt: "Circle odd-one-out diagram for question 7.",
      caption: "Scanned diagram for question 07."
    }
  ],
  ba_iq_09: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q09_venn_relationship.png",
      alt: "Venn relationship diagram for question 9.",
      caption: "Scanned diagram for question 09."
    }
  ],
  ba_iq_10: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q10_pattern_completion.png",
      alt: "Pattern completion diagram for question 10.",
      caption: "Scanned diagram for question 10."
    }
  ],
  ba_iq_24: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q24_building_views.png",
      alt: "Building views diagram for question 24.",
      caption: "Scanned diagram for question 24."
    }
  ],
  ba_iq_25: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q25_visual_analogy.png",
      alt: "Visual analogy diagram for question 25.",
      caption: "Scanned diagram for question 25."
    }
  ],
  ba_iq_26: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q26_quadrant_pattern.png",
      alt: "Quadrant pattern diagram for question 26.",
      caption: "Scanned diagram for question 26."
    }
  ],
  ba_iq_27: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q27_shape_prompt.png",
      alt: "Shape prompt diagram for question 27.",
      caption: "Scanned prompt diagram for question 27."
    },
    {
      type: "image",
      src: "/addon-images/ba-iq/q27_answer_options.png",
      alt: "Answer option diagram for question 27.",
      caption: "Scanned answer option graphic for question 27."
    }
  ],
  ba_iq_28: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q28_shape_analogy.png",
      alt: "Shape analogy diagram for question 28.",
      caption: "Scanned diagram for question 28."
    }
  ],
  ba_iq_29: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q29_cube_net.png",
      alt: "Cube net diagram for question 29.",
      caption: "Scanned diagram for question 29."
    }
  ],
  ba_iq_30: [
    {
      type: "image",
      src: "/addon-images/ba-iq/q30_right_angles.png",
      alt: "Right angles diagram for question 30.",
      caption: "Scanned diagram for question 30."
    }
  ]
};

function makeQuestion(
  id: string,
  prompt: string,
  correctAnswer: string,
  options: string[],
  explanation: string,
  rationale: string,
  difficulty: 2 | 3 = 2
): ExamQuestion {
  return {
    id,
    roleLevelMin: "Associate",
    roleLevelMax: null,
    techStack: "General",
    category: "Business analysis",
    difficulty,
    format: "single_select",
    points: 1,
    scoringMethod: "all_or_nothing",
    prompt,
    promptBlocks: diagramPromptBlocksByQuestionId[id],
    options,
    correctAnswer: [correctAnswer],
    explanation,
    rationale
  };
}

export function buildImageAnalysisQuestions(): ExamQuestion[] {
  return [
    makeQuestion(
      "ba_iq_01",
      "Which visual element in the screenshot most clearly indicates the process is not ready for deployment?",
      "The red warning icon on the final step",
      [
        "The red warning icon on the final step",
        "The green status bar",
        "The left-hand navigation",
        "The title of the workflow panel"
      ],
      "The red warning icon is a direct signal that the final step requires attention before the workflow is safe.",
      "The warning icon is the clearest visual signal of an immediate issue in the workflow."
    ),
    makeQuestion(
      "ba_iq_02",
      "What is the best first action after seeing the warning icon on the final step?",
      "Investigate the warning before proceeding",
      [
        "Investigate the warning before proceeding",
        "Deploy the workflow immediately",
        "Remove the warning icon and try again",
        "Ignore it because the workflow looks complete"
      ],
      "The safest next step is to investigate the warning before allowing the workflow to advance.",
      "A warning should be assessed first rather than treated as a cosmetic issue."
    ),
    makeQuestion(
      "ba_iq_03",
      "Which of these is the strongest business reason to pause the workflow?",
      "The final step is marked with a failure warning",
      [
        "The final step is marked with a failure warning",
        "The workflow has three visible steps",
        "The screenshot uses a blue accent color",
        "The task labels are not visible"
      ],
      "A failure warning is a direct signal that the workflow may not meet business requirements.",
      "Business analysis prioritizes preventing failure over cosmetic or aesthetic signals."
    ),
    makeQuestion(
      "ba_iq_04",
      "The screenshot shows a red warning indicator. What type of issue does this most likely represent?",
      "Validation or configuration failure",
      [
        "Validation or configuration failure",
        "Positive completion",
        "User training need",
        "Design preference"
      ],
      "A red warning usually points to a validation or configuration failure that must be fixed.",
      "Operational and risk issues are most consistent with a red warning indicator."
    ),
    makeQuestion(
      "ba_iq_05",
      "If the automation is built on this workflow, what is the most important thing to confirm before release?",
      "That the warning condition has been resolved",
      [
        "That the warning condition has been resolved",
        "That the screen uses consistent font sizes",
        "That the left navigation is visible",
        "That the header color is purple"
      ],
      "Resolving the warning is the most important business requirement before release.",
      "Visual polish is secondary to fixing an actual warning condition."
    ),
    makeQuestion(
      "ba_iq_06",
      "Which narrative best describes the likely state of the workflow?",
      "The workflow appears built but blocked by a final-step validation warning",
      [
        "The workflow appears built but blocked by a final-step validation warning",
        "The workflow is complete and ready for deployment",
        "The workflow is missing every step",
        "The workflow has no visible controls"
      ],
      "The screenshot shows a completed workflow with a warning blocking the final step.",
      "The most likely state is a near-complete workflow prevented from progressing by a warning."
    ),
    makeQuestion(
      "ba_iq_07",
      "What is the most useful assumption to make about the red warning icon?",
      "It indicates a condition that requires correction before execution",
      [
        "It indicates a condition that requires correction before execution",
        "It is decorative and can be ignored",
        "It means the workflow is finished successfully",
        "It only affects the user interface"
      ],
      "Warnings are not decorative; they indicate conditions that should be corrected.",
      "Business analysts treat warnings as signals of real process risk, not cosmetic issues."
    ),
    makeQuestion(
      "ba_iq_08",
      "How should the team treat the screenshot when building test coverage for this workflow?",
      "As a risk scenario that must be validated with the warning condition",
      [
        "As a risk scenario that must be validated with the warning condition",
        "As an example of a finished workflow to deploy immediately",
        "As a purely design-focused review",
        "As an unrelated asset"
      ],
      "This workflow screenshot should be treated as a risk scenario because of the warning condition.",
      "Testing should verify warning handling and remediation, not just visual layout."
    ),
    makeQuestion(
      "ba_iq_09",
      "Which statement best matches the likely business impact of the warning?",
      "It could stop the process from delivering expected outcomes",
      [
        "It could stop the process from delivering expected outcomes",
        "It improves the user experience",
        "It shows the workflow is complete",
        "It is a low-priority design detail"
      ],
      "A warning on a final step can prevent the process from achieving its intended outcome.",
      "Business impact is highest when warnings block completion."
    ),
    makeQuestion(
      "ba_iq_10",
      "Which decision is most aligned with a strong BA review?",
      "Reject the workflow until the warning is explained and fixed",
      [
        "Reject the workflow until the warning is explained and fixed",
        "Approve the workflow because the screenshot looks nice",
        "Ignore the warning and move on",
        "Assume the warning is a false positive"
      ],
      "A strong BA review rejects the workflow until the warning is properly addressed.",
      "Due diligence requires understanding and fixing warnings before approval."
    ),
    makeQuestion(
      "ba_iq_11",
      "When you see a final-step warning, which stakeholder should you consult first?",
      "The process owner or domain expert",
      [
        "The process owner or domain expert",
        "The marketing team",
        "The color designer",
        "The vendor logo provider"
      ],
      "Consulting the process owner or domain expert is the best first step for business context.",
      "The domain expert can explain whether the warning is valid and what needs fixing."
    ),
    makeQuestion(
      "ba_iq_12",
      "What is the clearest reason to keep the workflow draft rather than deleting it?",
      "It surfaces a risk condition that can be analyzed and corrected",
      [
        "It surfaces a risk condition that can be analyzed and corrected",
        "It looks colorful enough to keep",
        "It has more than one step",
        "It uses a red icon"
      ],
      "The draft is valuable because it reveals a risk condition rather than being an incomplete design."
      ,
      "Risk signals are useful for analysis; they should be resolved, not discarded."
    ),
    makeQuestion(
      "ba_iq_13",
      "Which would be the best business requirement to add based on this screenshot?",
      "Verify final-step validation rules before deployment",
      [
        "Verify final-step validation rules before deployment",
        "Ensure all colors are purple",
        "Make the warning icon larger",
        "Hide the workflow panel"
      ],
      "A real business requirement is to verify validation rules, not cosmetic changes.",
      "This screenshot's key issue is validation, so the requirement should reflect that."
    ),
    makeQuestion(
      "ba_iq_14",
      "What does the screenshot most likely fail to show clearly?",
      "The cause of the final warning",
      [
        "The cause of the final warning",
        "The number of steps",
        "The overall screen width",
        "The color of the header"
      ],
      "The screenshot shows the warning but not its cause, which is the important missing detail.",
      "BA work focuses on clarifying root cause, not just noticing the warning."
    ),
    makeQuestion(
      "ba_iq_15",
      "Which improvement would most increase the BA value of this screenshot?",
      "Add a short note explaining the warning condition",
      [
        "Add a short note explaining the warning condition",
        "Change the icon to blue",
        "Add more decorative graphics",
        "Remove the text labels"
      ],
      "A note explaining the warning would make it easier to understand the risk."
      ,
      "Clarity on why the warning exists is more valuable than extra decoration."
    ),
    makeQuestion(
      "ba_iq_16",
      "Which term best describes the screenshot's current state?",
      "A draft workflow with a critical unresolved issue",
      [
        "A draft workflow with a critical unresolved issue",
        "A finalized production workflow",
        "A marketing wireframe",
        "A completed and approved design"
      ],
      "The screenshot appears to show a draft workflow blocked by an issue, not a finished product.",
      "The warning indicates work remains before the workflow can be considered complete."
    ),
    makeQuestion(
      "ba_iq_17",
      "For BA screening, what question is most important to ask about this screenshot?",
      "What specific condition caused the warning?",
      [
        "What specific condition caused the warning?",
        "What font is used in the screenshot?",
        "How many steps does the workflow have?",
        "Which color is dominant"
      ],
      "The most important BA question is about the cause of the warning condition.",
      "Understanding root cause is central to business analysis."
    ),
    makeQuestion(
      "ba_iq_18",
      "The screenshot is used for first screening. What kind of answer shows the best BA judgment?",
      "A choice that focuses on process risk and prevention",
      [
        "A choice that focuses on process risk and prevention",
        "A choice that focuses on visual style",
        "A choice that focuses on font size",
        "A choice that focuses on icon placement"
      ],
      "Strong BA judgment chooses the process risk path over visual or styling concerns.",
      "BA screening should reward risk-aware and prevention-focused answers."
    ),
    makeQuestion(
      "ba_iq_19",
      "Which of these would be the weakest justification for approving the workflow?",
      "Because the screenshot has a clean layout",
      [
        "Because the screenshot has a clean layout",
        "Because the warning has been investigated",
        "Because the risk has been clarified",
        "Because the final issue is resolved"
      ],
      "A clean layout is a weak justification when there is an unresolved warning.",
      "Business approval should be based on issue resolution, not appearance."
    ),
    makeQuestion(
      "ba_iq_20",
      "What should a candidate infer from the placement of the warning on the final step?",
      "The issue likely blocks completion and must be fixed before go-live",
      [
        "The issue likely blocks completion and must be fixed before go-live",
        "The issue is optional and can be deferred after launch",
        "The issue is only for aesthetics",
        "The issue indicates the workflow is complete"
      ],
      "A final-step warning usually means the workflow cannot complete successfully.",
      "Business analysts know final-stage warnings are usually gating issues."
    ),
    makeQuestion(
      "ba_iq_21",
      "What is the most valuable piece of follow-up information to request?",
      "The exact validation rule or failure condition behind the warning",
      [
        "The exact validation rule or failure condition behind the warning",
        "The file format of the screenshot",
        "The width of the columns",
        "The animation speed"
      ],
      "Knowing the exact validation rule gives the most useful context for resolution.",
      "Root-cause information is the key follow-up detail for a BA."
    ),
    makeQuestion(
      "ba_iq_22",
      "Which option best describes the candidate's likely next step?",
      "Document the warning and clarify the required fix",
      [
        "Document the warning and clarify the required fix",
        "Change the icon to green",
        "Remove all steps from the screenshot",
        "Approve it as-is"
      ],
      "Documenting and clarifying the fix is the right next business step.",
      "This preserves the workflow draft while making the issue actionable."
    ),
    makeQuestion(
      "ba_iq_23",
      "What does the presence of the screenshot imply about the screening test?",
      "It evaluates the candidate's ability to interpret process risk visually",
      [
        "It evaluates the candidate's ability to interpret process risk visually",
        "It tests the candidate's coding ability",
        "It measures the candidate's typing speed",
        "It verifies the candidate's knowledge of colors"
      ],
      "The screenshot is intended to test visual risk interpretation in a BA context.",
      "This type of question is about process judgment rather than technical syntax."
    ),
    makeQuestion(
      "ba_iq_24",
      "Which phrase best describes the expected candidate mindset?",
      "Look for the strongest operational risk and recommend a safe action",
      [
        "Look for the strongest operational risk and recommend a safe action",
        "Focus only on the appearance of the page",
        "Assume the workflow is complete if it is visible",
        "Choose the option with the most colorful wording"
      ],
      "The best mindset is risk-aware and safety-first, not style-first.",
      "BA screening prioritizes safe, evidence-based recommendations."
    ),
    makeQuestion(
      "ba_iq_25",
      "Why is it important to use a scanned diagram for this question?",
      "It allows testing visual reasoning with a real workflow asset",
      [
        "It allows testing visual reasoning with a real workflow asset",
        "It makes the question easier to guess",
        "It proves the candidate can edit images",
        "It improves the color palette"
      ],
      "Scanned diagrams provide a realistic visual asset that tests reasoning rather than purely theoretical logic.",
      "The goal is assessment of judgment using an actual workflow diagram, not just abstract text."
    ),
    makeQuestion(
      "ba_iq_26",
      "Which business analysis principle is this screenshot question most likely assessing?",
      "Understanding risk signals and prioritizing remediation",
      [
        "Understanding risk signals and prioritizing remediation",
        "Choosing a company logo",
        "Counting the number of colors",
        "Designing the cover page"
      ],
      "The screenshot is assessing the ability to spot risk and choose remediation."
      ,
      "This is a core BA principle in a screening context."
    ),
    makeQuestion(
      "ba_iq_27",
      "If you had to brief a stakeholder, what would you say about this screenshot?",
      "The workflow shows a key error state that should be investigated before release",
      [
        "The workflow shows a key error state that should be investigated before release",
        "The workflow is complete and ready",
        "The screenshot is only for UI review",
        "The workflow is unimportant"
      ],
      "The right briefing emphasizes the error state and the need for investigation.",
      "Stakeholder communication should focus on actionable risk, not aesthetics."
    ),
    makeQuestion(
      "ba_iq_28",
      "What does the warning icon on the final step tell you about the current state of the process?",
      "A gate condition has failed and the process cannot advance safely",
      [
        "A gate condition has failed and the process cannot advance safely",
        "The process is already complete",
        "The process is in a good state",
        "The process is missing labels"
      ],
      "The warning on the last step means a gate condition failed and requires correction.",
      "This is consistent with common workflow risk patterns."
    ),
    makeQuestion(
      "ba_iq_29",
      "Which answer best reflects a cautious BA recommendation?",
      "Stop and resolve the warning before any deployment decision",
      [
        "Stop and resolve the warning before any deployment decision",
        "Deploy and monitor in production",
        "Change the icon color to green",
        "Ask the design team to approve"
      ],
      "A cautious BA recommendation is to stop and resolve the warning first.",
      "Good BA practice is to resolve known issues before deployment."
    ),
    makeQuestion(
      "ba_iq_30",
      "What would a strong candidate say the warning most likely represents?",
      "A business rule or data validation failure that must be corrected",
      [
        "A business rule or data validation failure that must be corrected",
        "A styling guide suggestion",
        "A missing logo asset",
        "A completed action confirmation"
      ],
      "This warning is most plausibly a validation or business rule failure, not a styling issue.",
      "Business analysts look for validation and requirements issues in warning states."
    )
  ];
}
