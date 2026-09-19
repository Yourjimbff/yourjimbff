# App Store listing — everything that goes into App Store Connect

Filled in by Jarvis, 19 Sep 2026. Yusuf pastes nothing: Jarvis fills the
forms in his browser while he is signed in. This file is the source so the
words are the same every time.

## App record (App Store Connect > My Apps > + > New App)
- Platform: iOS
- Name: YOURJIMBFF            (the one thing Yusuf may want to change: "My Gym BFF" / "Jim BFF")
- Primary language: English (U.S.)
- Bundle ID: com.yourjimbff.app   (already in the Xcode project)
- SKU: yourjimbff-ios
- User access: Full Access

## Version 1.0 — App Information
- Subtitle (30 max): Log your day in plain words
- Category: Health & Fitness. Secondary: Food & Drink
- Content rights: contains no third-party content that needs rights, unless the exercise demo images (wger, CC BY-SA, credited in-app) are live in the build — then "Yes, and I have the rights"
- Age rating: answer every question None / No. Fitness and nutrition guidance is not medical treatment information. Expected result: 4+
- Privacy Policy URL: https://yourjimbff.netlify.app/privacy/
- Support URL: https://yourjimbff.netlify.app/support/
- Marketing URL: https://yourjimbff.netlify.app/
- Copyright: 2026 Yusuf Richardson

## Promotional text (170 max, can change any time without a new build)
Free while it is new. Type what you ate, log your lift, and watch the day add up.

## Description (4000 max)
Logging food should be the easiest thing on the planet. In YOURJIMBFF you type what you ate the way you would say it - "3 eggs, a slice of sourdough and two turkey bacon" - and it is logged, priced in calories and protein, and listed out for you. No cups, no scales, no searching a database for the right brand of egg.

Everything you do in a day lives in one place:

FOOD
- Log a meal in one line, from a photo, or from a label
- Every food listed under its meal, tagged by what it is: protein, vegetable, carbohydrate
- Calories, protein, carbs and fat for the meal and for the day
- Your usual foods remembered so tomorrow is faster than today

TRAINING
- Log a workout as you do it - exercise, sets, reps, weight
- Build your own training week from the exercise library, or follow one your coach set
- Post-meal walks, steps and rest days count too

YOUR BODY
- Weigh-ins with the trend line, not just the number
- Progress photos kept private to you
- Sleep, energy and a journal line when you want one

JIM
Jim is the assistant inside the app. Tell Jim your day and Jim logs it - food, training, weigh-in, steps - and reads it back honestly: what was on the plate, what it does for your goal, and what to do differently next time. Jim remembers what you logged three days ago, so the feedback is about you, not a script.

FOR YOUR COACH
If you have a coach, they can see your logs and reply, so they are coaching off something real. If you do not, the app works on its own.

YOUR DATA IS YOURS
No ads, no trackers, nothing sold. You can delete your account and every log, photo and message in it from Settings, whenever you like.

Built by a coach who logs his own food in it every day.

## Keywords (100 max, commas, no spaces)
food log,macro tracker,calorie counter,workout log,fitness coach,meal tracker,protein,steps,gym

## What's New (version 1.0)
First release.

## Screenshots
iPhone 6.9" / 6.7" set (1290 x 2796): captured by Jarvis from the app, 5 screens - the day, a logged meal with its list, Jim's read, a workout, the weight chart. iPad: not needed, the app is iPhone-only.

## App Privacy (the questionnaire)
Does the app collect data: YES.
Collected and LINKED to the user, purpose "App Functionality" for all:
- Contact Info: Name, Email Address, Phone Number
- Health & Fitness: Health (weight, sleep), Fitness (food, workouts, steps)
- User Content: Photos or Videos (meal, label and progress photos), Other User Content (messages to Jim, journal)
- Identifiers: User ID (the access code)
Not collected: Location, Financial Info (Stripe holds cards, the app never sees them), Browsing History, Usage Data, Diagnostics, Purchases.
Tracking (data used to track across other companies' apps and sites): NO.

## Pricing and availability
Free. All countries. No in-app purchases in 1.0.

## App Review information
- Sign-in required: YES. Demo account: the access code below goes in the sign-in box (the same box takes an email for password accounts).
  Demo access code: (filled by Jarvis before submit)
- Notes for the reviewer:
  YOURJIMBFF is a food and training log with an assistant (Jim). To try it: on the home screen type "3 eggs and a slice of sourdough" into the log box and press Log; the meal appears on Today with each food listed. Tap Train to log a set. Tap the weight card to add a weigh-in. Push notifications carry replies from the person's coach and reminders. Camera and photo access are used only to log a meal, a label or a progress photo. The account can be deleted by the user from Settings.
- Contact: Yusuf Richardson, yusuf@yourjimbff.com, phone from his Apple Developer account.

## Export compliance
Answered in the app itself: ITSAppUsesNonExemptEncryption = NO in Info.plist (it only uses HTTPS). App Store Connect will not ask.

## The day the build goes to TestFlight
Netlify > Site configuration > Environment variables > APNS_ENV = production. Until that flips, every push to a TestFlight or store install answers BadDeviceToken. Xcode signs the archive with the production push entitlement on its own.
