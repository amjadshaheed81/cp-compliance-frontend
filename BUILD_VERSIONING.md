# Frontend build versioning

The visible build number uses this format:

`Year.ReactMajor.ApplicationMajor.Build`

Example: `2026.18.1.1`

- `2026` is generated from the build year.
- `18` is generated from the React major version in `package.json`.
- `1` is the application major version in `build-version.json` and is changed manually for a major application release.
- The final number is increased automatically by `npm run build`.

## Normal commands

- `npm start` regenerates development metadata without increasing the build number.
- `npm test` regenerates test metadata without increasing the build number.
- `npm run build` increases the final build number and generates production metadata before React builds.

## Show or hide the build number in the UI

Edit `public/app-config.js`:

```javascript
window.__CP_COMPLIANCE_CONFIG__ = {
  showBuildNumber: true,
};
```

Set `showBuildNumber` to `false` to hide the build from the login page and left navigation.

The browser console always reports the build number, even when the UI display is disabled.
The generated production build also contains `/build-info.json` for support checks.
