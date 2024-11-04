# TMi
birthday project for tanisha. 

https://tmi-nn6uva4q4-krutangs-projects.vercel.app/


## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [License](#license)

## Features
- 🎵 **Spotify Integration**: Fetches songs from any public Spotify playlist.
- ⏳ **Progressive Song Snippets**: Snippet duration increases with each incorrect guess or skip (1s, 2s, 4s, 7s, 11s, 16s).
- 🔍 **Guessing Game**: Players guess the song title or artist based on the snippet.
- 📊 **Score Tracking**: Keep track of correct guesses.
- 💻 **Simple User Interface**: Easy-to-use interface for non-tech-savvy users.

## How It Works
1. The player inputs a public Spotify playlist URL.
2. The game fetches songs from the playlist using the Spotify Web API.
3. A random song is selected, and a short snippet (starting at 1 second) is played.
4. The player guesses the song title or artist.
5. If the guess is incorrect or skipped, the snippet length increases (2s, 4s, etc.).
6. The game continues until the player guesses correctly or skips through all snippets.