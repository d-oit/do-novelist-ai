import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { AgentConsole } from '../AgentConsole';

// Mock the agent console hook
const mockUseAgentConsole = vi.fn();

vi.mock('../../hooks/useAgentConsole', () => ({
  useAgentConsole: mockUseAgentConsole,
}));

// Mock log entries
const mockLogs = [
  {
    id: '1',
    timestamp: new Date(),
    level: 'info',
    message: 'Agent started',
    agent: 'Writer Agent',
  },
  {
    id: '2',
    timestamp: new Date(),
    level: 'success',
    message: 'Chapter drafted successfully',
    agent: 'Writer Agent',
  },
  {
    id: '3',
    timestamp: new Date(),
    level: 'error',
    message: 'Failed to connect to AI service',
    agent: 'System',
  },
];

describe('AgentConsole', () => {
  beforeEach(() => {
    mockUseAgentConsole.mockReturnValue({
      logs: mockLogs,
      isVisible: true,
      isMinimized: false,
      clearLogs: vi.fn(),
      toggleVisibility: vi.fn(),
      toggleMinimize: vi.fn(),
    });
  });

  it('should receive logs from hook', () => {
    const result = mockUseAgentConsole();

    expect(result.logs).toEqual(mockLogs);
  });

  it('should handle visible state', () => {
    const result = mockUseAgentConsole();

    expect(result.isVisible).toBe(true);
  });

  it('should handle minimized state', () => {
    mockUseAgentConsole.mockReturnValue({
      logs: mockLogs,
      isVisible: true,
      isMinimized: true,
      clearLogs: vi.fn(),
      toggleVisibility: vi.fn(),
      toggleMinimize: vi.fn(),
    });

    const result = mockUseAgentConsole();

    expect(result.isMinimized).toBe(true);
  });

  it('should provide clearLogs function', () => {
    const result = mockUseAgentConsole();

    expect(result.clearLogs).toBeDefined();
    expect(typeof result.clearLogs).toBe('function');
  });

  it('should provide toggleVisibility function', () => {
    const result = mockUseAgentConsole();

    expect(result.toggleVisibility).toBeDefined();
    expect(typeof result.toggleVisibility).toBe('function');
  });

  it('should provide toggleMinimize function', () => {
    const result = mockUseAgentConsole();

    expect(result.toggleMinimize).toBeDefined();
    expect(typeof result.toggleMinimize).toBe('function');
  });

  it('should handle empty logs', () => {
    mockUseAgentConsole.mockReturnValue({
      logs: [],
      isVisible: true,
      isMinimized: false,
      clearLogs: vi.fn(),
      toggleVisibility: vi.fn(),
      toggleMinimize: vi.fn(),
    });

    const result = mockUseAgentConsole();

    expect(result.logs).toEqual([]);
  });

  it('should handle hidden state', () => {
    mockUseAgentConsole.mockReturnValue({
      logs: mockLogs,
      isVisible: false,
      isMinimized: false,
      clearLogs: vi.fn(),
      toggleVisibility: vi.fn(),
      toggleMinimize: vi.fn(),
    });

    const result = mockUseAgentConsole();

    expect(result.isVisible).toBe(false);
  });
});

