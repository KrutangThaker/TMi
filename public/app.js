//app.js              # Main JavaScript file with game logic
// Required imports for Spotify Web API
import SpotifyWebApi from 'spotify-web-api-node';

/*
SpotifyWordleGame class => main logic, players guess song name from a randomly selected playlist with incremental increase in guess snippets.time
*/
class SpotifyWordleGame {
  constructor() { //env vars for spotify api initialization
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.REDIRECT_URI
    });
    
    //initialize vars using this
    this.currentSong = null; //initial song to be guessed
    this.attempts = 0; // # attempts
    //game will have 6 max attempts just like wordle
    this.maxAttempts = 6;
    //array of length of hint snippets
    this.snippetLengths = [3, 5, 7, 10, 15, 20]; // seconds per snippet depending on guess # (guess#1 starts at snippetLengths[0] = 3 seconds of song should be played.)
    this.gameState = 'waiting'; //defining game states which could be possibly:  waiting, playing, won, lost
  }

/**
   * new game with a rand song from the provided playlist
   * @param {string} playlistUrl - Spotify playlist URL
   * @returns {Promise<boolean>} - Success status of initialization
   */
  async initializeWithPlaylist(playlistUrl) {
    try {
        const playlistId = this.extractPlaylistId(playlistUrl); //grab playlist data 
        const playlist = await this.spotifyApi.getPlaylist(playlistId); //mnake sure it's available
        const tracks = playlist.body.tracks.items;
      
      // Select random song
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)]; //completely randomize song
        this.currentSong = { //prev defined constructor as a means to store current song details
            name: randomTrack.track.name,
            artist: randomTrack.track.artists[0].name,
            previewUrl: randomTrack.track.preview_url,
            duration: randomTrack.track.duration_ms
        };
      
      this.gameState = 'playing'; //update to playing song
        return true;
    }
    catch (error) {
        console.error('Error initializing game:', error);
        return false;
    }
  }

  extractPlaylistId(playlistUrl) {
    // Extract playlist ID from Spotify URL
    const matches = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
    return matches ? matches[1] : null;
  }

  getCurrentSnippetLength() {
    return this.snippetLengths[Math.min(this.attempts, this.snippetLengths.length - 1)]; //set the length of snippet to be played as a hint by using attempts# and snippet arrays
  }

  async makeGuess(guessedSongName) {
    if (this.gameState !== 'playing') {
      return {
        correct: false,
        message: 'Game is not in active state'
      };
    }

    const normalizedGuess = guessedSongName.toLowerCase().trim();
    const normalizedAnswer = this.currentSong.name.toLowerCase().trim();

    if (normalizedGuess === normalizedAnswer) {
      this.gameState = 'won';
      return {
        correct: true,
        message: 'Congratulations! You guessed the song correctly!',
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

    return {
      correct: false,
      message: `Incorrect guess. You have ${this.maxAttempts - this.attempts} attempts remaining.`,
      snippetLength: this.getCurrentSnippetLength()
    };
  }

  getGameState() {
    return {
      attempts: this.attempts,
      remainingAttempts: this.maxAttempts - this.attempts,
      currentSnippetLength: this.getCurrentSnippetLength(),
      gameState: this.gameState
    };
  }

  resetGame() {
    this.currentSong = null;
    this.attempts = 0;
    this.gameState = 'waiting';
  }
}

export default SpotifyWordleGame;