import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '../CharacterCard';
import type { Character, CharacterRole, CharacterArc } from '../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: any) => (
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Crown: ({ className }: any) => <div className={className} data-testid="crown-icon" />,
  Sword: ({ className }: any) => <div className={className} data-testid="sword-icon" />,
  Heart: ({ className }: any) => <div className={className} data-testid="heart-icon" />,
  BookOpen: ({ className }: any) => <div className={className} data-testid="bookopen-icon" />,
  Users: ({ className }: any) => <div className={className} data-testid="users-icon" />,
  Zap: ({ className }: any) => <div className={className} data-testid="zap-icon" />,
  Target: ({ className }: any) => <div className={className} data-testid="target-icon" />,
  Edit3: ({ className }: any) => <div className={className} data-testid="edit3-icon" />,
  Trash2: ({ className }: any) => <div className={className} data-testid="trash2-icon" />,
  CheckCircle2: ({ className }: any) => <div className={className} data-testid="checkcircle2-icon" />,
}));

const createMockCharacter = (overrides?: Partial<Character>): Character => ({
  id: 'char-1',
  projectId: 'project-1',
  name: 'John Doe',
  role: 'protagonist' as CharacterRole,
  arc: 'growth' as CharacterArc,
  age: 30,
  gender: 'male',
  occupation: 'Detective',
  motivation: 'To solve the mystery and bring justice',
  goal: 'Find the truth behind the conspiracy',
  conflict: 'Must choose between justice and protecting loved ones',
  backstory: 'Former military officer turned detective',
  traits: [
    { category: 'personality', name: 'Brave', description: 'Fearless in danger', intensity: 8 },
    { category: 'skill', name: 'Combat', description: 'Expert fighter', intensity: 9 },
  ],
  relationships: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  imageUrl: undefined,
  ...overrides,
});

describe('CharacterCard', () => {
  const mockOnSelect = vi.fn();
  const mockOnToggleSelection = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering with props', () => {
    it('renders character card with basic information', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('protagonist')).toBeInTheDocument();
      expect(screen.getByText('To solve the mystery and bring justice')).toBeInTheDocument();
    });

    it('renders character card with custom role', () => {
      const character = createMockCharacter({ role: 'antagonist' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('antagonist')).toBeInTheDocument();
      expect(screen.getByTestId('sword-icon')).toBeInTheDocument();
    });

    it('renders character card with image', () => {
      const character = createMockCharacter({ imageUrl: 'https://example.com/image.jpg' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const image = screen.getByAltText('John Doe');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('renders fallback icon when no image is provided', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('displays character arc', () => {
      const character = createMockCharacter({ arc: 'redemption' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('redemption arc')).toBeInTheDocument();
    });

    it('displays correct tier badge for protagonist', () => {
      const character = createMockCharacter({ role: 'protagonist' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('main')).toBeInTheDocument();
    });

    it('displays correct tier badge for supporting character', () => {
      const character = createMockCharacter({ role: 'supporting' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const supportingElements = screen.getAllByText('supporting');
      expect(supportingElements).toHaveLength(2); // One for role, one for tier badge
    });

    it('displays correct tier badge for comic relief character', () => {
      const character = createMockCharacter({ role: 'comic-relief' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('minor')).toBeInTheDocument();
    });

    it('shows selection checkbox when selected', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={true}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('checkcircle2-icon')).toBeInTheDocument();
    });

    it('does not show selection icon when not selected', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByTestId('checkcircle2-icon')).not.toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('calls onSelect when card is clicked', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByText('John Doe').closest('div');
      if (card && card.parentElement) {
        fireEvent.click(card.parentElement);
        expect(mockOnSelect).toHaveBeenCalledWith(character);
      }
    });

    it('calls onToggleSelection when checkbox is clicked', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const checkbox = screen.getByRole('button', { name: '' });
      fireEvent.click(checkbox);
      expect(mockOnToggleSelection).toHaveBeenCalledWith('char-1');
    });

    it('calls onEdit when edit button is clicked', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByLabelText('Edit character');
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(character);
    });

    it('calls onDelete when delete button is clicked', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete character');
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith('char-1');
    });

    it('prevents event propagation when edit button is clicked', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByLabelText('Edit character');
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('prevents event propagation when delete button is clicked', () => {
      const character = createMockCharacter();
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete character');
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('handles characters with empty motivation', () => {
      const character = createMockCharacter({ motivation: '' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles very long character names', () => {
      const character = createMockCharacter({
        name: 'A Very Long Character Name That Should Be Truncated',
      });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('A Very Long Character Name That Should Be Truncated')).toBeInTheDocument();
    });

    it('displays love-interest role correctly with hyphen replaced', () => {
      const character = createMockCharacter({ role: 'love-interest' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('love interest')).toBeInTheDocument();
    });

    it('displays comic-relief role correctly with hyphen replaced', () => {
      const character = createMockCharacter({ role: 'comic-relief' });
      render(
        <CharacterCard
          character={character}
          isSelected={false}
          onSelect={mockOnSelect}
          onToggleSelection={mockOnToggleSelection}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('comic relief')).toBeInTheDocument();
    });

    it('renders all role icons correctly', () => {
      const roles: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'mentor', 'foil', 'love-interest', 'comic-relief'];
      const expectedIcons = ['crown-icon', 'sword-icon', 'target-icon', 'bookopen-icon', 'zap-icon', 'heart-icon', 'users-icon'];

      roles.forEach((role, index) => {
        const { unmount } = render(
          <CharacterCard
            character={createMockCharacter({ role })}
            isSelected={false}
            onSelect={mockOnSelect}
            onToggleSelection={mockOnToggleSelection}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        );

        expect(screen.getByTestId(expectedIcons[index])).toBeInTheDocument();
        unmount();
      });
    });
  });
});
