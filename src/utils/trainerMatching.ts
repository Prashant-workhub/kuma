import { TrainerProfile, TraineeCompetency } from '../types';

const LEVEL_VALUE = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 } as const;

export interface TrainerMatch {
  trainer: TrainerProfile;
  score: number;
  breakdown: { competency: number; proficiency: number; experience: number; qualification: number };
  matchedCompetencies: string[];
  reason: string;
}

const norm = (value?: string) => (value || '').trim().toLowerCase();

/**
 * Deterministic trainer ranking for the SIH competency-mapping workflow.
 * Scores use only declared profile data; no AI inference or fabricated inputs.
 */
export function rankTrainersForTrainee(
  trainers: TrainerProfile[],
  competencies: TraineeCompetency[] = []
): TrainerMatch[] {
  const activeGaps = competencies.filter((item) => {
    const current = item.latestAssessedNumericLevel || item.numericLevel || LEVEL_VALUE[item.level] || 0;
    const target = item.targetNumericLevel || LEVEL_VALUE[item.targetLevel || 'Advanced'];
    return target > current;
  });
  const totalGap = activeGaps.reduce((sum, item) => {
    const current = item.latestAssessedNumericLevel || item.numericLevel || LEVEL_VALUE[item.level] || 0;
    const target = item.targetNumericLevel || LEVEL_VALUE[item.targetLevel || 'Advanced'];
    return sum + target - current;
  }, 0);

  return trainers.map((trainer) => {
    const trainerCompetencies = (trainer.competencies || []).filter((item) => item?.canTrain !== false);
    const matches = activeGaps.map((gap) => {
      const match = trainerCompetencies.find((item) =>
        item.id === gap.competencyId || item.id === gap.id || norm(item.name) === norm(gap.name)
      );
      return { gap, match };
    }).filter((item): item is { gap: TraineeCompetency; match: NonNullable<typeof trainerCompetencies[number]> } => !!item.match);

    const matchedGapWeight = matches.reduce((sum, { gap }) => {
      const current = gap.latestAssessedNumericLevel || gap.numericLevel || LEVEL_VALUE[gap.level] || 0;
      const target = gap.targetNumericLevel || LEVEL_VALUE[gap.targetLevel || 'Advanced'];
      return sum + target - current;
    }, 0);
    const competency = totalGap > 0 ? Math.round((matchedGapWeight / totalGap) * 40) : 0;
    const proficiency = matches.length > 0
      ? Math.round((matches.reduce((sum, { match }) => sum + LEVEL_VALUE[match.level], 0) / (matches.length * 4)) * 30)
      : 0;
    const experience = Math.round((Math.min(Math.max(Number(trainer.yearsOfExperience) || 0, 0), 10) / 10) * 15);
    const qualificationText = norm(trainer.qualification);
    const qualification = qualificationText.includes('ph.d') || qualificationText.includes('doctor')
      ? 15 : qualificationText.includes('master') || qualificationText.includes('m.tech') || qualificationText.includes('m.sc')
        ? 12 : qualificationText.includes('bachelor') || qualificationText.includes('b.tech') || qualificationText.includes('b.sc') ? 9 : 6;
    const matchedCompetencies = matches.map(({ match }) => match.name);
    const score = competency + proficiency + experience + qualification;
    const reason = matchedCompetencies.length
      ? `Covers ${matchedCompetencies.join(', ')} with declared ${trainer.yearsOfExperience || 0} years of experience.`
      : 'No declared trainer competency currently maps to this trainee’s active gaps.';

    return { trainer, score, breakdown: { competency, proficiency, experience, qualification }, matchedCompetencies, reason };
  }).sort((a, b) => b.score - a.score || a.trainer.fullName.localeCompare(b.trainer.fullName));
}
