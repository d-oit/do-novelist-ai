
import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Database, 
  Plus, 
  LayoutDashboard, 
  Folder, 
  Settings
} from 'lucide-react';

interface NavbarProps {
  projectTitle: string;
  onNewProject: () => void;
  currentView: 'dashboard' | 'projects' | 'settings';
  onNavigate: (view: 'dashboard' | 'projects' | 'settings') => void;
}

const Navbar: React.FC<NavbarProps> = ({
  projectTitle,
  onNewProject,
  currentView,
  onNavigate
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (view: 'dashboard' | 'projects' | 'settings') => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const NavLink = ({ view, icon: Icon, label }: { view: 'dashboard' | 'projects' | 'settings'; icon: React.ElementType; label: string; }) => (
    <button
      onClick={() => handleNav(view)}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === view ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
      data-testid={`nav-${view}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav('dashboard')}>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-lg leading-none">Novelist.ai</h1>
            <span className="text-xs text-muted-foreground font-mono">GOAP Engine v0.5.0</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <NavLink view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink view="projects" icon={Folder} label="Projects" />
          <NavLink view="settings" icon={Settings} label="Settings" />
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex flex-col text-right mr-2 border-r border-border pr-4">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Current Project</span>
            <span className="text-xs font-medium max-w-[150px] truncate">{projectTitle}</span>
          </div>

          <button 
            onClick={onNewProject}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            data-testid="nav-new-project"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        <button 
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-in slide-in-from-top-5 absolute w-full shadow-lg">
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <NavLink view="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavLink view="projects" icon={Folder} label="Projects" />
              <NavLink view="settings" icon={Settings} label="Settings" />
            </div>
            <div className="h-px bg-border w-full my-2"></div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-muted-foreground">Active Project</span>
                <span className="text-xs font-medium truncate max-w-[200px]">{projectTitle}</span>
              </div>
              <button 
                onClick={() => { onNewProject(); setIsMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
