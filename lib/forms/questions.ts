export const ONBOARDING_STAGES = [
  {
    value: "planning_3_years",
    label: "I plan to start a social business within the next 3 years",
  },
  {
    value: "setting_up",
    label: "I am currently setting up a business (not yet operational)",
  },
  {
    value: "new_business",
    label: "I run a new business (under 42 months)",
  },
  {
    value: "established",
    label: "I run an established business (42+ months)",
  },
] as const;

export type OnboardingStage = (typeof ONBOARDING_STAGES)[number]["value"];

export const ONBOARDING_STAGE_VALUES = ONBOARDING_STAGES.map(
  (option) => option.value,
) as [OnboardingStage, ...OnboardingStage[]];

export const FEEDBACK_LIKERT = [1, 2, 3, 4, 5] as const;

export const FEEDBACK_QUESTIONS = [
  {
    field: "organised",
    label: "The course was well organised and easy to follow.",
  },
  {
    field: "knowledgeSkills",
    label: "The learning materials genuinely increased my knowledge and skills.",
  },
  {
    field: "navigation",
    label: "The e-learning experience was smooth and easy to navigate.",
  },
  {
    field: "workload",
    label: "The workload was appropriate for the level.",
  },
  {
    field: "peerConnection",
    label:
      "I had meaningful opportunities to connect with other participants.",
  },
] as const;

export type FeedbackLikertField = (typeof FEEDBACK_QUESTIONS)[number]["field"];
