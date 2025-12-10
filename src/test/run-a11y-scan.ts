/**
 * Comprehensive Accessibility Scan Script
 * Scans key components and generates detailed violation report
 */

import { render } from '@testing-library/react';
import React from 'react';


// Import components to scan
import ActionCard from '../components/ActionCard';
import GoapVisualizer from '../components/GoapVisualizer';
import Header from '../components/layout/Header';
import MainLayout from '../components/layout/MainLayout';
import { UserProvider } from '../contexts/UserContext';
import SettingsView from '../features/settings/components/SettingsView';
import { AgentMode, PublishStatus } from '../shared/types';

import { runA11yTests, groupViolationsBySeverity, formatViolations } from './a11y-utils';
import type { A11yViolation } from './a11y-utils';

interface ComponentScanResult {
  name: string;
  totalViolations: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  violations: A11yViolation[];
}

async function scanComponent(
  name: string,
  element: React.ReactElement,
): Promise<ComponentScanResult> {
  const { container } = render(element);
  const results = await runA11yTests(container);
  const grouped = groupViolationsBySeverity(results.violations);

  return {
    name,
    totalViolations: results.violations.length,
    critical: grouped.critical.length,
    serious: grouped.serious.length,
    moderate: grouped.moderate.length,
    minor: grouped.minor.length,
    violations: results.violations,
  };
}

async function runComprehensiveScan(): Promise<void> {
  console.log('\n========================================');
  console.log('ACCESSIBILITY SCAN - WCAG 2.1 AA');
  console.log('========================================\n');

  const components = [
    {
      name: 'MainLayout',
      element: React.createElement(MainLayout, null, React.createElement('div', null, 'Content')),
    },
    {
      name: 'Header',
      element: React.createElement(Header, {
        projectTitle: 'Test Project',
        onNewProject: () => {},
        currentView: 'dashboard',
        onNavigate: () => {},
      }),
    },
    {
      name: 'ActionCard',
      element: React.createElement(ActionCard, {
        action: {
          name: 'test-action',
          label: 'Test Action',
          description: 'Test description',
          cost: 1,
          agentMode: AgentMode.SINGLE,
          preconditions: {},
          effects: {},
          promptTemplate: 'Test',
          category: 'generation' as const,
          estimatedDuration: 1000,
          requiredPermissions: ['test'],
          tags: ['test'],
        },
        isActive: false,
        onClick: () => {},
      }),
    },
    {
      name: 'GoapVisualizer',
      element: React.createElement(GoapVisualizer, {
        project: {
          id: 'test',
          title: 'Test',
          idea: 'Test',
          style: 'General Fiction' as const,
          status: PublishStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
          chapters: [],
          worldState: {
            hasTitle: true,
            hasOutline: false,
            chaptersCompleted: 0,
            chaptersCount: 0,
            styleDefined: false,
            isPublished: false,
            hasCharacters: false,
            hasWorldBuilding: false,
            hasThemes: false,
            plotStructureDefined: false,
            targetAudienceDefined: false,
          },
          isGenerating: false,
          language: 'en' as const,
          targetWordCount: 50000,
          settings: {},
          genre: [],
          targetAudience: 'adult' as const,
          contentWarnings: [],
          keywords: [],
          synopsis: '',
          authors: [],
          analytics: {
            totalWordCount: 0,
            averageChapterLength: 0,
            estimatedReadingTime: 0,
            generationCost: 0,
            editingRounds: 0,
          },
          version: '1.0.0',
          changeLog: [],
          timeline: {
            id: 'test-timeline',
            projectId: 'test',
            events: [],
            eras: [],
            settings: {
              viewMode: 'chronological',
              zoomLevel: 1,
              showCharacters: true,
              showImplicitEvents: false,
            },
          },
        },
        currentAction: null,
      }),
    },
    {
      name: 'SettingsView',
      element: React.createElement(UserProvider, null, React.createElement(SettingsView)),
    },
  ];

  const results: ComponentScanResult[] = [];

  for (const component of components) {
    try {
      const result = await scanComponent(component.name, component.element);
      results.push(result);
    } catch (error) {
      console.error(`Error scanning ${component.name}:`, error);
    }
  }

  // Print summary
  console.log('\n=== SUMMARY ===\n');
  const totalCritical = results.reduce((sum, r) => sum + r.critical, 0);
  const totalSerious = results.reduce((sum, r) => sum + r.serious, 0);
  const totalModerate = results.reduce((sum, r) => sum + r.moderate, 0);
  const totalMinor = results.reduce((sum, r) => sum + r.minor, 0);

  console.log(`Total Components Scanned: ${results.length}`);
  console.log(`Total Violations: ${results.reduce((sum, r) => sum + r.totalViolations, 0)}`);
  console.log(`  - Critical: ${totalCritical}`);
  console.log(`  - Serious: ${totalSerious}`);
  console.log(`  - Moderate: ${totalModerate}`);
  console.log(`  - Minor: ${totalMinor}\n`);

  // Print detailed results for each component
  for (const result of results) {
    if (result.totalViolations > 0) {
      console.log(`\n=== ${result.name} ===`);
      console.log(
        `Total: ${result.totalViolations} | Critical: ${result.critical} | Serious: ${result.serious} | Moderate: ${result.moderate} | Minor: ${result.minor}\n`,
      );

      console.log(formatViolations(result.violations));
    }
  }

  // Print critical violations that need immediate attention
  const criticalViolations = results
    .filter(r => r.critical > 0)
    .map(r => ({
      component: r.name,
      violations: r.violations.filter(v => v.impact === 'critical'),
    }));

  if (criticalViolations.length > 0) {
    console.log('\n========================================');
    console.log('CRITICAL VIOLATIONS - IMMEDIATE ACTION REQUIRED');
    console.log('========================================\n');

    for (const { component, violations } of criticalViolations) {
      console.log(`\n>>> ${component} (${violations.length} critical)\n`);
      for (const violation of violations) {
        console.log(`ID: ${violation.id}`);
        console.log(`Description: ${violation.description}`);
        console.log(`Help: ${violation.help}`);
        console.log(`URL: ${violation.helpUrl}`);
        console.log(`Affected Elements:`);
        for (const node of violation.nodes) {
          console.log(`  - ${node.target.join(' > ')}`);
          console.log(`    HTML: ${node.html}`);
          if (node.failureSummary) {
            console.log(`    Issue: ${node.failureSummary}`);
          }
        }
        console.log('');
      }
    }
  } else {
    console.log('\n=== SUCCESS: No critical violations found! ===\n');
  }
}

// Run the scan
runComprehensiveScan().catch(console.error);
