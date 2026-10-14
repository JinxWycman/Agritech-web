# Repository instructions

- Read `docs/HANDOFF.md` first; it is the current project map and phase record.
- `docs/agritech-website-prompt.md` is the product source of truth. For a phase, read only its requested sections.
- Follow mock-first rules: screens use `src/services` interfaces; fixtures stay in `src/mocks`; mock mode makes no backend requests; unconfirmed API adapters remain explicit not-implemented stubs. Never modify the backend.
- Respect approved phase scope. Do not add unrelated refactors, dependencies, or documentation.
- Run `npm run typecheck` during implementation as needed; run `npm run lint`, `npm test`, and `npm run build` once at phase end, then rerun only failed commands.
- Do not start servers or browsers unless the user requests visual review.
- Preserve existing user changes. Do not commit, push, reset, stash, or switch branches unless explicitly authorized.
- At phase end, update `docs/HANDOFF.md` and `docs/missing-endpoints.md` before reporting.
- Use English and Kiswahili resources for user-facing copy. Mark Kiswahili agronomy text for expert review.
- Keep accessibility, WCAG AA contrast, keyboard access, visible focus, and 360px layouts in scope.
