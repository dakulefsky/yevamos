# Review — 2026-10-22

## Fixed in this change

- Replaced male/female glyphs with Hebrew words in picker buttons; removed gender badges from bubbles.
- Removed the large death X and dagger. Added a dark lower banner with white נפטר / נפטרה text; names and two note lines sit above the banner.
- Corrected a later CSS rule that overrode deceased borders, especially for female people; both sexes now retain the deceased border color.
- Initial rendering adds a default viewport to empty cases. The save baseline previously preceded that initialization, causing an untouched session to count as dirty. Capture the baseline after rendering instead.
- SVG export copied computed selection styles before removing the selected class, leaving the selection highlight in the downloaded image. Resolve styles with the highlight temporarily removed, then restore the canvas selection.
- The session test server now returns 204 for the browser favicon request instead of reporting an unrelated 404 as an application console error.

## Remaining findings

1. **Custom names can be changed by validation.** `plugin/model.js`, `validateCase`, maps every name through `oldNames`, including current data and ordinary edits. For example, a custom name `David` becomes `דוד` on validation. Restrict name migration to data known to contain legacy default names; the current schema does not retain whether a name was user-entered. A migration decision is needed to preserve both old defaults and custom English names.
2. **CI runs only the model and navigation suites.** `.github/workflows/release.yml` omits placement, session, manual save, finder/recovery, theme, and large-case tests. Run these before publishing so save/recovery and visual regressions block releases.
3. **README test instructions mention a missing file.** `visual_review.cjs` is not in this repository. Replace that command with the existing theme/session tests or supply the review script.
4. **Browser test setup contains old workspace paths.** `browser_support.cjs` embeds a prior Chromium location, and the placement test uses a fixed port. Prefer the installed Playwright browser or the documented environment override, and an ephemeral port for parallel runs.

## Validation

Passed all eight existing suites with system Chromium: model, placement (including its intentional old-version reproduction), session, manual save, navigation, theme, finder/recovery, and large case (12 cases × 100 people). Added regression assertions for an initially clean session, Hebrew gender labels, removal of the X, persistence of the death label, and SVG selection styling. Generated an installable package and standalone HTML preview with `python3 build.py --preview`.

Actual Otzaria host installation was not tested; browser tests use a theme-event stub.
