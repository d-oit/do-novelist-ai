import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/components/ui/Card';

describe('Card', () => {
  describe('rendering', () => {
    it('should render card with children', () => {
      render(<Card>Test Content</Card>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('rounded-xl', 'border', 'text-card-foreground');
      expect(card).toHaveClass('border-border/40', 'bg-card/80');
    });

    it('should render with elevated variant', () => {
      const { container } = render(<Card variant='elevated'>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('border-border/60', 'bg-card/90', 'backdrop-blur-md');
    });

    it('should render with glass variant', () => {
      const { container } = render(<Card variant='glass'>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('border-border/30', 'bg-card/50', 'backdrop-blur-xl');
    });

    it('should render with outline variant', () => {
      const { container } = render(<Card variant='outline'>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('border-border', 'bg-transparent');
    });
  });

  describe('interactive mode', () => {
    it('should apply interactive styles when interactive=true', () => {
      const { container } = render(<Card interactive>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('cursor-pointer');
    });

    it('should not apply interactive styles by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('customization', () => {
    it('should merge custom className', () => {
      const { container } = render(<Card className='custom-class'>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl'); // Still has base classes
    });

    it('should forward ref', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Content</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should pass through HTML attributes', () => {
      render(
        <Card data-testid='test-card' id='card-1'>
          Content
        </Card>,
      );
      const card = screen.getByTestId('test-card');

      expect(card).toHaveAttribute('id', 'card-1');
    });

    it('should support onClick handler', () => {
      const handleClick = vi.fn();
      render(
        <Card onClick={handleClick} interactive>
          Clickable
        </Card>,
      );
      const card = screen.getByText('Clickable');

      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('CardHeader', () => {
  it('should render with children', () => {
    render(<CardHeader>Header Content</CardHeader>);

    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should apply default styles', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;

    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardHeader className='custom-header'>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;

    expect(header).toHaveClass('custom-header');
    expect(header).toHaveClass('flex'); // Still has base classes
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<CardHeader ref={ref}>Header</CardHeader>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle', () => {
  it('should render as h3 element', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    const title = container.querySelector('h3');

    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Title');
  });

  it('should apply default styles', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    const title = container.querySelector('h3');

    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardTitle className='custom-title'>Title</CardTitle>);
    const title = container.querySelector('h3');

    expect(title).toHaveClass('custom-title');
    expect(title).toHaveClass('text-2xl'); // Still has base classes
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLHeadingElement | null };
    render(<CardTitle ref={ref}>Title</CardTitle>);

    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('CardDescription', () => {
  it('should render as paragraph element', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    const description = container.querySelector('p');

    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent('Description');
  });

  it('should apply default styles', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    const description = container.querySelector('p');

    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardDescription className='custom-desc'>Description</CardDescription>);
    const description = container.querySelector('p');

    expect(description).toHaveClass('custom-desc');
    expect(description).toHaveClass('text-sm'); // Still has base classes
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLParagraphElement | null };
    render(<CardDescription ref={ref}>Description</CardDescription>);

    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });
});

describe('CardContent', () => {
  it('should render with children', () => {
    render(<CardContent>Content</CardContent>);

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should apply default styles', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const content = container.firstChild as HTMLElement;

    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardContent className='custom-content'>Content</CardContent>);
    const content = container.firstChild as HTMLElement;

    expect(content).toHaveClass('custom-content');
    expect(content).toHaveClass('p-6'); // Still has base classes
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<CardContent ref={ref}>Content</CardContent>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter', () => {
  it('should render with children', () => {
    render(<CardFooter>Footer</CardFooter>);

    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should apply default styles', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;

    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardFooter className='custom-footer'>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;

    expect(footer).toHaveClass('custom-footer');
    expect(footer).toHaveClass('flex'); // Still has base classes
  });

  it('should forward ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<CardFooter ref={ref}>Footer</CardFooter>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Card composition', () => {
  it('should render full card with all components', () => {
    render(
      <Card variant='elevated' interactive data-testid='full-card'>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content Here</CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId('full-card')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content Here')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should work with partial composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Simple Card</CardTitle>
        </CardHeader>
        <CardContent>Just title and content</CardContent>
      </Card>,
    );

    expect(screen.getByText('Simple Card')).toBeInTheDocument();
    expect(screen.getByText('Just title and content')).toBeInTheDocument();
    expect(screen.queryByText('Footer')).not.toBeInTheDocument();
  });

  it('should work with custom content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>
            <span>Custom Title with Icon</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        </CardContent>
      </Card>,
    );

    expect(screen.getByText('Custom Title with Icon')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });
});

describe('display names', () => {
  it('should have correct display names', () => {
    expect(Card.displayName).toBe('Card');
    expect(CardHeader.displayName).toBe('CardHeader');
    expect(CardTitle.displayName).toBe('CardTitle');
    expect(CardDescription.displayName).toBe('CardDescription');
    expect(CardContent.displayName).toBe('CardContent');
    expect(CardFooter.displayName).toBe('CardFooter');
  });
});
