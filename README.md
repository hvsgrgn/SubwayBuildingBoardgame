# Budapest Metrói: Subway Building Board Game 🚇

A single-player browser game where you build Budapest's four metro lines (M1–M4) on a grid map. It's written in plain JavaScript with no frameworks, and the board is drawn on an HTML canvas.

The game interface is in Hungarian.

## How to play

1. Enter your name in the main menu and start the game.
2. The game has **4 rounds**, one for each metro line. The order of the lines is randomized at the start.
3. Each turn, draw a **station card** (A, B, C, D or Joker). Then extend the current line from one of its ends to a station of the matching type. A Joker matches any station.
4. Build a segment by clicking **Útvonal építése** ("Build route"), then clicking the start station and the end station on the map.
5. If you can't use a card, just draw the next one.
6. The round ends once you've drawn 5 middle-platform or 5 side-platform cards, and the next line begins.

### Building rules

- Segments run straight along the grid, **horizontally, vertically or at 45°**.
- A segment can't pass through another station. Each segment connects exactly two stations.
- Segments can't **cross** each other. Lines can only meet at stations.
- Two stations can be connected by **only one segment**, but several lines can pass through the same station.

## Features

- Main menu with name entry and the rules
- Canvas-rendered map of Budapest stations, with Buda/Pest sides and districts
- A live timer, the player's name, and the current line's name and color
- A shuffled card deck with middle- and side-platform cards plus Jokers
- Rule checking for every segment you build (direction, crossings, duplicates, passing through stations)
- Round progress counters, with automatic switching to the next line
- Scoring: each round's score is the number of stations the line touches

## Running it

The game loads its map data from JSON files and uses ES modules, so it has to be served from a local web server. Opening `index.html` directly won't work. Use either of these:

- **VS Code:** install the *Live Server* extension, right-click `index.html`, and choose **Open with Live Server**.
- **Python:** run `python -m http.server` in the project folder, then open http://localhost:8000.

## Project structure

```
├── index.html / index.js / style.css   # main menu
├── game.html / game.css                # game screen
├── canvas.js                           # drawing the map, stations and lines
├── routebuilder.js                     # building segments + rule validation
├── state.js                            # game state, deck, rounds, timer
├── events.js / screens.js              # event handling and UI updates
├── stations.json                       # station positions, types, districts
├── lines.json                          # metro lines (name, color, start station)
└── images/                             # SVG cards and station icons
```

## About

Made for the Web Programming course at ELTE (2025), as the JavaScript assignment.
