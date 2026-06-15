import { z } from "zod";

export const competencyRatingSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().optional(),
});

export type CompetencyRating = z.infer<typeof competencyRatingSchema>;

export const competencyJsonSchema = z.array(competencyRatingSchema);

export const anchorSchema = z.object({
  score: z.number().int().min(1).max(5),
  description: z.string(),
});

export const anchorsJsonSchema = z.array(anchorSchema);

export type AnchorEntry = z.infer<typeof anchorSchema>;

export const answerJsonSchema = z.record(z.string(), z.unknown());

export function parseCompetencyJson(raw: unknown): CompetencyRating[] | null {
  const result = competencyJsonSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseAnchorsJson(raw: unknown): AnchorEntry[] | null {
  const result = anchorsJsonSchema.safeParse(raw);
  return result.success ? result.data : null;
}
