import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AISettingsPanel } from '@/features/settings/components/AISettingsPanel';
import { loadUserPreferences, saveUserPreferences } from '@/services/ai-config-service';
import { startHealthMonitoring } from '@/services/ai-health-service';

vi.mock('@/services/ai-config-service');
vi.mock('@/services/ai-health-service');

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Settings: ({ className }: any) => <div className={className} data-testid='settings-icon' />,
  DollarSign: ({ className }: any) => <div className={className} data-testid='dollar-icon' />,
  Shield: ({ className }: any) => <div className={className} data-testid='shield-icon' />,
  Zap: ({ className }: any) => <div className={className} data-testid='zap-icon' />,
  Activity: ({ className }: any) => <div className={className} data-testid='activity-icon' />,
  Brain: ({ className }: any) => <div className={className} data-testid='brain-icon' />,
}));

// Mock components
vi.mock('@/components/ai/CostDashboard', () => ({
  CostDashboard: () => <div data-testid='cost-dashboard'>Cost Dashboard</div>,
}));

vi.mock('@/components/ai/FallbackProviderEditor', () => ({
  FallbackProviderEditor: ({ value, onChange }: any) => (
    <div data-testid='fallback-editor' onChange={() => onChange(value)}>
      Fallback Editor
    </div>
  ),
}));

vi.mock('@/components/ai/ProviderSelector', () => ({
  ProviderSelector: ({ userId, onProviderChange }: any) => (
    <div data-testid='provider-selector' data-userid={userId} onClick={() => onProviderChange('openai', 'gpt-4')}>
      Provider Selector
    </div>
  ),
}));

// Mock useSettings hook
const mockUpdate = vi.fn();
const mockSettings = {
  enableContextInjection: true,
  contextTokenLimit: 5000,
  contextIncludeCharacters: true,
  contextIncludeWorldBuilding: true,
  contextIncludeTimeline: true,
  contextIncludeChapters: true,
};

vi.mock('@/features/settings/hooks/useSettings', () => ({
  useSettings: () => ({ settings: mockSettings, update: mockUpdate }),
}));

