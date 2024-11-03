//game-ui.js
/*
to handle all the backend logic, etc for the game



*/
import SpotifyWordleGame from './app.js';

class SpotifyWordleUI {
    constructor() {
        this.game = new SpotifyWordleGame();
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

        this.bindEventListeners();
        console.log('SpotifyWordleUI initialized'); // Debug log
    }

    async startGame() {
        const playlistUrl = this.elements.playlistInput.value.trim();
        
        if (!playlistUrl) {
            this.showError('Please enter a valid Spotify playlist URL');
            return;
        }

        try {
            console.log('Starting game with playlist:', playlistUrl); // Debug log
            this.elements.startButton.disabled = true;
            this.elements.startButton.textContent = 'Loading...';

            // Initialize game with playlist
            const success = await this.game.initializeWithPlaylist(playlistUrl);
            console.log('Game initialization result:', success); // Debug log
            
            if (success) {
                this.elements.playlistSection.classList.add('hidden');
                this.elements.gameSection.classList.remove('hidden');
                this.setupAudioPlayer();
                console.log('Game started successfully'); // Debug log
            } else {
                throw new Error('Failed to initialize game');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            this.showError(error.message || 'Failed to start game. Please try again.');
        } finally {
            //start game
            this.elements.startButton.disabled = false;
            this.elements.startButton.textContent = 'Start Game';
        }
    }

    showError(message) {
        // Create and show an error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-500 text-white p-4 rounded-lg mt-4';
        errorDiv.textContent = message;
        
        // Insert error message after the playlist input section
        this.elements.playlistSection.appendChild(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000); 
        //after 5000 ms -> 5 seconds rmeove error
        
        console.error('Error shown:', message); // Debug log
    }
    bindEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.playButton.addEventListener('click', () => this.togglePlay());
        this.elements.submitGuess.addEventListener('click', () => this.submitGuess());
        this.elements.playAgainButton.addEventListener('click', () => this.resetGame());
        
        // Add keyboard support
        this.elements.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess();
            }
        });
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => { 
    //ad the event
    console.log('DOM loaded, initializing UI'); // Debug log
    window.gameUI = new SpotifyWordleUI(); // Make it accessible for debugging
});

export default SpotifyWordleUI;