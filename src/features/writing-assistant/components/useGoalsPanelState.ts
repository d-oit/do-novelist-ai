import { useState, useCallback } from 'react';

export const useGoalsPanelState = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
  }, []);

  const handleStartEdit = useCallback((goalId: string) => {
    setEditingId(goalId);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleTogglePresets = useCallback(() => {
    setShowPresets(prev => !prev);
  }, []);

  const handleToggleImportExport = useCallback(() => {
    setShowImportExport(prev => !prev);
  }, []);

  const handleClosePresets = useCallback(() => {
    setShowPresets(false);
  }, []);

  const handleCloseImportExport = useCallback(() => {
    setShowImportExport(false);
  }, []);

  return {
    isCreating,
    editingId,
    showPresets,
    showImportExport,
    handleStartCreate,
    handleCancelCreate,
    handleStartEdit,
    handleCancelEdit,
    handleTogglePresets,
    handleToggleImportExport,
    handleClosePresets,
    handleCloseImportExport,
  };
};
