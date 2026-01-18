import type {
  PlatformAnalytics,
  Publication,
  PublishingExport,
  ReaderFeedback,
} from '@/features/publishing/types';

/**
 * Analytics Export Module
 * Handles exporting publishing analytics data in various formats
 */

/**
 * Export publishing analytics for specified publications
 * @param publications - Array of publications to export
 * @param analytics - Array of analytics for each publication
 * @param feedback - Array of feedback for each publication
 * @param exportConfig - Export configuration including format and options
 * @returns Exported data as a string
 */
export function exportPublishingAnalytics(
  publications: Publication[],
  analytics: PlatformAnalytics[],
  feedback: ReaderFeedback[],
  exportConfig: PublishingExport,
): string {
  const exportData: {
    publications: Publication[];
    analytics: PlatformAnalytics[];
    feedback: ReaderFeedback[];
    exportedAt: string;
    config: Omit<PublishingExport, 'publicationIds'>;
  } = {
    publications,
    analytics,
    feedback,
    exportedAt: new Date().toISOString(),
    config: exportConfig,
  };

  switch (exportConfig.format) {
    case 'json':
      return exportToJSON(exportData);
    case 'csv':
      return exportToCSV(exportData);
    case 'xlsx':
      throw new Error('XLSX format not implemented yet');
    default:
      throw new Error(`Unsupported export format: ${exportConfig.format}`);
  }
}

/**
 * Export data to JSON format
 * @param data - Data to export
 * @returns JSON string
 */
function exportToJSON(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Export data to CSV format
 * @param data - Data to export
 * @returns CSV string
 */
function exportToCSV(data: Record<string, unknown>): string {
  // Simple CSV conversion - would be more sophisticated in real implementation
  const lines: string[] = [];

  // Flatten nested objects for CSV
  const flattenObject = (obj: Record<string, unknown>, prefix = ''): string[] => {
    const result: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result.push(...flattenObject(value as Record<string, unknown>, newKey));
      } else if (Array.isArray(value)) {
        result.push(`${newKey},"${JSON.stringify(value).replace(/"/g, '""')}"`);
      } else {
        result.push(`${newKey},"${String(value ?? '').replace(/"/g, '""')}"`);
      }
    }
    return result;
  };

  // Add metadata section
  lines.push('# Publishing Analytics Export');
  lines.push(`# Exported At: ${new Date().toISOString()}`);
  lines.push('#');

  // Add publications section
  if ('publications' in data && Array.isArray(data.publications)) {
    lines.push('');
    lines.push('## Publications');
    for (const pub of data.publications) {
      lines.push(...flattenObject(pub as Record<string, unknown>));
      lines.push('---');
    }
  }

  // Add analytics section
  if ('analytics' in data && Array.isArray(data.analytics)) {
    lines.push('');
    lines.push('## Analytics');
    for (const analytic of data.analytics) {
      lines.push(...flattenObject(analytic as Record<string, unknown>));
      lines.push('---');
    }
  }

  // Add feedback section
  if ('feedback' in data && Array.isArray(data.feedback)) {
    lines.push('');
    lines.push('## Feedback');
    for (const fb of data.feedback) {
      lines.push(...flattenObject(fb as Record<string, unknown>));
      lines.push('---');
    }
  }

  return lines.join('\n');
}

/**
 * Generate export filename based on configuration
 * @param exportConfig - Export configuration
 * @returns Filename string
 */
export function generateExportFilename(exportConfig: PublishingExport): string {
  const format = exportConfig.format;
  const sections = exportConfig.sections.join('-');
  const dateRange = `${exportConfig.dateRange.start.toISOString().split('T')[0]}_to_${exportConfig.dateRange.end.toISOString().split('T')[0]}`;

  return `publishing-analytics_${sections}_${dateRange}.${format}`;
}
