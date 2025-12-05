import { render } from '@testing-library/react';
import axe, { type AxeResults } from 'axe-core';
import Header from '../components/layout/Header';

async function debugHeaderAccessibility(): Promise<void> {
  console.log('Testing Header accessibility...');

  const { container } = render(
    <Header
      projectTitle='Test Project'
      onNewProject={() => {}}
      currentView='dashboard'
      onNavigate={() => {}}
    />,
  );

  const results = await new Promise<AxeResults>((resolve, reject) => {
    axe.run(
      container,
      {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
        },
      },
      (error, results) => {
        if (error) reject(error);
        else resolve(results);
      },
    );
  });

  console.log(`\n=== ACCESSIBILITY RESULTS ===`);
  console.log(`Total violations: ${results.violations.length}`);
  console.log(`Passes: ${results.passes.length}`);
  console.log(`Incomplete: ${results.incomplete.length}`);
  console.log(`Inapplicable: ${results.inapplicable.length}`);

  if (results.violations.length > 0) {
    console.log(`\n=== VIOLATIONS DETAILS ===`);
    results.violations.forEach((violation, index) => {
      console.log(`\n${index + 1}. [${violation.id}] ${violation.help}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Description: ${violation.description}`);
      console.log(`   Help URL: ${violation.helpUrl}`);
      console.log(`   Nodes affected: ${violation.nodes.length}`);

      violation.nodes.forEach((node, nodeIndex) => {
        console.log(`   \n   Node ${nodeIndex + 1}:`);
        console.log(`     Target: ${node.target.join(' > ')}`);
        console.log(`     HTML: ${node.html.substring(0, 200)}...`);
        if (node.failureSummary) {
          console.log(`     Failure Summary: ${node.failureSummary}`);
        }
      });
    });
  }
}

debugHeaderAccessibility().catch(console.error);
