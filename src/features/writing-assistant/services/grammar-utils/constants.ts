/**
 * Grammar checking constants and patterns
 * Extracted from grammarSuggestionService.ts for better organization
 */

/**
 * Common wordy phrases and their concise alternatives
 */
export const WORDY_PHRASES: Record<string, string> = {
  'at this point in time': 'now',
  'in order to': 'to',
  'due to the fact that': 'because',
  'in the event that': 'if',
  'for the purpose of': 'to',
  'in the near future': 'soon',
  'at all times': 'always',
  'in spite of the fact that': 'although',
  'with the exception of': 'except',
  'in regard to': 'about',
  'in the process of': '',
  'has the ability to': 'can',
  'make a decision': 'decide',
  'take into consideration': 'consider',
  'give consideration to': 'consider',
  'come to an end': 'end',
  'reach a conclusion': 'conclude',
  'is defined as': 'is',
  'in a position to': 'can',
  'in close proximity to': 'near',
  'on a daily basis': 'daily',
  'for the reason that': 'because',
};

/**
 * Passive voice detection patterns
 */
export const PASSIVE_PATTERNS = [
  /\b(was|were|is|are|been|being)\s+(\w+ed)\b/gi,
  /\b(was|were)\s+(\w+en)\b/gi,
];

/**
 * Common weak words and improvement suggestions
 */
export const WEAK_WORDS: Record<string, string> = {
  very: 'consider adding a stronger word',
  really: 'consider using a more specific intensifier',
  just: 'may be unnecessary',
  thing: 'be more specific',
  stuff: 'be more specific',
  got: 'use a more precise verb',
  nice: 'use a more descriptive word',
  good: 'use a stronger adjective',
  bad: 'use a more specific word',
  big: 'use a more specific size descriptor',
};

/**
 * Common misspellings and their corrections
 */
export const COMMON_MISSPELLINGS: Record<string, string> = {
  Teh: 'The',
  teh: 'the',
  taht: 'that',
  definately: 'definitely',
  seperate: 'separate',
  occured: 'occurred',
  recieve: 'receive',
  untill: 'until',
  wierd: 'weird',
  accomodate: 'accommodate',
  occurence: 'occurrence',
  refering: 'referring',
  begining: 'beginning',
  beleive: 'believe',
  calender: 'calendar',
  collegue: 'colleague',
  concious: 'conscious',
  existance: 'existence',
  foriegn: 'foreign',
  goverment: 'government',
  happend: 'happened',
  immediatly: 'immediately',
  independant: 'independent',
  knowlege: 'knowledge',
  liason: 'liaison',
  mispell: 'misspell',
  neccessary: 'necessary',
  noticable: 'noticeable',
  occassion: 'occasion',
  persistant: 'persistent',
  posession: 'possession',
  privelege: 'privilege',
  publically: 'publicly',
  questoin: 'question',
  recomend: 'recommend',
  rythm: 'rhythm',
  succesful: 'successful',
  suprise: 'surprise',
  truely: 'truly',
  writting: 'writing',
};

/**
 * Common redundant phrases and their concise alternatives
 */
export const REDUNDANT_PHRASES = [
  { phrase: 'advance planning', replacement: 'planning' },
  { phrase: 'end result', replacement: 'result' },
  { phrase: 'each and every', replacement: 'each' },
  { phrase: 'true fact', replacement: 'fact' },
  { phrase: 'past history', replacement: 'history' },
  { phrase: 'unexpected surprise', replacement: 'surprise' },
  { phrase: 'completely eliminate', replacement: 'eliminate' },
  { phrase: 'refer back', replacement: 'refer' },
  { phrase: 'join together', replacement: 'join' },
  { phrase: 'repeat again', replacement: 'repeat' },
  { phrase: 'return back', replacement: 'return' },
  { phrase: 'circle around', replacement: 'circle' },
];

/**
 * Subject-verb agreement patterns to check
 */
export const SUBJECT_VERB_PATTERNS = [
  { pattern: /\bevery\s+\w+(s)?\b/gi, issue: 'singular verb after "every"' },
  { pattern: /\bnone\b/gi, issue: 'ensure singular verb with "none"' },
  {
    pattern: /\beither\s+\w+(s)?\s+or\s+\w+(s)?\b/gi,
    issue: 'verb agreement with "either...or"',
  },
  {
    pattern: /\bneither\s+\w+(s)?\s+nor\s+\w+(s)?\b/gi,
    issue: 'verb agreement with "neither...nor"',
  },
];

/**
 * Pronoun reference patterns to check
 */
export const PRONOUN_PATTERNS = [/\bthis\s+[\w]+\b/gi, /\bthat\s+they\b/gi, /\bwhich\b/gi];

/**
 * Vague language patterns to detect
 */
export const VAGUE_PATTERNS = [
  { pattern: /\bsome\s+\w+s?\b/gi, issue: 'vague quantity' },
  { pattern: /\ba\s+lot\b/gi, issue: 'consider being more specific' },
  { pattern: /\balot\b/gi, issue: '"a lot" should be two words' },
  { pattern: /\bkind of\b|\bsort of\b/gi, issue: 'vague expression' },
  { pattern: /\breally\s+\w+/gi, issue: 'unnecessary intensifier' },
];
