# Progress Tracking

Monitor and report on workflow execution status in real-time for better
coordination and transparency.

## Why Progress Tracking Matters

- **Visibility**: Know what's happening at all times
- **Coordination**: Enable informed decision-making
- **Estimation**: Provide accurate time estimates
- **Debugging**: Identify where workflows stall
- **Transparency**: Show stakeholders progress
- **Optimization**: Identify bottlenecks

## Tracking Components

### 1. Task Status

Track each task with:

```typescript
interface TaskStatus {
  id: string; // Unique identifier
  name: string; // Human-readable name
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  agent?: string; // Agent responsible
  startTime?: number; // Unix timestamp
  endTime?: number; // Unix timestamp
  duration?: number; // Actual duration (ms)
  estimatedDuration?: number; // Estimated duration (ms)
  dependencies: string[]; // Task IDs this depends on
  qualityGates?: string[]; // Quality gates to run
  artifacts?: string[]; // Output artifacts
  error?: Error; // If failed
  notes?: string; // Additional information
}
```

### 2. Workflow Progress

```typescript
interface WorkflowProgress {
  workflowId: string;
  workflowName: string;
  totalTasks: number;
  completedTasks: number;
  currentTask?: TaskStatus;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  tasks: TaskStatus[];
  phases: PhaseStatus[];
}

interface PhaseStatus {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  taskCount: number;
  completedCount: number;
}
```

## Tracking Implementation

### Basic Progress Tracker

```typescript
class ProgressTracker {
  private workflow: WorkflowProgress;
  private listeners: Array<(progress: WorkflowProgress) => void> = [];

  constructor(workflowName: string, tasks: TaskStatus[]) {
    this.workflow = {
      workflowId: generateId(),
      workflowName,
      totalTasks: tasks.length,
      completedTasks: 0,
      startTime: Date.now(),
      status: 'running',
      tasks,
      phases: [],
    };

    this.report();
  }

  startTask(taskId: string): void {
    const task = this.workflow.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    task.status = 'in_progress';
    task.startTime = Date.now();
    this.workflow.currentTask = task;

    console.log(`\n▶️ Starting task: ${task.name}`);
    this.report();
  }

  completeTask(taskId: string, artifacts?: string[]): void {
    const task = this.workflow.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'completed';
    task.endTime = Date.now();
    task.duration = task.endTime - (task.startTime || Date.now());
    task.artifacts = artifacts;

    this.workflow.completedTasks++;

    console.log(`✅ Completed task: ${task.name} (${task.duration}ms)`);
    this.report();
  }

  failTask(taskId: string, error: Error): void {
    const task = this.workflow.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'failed';
    task.endTime = Date.now();
    task.duration = task.endTime - (task.startTime || Date.now());
    task.error = error;

    this.workflow.status = 'failed';

    console.error(`❌ Failed task: ${task.name}`);
    console.error(`Error: ${error.message}`);
    this.report();
  }

  startPhase(name: string): void {
    const phase: PhaseStatus = {
      name,
      status: 'in_progress',
      startTime: Date.now(),
      taskCount: 0,
      completedCount: 0,
    };

    this.workflow.phases.push(phase);
    console.log(`\n=== Phase: ${name} ===`);
    this.report();
  }

  completePhase(name: string): void {
    const phase = this.workflow.phases.find(p => p.name === name);
    if (!phase) return;

    phase.status = 'completed';
    phase.endTime = Date.now();

    console.log(`✅ Phase completed: ${name}`);
    this.report();
  }

  private report(): void {
    const percentage = Math.round(
      (this.workflow.completedTasks / this.workflow.totalTasks) * 100,
    );

    const current = this.workflow.currentTask
      ? `Current: ${this.workflow.currentTask.name}`
      : '';

    console.log(
      `\n📊 Progress: ${this.workflow.completedTasks}/${this.workflow.totalTasks} (${percentage}%) ${current}`,
    );

    // Notify listeners
    this.listeners.forEach(listener => listener(this.workflow));
  }

  onProgress(callback: (progress: WorkflowProgress) => void): void {
    this.listeners.push(callback);
  }

  getProgress(): WorkflowProgress {
    return { ...this.workflow };
  }

  complete(): void {
    this.workflow.endTime = Date.now();
    this.workflow.status = 'completed';
    this.workflow.currentTask = undefined;

    const duration = this.workflow.endTime - this.workflow.startTime;
    console.log(`\n✅ Workflow completed: ${this.workflow.workflowName}`);
    console.log(
      `Total duration: ${duration}ms (${Math.round(duration / 1000 / 60)}m ${Math.round((duration % 60000) / 1000)}s)`,
    );
    this.report();
  }
}
```

