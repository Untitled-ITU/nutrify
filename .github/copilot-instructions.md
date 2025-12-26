# Copilot Code Review – Project Guidelines

**Project context:** University team project (React + Firebase Hosting, Firestore, Storage; CI via GitHub Actions). Reviews should be practical and lightweight. Prefer concise, actionable feedback over nitpicks.

## What to focus on (priorities)
1. **Build & CI sanity**
   - Workflow triggers match our branch model (`develop` → preprod, `main` → prod).
   - No secrets in version control; environment secrets are referenced via `${{ secrets.* }}`.
   - Workflows don’t fail on missing lockfiles (use guards or avoid cache when no lockfile).
2. **Security basics (lightweight)**
   - Firebase rules are not left fully open to the public.
   - If rules are temporary, surface a reminder to tighten later (do not block on it).
3. **Correctness & crashes**
   - Obvious runtime errors, missing null checks, or broken imports.
   - Dangerous operations without guards (e.g., unchecked user input).
4. **Clarity**
   - Dead code, duplicated logic, or unneeded files in repo.
   - README or comments missing for non-obvious steps (e.g., how to run locally).
5. **Performance (only if clear win)**
   - Flag only impactful issues (e.g., n+1 Firestore queries). Avoid micro-optimizations.

## What to avoid
- Style nitpicks if linters already cover them.
- Large refactors or opinionated patterns unless there is a correctness or security risk.
- Requesting changes for personal preferences.

## Tone & format
- Keep it brief, constructive, and specific.
- Prefer a short list with code suggestions when helpful.
- Use “Suggestion:” blocks for optional fixes.

## Examples

**Good:**
- “Build workflow fails when no `package-lock.json`. Suggest guarding `npm ci` or removing `cache: npm` until lockfile exists.”
- “Firestore rules allow public access until a fixed date. Since this is a student preprod, consider `request.auth != null` now.”

**Avoid:**
- “Rename all variables to X” without functional benefit.
- “Change the entire state management approach” with no clear bug or risk.