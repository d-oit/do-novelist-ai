import React from 'react';

import { AdvancedOptionsSection } from './AdvancedOptionsSection';
import { BasicFieldsSection } from './BasicFieldsSection';
import { IdeaInputSection } from './IdeaInputSection';
import { ProjectWizardFooter } from './ProjectWizardFooter';
import { ProjectWizardHeader } from './ProjectWizardHeader';
import { useProjectWizard } from './useProjectWizard';

interface ProjectWizardProps {
  isOpen: boolean;
  onCreate: (title: string, style: string, idea: string, targetWordCount: number) => void;
  onCancel: () => void;
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ isOpen, onCreate, onCancel }) => {
  const { state, setters, handlers, refs } = useProjectWizard(isOpen);

  if (!isOpen) return null;

  const handleSubmit = (): void => {
    if (!state.title || !state.style || !state.idea) return;

    let fullStyle = state.style;
    const extras = [];
    if (state.tone && state.tone !== 'Neutral') extras.push(`Tone: ${state.tone}`);
    if (state.audience && state.audience !== 'General')
      extras.push(`Target Audience: ${state.audience}`);
    if (state.customInstructions) extras.push(`Instructions: ${state.customInstructions}`);

    if (extras.length > 0) {
      fullStyle += `\n\n[Additional Guidance]\n${extras.join('\n')}`;
    }

    onCreate(state.title, fullStyle, state.idea, state.targetWordCount);
  };

  const handleIdeaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md'
      data-testid='project-wizard-overlay'
    >
      <div className='animate-in fade-in zoom-in-95 flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl duration-200 md:m-4 md:h-[calc(100dvh-2rem)] md:max-w-4xl md:rounded-xl md:border md:border-border lg:max-w-5xl'>
        <ProjectWizardHeader onCancel={onCancel} />

        <div className='custom-scrollbar space-y-6 overflow-y-auto p-6'>
          <IdeaInputSection
            idea={state.idea}
            activeTab={state.activeTab}
            files={state.files}
            isReading={state.isReading}
            brainstorming={state.brainstorming}
            brainstormError={state.brainstormError}
            tone={state.tone}
            audience={state.audience}
            onIdeaChange={setters.setIdea}
            onTabChange={setters.setActiveTab}
            onBrainstorm={() => void handlers.handleBrainstorm('idea')}
            onFileChange={e => void handlers.handleFileChange(e)}
            onRemoveFile={handlers.removeFile}
            onKeyDown={handleIdeaKeyDown}
            fileInputRef={refs.fileInputRef}
            ideaTextareaRef={refs.ideaTextareaRef}
          />

          <BasicFieldsSection
            title={state.title}
            style={state.style}
            brainstorming={state.brainstorming}
            onTitleChange={setters.setTitle}
            onStyleChange={setters.setStyle}
            onBrainstormTitle={() => void handlers.handleBrainstorm('title')}
            onBrainstormStyle={() => void handlers.handleBrainstorm('style')}
          />

          <AdvancedOptionsSection
            showAdvanced={state.showAdvanced}
            tone={state.tone}
            audience={state.audience}
            customInstructions={state.customInstructions}
            targetWordCount={state.targetWordCount}
            onToggleAdvanced={() => setters.setShowAdvanced(!state.showAdvanced)}
            onToneChange={setters.setTone}
            onAudienceChange={setters.setAudience}
            onCustomInstructionsChange={setters.setCustomInstructions}
            onTargetWordCountChange={setters.setTargetWordCount}
          />
        </div>

        <ProjectWizardFooter
          title={state.title}
          style={state.style}
          idea={state.idea}
          onCancel={onCancel}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default ProjectWizard;
