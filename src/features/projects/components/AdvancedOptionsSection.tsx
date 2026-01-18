import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

import { TONES, AUDIENCES } from './project-wizard-constants';

interface AdvancedOptionsSectionProps {
  showAdvanced: boolean;
  tone: string;
  audience: string;
  customInstructions: string;
  targetWordCount: number;
  onToggleAdvanced: () => void;
  onToneChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
  onCustomInstructionsChange: (value: string) => void;
  onTargetWordCountChange: (value: number) => void;
}

export const AdvancedOptionsSection: React.FC<AdvancedOptionsSectionProps> = ({
  showAdvanced,
  tone,
  audience,
  customInstructions,
  targetWordCount,
  onToggleAdvanced,
  onToneChange,
  onAudienceChange,
  onCustomInstructionsChange,
  onTargetWordCountChange,
}) => {
  return (
    <div className='space-y-3'>
      <button
        onClick={onToggleAdvanced}
        className='flex w-full items-center justify-between text-xs font-bold uppercase text-muted-foreground transition-colors hover:text-foreground'
      >
        <span>4. Advanced Options (Optional)</span>
        {showAdvanced ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
      </button>

      {showAdvanced && (
        <div className='space-y-4 rounded-lg border border-border bg-secondary/10 p-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Tone */}
            <div className='space-y-1'>
              <label className='text-[10px] font-bold uppercase text-muted-foreground'>Tone</label>
              <div className='flex gap-2'>
                <input
                  className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                  placeholder='e.g. Dark & Gritty'
                  value={tone}
                  onChange={e => onToneChange(e.target.value)}
                />
                <div className='relative shrink-0'>
                  <select
                    className='h-full w-24 cursor-pointer appearance-none rounded-md border border-border bg-secondary px-3 py-2 pr-8 text-xs outline-none hover:bg-secondary/80 focus:border-primary'
                    onChange={e => {
                      if (e.target.value) onToneChange(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value=''>Presets</option>
                    {TONES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-50' />
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div className='space-y-1'>
              <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                Target Audience
              </label>
              <div className='flex gap-2'>
                <input
                  className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                  placeholder='e.g. Young Adult (YA)'
                  value={audience}
                  onChange={e => onAudienceChange(e.target.value)}
                />
                <div className='relative shrink-0'>
                  <select
                    className='h-full w-24 cursor-pointer appearance-none rounded-md border border-border bg-secondary px-3 py-2 pr-8 text-xs outline-none hover:bg-secondary/80 focus:border-primary'
                    onChange={e => {
                      if (e.target.value) onAudienceChange(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value=''>Presets</option>
                    {AUDIENCES.map(a => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-50' />
                </div>
              </div>
            </div>

            {/* Target Word Count */}
            <div className='space-y-1'>
              <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                Target Word Count
              </label>
              <input
                type='number'
                className='w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                placeholder='e.g. 50000'
                value={targetWordCount}
                onChange={e => onTargetWordCountChange(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div className='space-y-1'>
            <label className='text-[10px] font-bold uppercase text-muted-foreground'>
              Custom System Instructions
            </label>
            <textarea
              className='h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
              placeholder='e.g. Avoid clichés, use British spelling, chapters must end on cliffhangers...'
              value={customInstructions}
              onChange={e => onCustomInstructionsChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
