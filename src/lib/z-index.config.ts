/**
 * Z-Index Scale
 *
 * Centralized z-index management following Anti-Slop guidelines.
 * Never use arbitrary z-index values - always reference these constants.
 */

export const Z_INDEX = {
  // Base layer
  BASE: 'z-0',

  // Content layers
  CONTENT_DECORATIVE: 'z-10', // Decorative overlays, gradients
  CONTENT_ELEVATED: 'z-20', // Elevated cards, dropdowns

  // Sticky elements
  STICKY_NAV: 'z-40', // Sticky headers, navigation
  STICKY_SIDEBAR: 'z-40', // Sticky sidebars

  // Modals and overlays
  MODAL_BACKDROP: 'z-50', // Modal backdrop layers
  MODAL: 'z-50', // Modal content
  DRAWER: 'z-50', // Drawer panels
  DROPDOWN: 'z-50', // Dropdown menus

  // Notifications
  TOAST: 'z-[100]', // Toast notifications
  TOOLTIP: 'z-[100]', // Tooltips
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

/**
 * Get z-index class by semantic name
 */
export function zIndex(key: ZIndexKey): string {
  return Z_INDEX[key];
}
