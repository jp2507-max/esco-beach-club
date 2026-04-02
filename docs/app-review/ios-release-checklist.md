# iOS Release Checklist

- App Store name matches `app.json`: `Esco Beach Club`
- Privacy policy URL is live
- Terms of service URL is live
- Support URL is live
- Associated domain file is live for `escolife.app`
- Member review account is active
- Staff review account is active if QR scanner review is required
- App Review notes are filled in `docs/app-review/review-notes-template.md`
- `eas.json` has the real `submit.production.ios.ascAppId` value instead of the placeholder
- Sample member QR payload is review-safe and matches a seeded member record
- `config/app-store/privacy-checklist.json` has been reviewed against current SDK usage
- `config/apple/privacy-manifest.json` matches the current app build
- Production iOS EAS build succeeds
- TestFlight smoke test passes on the exact binary submitted to review
