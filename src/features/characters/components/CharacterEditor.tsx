import { motion } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import type { FC } from 'react';
import { useState, useEffect } from 'react';

import { iconButtonTarget } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/components/ui/Card';
import { type Character, type CharacterRole, type CharacterArc } from '@/types';

interface CharacterEditorProps {
  character?: Character; // If null, creating new
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Character>) => Promise<void>;
}

const ROLES: CharacterRole[] = [
  'protagonist',
  'antagonist',
  'deuteragonist',
  'tritagonist',
  'love_interest',
  'mentor',
  'sidekick',
  'foil',
  'supporting',
  'minor',
  'background',
];

const ARCS: CharacterArc[] = [
  'positive_change',
  'negative_change',
  'flat',
  'corruption',
  'redemption',
  'growth',
  'fall',
  'disillusion',
  'testing',
];

export const CharacterEditor: FC<CharacterEditorProps> = ({
  character,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    role: 'supporting',
    arc: 'flat',
    motivation: '',
    goal: '',
    conflict: '',
    backstory: '',
    traits: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (character) {
      setFormData(character);
    } else {
      setFormData({
        name: '',
        role: 'supporting',
        arc: 'flat',
        motivation: '',
        goal: '',
        conflict: '',
        backstory: '',
        traits: [],
      });
    }
  }, [character, isOpen]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className='max-h-[90dvh] w-full max-w-2xl overflow-y-auto'
      >
        <Card>
          <CardHeader className='sticky top-0 z-10 flex flex-row items-center justify-between border-b bg-card'>
            <CardTitle>{character ? 'Edit Character' : 'Create Character'}</CardTitle>
            <button
              onClick={onClose}
              className={iconButtonTarget('rounded-md transition-colors hover:bg-muted')}
              aria-label='Close character editor'
            >
              <X className='h-4 w-4' />
            </button>
          </CardHeader>

          <form onSubmit={e => void handleSubmit(e)}>
            <CardContent className='space-y-6 pt-6'>
              {error !== null ? (
                <div className='flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                  <AlertCircle className='h-4 w-4' />
                  {error}
                </div>
              ) : null}

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Name</label>
                  <input
                    required
                    type='text'
                    value={formData.name ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className='w-full rounded-md border bg-background px-3 py-2'
                    placeholder='Character Name'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Role</label>
                  <select
                    value={formData.role ?? 'supporting'}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, role: e.target.value as CharacterRole }))
                    }
                    className='w-full rounded-md border bg-background px-3 py-2'
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>
                        {role.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Character Arc</label>
                <select
                  value={formData.arc ?? 'flat'}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, arc: e.target.value as CharacterArc }))
                  }
                  className='w-full rounded-md border bg-background px-3 py-2'
                >
                  {ARCS.map(arc => (
                    <option key={arc} value={arc}>
                      {arc}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Motivation</label>
                <textarea
                  required
                  value={formData.motivation ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                  className='min-h-[80px] w-full rounded-md border bg-background px-3 py-2'
                  placeholder='What drives this character?'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Goal</label>
                <textarea
                  required
                  value={formData.goal ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  className='min-h-[80px] w-full rounded-md border bg-background px-3 py-2'
                  placeholder='What do they want to achieve?'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Conflict</label>
                <textarea
                  required
                  value={formData.conflict ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, conflict: e.target.value }))}
                  className='min-h-[80px] w-full rounded-md border bg-background px-3 py-2'
                  placeholder='What stands in their way?'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Backstory (Optional)</label>
                <textarea
                  value={formData.backstory ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
                  className='min-h-[100px] w-full rounded-md border bg-background px-3 py-2'
                  placeholder='Relevant history...'
                />
              </div>
            </CardContent>

            <CardFooter className='flex justify-end gap-2 border-t pt-4'>
              <Button type='button' variant='ghost' onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                <Save className='mr-2 h-4 w-4' />
                {isSubmitting ? 'Saving...' : 'Save Character'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
