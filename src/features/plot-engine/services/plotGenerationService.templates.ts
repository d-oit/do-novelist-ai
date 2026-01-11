import type { PlotAct, StoryStructure } from '@/features/plot-engine';

export function createTemplateActs(structure: StoryStructure, targetLength: number): PlotAct[] {
  switch (structure) {
    case '3-act':
      return [
        {
          id: 'act-1',
          actNumber: 1,
          name: 'Setup',
          description: 'Introduction of characters and conflict',
          plotPoints: [
            {
              id: 'pp-1-1',
              type: 'inciting_incident',
              title: 'Inciting Incident',
              description: 'Event that sets story in motion',
              importance: 'major',
              position: 5,
              characterIds: [],
            },
            {
              id: 'pp-1-2',
              type: 'rising_action',
              title: 'First Plot Point',
              description: 'Story leaves ordinary world',
              importance: 'major',
              position: 20,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.2),
        },
        {
          id: 'act-2',
          actNumber: 2,
          name: 'Confrontation',
          description: 'Rising action and complications',
          plotPoints: [
            {
              id: 'pp-2-1',
              type: 'midpoint',
              title: 'Midpoint',
              description: 'Turning point that raises stakes',
              importance: 'major',
              position: 50,
              characterIds: [],
            },
            {
              id: 'pp-2-2',
              type: 'rising_action',
              title: 'All Is Lost',
              description: 'Lowest point for protagonist',
              importance: 'major',
              position: 75,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.6),
        },
        {
          id: 'act-3',
          actNumber: 3,
          name: 'Resolution',
          description: 'Climax and conclusion',
          plotPoints: [
            {
              id: 'pp-3-1',
              type: 'climax',
              title: 'Climax',
              description: 'Final confrontation and resolution',
              importance: 'major',
              position: 90,
              characterIds: [],
            },
            {
              id: 'pp-3-2',
              type: 'resolution',
              title: 'Resolution',
              description: 'New normal after conflict',
              importance: 'major',
              position: 100,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.2),
        },
      ];

    case '5-act':
      return [
        {
          id: 'act-1',
          actNumber: 1,
          name: 'Exposition',
          description: 'Setup and inciting incident',
          plotPoints: [
            {
              id: 'pp-1-1',
              type: 'inciting_incident',
              title: 'Inciting Incident',
              description: 'Event that starts story',
              importance: 'major',
              position: 10,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.1),
        },
        {
          id: 'act-2',
          actNumber: 2,
          name: 'Rising Action',
          description: 'Conflict development',
          plotPoints: [
            {
              id: 'pp-2-1',
              type: 'rising_action',
              title: 'Rising Action Begins',
              description: 'First major obstacle',
              importance: 'major',
              position: 25,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.2),
        },
        {
          id: 'act-3',
          actNumber: 3,
          name: 'Climax',
          description: 'Peak tension and confrontation',
          plotPoints: [
            {
              id: 'pp-3-1',
              type: 'climax',
              title: 'Climax',
              description: 'Main conflict resolution',
              importance: 'major',
              position: 50,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.2),
        },
        {
          id: 'act-4',
          actNumber: 4,
          name: 'Falling Action',
          description: 'Aftermath of climax',
          plotPoints: [
            {
              id: 'pp-4-1',
              type: 'falling_action',
              title: 'Falling Action',
              description: 'Dealing with consequences',
              importance: 'major',
              position: 75,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.2),
        },
        {
          id: 'act-5',
          actNumber: 5,
          name: 'Denouement',
          description: 'Final resolution',
          plotPoints: [
            {
              id: 'pp-5-1',
              type: 'resolution',
              title: 'Resolution',
              description: 'Story conclusion',
              importance: 'major',
              position: 100,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.3),
        },
      ];

    case 'hero-journey':
      return [
        {
          id: 'act-1',
          actNumber: 1,
          name: 'Departure',
          description: 'Call to adventure',
          plotPoints: [
            {
              id: 'pp-1-1',
              type: 'inciting_incident',
              title: 'Call to Adventure',
              description: 'Hero receives a challenge',
              importance: 'major',
              position: 10,
              characterIds: [],
            },
            {
              id: 'pp-1-2',
              type: 'turning_point',
              title: 'Crossing the Threshold',
              description: 'Hero leaves ordinary world',
              importance: 'major',
              position: 20,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.25),
        },
        {
          id: 'act-2',
          actNumber: 2,
          name: 'Initiation',
          description: 'Trials and transformation',
          plotPoints: [
            {
              id: 'pp-2-1',
              type: 'rising_action',
              title: 'Tests and Allies',
              description: 'Hero faces challenges',
              importance: 'major',
              position: 40,
              characterIds: [],
            },
            {
              id: 'pp-2-2',
              type: 'climax',
              title: 'Ordeal',
              description: 'Greatest challenge near death',
              importance: 'major',
              position: 60,
              characterIds: [],
            },
            {
              id: 'pp-2-3',
              type: 'rising_action',
              title: 'Reward',
              description: 'Hero achieves goal',
              importance: 'major',
              position: 70,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.5),
        },
        {
          id: 'act-3',
          actNumber: 3,
          name: 'Return',
          description: 'Coming back changed',
          plotPoints: [
            {
              id: 'pp-3-1',
              type: 'rising_action',
              title: 'The Road Back',
              description: 'Returning to ordinary world',
              importance: 'major',
              position: 80,
              characterIds: [],
            },
            {
              id: 'pp-3-2',
              type: 'resolution',
              title: 'Return with Elixir',
              description: 'Hero brings back wisdom',
              importance: 'major',
              position: 100,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.25),
        },
      ];

    case 'kishotenketsu':
      return [
        {
          id: 'act-1',
          actNumber: 1,
          name: 'Introduction',
          description: 'Establishing context',
          plotPoints: [
            {
              id: 'pp-1-1',
              type: 'turning_point',
              title: 'Introduction',
              description: 'Scene setting and character introduction',
              importance: 'major',
              position: 10,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.25),
        },
        {
          id: 'act-2',
          actNumber: 2,
          name: 'Development',
          description: 'Building tension',
          plotPoints: [
            {
              id: 'pp-2-1',
              type: 'rising_action',
              title: 'Development',
              description: 'Expanding on situation',
              importance: 'major',
              position: 35,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.25),
        },
        {
          id: 'act-3',
          actNumber: 3,
          name: 'Twist',
          description: 'Unexpected turn',
          plotPoints: [
            {
              id: 'pp-3-1',
              type: 'climax',
              title: 'Twist',
              description: 'Surprising revelation or turn',
              importance: 'major',
              position: 60,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.25),
        },
        {
          id: 'act-4',
          actNumber: 4,
          name: 'Conclusion',
          description: 'Resolution and harmony',
          plotPoints: [
            {
              id: 'pp-4-1',
              type: 'resolution',
              title: 'Conclusion',
              description: 'Bringing elements together',
              importance: 'major',
              position: 100,
              characterIds: [],
            },
          ],
          chapters: [],
          duration: Math.ceil(targetLength * 0.25),
        },
      ];

    default:
      return createTemplateActs('3-act', targetLength);
  }
}
