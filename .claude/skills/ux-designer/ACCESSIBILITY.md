# Accessibility Checklist (WCAG 2.1 AA)

## Visual

- [ ] **Contrast**: Text vs background must be > 4.5:1.
- [ ] **Color**: Don't use color alone to convey meaning (add icons/text).
- [ ] **Focus**: Interactive elements must have a visible focus ring.

## Structure

- [ ] **Headings**: Use `h1` -> `h6` in logical order.
- [ ] **Landmarks**: Use `<main>`, `<nav>`, `<aside>`, `<footer>`.
- [ ] **Lists**: Use `<ul>`/`<ol>` for grouped items.

## Interactive

- [ ] **Keyboard**: All actions reachable via Tab/Enter/Space.
- [ ] **Labels**: Inputs have `<label>` or `aria-label`.
- [ ] **Buttons**: Icons have `aria-label` or hidden text.
- [ ] **Images**: Decorative images have `alt=""`, informative ones have
      descriptions.
