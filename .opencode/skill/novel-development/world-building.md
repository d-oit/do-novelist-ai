# World Building

## Core Concepts

World-building management handles locations, cultures, lore, and their
interconnections.

## Data Models

```typescript
interface WorldElement {
  id: string;
  name: string;
  type: 'location' | 'culture' | 'lore' | 'organization' | 'item';
  description: string;
  connections: WorldConnection[];
  attributes: Record<string, unknown>;
}

interface Location extends WorldElement {
  type: 'location';
  geography: string;
  climate: string;
  population?: number;
  settlements: string[];
  resources: Resource[];
}

interface Culture extends WorldElement {
  type: 'culture';
  beliefs: string[];
  traditions: string[];
  language: string;
  customs: Custom[];
  socialStructure: string;
}

interface Lore extends WorldElement {
  type: 'lore';
  category: 'history' | 'mythology' | 'legend' | 'prophecy';
  timeline: TimelineEvent[];
  sources: string[];
}
```

## World Connections

```typescript
interface WorldConnection {
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  strength: number;
  description: string;
}

enum ConnectionType {
  GEOGRAPHICAL = 'geographical',
  POLITICAL = 'political',
  CULTURAL = 'cultural',
  HISTORICAL = 'historical',
  ECONOMIC = 'economic',
}
```

## World Consistency Validation

```typescript
function validateWorldConsistency(world: WorldData[]): ValidationResult {
  const issues: ConsistencyIssue[] = [];

  world.forEach(element => {
    element.connections.forEach(conn => {
      const target = world.find(e => e.id === conn.targetId);

      if (!target) {
        issues.push({
          type: 'broken_connection',
          element: element.id,
          issue: `Connection to ${conn.targetId} not found`,
        });
      }

      if (target) {
        const reciprocal = target.connections.find(
          c => c.targetId === element.id,
        );

        if (!reciprocal && shouldHaveReciprocal(conn.type)) {
          issues.push({
            type: 'missing_reciprocal',
            element: element.id,
            issue: `Reciprocal connection from ${target.name} missing`,
          });
        }
      }
    });
  });

  return {
    isValid: issues.length === 0,
    issues,
  };
}
```

## Location Management

```typescript
interface LocationHierarchy {
  world: string;
  continents: Continent[];
  countries: Country[];
  cities: City[];
  landmarks: Landmark[];
}

function getLocationsNearby(
  location: Location,
  distance: number,
  world: WorldData[],
): Location[] {
  const nearby: Location[] = [];

  world.forEach(element => {
    if (element.type === 'location' && element.id !== location.id) {
      const dist = calculateDistance(location, element as Location);
      if (dist <= distance) {
        nearby.push(element as Location);
      }
    }
  });

  return nearby.sort(
    (a, b) => calculateDistance(location, a) - calculateDistance(location, b),
  );
}
```

## Culture Integration

```typescript
interface CultureInteraction {
  cultureA: Culture;
  cultureB: Culture;
  interactionType: 'trade' | 'war' | 'alliance' | 'migration';
  frequency: 'constant' | 'frequent' | 'occasional' | 'rare';
  impactLevel: 'low' | 'medium' | 'high' | 'transformative';
}
```

## Performance Optimization

- Use spatial indexing for location queries
- Cache world validation results
- Index elements by type and attributes
- Use graph traversal algorithms for relationship analysis

## Testing

```typescript
describe('world-consistency-validator', () => {
  it('detects broken connections', () => {
    const world = createWorldWithBrokenConnection();
    const result = validateWorldConsistency(world);

    expect(result.isValid).toBe(false);
    expect(result.issues[0].type).toBe('broken_connection');
  });

  it('detects missing reciprocal connections', () => {
    const world = createWorldWithMissingReciprocal();
    const result = validateWorldConsistency(world);

    expect(result.issues).toContainEqual(
      expect.objectContaining({ type: 'missing_reciprocal' }),
    );
  });
});
```

## Integration

- Character development for character locations
- Plot engine for event locations
- Publishing for world guide exports
