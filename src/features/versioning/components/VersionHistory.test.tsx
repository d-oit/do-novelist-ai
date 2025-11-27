import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VersionHistory from './VersionHistory';
import { useVersioning } from '../hooks/useVersioning';
import { Chapter, ChapterStatus } from '../../../types';

// Mock UI components to avoid import issues
vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/Card', () => ({
  Card: ({ children, className, onClick, ...props }: any) => (
    <div className={className} onClick={onClick} {...props}>
      {children}
    </div>
  ),
}));

// Mock the versioning hook
vi.mock('../hooks/useVersioning');
const mockUseVersioning = vi.mocked(useVersioning);

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockChapter: Chapter = {
  id: 'test-chapter',
  title: 'Test Chapter',
  summary: 'A test chapter for version history',
  content: 'This is the content of the test chapter.',
  status: ChapterStatus.DRAFTING,
  orderIndex: 1,
};

const mockVersions = [
  {
    id: 'version-1',
    chapterId: 'test-chapter',
    title: 'Test Chapter',
    summary: 'A test chapter for version history',
    content: 'This is the original content.',
    status: ChapterStatus.DRAFTING,
    timestamp: new Date('2024-01-01T10:00:00Z'),
    authorName: 'Test Author',
    message: 'Initial version',
    type: 'manual' as const,
    contentHash: 'hash1',
    wordCount: 5,
    charCount: 25,
  },
  {
    id: 'version-2',
    chapterId: 'test-chapter',
    title: 'Test Chapter',
    summary: 'A test chapter for version history',
    content: 'This is the updated content with more text.',
    status: ChapterStatus.DRAFTING,
    timestamp: new Date('2024-01-01T11:00:00Z'),
    authorName: 'Test Author',
    message: 'Added more content',
    type: 'auto' as const,
    contentHash: 'hash2',
    wordCount: 8,
    charCount: 40,
  },
];

const mockVersioningHook = {
  versions: mockVersions,
  branches: [],
  currentBranch: null,
  isLoading: false,
  error: null,
  saveVersion: vi.fn(),
  restoreVersion: vi.fn(),
  deleteVersion: vi.fn(),
  compareVersions: vi.fn(),
  createBranch: vi.fn(),
  switchBranch: vi.fn(),
  mergeBranch: vi.fn(),
  deleteBranch: vi.fn(),
  getFilteredVersions: vi.fn(() => mockVersions),
  searchVersions: vi.fn(() => mockVersions),
  getVersionHistory: vi.fn(),
  exportVersionHistory: vi.fn(),
};

describe('VersionHistory', () => {
  const mockOnRestoreVersion = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVersioning.mockReturnValue(mockVersioningHook);
  });

  it('renders version history with versions list', () => {
    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Version History')).toBeInTheDocument();
    expect(screen.getByText('(2 versions)')).toBeInTheDocument();
    expect(screen.getByText('Initial version')).toBeInTheDocument();
    expect(screen.getByText('Added more content')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseVersioning.mockReturnValue({
      ...mockVersioningHook,
      isLoading: true,
    });

    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Loading version history...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseVersioning.mockReturnValue({
      ...mockVersioningHook,
      error: 'Failed to load versions',
    });

    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Failed to load versions')).toBeInTheDocument();
  });

  it('allows filtering versions by search query', async () => {
    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search versions...');
    fireEvent.change(searchInput, { target: { value: 'initial' } });

    await waitFor(() => {
      expect(mockVersioningHook.searchVersions).toHaveBeenCalledWith('initial');
    });
  });

  it('allows restoring a version', async () => {
    mockVersioningHook.restoreVersion.mockResolvedValue(mockChapter);

    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    // Click on a version to select it
    const versionCard = screen.getByText('Initial version').closest('div');
    fireEvent.click(versionCard!);

    // Wait for the restore button to appear and click it
    await waitFor(() => {
      const restoreButton = screen.getByText('Restore This Version');
      fireEvent.click(restoreButton);
    });

    expect(mockVersioningHook.restoreVersion).toHaveBeenCalledWith('version-1');
    await waitFor(() => {
      expect(mockOnRestoreVersion).toHaveBeenCalledWith(mockChapter);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('allows exporting version history', async () => {
    const mockExportData = JSON.stringify(mockVersions, null, 2);
    mockVersioningHook.exportVersionHistory.mockResolvedValue(mockExportData);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mocked-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock createElement and click
    const mockAnchor = { click: vi.fn(), href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockVersioningHook.exportVersionHistory).toHaveBeenCalledWith(
        mockChapter.id,
        'json'
      );
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows empty state when no versions match search', () => {
    mockVersioningHook.getFilteredVersions.mockReturnValue([]);
    mockVersioningHook.searchVersions.mockReturnValue([]);

    render(
      <VersionHistory
        chapter={mockChapter}
        onRestoreVersion={mockOnRestoreVersion}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search versions...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No versions match your search.')).toBeInTheDocument();
  });
});