# BlogForge Frontend

React + Vite + Tailwind CSS frontend for the BlogForge technical blog authoring platform.

## Project structure

- `src/main.tsx` — React entrypoint
- `src/App.tsx` — authentication and application routing coordinator
- `src/index.css` — global styles and Tailwind CSS v4 entrypoint
- `src/services/api.ts` — typed API client and authentication token helpers
- `src/components/` — shared UI and Markdown rendering components
- `src/pages/app/` — authenticated authoring workspace
- `src/pages/admin/` — administrator console
- `src/pages/Auth.tsx` — login and registration
- `src/pages/Landing.tsx` — public landing page
- `index.html` — Vite HTML shell

## Development

Run the development server with `npm run dev` or `pnpm dev`.

The production build is created with `npm run build` or `pnpm build`.

## Styling

The project uses Tailwind CSS v4 through `@tailwindcss/vite`. Use Tailwind utilities for component-level styling and `src/index.css` for global styles.

## Code quality

- Keep TypeScript strict and avoid `any` when a concrete type is practical.
- Keep interactive elements keyboard accessible and give icon-only controls accessible labels.
- Preserve the authenticated workflow: New Blog → Workflow → Outline Review → Research → Final Review → Blog Workspace.
- Keep API/backend contracts in `src/services/api.ts` synchronized with the backend.
- Do not add scaffold/demo branding or fake product metrics to the UI.
