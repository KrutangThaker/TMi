// app.js
class SpotifyWordleGame {
  constructor() {
      this.currentSong = null;
      this.attempts = 0;
      this.maxAttempts = 6;
      this.snippetLengths = [3, 5, 7, 10, 15, 20]; // Snippet lengths in seconds
      this.gameState = 'waiting'; // waiting, playing, won, lost
      this.currentPlaylist = null;
  }

  async initialize() {
      try {
          // Fetch access token from backend
          const response = await fetch('/api/token');
          const data = await response.json();
          
          if (!data.access_token) {
              throw new Error('No access token received');
          }
          
          return true;
      } catch (error) {
          console.error('Failed to initialize game:', error);
          throw new Error('Failed to initialize game. Please check your Spotify credentials.');
      }
  }

  async initializeWithPlaylist(playlistUrl) {
      try {
          // First ensure we have a valid token
          await this.initialize();
          
          const playlistId = this.extractPlaylistId(playlistUrl);
          if (!playlistId) {
              throw new Error('Invalid playlist URL');
          }

          console.log('Fetching playlist with ID:', playlistId);

          // Fetch playlist from backend
          const response = await fetch(`/api/playlist/${playlistId}`);
          if (!response.ok) {
              throw new Error('Failed to fetch playlist');
          }

          const data = await response.json();
          
          if (!data.tracks || data.tracks.length === 0) {
              throw new Error('No tracks found in playlist');
          }

          // Filter tracks to only those with preview URLs
          const playableTracks = data.tracks.filter(track => track.previewUrl);
          
          if (playableTracks.length === 0) {
              throw new Error('No playable tracks found in playlist');
          }

          // Select random track
          const randomTrack = playableTracks[Math.floor(Math.random() * playableTracks.length)];
          
          this.currentSong = {
              name: randomTrack.name,
              artist: randomTrack.artist,
              previewUrl: randomTrack.previewUrl,
              duration: randomTrack.duration
          };

          console.log('Selected track:', this.currentSong.name);
          
          this.gameState = 'playing';
          this.attempts = 0;
          return true;
      } catch (error) {
          console.error('Error initializing game:', error);
          throw error;
      }
  }

  extractPlaylistId(playlistUrl) {
      try {
          const patterns = [
              /spotify:playlist:([a-zA-Z0-9]+)/, // Spotify URI
              /playlist\/([a-zA-Z0-9]+)/, // Web URL
              /^([a-zA-Z0-9]+)$/ // Direct ID
          ];

          for (const pattern of patterns) {
              const matches = playlistUrl.match(pattern);
              if (matches && matches[1]) {
                  return matches[1];
              }
          }
          return null;
      } catch (error) {
          console.error('Error extracting playlist ID:', error);
          return null;
      }
  }

  getCurrentSnippetLength() {
      return this.snippetLengths[Math.min(this.attempts, this.snippetLengths.length - 1)];
  }

  makeGuess(guessedSongName) {
      if (this.gameState !== 'playing') {
          return {
              correct: false,
              message: 'Game is not in active state'
          };
      }

      const normalizedGuess = guessedSongName.toLowerCase().trim();
      const normalizedAnswer = this.currentSong.name.toLowerCase().trim();

      const isCorrect = normalizedGuess === normalizedAnswer;

      if (isCorrect) {
          this.gameState = 'won';
          return {
              correct: true,
              message: `Congratulations! You guessed correctly: "${this.currentSong.name}" by ${this.currentSong.artist}`,
              songDetails: this.currentSong
          };
      }

      this.attempts++;
      
      if (this.attempts >= this.maxAttempts) {
          this.gameState = 'lost';
          return {
              correct: false,
              message: `Game Over! The song was "${this.currentSong.name}" by ${this.currentSong.artist}`,
              songDetails: this.currentSong
          };
      }

      // Calculate similarity score for hint
      const similarity = this.calculateSimilarity(normalizedGuess, normalizedAnswer);
      let hint = '';
      if (similarity > 0.8) {
          hint = "You're very close!";
      } else if (similarity > 0.6) {
          hint = "You're getting warmer!";
      } else if (similarity > 0.4) {
          hint = "You're on the right track.";
      }

      return {
          correct: false,
          message: `Incorrect guess. ${hint} You have ${this.maxAttempts - this.attempts} attempts remaining.`,
          snippetLength: this.getCurrentSnippetLength()
      };
  }

  calculateSimilarity(str1, str2) {
      // Simple Levenshtein distance implementation
      const matrix = Array(str2.length + 1).fill(null)
          .map(() => Array(str1.length + 1).fill(null));

      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

      for (let j = 1; j <= str2.length; j++) {
          for (let i = 1; i <= str1.length; i++) {
              const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
              matrix[j][i] = Math.min(
                  matrix[j][i - 1] + 1,
                  matrix[j - 1][i] + 1,
                  matrix[j - 1][i - 1] + indicator
              );
          }
      }

      const maxLength = Math.max(str1.length, str2.length);
      return 1 - matrix[str2.length][str1.length] / maxLength;
  }

  getGameState() {
      return {
          attempts: this.attempts,
          maxAttempts: this.maxAttempts,
          remainingAttempts: this.maxAttempts - this.attempts,
          currentSnippetLength: this.getCurrentSnippetLength(),
          gameState: this.gameState,
          currentSong: this.gameState === 'playing' ? {
              previewUrl: this.currentSong?.previewUrl
          } : this.currentSong
      };
  }

  resetGame() {
      this.currentSong = null;
      this.attempts = 0;
      this.gameState = 'waiting';
  }
}

export default SpotifyWordleGame;