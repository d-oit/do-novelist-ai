import React from 'react';
import { Brain, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import type { Character, CharacterValidationResult } from '../types';

interface CharacterStatsProps {
    characters: Character[];
    validationResult?: CharacterValidationResult;
}

export const CharacterStats: React.FC<CharacterStatsProps> = ({
    characters,
    validationResult
}) => {
    const stats = {
        total: characters.length,
        protagonists: characters.filter(c => c.role === 'protagonist').length,
        antagonists: characters.filter(c => c.role === 'antagonist').length,
        withArcs: characters.filter(c => c.arc !== 'flat').length,
    };

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Character Analytics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total Characters</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500">{stats.protagonists}</div>
                        <div className="text-xs text-muted-foreground">Protagonists</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{stats.antagonists}</div>
                        <div className="text-xs text-muted-foreground">Antagonists</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{stats.withArcs}</div>
                        <div className="text-xs text-muted-foreground">With Arcs</div>
                    </div>
                </div>

                {/* Validation Status */}
                {validationResult && (
                    <div className="mt-4 pt-4 border-t border-border">
                        {validationResult.isValid ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm">Character setup is valid</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">
                                    {validationResult.issues.length} issues found
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
