# iOS Release Checklist

- App Store name matches `app.json`: `Esco Beach Club`
- `store.config.json` is present and reviewed for title, subtitle, description, keywords, support URL, and privacy URL
- Privacy policy URL is live
- Terms of service URL is live
- Support URL is live
- Member review account is active
- Staff review account is active if QR scanner review is required
- App Review notes are filled in `docs/app-review/review-notes-template.md`
- App Store Connect app record exists for `com.escobeachclub.app`
- `submit.production.ios.ascAppId` is set before final automated submit, or the first submit is run interactively to create/link the app record
- Sample member QR payload is review-safe and matches a seeded member record
- `config/app-store/privacy-checklist.json` has been reviewed against current SDK usage
- `config/apple/privacy-manifest.json` matches the current app build
- `bun run check:ios-submission:strict` passes with production env values available
- Production iOS EAS build succeeds
- TestFlight smoke test passes on the exact binary submitted to review
