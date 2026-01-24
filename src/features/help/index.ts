/**
 * Help feature exports
 */

export { HelpCenter } from './components/HelpCenter';
export { HelpArticle as HelpArticleComponent } from './components/HelpArticle';
export type { HelpCenterProps } from './components/HelpCenter';
export type { HelpArticleProps } from './components/HelpArticle';

export {
  HELP_CATEGORIES,
  getAllArticles,
  getArticleById,
  searchArticles,
  getRelatedArticles,
} from './helpContent';
export type { HelpArticle as HelpArticleType } from './helpContent';
