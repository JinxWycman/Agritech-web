/** Language-neutral symptom codes; labels come from translations. Also sent to the backend as outbreak signal codes. */
export const SYMPTOM_CATALOGUE = [
  { code: "yellow-leaves", issueType: "crop" as const },
  { code: "spots-on-leaves", issueType: "crop" as const },
  { code: "poor-growth", issueType: "crop" as const },
  { code: "pest-damage", issueType: "crop" as const },
  { code: "not-eating", issueType: "livestock" as const },
  { code: "coughing", issueType: "livestock" as const },
  { code: "lameness", issueType: "livestock" as const },
  { code: "skin-problem", issueType: "livestock" as const },
];
