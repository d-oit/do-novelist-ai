import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import App from '@/app/App';
import { UserProvider } from '@/contexts/UserContext';

// Mock all external dependencies
vi.mock('@/lib/database/services/user-settings-service', () => ({
  getTheme: vi.fn().mockResolvedValue('light'),
  setTheme: vi.fn().mockResolvedValue(undefined),
  getOrCreateUserSettings: vi.fn().mockResolvedValue({
    id: 'test-id',
    userId: 'test-user-id',
    theme: 'light',
    language: 'en',
    onboardingCompleted: false,
    onboardingStep: 'welcome',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
}));

vi.mock('@/features/projects/services', () => ({
  db: {
    init: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/pwa', () => ({
  offlineManager: {
    initialize: vi.fn(),
  },
}));

vi.mock('@/performance', () => ({
  performanceMonitor: {
    startTiming: vi.fn(),
    endTiming: vi.fn(),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock lazy-loaded components
vi.mock('@/features/projects/components', () => ({
  ProjectsView: () => <div data-testid='projects-view'>Projects View</div>,
  ProjectStats: () => <div data-testid='project-stats'>Project Stats</div>,
  ProjectWizard: () => <div data-testid='project-wizard'>Project Wizard</div>,
}));

vi.mock('@/features/settings/components', () => ({
  SettingsView: () => <div data-testid='settings-view'>Settings View</div>,
}));

vi.mock('@/pages/MetricsPage', () => ({
  MetricsPage: () => <div data-testid='metrics-page'>Metrics Page</div>,
}));

vi.mock('@/features/generation/components', () => ({
  AgentConsole: () => <div data-testid='agent-console'>Agent Console</div>,
  ActionCard: () => <div data-testid='action-card'>Action Card</div>,
  BookViewer: () => <div data-testid='book-viewer'>Book Viewer</div>,
  PlannerControl: () => <div data-testid='planner-control'>Planner Control</div>,
}));

vi.mock('@/features/plot-engine/components', () => ({
  LazyPlotEngineDashboard: () => <div data-testid='plot-engine'>Plot Engine Dashboard</div>,
}));

vi.mock('@/features/world-building', () => ({
  WorldBuildingDashboard: () => <div data-testid='world-building'>World Building Dashboard</div>,
}));

vi.mock('@/features/generation/hooks', () => ({
  useGoapEngine: () => ({
    worldState: {
      hasTitle: false,
      hasOutline: false,
      chaptersCount: 0,
      chaptersCompleted: 0,
      styleDefined: false,
      isPublished: false,
    },
    actions: [],
    logs: [],
    isRunning: false,
    currentAction: null,
    startPlanner: vi.fn(),
    stopPlanner: vi.fn(),
    resetPlanner: vi.fn(),
    addLog: vi.fn(),
  }),
}));

vi.mock('@/features/semantic-search', () => ({
  SearchModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid='search-modal'>Search Modal</div> : null,
}));

vi.mock('@/components/error-boundary', () => ({
  ProjectsErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/shared/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid='main-layout'>{children}</div>,
  Header: ({ onNavigate }: any) => (
    <nav data-testid='navbar'>
      <button onClick={() => onNavigate('projects')} data-testid='nav-projects'>
        Projects
      </button>
      <button onClick={() => onNavigate('dashboard')} data-testid='nav-dashboard'>
        Dashboard
      </button>
      <button onClick={() => onNavigate('settings')} data-testid='nav-settings'>
        Settings
      </button>
      <button onClick={() => onNavigate('metrics')} data-testid='nav-metrics'>
        Metrics
      </button>
      <button onClick={() => onNavigate('plot-engine')} data-testid='nav-plot-engine'>
        Plot Engine
      </button>
      <button onClick={() => onNavigate('world-building')} data-testid='nav-world-building'>
        World Building
      </button>
    </nav>
  ),
}));

vi.mock('@/shared/components/ui/Toaster', () => ({
  Toaster: () => <div data-testid='toaster'>Toaster</div>,
}));

vi.mock('@/shared/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid='skeleton' className={className}>
      Loading...
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should render without crashing', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
    });

    it('should initialize database on mount', async () => {
      const { db } = await import('@/features/projects/services');

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(db.init).toHaveBeenCalled();
      });
    });

    it('should initialize offline manager on mount', async () => {
      const { offlineManager } = await import('@/lib/pwa');

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(offlineManager.initialize).toHaveBeenCalled();
      });
    });

    it('should track performance timing for initialization', async () => {
      const { performanceMonitor } = await import('@/performance');

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(performanceMonitor.startTiming).toHaveBeenCalledWith('app-initialization');
      });
    });

    it('should handle database initialization timeout gracefully', async () => {
      const { db } = await import('@/features/projects/services');
      const { logger } = await import('@/lib/logging/logger');

      // Simulate timeout by making init never resolve
      // @ts-expect-error - we know this is a mock
      db.init.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(undefined);
          }, 20000);
        });
      });

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(
        () => {
          expect(logger.warn).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // Should still render even if database times out
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

      await waitFor(
        () => {
          expect(logger.warn).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('should handle database initialization errors', async () => {
      const { db } = await import('@/features/projects/services');
      const { logger } = await import('@/lib/logging/logger');

      vi.mocked(db.init).mockRejectedValueOnce(new Error('Database error'));

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(logger.warn).toHaveBeenCalledWith(
          'Database initialization failed or timed out',
          expect.objectContaining({
            component: 'App',
          }),
        );
      });
    });
  });

  describe('View Navigation', () => {
    it('should render projects view by default', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('projects-view')).toBeInTheDocument();
      });
    });

    it('should switch to settings view when settings nav is clicked', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('nav-settings').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('settings-view')).toBeInTheDocument();
      });
    });

    it('should switch to metrics view', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('nav-metrics')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('nav-metrics').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('metrics-page')).toBeInTheDocument();
      });
    });

    it('should switch to plot engine view', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('nav-plot-engine')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('nav-plot-engine').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('plot-engine')).toBeInTheDocument();
      });
    });

    it('should switch to world building view', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('nav-world-building')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('nav-world-building').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('world-building')).toBeInTheDocument();
      });
    });

    it('should track performance timing on view changes', async () => {
      const { performanceMonitor } = await import('@/performance');

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('nav-settings').click();
      });

      await waitFor(() => {
        expect(performanceMonitor.startTiming).toHaveBeenCalledWith('route-projects');
      });
    });
  });

  describe('Lazy Loading', () => {
    it('should render lazy-loaded components after suspense resolves', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('projects-view')).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('should render main layout', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
    });

    it('should render navbar', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });
    });

    it('should render toaster for notifications', async () => {
      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('toaster')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle database errors and continue rendering', async () => {
      const { db } = await import('@/features/projects/services');
      vi.mocked(db.init).mockRejectedValueOnce(new Error('DB Error'));

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
    });

    it('should log errors appropriately', async () => {
      const { db } = await import('@/features/projects/services');
      const { logger } = await import('@/lib/logging/logger');

      vi.mocked(db.init).mockRejectedValueOnce(new Error('Test error'));

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Database initialization'),
          expect.any(Object),
        );
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should start timing on mount', async () => {
      const { performanceMonitor } = await import('@/performance');

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      expect(performanceMonitor.startTiming).toHaveBeenCalledWith('app-initialization');
    });

    it('should track view transitions', async () => {
      const { performanceMonitor } = await import('@/performance');

      await act(async () => {
        render(
          <UserProvider>
            <App />
          </UserProvider>,
        );
      });

      await waitFor(() => {
        expect(performanceMonitor.startTiming).toHaveBeenCalledWith('route-projects');
      });
    });
  });
});
