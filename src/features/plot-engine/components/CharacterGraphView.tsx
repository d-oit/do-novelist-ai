/**
 * Character Graph View Component
 *
 * Interactive network visualization of character relationships
 */

import React, { useMemo, useState } from 'react';

import type { CharacterGraph, CharacterRelationship, CharacterNode } from '@/features/plot-engine';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';

interface CharacterGraphViewProps {
  characterGraph: CharacterGraph;
  onNodeClick?: (nodeId: string) => void;
  onRelationshipClick?: (relationship: CharacterRelationship) => void;
}

export const CharacterGraphView: React.FC<CharacterGraphViewProps> = React.memo(
  ({ characterGraph, onNodeClick, onRelationshipClick }) => {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);

    // Get relationships for selected node
    const nodeRelationships = useMemo(() => {
      if (!selectedNode) return [];
      return characterGraph.relationships.filter(
        rel => rel.character1Id === selectedNode || rel.character2Id === selectedNode,
      );
    }, [selectedNode, characterGraph.relationships]);

    // Get node by ID
    const getNode = (id: string): CharacterNode | undefined => {
      return characterGraph.nodes.find(n => n.id === id);
    };

    // Get selected relationship
    const selectedRel = useMemo(() => {
      if (!selectedRelationship) return null;
      return characterGraph.relationships.find(r => r.id === selectedRelationship);
    }, [selectedRelationship, characterGraph.relationships]);

    const handleNodeClick = (nodeId: string): void => {
      setSelectedNode(nodeId);
      setSelectedRelationship(null);
      onNodeClick?.(nodeId);
    };

    const handleRelationshipClick = (relationship: CharacterRelationship): void => {
      setSelectedRelationship(relationship.id);
      onRelationshipClick?.(relationship);
    };

    return (
      <div className='space-y-6'>
        {/* Graph Overview */}
        <Card className='p-6'>
          <h3 className='mb-4 text-lg font-semibold'>Character Network</h3>
          <div className='mb-6 grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>Characters</p>
              <p className='mt-1 text-2xl font-bold'>{characterGraph.nodes.length}</p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>Relationships</p>
              <p className='mt-1 text-2xl font-bold'>{characterGraph.relationships.length}</p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>Avg Connections</p>
              <p className='mt-1 text-2xl font-bold'>
                {characterGraph.nodes.length > 0
                  ? Math.round(
                      characterGraph.nodes.reduce((sum, n) => sum + n.connectionCount, 0) /
                        characterGraph.nodes.length,
                    )
                  : 0}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className='mb-4 rounded-lg border bg-muted/30 p-3'>
            <p className='mb-2 text-sm font-medium'>Legend:</p>
            <div className='flex flex-wrap gap-3 text-xs'>
              <div className='flex items-center gap-1'>
                <div className='h-3 w-3 rounded-full' style={{ backgroundColor: '#3b82f6' }} />
                <span>Protagonist</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='h-3 w-3 rounded-full' style={{ backgroundColor: '#ef4444' }} />
                <span>Antagonist</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='h-3 w-3 rounded-full' style={{ backgroundColor: '#10b981' }} />
                <span>Supporting</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='h-3 w-3 rounded-full' style={{ backgroundColor: '#8b5cf6' }} />
                <span>Mentor</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='h-3 w-3 rounded-full' style={{ backgroundColor: '#ec4899' }} />
                <span>Love Interest</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='h-3 w-3 rounded-full' style={{ backgroundColor: '#6b7280' }} />
                <span>Other</span>
              </div>
            </div>
            <p className='mt-2 text-xs text-muted-foreground'>
              💡 Hover over nodes and edges for details • Click to select
            </p>
          </div>

          {/* Simplified Network Visualization */}
          <div className='relative min-h-[400px] rounded-lg bg-muted/30 p-8'>
            <SimpleNetworkGraph
              nodes={characterGraph.nodes}
              relationships={characterGraph.relationships}
              selectedNode={selectedNode}
              onNodeClick={handleNodeClick}
            />
          </div>
        </Card>

        {/* Character List */}
        <Card className='p-6'>
          <h3 className='mb-4 text-lg font-semibold'>Characters</h3>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            {characterGraph.nodes
              .sort((a, b) => b.importance - a.importance)
              .map(node => (
                <CharacterNodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNode === node.id}
                  onClick={() => handleNodeClick(node.id)}
                />
              ))}
          </div>
        </Card>

        {/* Selected Node Details */}
        {selectedNode && (
          <Card className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>
              {getNode(selectedNode)?.name} - Relationships
            </h3>
            {nodeRelationships.length > 0 ? (
              <div className='space-y-3'>
                {nodeRelationships.map(rel => (
                  <RelationshipCard
                    key={rel.id}
                    relationship={rel}
                    nodes={characterGraph.nodes}
                    currentNodeId={selectedNode}
                    isSelected={selectedRelationship === rel.id}
                    onClick={() => handleRelationshipClick(rel)}
                  />
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>No relationships found</p>
            )}
          </Card>
        )}

        {/* Relationship Evolution */}
        {selectedRel && selectedRel.evolution.length > 0 && (
          <Card className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>Relationship Evolution</h3>
            <div className='space-y-3'>
              {selectedRel.evolution.map((evo, index) => (
                <div
                  key={`${evo.chapterId}-${index}`}
                  className='border-l-2 border-primary py-2 pl-4'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>Chapter {evo.chapterNumber}</p>
                      {evo.event && (
                        <p className='mt-1 text-xs text-muted-foreground'>{evo.event}</p>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary' className='capitalize'>
                        {evo.type.replace('_', ' ')}
                      </Badge>
                      <span className='text-sm font-medium'>Strength: {evo.strength}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Strongest Relationships */}
        <Card className='p-6'>
          <h3 className='mb-4 text-lg font-semibold'>Strongest Relationships</h3>
          <div className='space-y-3'>
            {characterGraph.relationships
              .sort((a, b) => b.strength - a.strength)
              .slice(0, 5)
              .map(rel => (
                <RelationshipCard
                  key={rel.id}
                  relationship={rel}
                  nodes={characterGraph.nodes}
                  onClick={() => handleRelationshipClick(rel)}
                  isSelected={selectedRelationship === rel.id}
                />
              ))}
          </div>
        </Card>
      </div>
    );
  },
);

// Simple Network Graph (visual representation)
interface SimpleNetworkGraphProps {
  nodes: CharacterNode[];
  relationships: CharacterRelationship[];
  selectedNode: string | null;
  onNodeClick: (nodeId: string) => void;
}

const SimpleNetworkGraph: React.FC<SimpleNetworkGraphProps> = ({
  nodes,
  relationships,
  selectedNode,
  onNodeClick,
}) => {
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
  const [hoveredRelationship, setHoveredRelationship] = React.useState<string | null>(null);

  // Position nodes in a circle
  const nodePositions = useMemo(() => {
    const radius = 150;
    const centerX = 200;
    const centerY = 200;

    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      return {
        id: node.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [nodes]);

  const getPosition = (nodeId: string) => {
    return nodePositions.find(p => p.id === nodeId) || { x: 0, y: 0 };
  };

  // Get node color by role
  const getNodeColor = (node: CharacterNode, isSelected: boolean, isHovered: boolean): string => {
    if (isSelected) return 'hsl(var(--primary))';
    if (isHovered) return 'hsl(var(--accent))';

    const roleColors: Record<string, string> = {
      protagonist: '#3b82f6', // blue
      antagonist: '#ef4444', // red
      supporting: '#10b981', // green
      mentor: '#8b5cf6', // purple
      comic_relief: '#f59e0b', // orange
      love_interest: '#ec4899', // pink
      sidekick: '#06b6d4', // cyan
    };

    return roleColors[node.role] || '#6b7280'; // gray default
  };

  // Get relationship color by type
  const getRelationshipColor = (type: string, isHovered: boolean): string => {
    if (isHovered) return 'hsl(var(--primary))';

    const relationshipColors: Record<string, string> = {
      ally: '#3b82f6', // blue
      enemy: '#ef4444', // red
      romantic: '#ec4899', // pink
      family: '#8b5cf6', // purple
      mentor: '#10b981', // green
      mentee: '#06b6d4', // cyan
      rival: '#f59e0b', // orange
      neutral: '#6b7280', // gray
      antagonist: '#dc2626', // dark red
      friend: '#60a5fa', // light blue
    };

    return relationshipColors[type] || '#9ca3af'; // light gray default
  };

  return (
    <svg viewBox='0 0 400 400' className='h-full w-full'>
      {/* Draw relationships as lines */}
      {relationships.map(rel => {
        const pos1 = getPosition(rel.character1Id);
        const pos2 = getPosition(rel.character2Id);
        const isHovered = hoveredRelationship === rel.id;
        const isConnectedToHovered =
          hoveredNode && (rel.character1Id === hoveredNode || rel.character2Id === hoveredNode);

        return (
          <line
            key={rel.id}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={getRelationshipColor(rel.type, isHovered)}
            strokeWidth={Math.max(2, rel.strength / 3)}
            opacity={isHovered || isConnectedToHovered ? 0.8 : 0.3}
            className='cursor-pointer transition-opacity'
            onMouseEnter={() => setHoveredRelationship(rel.id)}
            onMouseLeave={() => setHoveredRelationship(null)}
          />
        );
      })}

      {/* Draw nodes */}
      {nodes.map(node => {
        const pos = getPosition(node.id);
        const isSelected = selectedNode === node.id;
        const isHovered = hoveredNode === node.id;
        const radius = 10 + node.importance;

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Node shadow for hover effect */}
            {isHovered && (
              <circle
                r={radius + 4}
                fill={getNodeColor(node, isSelected, isHovered)}
                opacity={0.3}
                className='animate-pulse'
              />
            )}
            <circle
              r={radius}
              fill={getNodeColor(node, isSelected, isHovered)}
              stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
              strokeWidth={isSelected ? 3 : 2}
              className='cursor-pointer transition-all hover:stroke-[3]'
              onClick={() => onNodeClick(node.id)}
            />
            <text
              y={radius + 15}
              textAnchor='middle'
              fontSize={isHovered ? '13' : '12'}
              fontWeight={isHovered ? 'bold' : 'normal'}
              fill='hsl(var(--foreground))'
              className='pointer-events-none transition-all'
            >
              {node.name.length > 10 ? `${node.name.substring(0, 10)}...` : node.name}
            </text>
            {/* Show importance on hover */}
            {isHovered && (
              <text
                y={-radius - 5}
                textAnchor='middle'
                fontSize='10'
                fill='hsl(var(--muted-foreground))'
                className='pointer-events-none'
              >
                {node.role} • {node.importance}/10
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// Character Node Card
interface CharacterNodeCardProps {
  node: CharacterNode;
  isSelected: boolean;
  onClick: () => void;
}

const CharacterNodeCard: React.FC<CharacterNodeCardProps> = ({ node, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 text-left transition-colors',
        isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50',
      )}
      data-testid='character-node-card'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1'>
          <h4 className='text-sm font-medium'>{node.name}</h4>
          <p className='mt-1 text-xs text-muted-foreground'>{node.role}</p>
        </div>
        <div className='flex flex-col items-end gap-1'>
          <Badge variant='secondary' className='text-xs'>
            {node.connectionCount} connections
          </Badge>
          <span className='text-xs text-muted-foreground'>Importance: {node.importance}/10</span>
        </div>
      </div>
    </button>
  );
};

// Relationship Card
interface RelationshipCardProps {
  relationship: CharacterRelationship;
  nodes: CharacterNode[];
  currentNodeId?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({
  relationship,
  nodes,
  currentNodeId,
  isSelected,
  onClick,
}) => {
  const char1 = nodes.find(n => n.id === relationship.character1Id);
  const char2 = nodes.find(n => n.id === relationship.character2Id);

  const otherChar = currentNodeId === relationship.character1Id ? char2 : char1;

  const relationshipColors = {
    ally: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    enemy: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    romantic: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    family: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    mentor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    mentee: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    rival: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    antagonist: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    friend: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-colors',
        isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50',
      )}
      data-testid='relationship-card'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1'>
          <p className='text-sm font-medium'>
            {currentNodeId ? (
              <span>{otherChar?.name || 'Unknown'}</span>
            ) : (
              <span>
                {char1?.name || 'Unknown'} ↔ {char2?.name || 'Unknown'}
              </span>
            )}
          </p>
          {relationship.description && (
            <p className='mt-1 text-xs text-muted-foreground'>{relationship.description}</p>
          )}
        </div>
        <div className='flex flex-col items-end gap-1'>
          <span
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium',
              relationshipColors[relationship.type],
            )}
          >
            {relationship.type.replace('_', ' ')}
          </span>
          <span className='text-xs text-muted-foreground'>
            Strength: {relationship.strength}/10
          </span>
        </div>
      </div>
    </button>
  );
};
