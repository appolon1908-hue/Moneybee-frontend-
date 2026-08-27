## MoneyBee frontend change

### Required checks
- [ ] `pnpm test:design` passes
- [ ] No literal colors were added outside design tokens
- [ ] No page-specific font, button, header or footer system was introduced
- [ ] New marketing routes inherit `MarketingShell`
- [ ] Responsive behavior checked at mobile, tablet and desktop widths
- [ ] Keyboard focus and reduced-motion behavior checked
- [ ] No lender/approval/financial decision logic was added to the frontend

### Visual evidence
Describe the changed user journey and attach screenshots for desktop and mobile when UI behavior changes.

### API/security boundary
Confirm forms continue to submit only through the MoneyBee API and no secrets or direct CRM/vendor calls were introduced.