### Usage

```typescript
// Create tracker
const tracker = new ProgressTracker('Fix All Issues', [
  { id: '1', name: 'Analyze failures', dependencies: [] },
  { id: '2', name: 'Implement fixes', dependencies: ['1'] },
  { id: '3', name: 'Run tests', dependencies: ['2'] },
  { id: '4', name: 'Verify', dependencies: ['3'] },
]);

// Track progress
tracker.startPhase('Analysis');
tracker.startTask('1');

// ... execute task ...

tracker.completeTask('1', ['analysis-report.json']);
tracker.completePhase('Analysis');

tracker.startPhase('Implementation');
tracker.startTask('2');

// ... execute task ...

tracker.completeTask('2');
tracker.completePhase('Implementation');

// ... continue with remaining tasks ...

tracker.complete();
```

## Reporting Formats

### Console Output

```typescript
function formatProgress(progress: WorkflowProgress): string {
  const percentage = Math.round(
    (progress.completedTasks / progress.totalTasks) * 100,
  );

  const current = progress.currentTask
    ? `Current: ${progress.currentTask.name}`
    : 'Waiting...';

  const eta = calculateETA(progress);

  return `
╔════════════════════════════════════════════╗
║  Workflow: ${progress.workflowName}                   ║
║  Progress: ${progress.completedTasks}/${progress.totalTasks} (${percentage}%)${' '.repeat(10 - percentage.toString().length)}  ║
║  ${current.padEnd(50)} ║
║  ETA: ${eta}                                         ║
╚════════════════════════════════════════════╝
`;
}

function calculateETA(progress: WorkflowProgress): string {
  if (!progress.currentTask || !progress.currentTask.startTime) {
    return 'Unknown';
  }

  const elapsed = Date.now() - progress.startTime;
  const avgTimePerTask = elapsed / progress.completedTasks;
  const remainingTasks = progress.totalTasks - progress.completedTasks;
  const remainingTime = avgTimePerTask * remainingTasks;

  return `${Math.round(remainingTime / 1000)}s`;
}
```

### Markdown Report

```typescript
function formatMarkdown(progress: WorkflowProgress): string {
  const percentage = Math.round(
    (progress.completedTasks / progress.totalTasks) * 100,
  );

  return `
# Workflow Progress: ${progress.workflowName}

## Overview
- **Status**: ${progress.status.toUpperCase()}
- **Progress**: ${progress.completedTasks}/${progress.totalTasks} (${percentage}%)
- **Started**: ${new Date(progress.startTime).toISOString()}
- **Current Task**: ${progress.currentTask?.name || 'None'}

## Tasks
${progress.tasks
  .map(task => {
    const icon =
      task.status === 'completed'
        ? '✅'
        : task.status === 'in_progress'
          ? '▶️'
          : task.status === 'failed'
            ? '❌'
            : task.status === 'blocked'
              ? '🚫'
              : '⏳';
    const duration = task.duration ? `${task.duration}ms` : '-';
    return `- [${icon}] ${task.name} (${task.status}) ${duration}`;
  })
  .join('\n')}

