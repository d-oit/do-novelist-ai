import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { iconButtonTarget } from '../../../lib/utils';
import type { Character, CharacterRole, CharacterArc } from '../types';

interface CharacterEditorProps {
    character?: Character; // If null, creating new
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Character>) => Promise<void>;
}

const ROLES: CharacterRole[] = [
    'protagonist', 'antagonist', 'supporting', 'mentor', 'foil', 'love-interest', 'comic-relief'
];

const ARCS: CharacterArc[] = [
    'change', 'growth', 'fall', 'flat', 'corruption', 'redemption'
];

export const CharacterEditor: React.FC<CharacterEditorProps> = ({
    character,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState<Partial<Character>>({
        name: '',
        role: 'supporting',
        arc: 'flat',
        motivation: '',
        goal: '',
        conflict: '',
        backstory: '',
        traits: []
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
                traits: []
            });
        }
    }, [character, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto"
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
                        <CardTitle>{character ? 'Edit Character' : 'Create Character'}</CardTitle>
                        <button
                            onClick={onClose}
                            className={iconButtonTarget("rounded-md hover:bg-muted transition-colors")}
                            aria-label="Close character editor"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 pt-6">
                            {error && (
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                        placeholder="Character Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as CharacterRole }))}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        {ROLES.map(role => (
                                            <option key={role} value={role}>{role.replace('-', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Character Arc</label>
                                <select
                                    value={formData.arc}
                                    onChange={e => setFormData(prev => ({ ...prev, arc: e.target.value as CharacterArc }))}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    {ARCS.map(arc => (
                                        <option key={arc} value={arc}>{arc}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Motivation</label>
                                <textarea
                                    required
                                    value={formData.motivation}
                                    onChange={e => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                                    placeholder="What drives this character?"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Goal</label>
                                <textarea
                                    required
                                    value={formData.goal}
                                    onChange={e => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                                    placeholder="What do they want to achieve?"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Conflict</label>
                                <textarea
                                    required
                                    value={formData.conflict}
                                    onChange={e => setFormData(prev => ({ ...prev, conflict: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[80px]"
                                    placeholder="What stands in their way?"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Backstory (Optional)</label>
                                <textarea
                                    value={formData.backstory}
                                    onChange={e => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]"
                                    placeholder="Relevant history..."
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-end gap-2 border-t pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Saving...' : 'Save Character'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};
