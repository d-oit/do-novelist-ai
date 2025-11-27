
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, Sparkles, Book, Plus, Loader2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { iconButtonTarget } from '../../../lib/utils';
import { brainstormProject } from '../../../lib/gemini';

interface ProjectWizardProps {
  isOpen: boolean;
  onCreate: (title: string, style: string, idea: string, targetWordCount: number) => void;
  onCancel: () => void;
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ isOpen, onCreate, onCancel }) => {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [idea, setIdea] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'upload'>('write');
  const [files, setFiles] = useState<File[]>([]);
  const [isReading, setIsReading] = useState(false);
  
  // Optional Advanced Fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(50000);

  // Brainstorming States
  const [brainstorming, setBrainstorming] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when wizard opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStyle('');
      setIdea('');
      setFiles([]);
      setTone('');
      setAudience('');
      setCustomInstructions('');
      setTargetWordCount(50000);
      setShowAdvanced(false);
      setActiveTab('write');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBrainstorm = async (field: 'title' | 'style' | 'idea') => {
    // Construct a rich context including tone and audience if available
    let promptContext = idea;
    if (tone && tone !== 'Neutral') promptContext += `\nDesired Tone: ${tone}`;
    if (audience && audience !== 'General') promptContext += `\nTarget Audience: ${audience}`;

    if (!promptContext.trim()) {
       if (field === 'idea') {
          setIdea("A story about..."); 
       }
       return;
    }

    setBrainstorming(prev => ({ ...prev, [field]: true }));
    try {
      const result = await brainstormProject(promptContext, field);
      if (result) {
        if (field === 'title') setTitle(result);
        if (field === 'style') setStyle(result);
        if (field === 'idea') setIdea(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBrainstorming(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setIsReading(true);

      for (const file of newFiles) {
        try {
          if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
            const text = await file.text();
            setIdea(prev => prev + `\n\n--- Content from ${file.name} ---\n${text}`);
          } else {
            setIdea(prev => prev + `\n\n[Attached File: ${file.name} - Binary content omitted in demo]`);
          }
        } catch (err) {
          console.error("Error reading file", err);
        }
      }
      setIsReading(false);
    }
  };

  const handleSubmit = () => {
    if (!title || !style || !idea) return;

    // Combine basic style with advanced options if present
    let fullStyle = style;
    const extras = [];
    if (tone && tone !== 'Neutral') extras.push(`Tone: ${tone}`);
    if (audience && audience !== 'General') extras.push(`Target Audience: ${audience}`);
    if (customInstructions) extras.push(`Instructions: ${customInstructions}`);
    
    if (extras.length > 0) {
      fullStyle += `\n\n[Additional Guidance]\n${extras.join('\n')}`;
    }

    onCreate(title, fullStyle, idea, targetWordCount);
  };

  const GENRES = [
    "Sci-Fi / Cyberpunk", "High Fantasy", "Mystery / Thriller", 
    "Horror", "Romance", "Historical Fiction", 
    "Non-Fiction / Business", "Self-Help", "Memoir",
    "Literary Fiction", "Young Adult Dystopian", "Space Opera", 
    "True Crime", "Biography", "Satire"
  ];

  const TONES = ["Neutral", "Dark & Gritty", "Humorous", "Optimistic", "Academic", "Poetic", "Fast-paced", "Atmospheric", "Whimsical"];
  const AUDIENCES = ["General", "Adult", "Young Adult (YA)", "Middle Grade", "Children", "Professional", "Academics"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" data-testid="project-wizard-overlay">
      <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh]">
        
        {/* Header */}
        <div className="bg-secondary/30 p-6 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              New Book Project
            </h2>
            <p className="text-sm text-muted-foreground">Initialize the GOAP engine with your creative vision.</p>
          </div>
          <button
            onClick={onCancel}
            className={iconButtonTarget("text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors")}
            aria-label="Close project wizard"
            data-testid="wizard-cancel-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Step 2 (Moved up for flow): Source Material */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex justify-between items-center">
              <span>1. Core Idea / Source Material</span>
              <button 
                onClick={() => handleBrainstorm('idea')}
                disabled={(!idea && !tone && !audience) || brainstorming.idea}
                className="text-[10px] bg-secondary hover:bg-secondary/80 border border-border rounded px-2 py-1 text-primary flex items-center gap-1.5 disabled:opacity-50 transition-all"
                data-testid="wizard-brainstorm-idea"
              >
                {brainstorming.idea ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Enhance Idea
              </button>
            </label>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex border-b border-border bg-secondary/20">
                <button 
                  onClick={() => setActiveTab('write')}
                  className={`flex-1 px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'write' ? 'bg-card text-primary border-r border-border' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Book className="w-3 h-3" /> Write Idea
                </button>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-card text-primary border-l border-border' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Upload className="w-3 h-3" /> Upload Files
                </button>
              </div>

              <div className="p-4 bg-card h-32">
                {activeTab === 'write' ? (
                  <textarea 
                    className="w-full h-full bg-transparent resize-none focus:outline-none text-sm font-mono text-muted-foreground"
                    placeholder="Describe your plot, characters, and themes here..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    data-testid="wizard-idea-input"
                  />
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-secondary/10 transition-all group"
                  >
                    <input type="file" multiple ref={fileInputRef} className="hidden" accept=".txt,.md,.json" onChange={handleFileChange} />
                    <div className="bg-secondary/50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                       <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Click to upload files</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports .txt, .md, .json</p>
                    {isReading && <p className="text-xs text-primary mt-2 animate-pulse">Reading file content...</p>}
                  </div>
                )}
              </div>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[100px] truncate">{f.name}</span>
                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 1: Meta Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">2. Book Title</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="e.g. The Martian Chronicles"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="wizard-title-input"
                />
                <button 
                   onClick={() => handleBrainstorm('title')}
                   disabled={!idea || brainstorming.title}
                   className="px-3 bg-secondary hover:bg-secondary/80 border border-border rounded-md text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                   title="Generate Title from Idea"
                   data-testid="wizard-brainstorm-title"
                >
                  {brainstorming.title ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">3. Genre / Style</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Dark Fantasy, lyrical prose"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  data-testid="wizard-style-input"
                />
                <button 
                   onClick={() => handleBrainstorm('style')}
                   disabled={!idea || brainstorming.style}
                   className="px-3 bg-secondary hover:bg-secondary/80 border border-border rounded-md text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                   title="Suggest Style from Idea"
                   data-testid="wizard-brainstorm-style"
                >
                  {brainstorming.style ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {GENRES.slice(0, 5).map(g => (
                  <button 
                    key={g}
                    onClick={() => setStyle(g)}
                    className="text-[10px] bg-secondary hover:bg-primary/20 text-muted-foreground px-2 py-0.5 rounded-full transition-colors"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options Accordion */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 bg-secondary/10 hover:bg-secondary/20 transition-colors"
            >
              <span className="text-xs font-bold uppercase text-muted-foreground">Advanced AI Guidance & Goals (Optional)</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            
            {showAdvanced && (
              <div className="p-4 space-y-4 bg-card animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tone Input with Presets */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Tone</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        placeholder="e.g. Dark & Gritty"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                      />
                      <div className="relative shrink-0">
                         <select 
                          className="h-full bg-secondary text-xs px-3 py-2 rounded-md border border-border focus:border-primary outline-none appearance-none pr-8 cursor-pointer hover:bg-secondary/80 w-24"
                          onChange={(e) => { if(e.target.value) setTone(e.target.value); e.target.value=''; }}
                         >
                          <option value="">Presets</option>
                          {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                         <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Audience Input with Presets */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Audience</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        placeholder="e.g. Young Adult (YA)"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                      />
                      <div className="relative shrink-0">
                         <select 
                          className="h-full bg-secondary text-xs px-3 py-2 rounded-md border border-border focus:border-primary outline-none appearance-none pr-8 cursor-pointer hover:bg-secondary/80 w-24"
                          onChange={(e) => { if(e.target.value) setAudience(e.target.value); e.target.value=''; }}
                         >
                          <option value="">Presets</option>
                          {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                         </select>
                         <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </div>
                  </div>

                   {/* Target Word Count */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Word Count</label>
                    <input
                        type="number"
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        placeholder="e.g. 50000"
                        value={targetWordCount}
                        onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Custom System Instructions</label>
                  <textarea 
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-20 resize-none"
                    placeholder="e.g. Avoid clichés, use British spelling, chapters must end on cliffhangers..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/10 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!title || !style || !idea}
            onClick={handleSubmit}
            className="px-6 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
            data-testid="wizard-submit-btn"
          >
            <Plus className="w-4 h-4" />
            Initialize Project
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProjectWizard;