## Phases
${progress.phases
  .map(phase => {
    const icon =
      phase.status === 'completed'
        ? '✅'
        : phase.status === 'in_progress'
          ? '▶️'
          : phase.status === 'failed'
            ? '❌'
            : '⏳';
    return `- [${icon}] ${phase.name} (${phase.completedCount}/${phase.taskCount} tasks)`;
  })
  .join('\n')}
`;
}
```

### JSON Report

```typescript
function formatJSON(progress: WorkflowProgress): string {
  return JSON.stringify(progress, null, 2);
}
```

## ETA Calculation

### Linear Estimation

```typescript
function calculateLinearETA(progress: WorkflowProgress): number {
  if (progress.completedTasks === 0) {
    return 0;
  }

  const elapsed = Date.now() - progress.startTime;
  const avgTimePerTask = elapsed / progress.completedTasks;
  const remainingTasks = progress.totalTasks - progress.completedTasks;

  return avgTimePerTask * remainingTasks;
}
```

### Weighted Estimation

```typescript
function calculateWeightedETA(
  progress: WorkflowProgress,
  taskEstimates: Map<string, number>,
): number {
  let remainingTime = 0;

  for (const task of progress.tasks) {
    if (task.status !== 'pending') continue;

    // Use provided estimate or fallback to linear
    const estimate =
      taskEstimates.get(task.id) ||
      (progress.completedTasks > 0
        ? (Date.now() - progress.startTime) / progress.completedTasks
        : 60000); // Default 1 minute

    remainingTime += estimate;
  }

  return remainingTime;
}
```

### Adaptive Estimation

```typescript
function calculateAdaptiveETA(progress: WorkflowProgress): number {
  if (progress.completedTasks < 2) {
    return calculateLinearETA(progress);
  }

  // Weight recent tasks more heavily
  const recentTasks = progress.tasks
    .filter(t => t.status === 'completed')
    .slice(-3);

  const avgRecentTime =
    recentTasks.reduce((sum, t) => sum + (t.duration || 0), 0) /
    recentTasks.length;

  const remainingTasks = progress.tasks.filter(
    t => t.status === 'pending',
  ).length;

  return avgRecentTime * remainingTasks;
}
```

## Real-Time Updates

### Progress Callbacks

```typescript
async function executeWithProgress(
  workflow: WorkflowDefinition,
  onProgress: (progress: WorkflowProgress) => void,
): Promise<void> {
  const tracker = new ProgressTracker(workflow.name, workflow.tasks);

  // Subscribe to updates
  tracker.onProgress(onProgress);

  // Execute workflow
  for (const phase of workflow.phases) {
    tracker.startPhase(phase.name);

    for (const taskId of phase.taskIds) {
      tracker.startTask(taskId);

      try {
        const result = await executeTask(taskId);
        tracker.completeTask(taskId, result.artifacts);
      } catch (error) {
        tracker.failTask(taskId, error as Error);
        throw error;
      }
    }

    tracker.completePhase(phase.name);
  }

  tracker.complete();
}
```

### Webhook Updates

```typescript
interface ProgressWebhook {
  url: string;
  auth?: string;
  interval: number; // milliseconds
}

async function executeWithWebhook(
  workflow: WorkflowDefinition,
  webhook: ProgressWebhook,
): Promise<void> {
  const tracker = new ProgressTracker(workflow.name, workflow.tasks);

  // Send updates periodically
  const intervalId = setInterval(async () => {
    const progress = tracker.getProgress();

    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: webhook.auth || '',
        },
        body: JSON.stringify(progress),
      });
    } catch (error) {
      console.error('Failed to send webhook update:', error);
    }
  }, webhook.interval);

  try {
    await executeWithProgress(workflow, progress => {
      console.log(formatProgress(progress));
    });
  } finally {
    clearInterval(intervalId);
  }
}
```

## Visualization

### Progress Bar

```typescript
function renderProgressBar(percentage: number, width = 50): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + '] ' + percentage + '%';
}

// Usage
const percentage = Math.round((completed / total) * 100);
console.log(renderProgressBar(percentage));
// Output: [██████████████████░░░░░░░░░░░░░░░] 45%
```

