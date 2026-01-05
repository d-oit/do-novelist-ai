/**
 * Character Graph Service
 *
 * Analyzes and tracks character relationships across the story
 */

import type {
  CharacterGraph,
  CharacterNode,
  CharacterRelationship,
  RelationshipEvolution,
  RelationshipType,
} from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';
import type { Chapter, Character } from '@/shared/types';

export class CharacterGraphService {
  /**
   * Build character relationship graph from chapters
   */
  public async buildCharacterGraph(
    projectId: string,
    chapters: Chapter[],
    characters: Character[],
  ): Promise<CharacterGraph> {
    try {
      logger.info('Building character graph', { projectId, characters: characters.length });

      const relationships = this.extractRelationships(chapters, characters);
      const nodes = this.buildNodes(characters, relationships);

      return {
        projectId,
        relationships,
        nodes,
        analyzedAt: new Date(),
      };
    } catch (error) {
      logger.error('Character graph building failed', { projectId, error });
      throw error;
    }
  }

  /**
   * Extract relationships between characters from chapters
   */
  private extractRelationships(
    chapters: Chapter[],
    characters: Character[],
  ): CharacterRelationship[] {
    const relationships: CharacterRelationship[] = [];
    const relationshipMap = new Map<string, CharacterRelationship>();

    // Compare each pair of characters
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i];
        const char2 = characters[j];
        if (!char1 || !char2) continue;

        const evolution = this.analyzeRelationshipEvolution(chapters, char1, char2);

