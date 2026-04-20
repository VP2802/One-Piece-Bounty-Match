# One Piece: Bounty Match

A browser-based **One Piece themed tile-matching game** inspired by classic Pikachu gameplay, built with **HTML, CSS, and Vanilla JavaScript**.

## Live Demo

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0ea5e9?style=for-the-badge&logo=github)](https://vp2802.github.io/One-Piece-Bounty-Match/)

## About the Project

**One Piece: Bounty Match** reimagines the classic connect-and-match format with a pirate-themed presentation, multiple difficulty modes, continuous runs, dynamic board mechanics, and a polished UI.

Players clear pairs of identical tiles by connecting them with a valid path of at most **2 turns**. As difficulty increases, the board becomes larger, reshuffle access becomes more limited, and advanced movement rules such as board shifting make matches harder to predict.

The game supports both **quick single-stage play** and **continuous multi-stage runs**, with score tracking, time pressure, local leaderboard persistence, and custom audio/notification systems.

---

## Core Features

- **4 game modes**: Easy, Hard, Insane, Impossible
- **2 play types**: Single Run and Continuous
- **One Piece styled UI and board themes**
- **Wanted Poster countdown timer**
- **Combo-based scoring system**
- **Hints in Easy mode**
- **Manual reshuffle system** with per-mode limits
- **Board shifting mechanics** in higher difficulties
- **Pause / Resume / Restart / Home / End controls**
- **Persistent leaderboard** with score, time, mode, and stages cleared
- **Custom in-game toast notifications** instead of browser `alert()`
- **Sound toggle + volume slider**
- **Background music system** with:
  - normal BGM playlist during regular play
  - danger BGM playlist for the final 60 seconds
- **Responsive layout** for smaller screens

---

## Play Types

### Single Run
- Play exactly **1 stage**
- The result screen appears immediately after win or loss
- Best for quick score attempts

### Continuous
- Progress through stages back-to-back in the same run
- **Run total score** accumulates across cleared stages
- Top bar shows:
  - **Total** = total score of the run
  - **Stage Score** = score of the current stage only
  - **Stage** = current stage number
- After clearing a stage, a short stage-clear screen appears before the next stage starts automatically
- Press **End** anytime to finish the run and save the result

---

## Game Modes

| Mode | Time | Hints | Board Size | Reshuffle | Special Rules |
|------|------|-------|------------|-----------|---------------|
| Easy | 15 minutes | 3 | 9 x 10 | 5 | Reshuffle only unlocks after all hints are used |
| Hard | 12 minutes | 0 | 10 x 15 | 3 | Standard high-density board |
| Insane | 10 minutes | 0 | 12 x 15 | 1 | Fixed random shift direction for the whole stage |
| Impossible | 8 minutes | 0 | 15 x 16 | 0 | Board shifts in a random direction after every successful match |

---

## Scoring System

### Match Score
Each successful match grants:
- **Base score**: `100`
- **Combo bonus** based on current combo streak and difficulty

### Combo Bonus Per Level
- **Easy**: `+10`
- **Hard**: `+15`
- **Insane**: `+25`
- **Impossible**: `+35`

Combo scaling is capped at the first **5 combo levels**.

### Time Bonus Multiplier
Remaining time is converted into bonus score on stage clear:
- **Easy**: `x8`
- **Hard**: `x12`
- **Insane**: `x16`
- **Impossible**: `x20`

### Mode Bonus
- **Easy**: `0`
- **Hard**: `500`
- **Insane**: `1200`
- **Impossible**: `2500`

### Final Stage Score
```text
Stage Total = Match Score + Time Bonus + Mode Bonus
```

In **Continuous** mode, only cleared stages are added into the run total.

### Leaderboard Ranking Priority
1. Higher **score**
2. More **stages cleared**
3. Faster **completion time**

---

## Hint and Reshuffle Rules

### Hint
- Only available in **Easy** mode
- Each use reveals a valid pair
- Each hint costs **200 score**
- When hints reach `0`, the **Hint button disappears**
- In Easy mode, using all hints also **unlocks Reshuffle**

### Reshuffle
- **Easy**: hidden until all hints are used
- **Hard**: available immediately
- **Insane**: available immediately
- **Impossible**: unavailable

If no valid move exists:
- the game attempts to reshuffle the remaining tiles
- if repeated reshuffles still fail, the remaining board may be rebuilt to avoid deadlock

---

## Audio System

The game includes a simplified sound system and playlist-based background music.

### Sound Effects
- `match.mp3`
- `wrong.mp3`
- `win.mp3`
- `lose.mp3`

### Background Music
- **Normal playlist**: plays during standard gameplay
- **Danger playlist**: automatically replaces the normal playlist when the timer reaches the last **60 seconds**

### Volume Control
- Sound can be toggled on/off
- A **volume slider** lets the player control audio intensity
- Sound settings are saved with `localStorage`

---

## Controls

- **Sound**: mute/unmute all game audio
- **Volume Slider**: adjust global audio level
- **Hints**: reveal a valid pair in Easy mode
- **Reshuffle**: shuffle remaining tiles when the mode allows it
- **Pause**: freeze the game and music
- **Restart**: restart the current mode/run
- **End**: finish the current continuous run
- **Home**: return to the start screen

---

## How to Play

1. Open the game in your browser
2. Choose a **Play Type**
3. Select a **Mode**
4. Click two identical tiles to match them
5. A pair is valid only if the tiles can be connected with a path of at most **2 turns**
6. Clear all tiles before time runs out
7. Aim for high combo chains, faster clears, and better leaderboard placement

---

## Tech Stack

- **HTML5**
- **CSS3**
- **Vanilla JavaScript**
- **LocalStorage** for leaderboard and sound settings
- **GitHub Pages** for deployment

---

## Project Structure

```text
One-Piece-Bounty-Match/
├── index.html
├── style.css
├── script.js
├── README.md
├── image/
└── sound/
    ├── match.mp3
    ├── wrong.mp3
    ├── win.mp3
    ├── lose.mp3
    └── bgm/
        ├── normal/
        └── danger/
```

---

## Notes

- Easy mode is intentionally beginner-friendly and gradually introduces pressure
- Insane and Impossible rely more heavily on board movement and route disruption
- Continuous mode rewards consistency over multiple stages
- Leaderboard and sound preferences are stored locally in the browser
- The game uses custom toast notifications to provide feedback without blocking gameplay

---

## Current Status

The current version already includes:
- custom toast notifications
- grouped sound controls
- persistent sound settings
- normal and danger BGM playlists
- cleaned-up single-SFX audio structure

---

## Future Improvements

- Player name input for leaderboard entries
- Distinct BGM per mode or per stage theme
- Smoother BGM crossfade when switching to danger mode
- Additional board themes and character sets
- Extra visual effects for combos, stage clear, and danger state
- Optional save/export for leaderboard records

---

## License / Asset Notes

Code structure and gameplay logic are project-authored.
Make sure any music, images, and external assets used in deployment follow the correct usage license for your public build.
