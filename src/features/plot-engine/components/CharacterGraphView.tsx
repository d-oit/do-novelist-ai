/**
 * Character Graph View Component
 * 
 * Interactive network visualization of character relationships
 */

import React, { useMemo, useState } from 'react';

import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';

import type { CharacterGraph, CharacterRelationship, CharacterNode } from '@/features/plot-engine';

interface CharacterGraphViewProps {
  characterGraph: CharacterGraph;
  onNodeClick?: (nodeId: string) => void;
  onRelationshipClick?: (relationship: CharacterRelationship) => void;
}

export const CharacterGraphView: React.FC<CharacterGraphViewProps> = ({
  characterGraph,
  onNodeClick,
  onRelationshipClick,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);

  // Get relationships for selected node
  const nodeRelationships = useMemo(() => {
    if (!selectedNode) return [];
    return characterGraph.relationships.filter(
      (rel) => rel.character1Id === selectedNode || rel.character2Id === selectedNode,
    );
  }, [selectedNode, characterGraph.relationships]);

  // Get node by ID
  const getNode = (id: string): CharacterNode | undefined => {
    return characterGraph.nodes.find((n) => n.id === id);
  };

  // Get selected relationship
  const selectedRel = useMemo(() => {
    if (!selectedRelationship) return null;
    return characterGraph.relationships.find((r) => r.id === selectedRelationship);
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
    <div className="space-y-6">
      {/* Graph Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Character Network</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Characters</p>
            <p className="text-2xl font-bold mt-1">{characterGraph.nodes.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Relationships</p>
            <p className="text-2xl font-bold mt-1">{characterGraph.relationships.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Avg Connections</p>
            <p className="text-2xl font-bold mt-1">
              {characterGraph.nodes.length > 0
                ? Math.round(
                    characterGraph.nodes.reduce((sum, n) => sum + n.connectionCount, 0) /
                      characterGraph.nodes.length,
                  )
                : 0}
            </p>
          </div>
        </div>

        {/* Simplified Network Visualization */}
        <div className="relative bg-muted/30 rounded-lg p-8 min-h-[400px]">
          <SimpleNetworkGraph
            nodes={characterGraph.nodes}
            relationships={characterGraph.relationships}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
          />
        </div>
      </Card>

      {/* Character List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Characters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {characterGraph.nodes
            .sort((a, b) => b.importance - a.importance)
            .map((node) => (
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
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {getNode(selectedNode)?.name} - Relationships
          </h3>
          {nodeRelationships.length > 0 ? (
            <div className="space-y-3">
              {nodeRelationships.map((rel) => (
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
            <p className="text-sm text-muted-foreground">No relationships found</p>
          )}
        </Card>
      )}

      {/* Relationship Evolution */}
      {selectedRel && selectedRel.evolution.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Relationship Evolution</h3>
          <div className="space-y-3">
            {selectedRel.evolution.map((evo, index) => (
              <div
                key={`${evo.chapterId}-${index}`}
                className="border-l-2 border-primary pl-4 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Chapter {evo.chapterNumber}</p>
                    {evo.event && (
                      <p className="text-xs text-muted-foreground mt-1">{evo.event}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {evo.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm font-medium">Strength: {evo.strength}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strongest Relationships */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Strongest Relationships</h3>
        <div className="space-y-3">
          {characterGraph.relationships
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 5)
            .map((rel) => (
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
};

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
    return nodePositions.find((p) => p.id === nodeId) || { x: 0, y: 0 };
  };

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      {/* Draw relationships as lines */}
      {relationships.map((rel) => {
        const pos1 = getPosition(rel.character1Id);
        const pos2 = getPosition(rel.character2Id);

        return (
          <line
            key={rel.id}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={Math.max(1, rel.strength / 5)}
            opacity={0.3}
          />
        );
      })}

      {/* Draw nodes */}
      {nodes.map((node) => {
        const pos = getPosition(node.id);
        const isSelected = selectedNode === node.id;
        const radius = 10 + node.importance;

        return (
          <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
            <circle
              r={radius}
              fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
              stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
              strokeWidth={2}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNodeClick(node.id)}
            />
            <text
              y={radius + 15}
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--foreground))"
              className="pointer-events-none"
            >
              {node.name.length > 10 ? `${node.name.substring(0, 10)}...` : node.name}
            </text>
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
      className={`text-left p-3 border rounded-lg transition-colors ${
        isSelected
          ? 'bg-primary/10 border-primary'
          : 'hover:bg-muted/50'
      }`}
      data-testid="character-node-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{node.name}</h4>
          <p className="text-xs text-muted-foreground mt-1">{node.role}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-xs">
            {node.connectionCount} connections
          </Badge>
          <span className="text-xs text-muted-foreground">
            Importance: {node.importance}/10
          </span>
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
  const char1 = nodes.find((n) => n.id === relationship.character1Id);
  const char2 = nodes.find((n) => n.id === relationship.character2Id);

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
      className={`w-full text-left p-3 border rounded-lg transition-colors ${
        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
      }`}
      data-testid="relationship-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-sm">
            {currentNodeId ? (
              <span>{otherChar?.name || 'Unknown'}</span>
            ) : (
              <span>
                {char1?.name || 'Unknown'} ↔ {char2?.name || 'Unknown'}
              </span>
            )}
          </p>
          {relationship.description && (
            <p className="text-xs text-muted-foreground mt-1">{relationship.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${relationshipColors[relationship.type]}`}
          >
            {relationship.type.replace('_', ' ')}
          </span>
          <span className="text-xs text-muted-foreground">Strength: {relationship.strength}/10</span>
        </div>
      </div>
    </button>
  );
};
