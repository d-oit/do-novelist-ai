#!/usr/bin/env node

/**
 * Performance monitoring script for Novelist.ai
 * Tracks bundle sizes, build times, and performance metrics over time
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PERFORMANCE_DIR = path.join('logs', '.performance-metrics');
const THRESHOLDS = {
  mainBundleSize: 250 * 1024, // 250KB (increased from 200KB for complex apps)
  totalBuildSize: 3 * 1024 * 1024, // 3MB
  buildTime: 30000, // 30 seconds
  maxChunks: 20,
  minChunks: 5,
};

function ensurePerformanceDir() {
  if (!fs.existsSync(PERFORMANCE_DIR)) {
    fs.mkdirSync(PERFORMANCE_DIR, { recursive: true });
  }
}

function getBuildMetrics() {
  const distPath = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    throw new Error('Build directory not found. Run `npm run build` first.');
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || 'local',
    branch: process.env.GITHUB_REF_NAME || 'local',
  };

  // Get total build size
  const totalSize = execSync(`du -sb ${distPath}`, { encoding: 'utf8' });
  metrics.totalBuildSize = parseInt(totalSize.split('\t')[0]);

  // Get asset sizes
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assets = fs.readdirSync(assetsPath);

    const jsFiles = assets.filter(f => f.endsWith('.js'));
    const cssFiles = assets.filter(f => f.endsWith('.css'));

    metrics.chunkCount = jsFiles.length;

    // Find main bundle (specifically the index bundle, not the largest vendor chunk)
    let mainBundleSize = 0;
    let largestChunkSize = 0;

    jsFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;

      if (size > largestChunkSize) {
        largestChunkSize = size;
      }

      // Main bundle is specifically the index-*.js file, not vendor chunks
      if (file.startsWith('index-')) {
        mainBundleSize = size;
      }
    });

    // If no index bundle found, use the smallest chunk as main bundle
    if (mainBundleSize === 0 && jsFiles.length > 0) {
      mainBundleSize = Math.min(
        ...jsFiles.map(file => {
          const filePath = path.join(assetsPath, file);
          return fs.statSync(filePath).size;
        }),
      );
    }

    metrics.mainBundleSize = mainBundleSize;
    metrics.largestChunkSize = largestChunkSize;

    // CSS metrics
    metrics.cssSize = cssFiles.reduce((total, file) => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      return total + stats.size;
    }, 0);
  }

  return metrics;
}

function checkThresholds(metrics) {
  const violations = [];

  if (metrics.mainBundleSize > THRESHOLDS.mainBundleSize) {
    violations.push({
      metric: 'mainBundleSize',
      value: metrics.mainBundleSize,
      threshold: THRESHOLDS.mainBundleSize,
      message: `Main bundle size ${formatBytes(metrics.mainBundleSize)} exceeds threshold ${formatBytes(THRESHOLDS.mainBundleSize)}`,
    });
  }

  if (metrics.totalBuildSize > THRESHOLDS.totalBuildSize) {
    violations.push({
      metric: 'totalBuildSize',
      value: metrics.totalBuildSize,
      threshold: THRESHOLDS.totalBuildSize,
      message: `Total build size ${formatBytes(metrics.totalBuildSize)} exceeds threshold ${formatBytes(THRESHOLDS.totalBuildSize)}`,
    });
  }

  if (metrics.chunkCount > THRESHOLDS.maxChunks) {
    violations.push({
      metric: 'chunkCount',
      value: metrics.chunkCount,
      threshold: THRESHOLDS.maxChunks,
      message: `Chunk count ${metrics.chunkCount} exceeds maximum ${THRESHOLDS.maxChunks}`,
    });
  }

  if (metrics.chunkCount < THRESHOLDS.minChunks) {
    violations.push({
      metric: 'chunkCount',
      value: metrics.chunkCount,
      threshold: THRESHOLDS.minChunks,
      message: `Chunk count ${metrics.chunkCount} below minimum ${THRESHOLDS.minChunks} (consider better code splitting)`,
    });
  }

  return violations;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function saveMetrics(metrics) {
  ensurePerformanceDir();

  // Save current metrics
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `metrics-${timestamp}.json`;
  const filepath = path.join(PERFORMANCE_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));

  // Update latest metrics
  const latestPath = path.join(PERFORMANCE_DIR, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(metrics, null, 2));

  // Update historical data
  const historyPath = path.join(PERFORMANCE_DIR, 'history.json');
  let history = [];

  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch {
      console.warn('Could not parse history file, starting fresh');
    }
  }

  history.push(metrics);

  // Keep only last 100 entries
  if (history.length > 100) {
    history = history.slice(-100);
  }

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function generateReport(metrics, violations) {
  console.log('\n🚀 Performance Report');
  console.log('=====================\n');

  console.log('📦 Bundle Analysis:');
  console.log(`  Main bundle: ${formatBytes(metrics.mainBundleSize)}`);
  console.log(`  Total size:  ${formatBytes(metrics.totalBuildSize)}`);
  console.log(`  CSS size:    ${formatBytes(metrics.cssSize || 0)}`);
  console.log(`  Chunks:      ${metrics.chunkCount}`);
  console.log(`  Largest:     ${formatBytes(metrics.largestChunkSize || 0)}\n`);

  if (violations.length === 0) {
    console.log('✅ All performance thresholds met!\n');
  } else {
    console.log('⚠️  Performance Issues:');
    violations.forEach(v => {
      console.log(`  ❌ ${v.message}`);
    });
    console.log('');
  }

  console.log('🎯 Thresholds:');
  console.log(`  Main bundle: < ${formatBytes(THRESHOLDS.mainBundleSize)}`);
  console.log(`  Total size:  < ${formatBytes(THRESHOLDS.totalBuildSize)}`);
  console.log(`  Chunks:      ${THRESHOLDS.minChunks}-${THRESHOLDS.maxChunks}`);
  console.log('');
}

function compareWithPrevious(currentMetrics) {
  const latestPath = path.join(PERFORMANCE_DIR, 'latest.json');

  if (!fs.existsSync(latestPath)) {
    console.log('📊 No previous metrics found for comparison\n');
    return;
  }

  try {
    const previous = JSON.parse(fs.readFileSync(latestPath, 'utf8'));

    console.log('📈 Performance Comparison:');

    const comparisons = [
      {
        name: 'Main bundle',
        current: currentMetrics.mainBundleSize,
        previous: previous.mainBundleSize,
      },
      {
        name: 'Total size',
        current: currentMetrics.totalBuildSize,
        previous: previous.totalBuildSize,
      },
      {
        name: 'Chunk count',
        current: currentMetrics.chunkCount,
        previous: previous.chunkCount,
        isCount: true,
      },
    ];

    comparisons.forEach(comp => {
      if (comp.current && comp.previous) {
        const diff = comp.current - comp.previous;
        const diffPercent = ((diff / comp.previous) * 100).toFixed(1);
        const diffFormatted = comp.isCount ? diff : formatBytes(Math.abs(diff));

        let icon = '📊';
        if (diff > 0) icon = '📈';
        if (diff < 0) icon = '📉';
        if (Math.abs(parseFloat(diffPercent)) > 10) icon = diff > 0 ? '🚨' : '🎉';

        console.log(
          `  ${icon} ${comp.name}: ${diff >= 0 ? '+' : ''}${diffFormatted} (${diff >= 0 ? '+' : ''}${diffPercent}%)`,
        );
      }
    });

    console.log('');
  } catch (_e) {
    console.warn('Could not compare with previous metrics:', _e.message);
  }
}

// Main execution
function main() {
  try {
    console.log('Analyzing build performance...\n');

    const metrics = getBuildMetrics();
    const violations = checkThresholds(metrics);

    compareWithPrevious(metrics);
    generateReport(metrics, violations);
    saveMetrics(metrics);

    // Exit with error if there are violations
    if (violations.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getBuildMetrics,
  checkThresholds,
  formatBytes,
  THRESHOLDS,
};
