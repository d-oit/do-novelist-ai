/**
 * Project Wizard Constants
 */

export const GENRES = [
  'Sci-Fi / Cyberpunk',
  'High Fantasy',
  'Mystery / Thriller',
  'Horror',
  'Romance',
  'Historical Fiction',
  'Non-Fiction / Business',
  'Self-Help',
  'Memoir',
  'Literary Fiction',
  'Young Adult Dystopian',
  'Space Opera',
  'True Crime',
  'Biography',
  'Satire',
] as const;

export const TONES = [
  'Neutral',
  'Dark & Gritty',
  'Humorous',
  'Optimistic',
  'Academic',
  'Poetic',
  'Fast-paced',
  'Atmospheric',
  'Whimsical',
] as const;

export const AUDIENCES = [
  'General',
  'Adult',
  'Young Adult (YA)',
  'Middle Grade',
  'Children',
  'Professional',
  'Academics',
] as const;

export type Genre = (typeof GENRES)[number];
export type Tone = (typeof TONES)[number];
export type Audience = (typeof AUDIENCES)[number];