// Mock logger
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AISettingsPanel', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockClear();

    vi.mocked(loadUserPreferences).mockResolvedValue({
      selectedProvider: 'openai' as any,
      selectedModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4096,
      autoFallback: true,
      costOptimization: false,
      fallbackProviders: ['anthropic', 'google'] as any[],
      monthlyBudget: 50,
      autoRouting: false,
      modelVariant: '',
      enableStructuredOutputs: false,
      enableResponseValidation: false,
    });
    vi.mocked(saveUserPreferences).mockResolvedValue(undefined);
    vi.mocked(startHealthMonitoring).mockResolvedValue(undefined as any);
  });

  const waitForLoad = async () => {
    await screen.findByText('AI Provider Settings', {}, { timeout: 3000 });
  };

  describe('Loading State', () => {
    it('renders loading skeleton while loading', () => {
      render(<AISettingsPanel userId={mockUserId} />);

      expect(screen.queryByText('AI Provider Settings')).not.toBeInTheDocument();

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering - Header', () => {
    it('renders header with title and refresh button', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      expect(screen.getByText('AI Provider Settings')).toBeInTheDocument();
      expect(screen.getByText('Refresh Health')).toBeInTheDocument();
    });

    it('renders settings icon', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('renders all tabs', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      expect(screen.getByText('Provider Selection')).toBeInTheDocument();
      expect(screen.getByText('Cost Analytics')).toBeInTheDocument();
      expect(screen.getByText('Provider Health')).toBeInTheDocument();
      expect(screen.getByText('Context Injection')).toBeInTheDocument();
    });

    it('shows provider selection tab by default', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      expect(screen.getByTestId('provider-selector')).toBeInTheDocument();
    });

    it('switches to cost analytics tab', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const analyticsTab = screen.getByText('Cost Analytics');
      fireEvent.click(analyticsTab);
      expect(screen.getByTestId('cost-dashboard')).toBeInTheDocument();
    });

    it('switches to provider health tab', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const healthTab = screen.getByText('Provider Health');
      fireEvent.click(healthTab);
      expect(screen.getByText('Provider Health Monitoring')).toBeInTheDocument();
    });

    it('switches to context injection tab', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const contextTab = screen.getByText('Context Injection');
      fireEvent.click(contextTab);
      expect(screen.getByText('AI Context-Aware Generation (RAG)')).toBeInTheDocument();
    });
  });

  describe('Provider Selection Tab', () => {
    it('renders provider selector', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      expect(await screen.findByTestId('provider-selector')).toBeInTheDocument();
    });

    it('renders temperature input', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const tempInput = screen.getByLabelText(/Temperature/);
      expect(tempInput).toBeInTheDocument();
    });

    it('renders max tokens input', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const maxTokensInput = screen.getByLabelText(/Max Tokens/);
      expect(maxTokensInput).toBeInTheDocument();
    });

    it('renders auto fallback checkbox', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const fallbackCheckbox = screen.getByLabelText(/Enable automatic fallback/);
      expect(fallbackCheckbox).toBeInTheDocument();
    });

    it('renders fallback provider editor', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      expect(screen.getByTestId('fallback-editor')).toBeInTheDocument();
    });

    it('renders cost optimization checkbox', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const costOptCheckbox = screen.getByLabelText(/Enable cost optimization/);
      expect(costOptCheckbox).toBeInTheDocument();
    });

    it('renders monthly budget input', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const budgetInput = screen.getByLabelText(/Monthly Budget/);
      expect(budgetInput).toBeInTheDocument();
    });
  });

  describe('Provider Health Tab', () => {
    it('renders provider health monitoring text', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Provider Health'));
      expect(screen.getByText('Provider Health Monitoring')).toBeInTheDocument();
    });

    it('renders OpenAI provider status', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Provider Health'));
      const statusContainer = await screen.findByTestId('provider-status-openai');
      expect(within(statusContainer).getByText('OpenAI')).toBeInTheDocument();
      expect(within(statusContainer).getByText('Operational')).toBeInTheDocument();
    });

    it('renders Anthropic provider status', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Provider Health'));
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
    });

    it('renders Google provider status', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Provider Health'));
      expect(screen.getByText('Google')).toBeInTheDocument();
    });
  });

  describe('Context Injection Tab', () => {
    it('renders context injection description', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      expect(screen.getByText('AI Context-Aware Generation (RAG)')).toBeInTheDocument();
      expect(screen.getByText(/Enable context injection/)).toBeInTheDocument();
    });

    it('renders enable context checkbox', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      const contextCheckbox = screen.getByLabelText('Enable Context Injection');
      expect(contextCheckbox).toBeInTheDocument();
      expect(contextCheckbox).toBeChecked();
    });

    it('renders context token limit when context is enabled', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      const tokenLimitInput = screen.getByLabelText(/Context Token Limit/);
      expect(tokenLimitInput).toBeInTheDocument();
    });

    it('renders include characters checkbox', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      const charsCheckbox = screen.getByLabelText('Characters');
      expect(charsCheckbox).toBeInTheDocument();
      expect(charsCheckbox).toBeChecked();
    });

    it('renders include world building checkbox', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      const worldCheckbox = screen.getByLabelText('World Building');
      expect(worldCheckbox).toBeInTheDocument();
      expect(worldCheckbox).toBeChecked();
    });

    it('renders include timeline checkbox', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      const timelineCheckbox = screen.getByLabelText('Timeline');
      expect(timelineCheckbox).toBeInTheDocument();
      expect(timelineCheckbox).toBeChecked();
    });

    it('renders include chapters checkbox', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      const chaptersCheckbox = screen.getByLabelText('Chapter Summaries');
      expect(chaptersCheckbox).toBeInTheDocument();
      expect(chaptersCheckbox).toBeChecked();
    });

    it('renders performance note', async () => {
      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      fireEvent.click(screen.getByText('Context Injection'));
      expect(screen.getByText('Performance Note')).toBeInTheDocument();
      expect(screen.getByText(/Increasing context token limit/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls refresh health monitoring when button is clicked', async () => {
      const { startHealthMonitoring } = await import('@/services/ai-health-service');

      render(<AISettingsPanel userId={mockUserId} />);
      await waitForLoad();

      const refreshButton = screen.getByText('Refresh Health');
      fireEvent.click(refreshButton);

      expect(startHealthMonitoring).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<AISettingsPanel userId={mockUserId} />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('AI Provider Settings');
      });
    });

    it('has proper labels on form inputs', async () => {
      render(<AISettingsPanel userId={mockUserId} />);

      await waitFor(() => {
        const tempInput = screen.getByLabelText(/Temperature/);
        expect(tempInput).toBeInTheDocument();

        const maxTokensInput = screen.getByLabelText(/Max Tokens/);
        expect(maxTokensInput).toBeInTheDocument();
      });
    });

    it('has proper ARIA descriptions', async () => {
      render(<AISettingsPanel userId={mockUserId} />);

      await waitFor(() => {
        const tempHelp = screen.getByText(/0.0-2.0/);
        expect(tempHelp).toBeInTheDocument();

        const maxTokensHelp = screen.getByText('Maximum response length');
        expect(maxTokensHelp).toBeInTheDocument();
      });
    });
  });

  describe('Visual Styling', () => {
    it('applies proper card styling', async () => {
      const { container } = render(<AISettingsPanel userId={mockUserId} />);

      await waitFor(() => {
        const card = container.querySelector('.rounded-lg.border');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('bg-white');
      });
    });
  });
});
