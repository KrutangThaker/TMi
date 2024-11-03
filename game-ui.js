// Import the game logic class
import SpotifyWordleGame from './spotify-auth.js';

class SpotifyWordleUI {
    constructor() {
        // Initialize game instance
        this.game = new SpotifyWordleGame();
        
        // Audio player elements
        this.audio = new Audio();
        this.isPlaying = false;
        
        // Cache DOM elements
        this.elements = {
            playlistSection: document.getElementById('playlist-section'),
            gameSection: document.getElementById('game-section'),
            playlistInput: document.getElementById('playlist-url'),
            startButton: document.getElementById('start-game'),
            playButton: document.getElementById('play-button'),
            progressBar: document.getElementById('progress-bar'),
            duration: document.getElementById('duration'),
            guessInput: document.getElementById('guess-input'),
            submitGuess: document.getElementById('submit-guess'),
            attempts: document.getElementById('attempts'),
            previousGuesses: document.getElementById('previous-guesses'),
            resultsModal: document.getElementById('results-modal'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            playAgainButton: document.getElementById('play-again')
        };

        // Bind event listeners
        this.bindEventListeners();
    }

    bindEventListeners() {
        // Start game
        this.elements.startButton.addEventListener('click', () => this.startGame());

        // Audio controls
        this.elements.playButton.addEventListener('click', () => this.togglePlay());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.stopPlaying());

        // Guess submission
        this.elements.submitGuess.addEventListener('click', () => this.makeGuess());
        this.elements.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });

        // Play again
        this.elements.playAgainButton.addEventListener('click', () => this.resetGame());
    }

    async startGame() {
        const playlistUrl = this.elements.playlistInput.value.trim();
        
        if (!playlistUrl) {
            this.showError('Please enter a valid Spotify playlist URL');
            return;
        }

        try {
            // Show loading state
            this.elements.startButton.disabled = true;
            this.elements.startButton.textContent = 'Loading...';

            // Initialize game with playlist
            const success = await this.game.initializeWithPlaylist(playlistUrl);
            
            if (success) {
                // Show game section
                this.elements.playlistSection.classList.add('hidden');
                this.elements.gameSection.classList.remove('hidden');
                this.elements.gameSection.classList.add('visible');

                // Set up audio
                this.setupAudioPlayer();
            } else {
                this.showError('Failed to load playlist. Please check the URL and try again.');
            }
        } catch (error) {
            this.showError('An error occurred while starting the game.');
            console.error(error);
        } finally {
            this.elements.startButton.disabled = false;
            this.elements.startButton.textContent = 'Start Game';
        }
    }

    setupAudioPlayer() {
        // Set up audio source and snippet length
        const snippetLength = this.game.getCurrentSnippetLength();
        this.audio.src = this.game.currentSong.previewUrl;
        this.audio.currentTime = 0;
        this.audio.duration = snippetLength;

        // Update duration display
        this.updateDurationDisplay(snippetLength);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.elements.playButton.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
        } else {
            this.audio.play();
            this.isPlaying = true;
            this.elements.playButton.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `;
        }
    }

    updateProgress() {
        const snippetLength = this.game.getCurrentSnippetLength();
        const progress = (this.audio.currentTime / snippetLength) * 100;
        this.elements.progressBar.style.width = `${Math.min(progress, 100)}%`;
        
        // Stop if we've reached the snippet length
        if (this.audio.currentTime >= snippetLength) {
            this.stopPlaying();
        }
    }

    stopPlaying() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.elements.playButton.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        `;
    }

    async makeGuess() {
        const guess = this.elements.guessInput.value.trim();
        
        if (!guess) return;

        const result = await this.game.makeGuess(guess);
        
        // Add guess to history
        this.addGuessToHistory(guess, result.correct);
        
        // Update attempts display
        this.elements.attempts.textContent = `Attempts: ${this.game.attempts}/6`;
        
        // Clear input
        this.elements.guessInput.value = '';

        if (result.correct || this.game.gameState === 'lost') {
            this.showResults(result);
        } else {
            // Update audio snippet length
            this.setupAudioPlayer();
        }
    }

    addGuessToHistory(guess, isCorrect) {
        const guessElement = document.createElement('div');
        guessElement.className = `guess-item p-2 rounded ${isCorrect ? 'correct-guess' : 'bg-gray-700'}`;
        guessElement.textContent = guess;
        this.elements.previousGuesses.insertBefore(guessElement, this.elements.previousGuesses.firstChild);
    }

    showResults(result) {
        this.elements.resultTitle.textContent = result.correct ? 'Congratulations!' : 'Game Over';
        this.elements.resultMessage.textContent = result.message;
        this.elements.resultsModal.classList.remove('hidden');
        this.elements.resultsModal.classList.add('visible');
    }

    resetGame() {
        // Reset game state
        this.game.resetGame();
        
        // Clear UI
        this.elements.previousGuesses.innerHTML = '';
        this.elements.attempts.textContent = 'Attempts: 0/6';
        this.elements.guessInput.value = '';
        
        // Hide results modal
        this.elements.resultsModal.classList.add('hidden');
        this.elements.resultsModal.classList.remove('visible');
        
        // Show playlist section
        this.elements.gameSection.classList.add('hidden');
        this.elements.playlistSection.classList.remove('hidden');
        
        // Stop audio
        this.stopPlaying();
    }

    updateDurationDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        this.elements.duration.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    showError(message) {
        // You can implement a more sophisticated error display system
        alert(message);
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpotifyWordleUI();
});

export default SpotifyWordleUI;