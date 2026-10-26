# Design and usability review — 0.8.6

Family controls, finder, canvas hints and popups fit narrow panes. Current-schema custom names survive validation and duplication; old default-name migration is restricted to schema-1 imports. All existing browser suites now gate the release workflow. Removed obsolete browser paths and corrected README test commands.

## Verification

All eight model/browser suites passed, including placement, manual saving, finder/recovery, themes and 12 cases with 100 people.

All four interfaces checked in Chromium at 320, 390, 600 and 1280 pixels, without page overflow, JavaScript errors or CSP violations. Audio UI checks use a mock Otzaria bridge and a sample library. Installed Otzaria/WebView rendering and physical audio output have not been tested. These are review builds, not store publications.
