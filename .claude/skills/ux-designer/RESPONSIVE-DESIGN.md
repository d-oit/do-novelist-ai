# Responsive Design Guidelines

## Mobile-First Strategy

1.  **Start Small**: Design for < 640px first.
2.  **Stack Vertically**: Use `flex-col` by default.
3.  **Touch Targets**: Minimum 44x44px for all interactive elements.

## Breakpoints

- **Mobile**: < 640px (1 column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: > 1024px (3-4 columns)

## Layout Patterns

- **Grid**: Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- **Navigation**: Hamburger menu on mobile, visible links on desktop.
- **Spacing**: Reduce padding/margins on mobile (`p-4` vs `md:p-8`).
