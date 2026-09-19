# The store app, in plain words

The store app is the live site inside an Apple shell. Every ship to Netlify
reaches it the same minute. No App Store review for app changes. The shell
is only for what a web page cannot do on an iPhone: push notifications, an
icon in the store, Apple Health later.

## Where it stands, 19 Sep 2026

DONE: Apple Developer account (team UGXVB2SSRZ), Xcode installed and signed in,
project opens, signing is automatic, Push is on, the app has run on Yusuf's own
iPhone and a test push reached it. Icon (YJB) in the project. Splash is dark
with the mark. iPhone-only, portrait. Camera and photo permission words in.
Encryption question answered in the plist. Public /privacy/, /terms/ and
/support/ pages live for the store links. Listing words, privacy answers and
review notes written in STORE-LISTING.md.

LEFT, and it is two sittings at the Mac with Jarvis driving:
1. App Store Connect (appstoreconnect.apple.com, Yusuf signs in, Jarvis fills):
   the app record, the listing, privacy answers, screenshots, review notes.
2. Xcode: Product > Archive > Distribute App > App Store Connect > Upload.
   Then in App Store Connect pick that build, press Add for Review, Submit.
3. Netlify: APNS_ENV to production the same day (see STORE-LISTING.md).

## What Jarvis does from here

- Icons and the splash screen from the brand mark.
- The push notification door on the site side (a token per phone, stored on
  the client's row) and the first notification: "Yusuf replied".
- The store listing words and screenshots.
- Google Play the same way (Android folder), $25 once.

## THE ONE REAL RISK, AND IT IS NOT THE PAPERWORK

App Review guideline 4.2, Minimum Functionality, in Apple's words: "Your app
should include features, content, and UI that elevate it beyond a repackaged
website. If your app is not particularly useful, unique, or app-like, it
doesn't belong on the App Store." Read again 15 Sep 2026 - unchanged.

This shell points at the live site. That is exactly the shape reviewers reject
most often, and the fact that it is genuinely a great app does not help if the
reviewer's test is "could I just open this in Safari".

So the shell has to do things Safari cannot BEFORE it is submitted, not after
a rejection:
  - PUSH NOTIFICATIONS. The plugin is already in the project; the token door
    on the site side is still owed. This is the single strongest answer to 4.2
    and it is also the thing the app most needs.
  - APPLE HEALTH. Steps already matter in the app and are being read off
    screenshots today. Reading them natively is a real native feature and an
    obvious one for a fitness app.
  - An icon, a splash screen and offline behaviour that does not look like a
    browser failing.

TestFlight has no such review, so the phone-in-hand proof and the link he
hands people are not blocked by any of this. Only the public listing is.

## Rules

- Never commit node_modules. `npm install` inside mobile/ rebuilds it.
- The web app is index.html at the repo root and stays the source of truth.
  mobile/www is a stub and is never the app.
