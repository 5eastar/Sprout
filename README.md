# 🌱 Sprout

A browser-based teaching tool for running structured learning sessions with individual pupils or small groups. Built for classroom and clinic use — no internet required, no accounts, no data leaves the device.

---

## What it does

Sprout gives you three types of activity, a phonics group session mode, and a data tracking system that saves everything locally.

### Identify
Click-to-find or drag-and-drop matching. You pick a program, choose your targets, set the field size, and go. Supports picture→picture, picture→text, and text→picture stimulus modes so you can vary the format without rebuilding anything.

### Categories
Three games built around categorisation:
- **Sort** — drag stimuli into category bins that stay on screen
- **Label** — pick which category a stimulus belongs to from a field of options
- **Compare** — perceptual concept work (bigger/smaller, taller/shorter, etc.) using procedurally rendered tiles, so you don't need images

### Phonics
Group session mode for up to however many pupils you want. Runs three program types in sequence:
- **Produce Phoneme** — teacher-scored (you tap +/−/○ after the pupil responds)
- **Select Grapheme** — pupil picks the correct letter from a field
- **Select Picture** — pupil picks the picture that starts with the target sound

Each pupil gets their own turn screen, their own targets, and their own field size. You can skip a pupil, come back to them later, or shuffle the order mid-session from the teacher menu.

### Programs
All content lives in `data.js`. You can add custom programs through the UI — give it a name, add your stimuli, upload images, done. The app exports a new `data.js` you drop into the folder to make changes permanent. Text-only programs (no images) are supported for things like letter cards or word lists.

---

## Data & results

Results are saved to `localStorage` after every question, so if something goes wrong mid-session nothing is lost. At the end you get a summary screen with accuracy and response times, and you can export everything to CSV. The Pupil Data page shows lifetime history per pupil across all session types.

You can edit results after the fact — tap the edit icon on the results page to cycle scores or delete individual rows if you made an error scoring.

---

## Reinforcers

At the end of every session the pupil picks a reward from a scrolling carousel. There are six:

| Reinforcer | What it is |
|---|---|
| Balloons | Pop balloons with confetti |
| Sparkles | Interactive particle system |
| Ball Pit | 3D physics ball pit (Three.js) |
| Pond | Liquid koi pond you can drag through |
| Snowy Window | Frost a window and wipe it away |
| Xylophone | Playable xylophone with song guides |

You can turn individual reinforcers on or off from the Reinforcers settings page.

---

## Setup

It's a static site — no build step, no server, no dependencies to install.

```
your-folder/
├── data.js              ← all program content lives here
├── home.html
├── game.html
├── phonics-game.html
├── ... (other pages)
├── js/
├── styles/
├── audio/
│   ├── phonemes/        ← .mp3 files for phoneme audio (optional)
│   └── sounds/          ← sound effects for the pond reinforcer
└── images/
```

Open `home.html` in a browser. That's it.

If phoneme audio files aren't present the app falls back to speech synthesis automatically.

---

## Browser support

Works in any modern Chromium or WebKit browser. Tested on Chrome, Edge, and Safari. The Ball Pit and Pond reinforcers require WebGL. Everything else runs without it.

Speech synthesis uses the Web Speech API — voice quality depends on what voices are installed on the device. It will prefer a British English female voice if one is available.

---

## A few things worth knowing

- All data is in `localStorage`. Clearing browser storage clears pupil history. Export to CSV regularly if you want backups.
- The teacher menu is hidden — triple-tap the T button in the corner during a session to open it. From there you can skip to results, skip the countdown, or go back to the setup menu.
- The answer toggle (the switch in the bottom-right during a game) uses a hold gesture, not a tap. Hold it for about 1.5 seconds to toggle wait mode on or off.
- Programs with a lot of large images can make `data.js` quite big. The image compressor runs automatically when you upload through the UI (800×800px max, JPEG at 70% quality).

---

## License

MIT
