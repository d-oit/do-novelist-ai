import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// import userEvent from '@testing-library/user-event'; // Not installed

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // const user = userEvent.setup(); // Not installed
  return {
    // user,
    ...render(ui, { ...options }),
  };
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };
