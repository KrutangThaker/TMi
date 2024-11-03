// game-ui.js
import SpotifyWordleGame from './app.js';

class SpotifyWordleUI {
    constructor() {
        this.game = new SpotifyWordleGame();
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentProgressInterval = null;
        
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
        console.log('SpotifyWordleUI initialized');
    }

    bindEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.playButton.addEventListener('click', () => this.togglePlay());
        this.elements.submitGuess.addEventListener('click', () => this.submitGuess());
        this.elements.playAgainButton.addEventListener('click', () => this.resetGame());
        
        this.elements.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess();
            }
        });

        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.stopPlaying());
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showError('Error playing audio. Please try again.');
        });
    }

    async startGame() {
        const playlistUrl = this.elements.playlistInput.value.trim();
        
        if (!playlistUrl) {
            this.showError('Please enter a valid Spotify playlist URL');
            return;
        }

        try {
            console.log('Starting game with playlist:', playlistUrl);
            this.elements.startButton.disabled = true;
            this.elements.startButton.textContent = 'Loading...';

            const success = await this.game.initializeWithPlaylist(playlistUrl);
            
            if (success) {
                this.elements.playlistSection.classList.add('hidden');
                this.elements.gameSection.classList.remove('hidden');
                this.setupAudioPlayer();
                console.log('Game started successfully');
            }
        } catch (error) {
            console.error('Error starting game:', error);
            this.showError(error.message || 'Failed to start game. Please try again.');
        } finally {
            this.elements.startButton.disabled = false;
            this.elements.startButton.textContent = 'Start Game';
        }
    }

    setupAudioPlayer() {
        const gameState = this.game.getGameState();
        if (gameState.currentSong && gameState.currentSong.previewUrl) {
            this.audio.src = gameState.currentSong.previewUrl;
            this.audio.load();
            console.log('Audio player setup with URL:', gameState.currentSong.previewUrl);
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.stopPlaying();
        } else {
            this.startPlaying();
        }
    }

    startPlaying() {
        const snippetLength = this.game.getCurrentSnippetLength();
        this.audio.currentTime = 0;
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.elements.playButton.innerHTML = `
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                `;
                
                // Stop playing after snippet length
                setTimeout(() => {
                    this.stopPlaying();
                }, snippetLength * 1000);
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                this.showError('Error playing audio. Please try again.');
            });
    }

    stopPlaying() {
        this.audio.pause();
        this.isPlaying = false;
        this.elements.playButton.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        `;
    }

    updateProgress() {
        const snippetLength = this.game.getCurrentSnippetLength();
        const progress = (this.audio.currentTime / snippetLength) * 100;
        this.elements.progressBar.style.width = `${Math.min(progress, 100)}%`;
        
        const currentTime = Math.min(this.audio.currentTime, snippetLength);
        this.elements.duration.textContent = this.formatTime(currentTime);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    async submitGuess() {
        const guess = this.elements.guessInput.value.trim();
        
        if (!guess) {
            this.showError('Please enter a guess');
            return;
        }

        const result = this.game.makeGuess(guess);
        this.updateGameStatus(result);
        this.elements.guessInput.value = '';

        // Add guess to previous guesses list
        const guessElement = document.createElement('div');
        guessElement.className = 'p-2 bg-gray-700 rounded';
        guessElement.textContent = `${guess} - ${result.message}`;
        this.elements.previousGuesses.insertBefore(guessElement, this.elements.previousGuesses.firstChild);

        // Update attempts counter
        this.elements.attempts.textContent = `Attempts: ${this.game.attempts}/${this.game.maxAttempts}`;

        if (result.correct || this.game.gameState === 'lost') {
            this.showResults(result);
        }
    }

    updateGameStatus(result) {
        const gameState = this.game.getGameState();
        this.elements.attempts.textContent = `Attempts: ${gameState.attempts}/${gameState.maxAttempts}`;
    }

    showResults(result) {
        this.elements.resultTitle.textContent = result.correct ? 'Congratulations!' : 'Game Over';
        this.elements.resultMessage.textContent = result.message;
        this.elements.resultsModal.classList.remove('hidden');
    }

    resetGame() {
        this.game.resetGame();
        this.elements.resultsModal.classList.add('hidden');
        this.elements.playlistSection.classList.remove('hidden');
        this.elements.gameSection.classList.add('hidden');
        this.elements.previousGuesses.innerHTML = '';
        this.elements.guessInput.value = '';
        this.elements.attempts.textContent = 'Attempts: 0/6';
        this.stopPlaying();
        this.audio.src = '';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-500 text-white p-4 rounded-lg mt-4';
        errorDiv.textContent = message;
        
        this.elements.playlistSection.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        
        console.error('Error shown:', message);
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI');
    window.gameUI = new SpotifyWordleUI();
});

export default SpotifyWordleUI;