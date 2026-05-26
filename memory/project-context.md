---
name: project-context
description: Architecture overview of the TreeMap Editor — Angular 17 Electron app with auth + dashboard layer
metadata:
  type: project
---

Angular 17 standalone app (esbuild builder), packaged with Electron. No NgModules anywhere.

**Added May 2026:** auth layer + dashboard + routing on top of the existing tree editor.

Key packages: `@angular/router@17`, `tailwindcss@3` (preflight disabled in config).

**Why:** User asked to add login, dashboard, and TreeMap card management as a new layer over the existing single-view editor.

**How to apply:** New routes use lazy `loadComponent`. The editor is wrapped in `EditorShellComponent` which calls `treeService.loadDocument()` on init and saves back via `treemapListSvc.updateData()` on destroy.

Route structure:
- `/login` → LoginComponent (guestGuard)
- `/dashboard` → DashboardComponent (authGuard)
- `/editor/:id` → EditorShellComponent (authGuard)

Data stored in localStorage:
- `treemap-auth-user` — current AuthUser JSON
- `treemap-list` — TreeMapDocument[] JSON (includes TreeDocument data per item)
- `treemap-editor-data` — legacy key used by TreeService when active in editor
