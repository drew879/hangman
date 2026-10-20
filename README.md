# Hangtime

A mobile-first, pass-and-play Hangman game for two people. Built with dependency-free HTML, CSS, JavaScript, SVG, and Web Audio. Intended for https://drew879.github.io/hangman/.

## Play

Enter two names. The setter privately enters an answer and category, hides the answer, and hands the phone to the guesser. Tap the built-in QWERTY keyboard to play. Six incorrect letters draw the head, torso, first leg, second leg, first arm, and second arm. Solving earns the guesser one point; losing awards no points. Roles swap each round. “New session” clears the current game and scores after confirmation.

Answers support up to 140 characters, with a maximum of 24 characters per word. Spaces, punctuation, and numbers are shown automatically. English A–Z letters are guessed case-insensitively; common accented letters match their base letter. Other alphabets are rejected with guidance.

Progress, names, scores, and sound preference save in localStorage on this browser and device. Refresh resumes the same stage. Clearing browser data or private browsing may remove saved progress. This is a casual shared-device game: answers are concealed in the interface, but remain readable in browser storage/source tools. No backend, external fonts, analytics, or remote assets.

## Run locally

Run `python3 -m http.server 8000` in this directory and open http://localhost:8000. JavaScript modules require HTTP serving.

Run tests with `npm test` (Node.js 22 or newer). No installation needed.

## GitHub Pages

Push these files to the `main` branch of `drew879/hangman`. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions**. The included workflow tests the game and deploys just the five application files. All paths are relative for the `/hangman/` project URL.

The remote repository currently advertises no branches. Publishing from this workspace is blocked by invalid GitHub credentials.

## Verification

Automated tests cover scoring, the six-miss limit, repeated guesses, role assignment, multiword/accent handling, answer validation, and saved-state round trips. Chromium mobile checks passed for winning and losing scores, role swaps, custom categories, refresh recovery, handoff privacy, session reset, and layouts at 320, 375, and 440 pixels wide, with no browser errors. The optional `qa/browser_check.py` runner requires Python Playwright and Chromium. Actual iPhone testing and audible sound verification remain to be done.