### Task Timeline

```typescript
function renderTimeline(progress: WorkflowProgress): string {
  const maxDuration = Math.max(
    ...progress.tasks.filter(t => t.duration).map(t => t.duration || 0),
  );

  let timeline = '';

  progress.tasks.forEach(task => {
    const statusIcon =
      task.status === 'completed'
        ? '✅'
        : task.status === 'in_progress'
          ? '▶️'
          : task.status === 'failed'
            ? '❌'
            : '⏳';

    const duration = task.duration || task.estimatedDuration || 0;
    const barLength = Math.round((duration / maxDuration) * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);

    timeline += `${statusIcon} ${task.name}\n`;
    timeline += `    ${bar} ${Math.round(duration / 1000)}s\n`;
  });

  return timeline;
}
```

## Best Practices

### ✅ Do

- Track progress from workflow start to finish
- Provide clear, human-readable status updates
- Calculate and display ETA
- Report errors immediately
- Use multiple reporting formats (console, markdown, JSON)
- Enable real-time updates
- Track phases and tasks separately
- Log timing information

### ❌ Don't

- Forget to update progress
- Use unclear status messages
- Provide misleading ETAs
- Hide errors from progress reports
- Update only at the end
- Use single reporting format
- Lose context between updates
- Skip timing information

## Performance Metrics

- **Update frequency**: 1-5 seconds per task completion
- **Reporting overhead**: < 50ms per update
- **ETA accuracy**: ± 20% (improves as workflow progresses)
- **Memory usage**: < 1MB for typical workflow
- **Network usage**: < 1KB per webhook update

## Examples

### Example 1: Console Progress Tracking

```typescript
async function fixAllIssues(): Promise<void> {
  const tracker = new ProgressTracker('Fix All Issues', [
    { id: '1', name: 'Analyze E2E failures', estimatedDuration: 120000 },
    { id: '2', name: 'Fix accessibility', estimatedDuration: 90000 },
    { id: '3', name: 'Optimize performance', estimatedDuration: 60000 },
    { id: '4', name: 'Run tests', estimatedDuration: 300000 },
  ]);

  tracker.onProgress(progress => {
    const percentage = Math.round(
      (progress.completedTasks / progress.totalTasks) * 100,
    );
    const bar = renderProgressBar(percentage);
    const eta = calculateAdaptiveETA(progress);

    console.log(`${bar} ETA: ${Math.round(eta / 1000)}s`);
  });

  // Execute workflow
  for (const task of tracker.getProgress().tasks) {
    tracker.startTask(task.id);

    try {
      await executeTask(task.id);
      tracker.completeTask(task.id);
    } catch (error) {
      tracker.failTask(task.id, error as Error);
      throw error;
    }
  }

  tracker.complete();
}
```

### Example 2: GitHub Actions Integration

```typescript
async function executeWithGitHubUpdates(): Promise<void> {
  const tracker = new ProgressTracker('Fix Issues', workflowTasks);

  // Update GitHub status on progress
  tracker.onProgress(async progress => {
    const percentage = Math.round(
      (progress.completedTasks / progress.totalTasks) * 100,
    );

    await runCommand(`gh api repos/:owner/:repo/statuses/:sha \
      --field state=pending \
      --field description="${percentage}% complete" \
      --field context="workflow-progress"`);
  });

  try {
    await executeWorkflow(workflowTasks);
  } finally {
    // Set final status
    const finalProgress = tracker.getProgress();
    const state = finalProgress.status === 'completed' ? 'success' : 'failure';

    await runCommand(`gh api repos/:owner/:repo/statuses/:sha \
      --field state=${state} \
      --field description="${finalProgress.completedTasks}/${finalProgress.totalTasks} tasks completed" \
      --field context="workflow-progress"`);
  }
}
```

## Monitor and report workflow progress for transparency and coordination.
