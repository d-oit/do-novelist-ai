import { type CharacterRole, type PersonalityTrait } from '@/types/character-schemas';

export function getImportanceRequirementMessage(role: CharacterRole): string {
  switch (role) {
    case 'protagonist':
      return 'Protagonists must have importance level 8 or higher';
    case 'antagonist':
    case 'deuteragonist':
      return 'This role requires importance level 6 or higher';
    case 'tritagonist':
    case 'love_interest':
    case 'mentor':
      return 'This role requires importance level 4 or higher';
    case 'sidekick':
    case 'foil':
    case 'supporting':
      return 'This role requires importance level 2 or higher';
    default:
      return 'Invalid importance level for this role';
  }
}

export function findPersonalityConflicts(traits: PersonalityTrait[]): string[] {
  const conflicts: Partial<Record<PersonalityTrait, PersonalityTrait[]>> = {
    brave: ['cowardly'],
    cowardly: ['brave'],
    intelligent: ['foolish'],
    foolish: ['intelligent'],
    kind: ['cruel'],
    cruel: ['kind'],
    honest: ['deceptive'],
    deceptive: ['honest'],
    loyal: ['treacherous'],
    treacherous: ['loyal'],
    optimistic: ['pessimistic'],
    pessimistic: ['optimistic'],
    confident: ['insecure'],
    insecure: ['confident'],
    patient: ['impatient'],
    impatient: ['patient'],
    humble: ['arrogant'],
    arrogant: ['humble'],
    generous: ['selfish'],
    selfish: ['generous'],
    creative: ['conventional'],
    conventional: ['creative'],
    ambitious: ['content'],
    content: ['ambitious'],
    curious: ['indifferent'],
    indifferent: ['curious'],
    disciplined: ['impulsive'],
    impulsive: ['disciplined'],
    empathetic: ['callous'],
    callous: ['empathetic'],
  };

  const foundConflicts: string[] = [];
  traits.forEach(trait => {
    const conflictingTraits = conflicts[trait] ?? [];
    conflictingTraits.forEach(conflictTrait => {
      if (traits.includes(conflictTrait)) {
        foundConflicts.push(`${trait} vs ${conflictTrait}`);
      }
    });
  });

  return [...new Set(foundConflicts)];
}