        if (evolution.length > 0) {
          // Create relationship
          const relationship: CharacterRelationship = {
            id: `rel-${char1.id}-${char2.id}`,
            projectId: char1.projectId,
            character1Id: char1.id,
            character2Id: char2.id,
            type: evolution[evolution.length - 1]?.type ?? 'neutral',
            strength: evolution[evolution.length - 1]?.strength ?? 5,
            evolution,
            isReciprocal: true, // Assume reciprocal unless indicated otherwise
          };

          relationships.push(relationship);
          relationshipMap.set(relationship.id, relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Analyze how relationship evolves across chapters
   */
  private analyzeRelationshipEvolution(
    chapters: Chapter[],
    char1: Character,
    char2: Character,
  ): RelationshipEvolution[] {
    const evolution: RelationshipEvolution[] = [];

    chapters.forEach((chapter, index) => {
      const content = chapter.content.toLowerCase();
      const char1Name = char1.name.toLowerCase();
      const char2Name = char2.name.toLowerCase();

      // Check if both characters appear in this chapter
      if (content.includes(char1Name) && content.includes(char2Name)) {
        const relationshipType = this.detectRelationshipType(content, char1Name, char2Name);
        const strength = this.estimateRelationshipStrength(content, char1Name, char2Name);

        // Add to evolution if relationship changed or first appearance
        if (evolution.length === 0 || evolution[evolution.length - 1]?.type !== relationshipType) {
          evolution.push({
            chapterId: chapter.id,
            chapterNumber: index + 1,
            type: relationshipType,
            strength,
            event: this.extractRelationshipEvent(content, char1Name, char2Name),
          });
        }
      }
    });

    return evolution;
  }

  /**
   * Detect relationship type from content
   */
  private detectRelationshipType(
    content: string,
    char1Name: string,
    char2Name: string,
  ): RelationshipType {
    // Look for relationship indicators between the two characters
    const segment = this.extractSegmentBetweenNames(content, char1Name, char2Name);

    // Romantic indicators
    if (
      segment.includes('love') ||
      segment.includes('kiss') ||
      segment.includes('romance') ||
      segment.includes('heart')
    ) {
      return 'romantic';
    }

    // Enemy indicators
    if (
      segment.includes('enemy') ||
      segment.includes('hate') ||
      segment.includes('fight') ||
      segment.includes('attack')
    ) {
      return 'enemy';
    }

    // Mentor indicators
    if (
      segment.includes('teach') ||
      segment.includes('mentor') ||
      segment.includes('guide') ||
      segment.includes('train')
    ) {
      return 'mentor';
    }

    // Family indicators
    if (
      segment.includes('family') ||
      segment.includes('sister') ||
      segment.includes('brother') ||
      segment.includes('parent') ||
      segment.includes('child')
    ) {
      return 'family';
    }

    // Friend indicators
    if (
      segment.includes('friend') ||
      segment.includes('companion') ||
      segment.includes('ally') ||
      segment.includes('trust')
    ) {
      return 'friend';
    }

    // Rival indicators
    if (segment.includes('rival') || segment.includes('compete') || segment.includes('jealous')) {
      return 'rival';
    }

    // Default to neutral
    return 'neutral';
  }

  /**
   * Estimate relationship strength
   */
  private estimateRelationshipStrength(
    content: string,
    char1Name: string,
    char2Name: string,
  ): number {
    const segment = this.extractSegmentBetweenNames(content, char1Name, char2Name);

    // Count interaction indicators
    let strength = 5; // baseline

    const positiveWords = ['help', 'support', 'trust', 'care', 'protect', 'love'];
    const negativeWords = ['betray', 'hurt', 'abandon', 'hate', 'kill', 'destroy'];

    positiveWords.forEach(word => {
      if (segment.includes(word)) strength += 1;
    });

    negativeWords.forEach(word => {
      if (segment.includes(word)) strength -= 1;
    });

    return Math.max(1, Math.min(10, strength));
  }

  /**
   * Extract text segment between character mentions
   */
  private extractSegmentBetweenNames(content: string, name1: string, name2: string): string {
    const index1 = content.indexOf(name1);
    const index2 = content.indexOf(name2);

    if (index1 === -1 || index2 === -1) return '';

    const start = Math.min(index1, index2);
    const end = Math.max(index1, index2);

    // Extract segment plus some context
    const contextLength = 200;
    const segmentStart = Math.max(0, start - contextLength);
    const segmentEnd = Math.min(content.length, end + contextLength);

    return content.substring(segmentStart, segmentEnd);
  }

  /**
   * Extract key event that defines relationship
   */
  private extractRelationshipEvent(
    content: string,
    char1Name: string,
    char2Name: string,
  ): string | undefined {
    const segment = this.extractSegmentBetweenNames(content, char1Name, char2Name);

    // Look for sentences with both names
    const sentences = segment.split(/[.!?]+/);
    const relevantSentence = sentences.find(s => s.includes(char1Name) && s.includes(char2Name));

    return relevantSentence?.trim().substring(0, 150);
  }

  /**
   * Build character nodes for graph visualization
   */
  private buildNodes(
    characters: Character[],
    relationships: CharacterRelationship[],
  ): CharacterNode[] {
    return characters.map(character => {
      // Count connections
      const connectionCount = relationships.filter(
        rel => rel.character1Id === character.id || rel.character2Id === character.id,
      ).length;

      // Estimate importance based on connections and role
      let importance = connectionCount;

      if (character.role?.toLowerCase().includes('protagonist')) {
        importance += 5;
      } else if (character.role?.toLowerCase().includes('antagonist')) {
        importance += 4;
      } else if (character.role?.toLowerCase().includes('supporting')) {
        importance += 2;
      }

      return {
        id: character.id,
        name: character.name,
        role: character.role || 'Character',
        importance: Math.min(10, importance),
        connectionCount,
      };
    });
  }

  /**
   * Get relationships for a specific character
   */
  public getCharacterRelationships(
    characterId: string,
    graph: CharacterGraph,
  ): CharacterRelationship[] {
    return graph.relationships.filter(
      rel => rel.character1Id === characterId || rel.character2Id === characterId,
    );
  }

  /**
   * Find strongest relationships in the story
   */
  public getStrongestRelationships(
    graph: CharacterGraph,
    limit: number = 5,
  ): CharacterRelationship[] {
    return [...graph.relationships].sort((a, b) => b.strength - a.strength).slice(0, limit);
  }

  /**
   * Detect relationship changes (evolution patterns)
   */
  public detectRelationshipChanges(relationship: CharacterRelationship): {
    hasChanged: boolean;
    pattern: 'improving' | 'deteriorating' | 'stable' | 'complex';
  } {
    if (relationship.evolution.length < 2) {
      return { hasChanged: false, pattern: 'stable' };
    }

    const strengths = relationship.evolution.map(e => e.strength);
    const first = strengths[0] ?? 5;
    const last = strengths[strengths.length - 1] ?? 5;

    const hasChanged = Math.abs(first - last) > 2;

    let pattern: 'improving' | 'deteriorating' | 'stable' | 'complex';

    if (hasChanged) {
      if (last > first) {
        pattern = 'improving';
      } else {
        pattern = 'deteriorating';
      }
    } else {
      // Check for complex pattern (ups and downs)
      let changes = 0;
      for (let i = 1; i < strengths.length; i++) {
        const prev = strengths[i - 1] ?? 5;
        const curr = strengths[i] ?? 5;
        if (Math.abs(curr - prev) > 1) {
          changes++;
        }
      }

      pattern = changes >= 2 ? 'complex' : 'stable';
    }

    return { hasChanged, pattern };
  }
}

export const characterGraphService = new CharacterGraphService();
