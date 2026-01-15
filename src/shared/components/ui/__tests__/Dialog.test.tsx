import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/Dialog';

describe('Dialog', () => {
  beforeEach(() => {
    // Clean up any existing portals
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  describe('Dialog component', () => {
    it('should render children', () => {
      render(
        <Dialog open={true}>
          <div>Dialog content</div>
        </Dialog>,
      );

      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('should control open state with open prop', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>Hidden content</DialogContent>
        </Dialog>,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <Dialog open={true}>
          <DialogContent>Visible content</DialogContent>
        </Dialog>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should call onOpenChange when state changes', async () => {
      const handleOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('DialogContent', () => {
    it('should render content when dialog is open', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('should not render when dialog is closed', () => {
      render(
        <Dialog open={false}>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should have correct accessibility attributes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should render close button with correct label', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('should close dialog when close button is clicked', async () => {
      const handleOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should close dialog when backdrop is clicked', async () => {
      const handleOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      // Find backdrop (the black overlay)
      const backdrop = document.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();

      if (backdrop) {
        fireEvent.click(backdrop);
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      }
    });

    it('should close dialog when Escape key is pressed', async () => {
      const handleOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should lock body scroll when open', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', async () => {
      const { rerender } = render(
        <Dialog open={true}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Dialog open={false}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('unset');
      });
    });

    it('should apply custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent className='custom-dialog'>Test content</DialogContent>
        </Dialog>,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-dialog');
    });

    it('should forward additional props to dialog element', () => {
      render(
        <Dialog open={true}>
          <DialogContent data-testid='custom-dialog'>Test content</DialogContent>
        </Dialog>,
      );

      expect(screen.getByTestId('custom-dialog')).toBeInTheDocument();
    });

    it('should focus first focusable element when opened', async () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <button>First button</button>
            <button>Second button</button>
          </DialogContent>
        </Dialog>,
      );

      await waitFor(() => {
        expect(screen.getByText('First button')).toHaveFocus();
      });
    });

    it('should render in portal to document.body', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Portal content</DialogContent>
        </Dialog>,
      );

      // Check that dialog is rendered as a child of document.body
      const dialog = screen.getByRole('dialog');
      // The portal structure is: body > div (portal root) > div (fixed container) > motion.div (backdrop + dialog)
      let current = dialog.parentElement;
      let foundBody = false;
      while (current) {
        if (current === document.body) {
          foundBody = true;
          break;
        }
        current = current.parentElement;
      }
      expect(foundBody).toBe(true);
    });
  });

  describe('DialogHeader', () => {
    it('should render children', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <h2>Header content</h2>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader data-testid='dialog-header'>Header</DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader className='custom-header' data-testid='dialog-header'>
              Header
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('DialogFooter', () => {
    it('should render children', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter data-testid='dialog-footer'>Footer</DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass('flex', 'flex-col-reverse');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter className='custom-footer' data-testid='dialog-footer'>
              Footer
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('DialogTitle', () => {
    it('should render as h2 element', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      const title = screen.getByText('Dialog Title');
      expect(title.tagName).toBe('H2');
    });

    it('should apply default classes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle className='custom-title'>Title</DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('DialogDescription', () => {
    it('should render as paragraph element', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>Dialog description text</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      const description = screen.getByText('Dialog description text');
      expect(description.tagName).toBe('P');
    });

    it('should apply default classes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should apply custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription className='custom-desc'>Description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('Complete Dialog example', () => {
    it('should render complete dialog with all components', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Confirmation</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div>Additional content here</div>
            <DialogFooter>
              <button>Cancel</button>
              <button>Delete</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to delete this item? This action cannot be undone.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Additional content here')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should handle complete user interaction flow', async () => {
      const handleOpenChange = vi.fn();
      const handleCancel = vi.fn();
      const handleConfirm = vi.fn();

      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>Please confirm your action</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleConfirm}>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );

      // Click confirm button
      fireEvent.click(screen.getByText('Confirm'));
      expect(handleConfirm).toHaveBeenCalled();

      // Close dialog via close button
      fireEvent.click(screen.getByLabelText('Close'));
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid open/close state changes', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>Content</DialogContent>
        </Dialog>,
      );

      rerender(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>,
      );

      rerender(
        <Dialog open={false}>
          <DialogContent>Content</DialogContent>
        </Dialog>,
      );

      rerender(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle dialog without onOpenChange callback', async () => {
      render(
        <Dialog open={true}>
          <DialogContent>Test content</DialogContent>
        </Dialog>,
      );

      // Should not throw when clicking close without callback
      const closeButton = screen.getByLabelText('Close');
      expect(() => fireEvent.click(closeButton)).not.toThrow();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>,
      );

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(document.body.style.overflow).toBe('unset');
    });
  });
});
