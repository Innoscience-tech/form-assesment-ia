export type DimensionId = 'estrategia' | 'lideranca' | 'governanca' | 'tecnologia' | 'cultura' | 'funding' | 'pessoas' | 'relacionamentos';
export type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type AssessmentAnswers = Partial<Record<number, AnswerValue>>;
export type MaturityLevel = 'inicial' | 'em-desenvolvimento' | 'consolidado';
export interface AssessmentQuestion { id: number; dimensionId: DimensionId; title: string; text: string }
export interface AssessmentDimension { id: DimensionId; name: string; questionIds: readonly number[] }
export interface ScaleOption { value: AnswerValue; label: string }
export interface ResultContent {
  level: MaturityLevel; label: string; title: string; scoreRange: string; challenge: string;
  headline: string; paragraphs: readonly string[]; guidanceTitle: string;
  guidance: readonly string[]; callout: string; support: string; cta: string;
}
export interface DimensionResult {
  id: DimensionId; name: string; average: number | null; level: MaturityLevel | null;
  answeredCount: number; scoredCount: number; unknownCount: number;
}
export interface AssessmentResult {
  dimensions: DimensionResult[]; overallAverage: number | null; level: MaturityLevel | null;
  content: ResultContent | null; strengths: DimensionResult[]; gaps: DimensionResult[];
  unansweredQuestionIds: number[]; answeredCount: number; scoredCount: number; unknownCount: number;
  isComplete: boolean;
}
