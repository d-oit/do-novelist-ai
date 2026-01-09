/**
 * Migration Wizard Component
 * Guides users through migrating their data from IndexedDB to Turso
 */
import { useState, useEffect } from 'react';

import {
  migrateProjectToTurso,
  checkIndexedDBExists,
  clearIndexedDBData,
  type MigrationProgress,
} from '@/lib/database/migration-utility';
import { logger } from '@/lib/logging/logger';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Progress } from '@/shared/components/ui/Progress';

interface MigrationWizardProps {
  projectId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const MigrationWizard: React.FC<MigrationWizardProps> = ({
  projectId,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<'check' | 'migrate' | 'complete'>('check');
  const [hasData, setHasData] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    completed: 0,
    errors: 0,
    currentTask: '',
  });
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<{
    characters: { success: number; errors: number };
    worldBuilding: { success: number; errors: number };
    versioning: { success: number; errors: number };
    total: { success: number; errors: number };
  } | null>(null);

  useEffect(() => {
    void checkForIndexedDBData();
  }, []);

  const checkForIndexedDBData = async (): Promise<void> => {
    try {
      const exists = await checkIndexedDBExists();
      const hasAnyData = Object.values(exists).some((v) => v);
      setHasData(hasAnyData);
    } catch (error) {
      logger.error('Failed to check IndexedDB', { component: 'MigrationWizard' }, error as Error);
    }
  };

  const handleMigrate = async (): Promise<void> => {
    setMigrating(true);
    setStep('migrate');

    try {
      const migrationResults = await migrateProjectToTurso(projectId, setProgress);
      setResults(migrationResults);
      setStep('complete');
    } catch (error) {
      logger.error('Migration failed', { component: 'MigrationWizard' }, error as Error);
    } finally {
      setMigrating(false);
    }
  };

  const handleClearOldData = async (): Promise<void> => {
    try {
      await clearIndexedDBData();
      logger.info('IndexedDB data cleared', { component: 'MigrationWizard' });
      onComplete();
    } catch (error) {
      logger.error('Failed to clear IndexedDB', { component: 'MigrationWizard' }, error as Error);
    }
  };

  if (step === 'check') {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Database Migration</h2>
        <p className="mb-4">
          Novelist.ai now uses Turso cloud database for better sync and reliability. 
          {hasData ? ' We detected local data that can be migrated.' : ' No local data detected.'}
        </p>
        
        {hasData ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What will be migrated:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Characters and relationships</li>
                <li>World-building data (locations, cultures, timelines)</li>
                <li>Version history and branches</li>
                <li>Publishing analytics</li>
                <li>Writing assistant preferences and history</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={() => void handleMigrate()} disabled={migrating}>
                Start Migration
              </Button>
              <Button onClick={onCancel} variant="secondary">
                Skip for Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button onClick={onComplete}>Continue</Button>
          </div>
        )}
      </Card>
    );
  }

  if (step === 'migrate') {
    const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Migrating Data...</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">{progress.currentTask}</p>
        
        <Progress value={progressPercent} className="mb-2" />
        
        <p className="text-sm text-gray-500">
          {progress.completed} of {progress.total} items migrated
          {progress.errors > 0 && ` (${progress.errors} errors)`}
        </p>
      </Card>
    );
  }

  if (step === 'complete') {
    const totalSuccess = results?.total.success || 0;
    const totalErrors = results?.total.errors || 0;

    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Migration Complete!</h2>
        
        <div className="space-y-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="font-semibold text-green-800 dark:text-green-200">
              ✓ Successfully migrated {totalSuccess} items
            </p>
            {totalErrors > 0 && (
              <p className="text-red-600 dark:text-red-400 mt-2">
                {totalErrors} items failed to migrate
              </p>
            )}
          </div>

          <div className="text-sm space-y-2">
            <p>• Characters: {results?.characters.success} migrated</p>
            <p>• World-building: {results?.worldBuilding.success} migrated</p>
            <p>• Version history: {results?.versioning.success} migrated</p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
          <p className="font-semibold mb-2">Clean up old data?</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your data has been migrated to Turso. Would you like to delete the old local IndexedDB data?
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => void handleClearOldData()}>Yes, Clear Old Data</Button>
          <Button onClick={onComplete} variant="secondary">
            Keep Old Data (Not Recommended)
          </Button>
        </div>
      </Card>
    );
  }

  return null;
};
