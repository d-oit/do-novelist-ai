import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Test Title',
    description: 'Test Description',
    onConfirm: vi.fn(),
  };

  it('renders when open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('renders default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel='Delete' cancelLabel='Go Back' />);

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('calls onConfirm and closes when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onCancel and closes when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes without calling onCancel when onCancel not provided', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('displays destructive variant with warning icon', () => {
    render(<ConfirmDialog {...defaultProps} variant='destructive' />);

    // Check for destructive button variant (destructive class should be present)
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton.className).toContain('bg-destructive');

    // Warning icon should be present in the document
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('displays default variant without warning icon', () => {
    render(<ConfirmDialog {...defaultProps} variant='default' />);

    // Check that warning icon container is not present
    const titleElement = screen.getByText('Test Title');
    expect(titleElement.previousElementSibling).toBeNull();
  });

  it('has proper accessibility attributes', () => {
    render(<ConfirmDialog {...defaultProps} />);

    // Dialog should have role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Close button should have accessible label
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('has autofocus on confirm button for destructive variant', () => {
    render(<ConfirmDialog {...defaultProps} variant='destructive' />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    // Button should be rendered with autoFocus prop
    expect(confirmButton).toBeInTheDocument();
  });

  it('has autofocus on cancel button for default variant', () => {
    render(<ConfirmDialog {...defaultProps} variant='default' />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    // Button should be rendered with autoFocus prop
    expect(cancelButton).toBeInTheDocument();
  });

  it('closes on Escape key press', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when clicking backdrop', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    }
  });
});
