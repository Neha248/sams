# Design System: SAMS Admin Dashboard (Academic Intelligence)

**Stitch Project:** [SAMS Admin Dashboard](https://stitch.withgoogle.com/projects/15144969386023659098)  
**Project ID:** `15144969386023659098`  
**Screen:** SAMS - Department Dashboard

## Visual Theme

Professional glassmorphism for higher-ed administration: deep academic blues, translucent cards, Outfit + Inter typography, 8px spacing rhythm.

## Implementation (Atomic Design)

| Layer | Location |
|-------|----------|
| Atoms | `src/components/atoms/` — MaterialIcon, TrendChip, GhostIcon |
| Molecules | `src/components/molecules/` — NavItem, SearchField, DepartmentSelect |
| Organisms | `src/components/organisms/` — AdminSidebar, AdminTopBar, MetricBentoGrid, FacultyTable, AssignTeacherModal |
| Template | `src/components/templates/AdminStitchLayout.tsx` |
| Page | `src/pages/admin/DepartmentDashboard.tsx` |

## Key Colors

- Primary: `#00236f` / container `#1e3a8a`
- Secondary: `#0058be` / container `#2170e4`
- Tertiary (sidebar): `#222a3e`
- Surface: `#f8f9ff`
- On-surface text: `#0b1c30`

Tokens are mirrored in `tailwind.config.js` and `src/design/tokens.ts`.
