# The store app, in plain words

The store app is the live site inside an Apple shell. Every ship to Netlify
reaches it the same minute. No App Store review for app changes. The shell
is only for what a web page cannot do on an iPhone: push notifications, an
icon in the store, Apple Health later.

## What only Yusuf can do (about 20 minutes of clicking, then waiting)

1. Apple Developer account, $99 a year, in your own name:
   https://developer.apple.com/programs/enroll/  Apple takes 1 to 2 days to
   approve it. Nothing below works until this is approved.
2. Install Xcode from the Mac App Store (it is big, start the download now).
3. Open Xcode once, sign in with the same Apple ID (Xcode > Settings > Accounts).
4. Open this file in Xcode: mobile/ios/App/App.xcodeproj
   Click "App" at the top of the left panel > Signing & Capabilities >
   tick "Automatically manage signing" and pick your team.
   Press the + Capability button and add "Push Notifications" and
   "Background Modes" (tick Remote notifications).
5. Plug your iPhone in, pick it at the top, press the Play button. The app
   opens on your phone. That is the first proof.
6. Product > Archive > Distribute App > TestFlight. Apple emails you a link
   in about a day. That link is the one you hand people.

## What Jarvis does from here

- Icons and the splash screen from the brand mark.
- The push notification door on the site side (a token per phone, stored on
  the client's row) and the first notification: "Yusuf replied".
- The store listing words and screenshots.
- Google Play the same way (Android folder), $25 once.

## Rules

- Never commit node_modules. `npm install` inside mobile/ rebuilds it.
- The web app is index.html at the repo root and stays the source of truth.
  mobile/www is a stub and is never the app.
