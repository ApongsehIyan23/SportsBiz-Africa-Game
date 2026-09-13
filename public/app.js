const socket = io();
let myTeam = null;
let currentFeedbackSound = null;
let timerInterval = null;
let shuffleInterval = null;
let leaderboardTransitionTimer = null; // New timer for the screen wipe
let latestScores = { 'Team A': 0, 'Team B': 0, 'Team C': 0 }; // Stores scores for the big screen

// Howler.js Audio System
const bgm = new Howl({
    src: ['assets/audio/bgm.mp3'],
    loop: true,
    volume: 0.15,
    html5: true
});

const clickSfx = new Howl({
    src: ['assets/audio/mouse click sound.mp3'],
    volume: 0.8
});

// Finale Audio
const winSfx = new Howl({
    src: ['assets/audio/winner sound.mp3'],
    volume: 0.9,
    html5: true
});

const loseSfx = new Howl({
    src: ['assets/audio/looser sound .mp3'],
    volume: 0.9,
    html5: true
});

// UI Elements
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const rankingsContainer = document.getElementById('rankings-container');
const statusMessage = document.getElementById('status-message');
const hudTeam = document.getElementById('hud-team');
const hudTimer = document.getElementById('hud-timer');
const timerProgressFill = document.getElementById('timer-progress-fill');
const questionText = document.getElementById('question-text');
const imageGrid = document.getElementById('image-grid');
const lockoutBanner = document.getElementById('lockout-banner');
const startGameBtn = document.getElementById('start-game-btn');
const nextQBtn = document.getElementById('next-q-btn');

// Feedback Modal Elements
const feedbackModal = document.getElementById('feedback-modal');
const feedbackCard = document.getElementById('feedback-card');
const feedbackBadge = document.getElementById('feedback-badge');
const feedbackComment = document.getElementById('feedback-comment');
const feedbackSubtext = document.getElementById('feedback-subtext');

// NEW: Lobby Interaction Logic
const startEntryBtn = document.getElementById('start-entry-btn');
const teamSelection = document.getElementById('team-selection');

if (startEntryBtn) {
    startEntryBtn.addEventListener('click', () => {
        // Play click sound
        clickSfx.play();
        // Hide Start button and reveal team choices
        startEntryBtn.classList.add('hidden');
        teamSelection.classList.remove('hidden');
    });
}

// Team Selection & Audio Unlock
document.querySelectorAll('.join-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        myTeam = e.target.getAttribute('data-team');
        socket.emit('joinTeam', myTeam);

        if (!bgm.playing()) {
            bgm.play();
        }

        statusMessage.classList.remove('hidden');
        statusMessage.innerText = `Joined ${myTeam}! Waiting for kickoff...`;
        statusMessage.style.color = '#ccff00'; // Match the new lime green brand

        document.querySelectorAll('.join-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    });
});

if (startGameBtn) {
    startGameBtn.addEventListener('click', () => socket.emit('adminStartGame'));
}

if (nextQBtn) {
    nextQBtn.addEventListener('click', () => socket.emit('adminNextQuestion'));
}

// Store the scores silently when server broadcasts them
socket.on('updateLeaderboard', (scores) => {
    latestScores = scores;
});

// Render the big screen rankings
function renderLeaderboard() {
    rankingsContainer.innerHTML = '';
    const sortedTeams = Object.keys(latestScores).sort((a, b) => latestScores[b] - latestScores[a]);
    
    sortedTeams.forEach((team, index) => {
        const row = document.createElement('div');
        row.className = `rank-row rank-${index + 1}`;
        
        const nameEl = document.createElement('span');
        nameEl.innerText = `#${index + 1} - ${team}`;
        
        const scoreEl = document.createElement('span');
        scoreEl.className = 'rank-score';
        scoreEl.innerText = `${latestScores[team]} pts`;
        
        row.appendChild(nameEl);
        row.appendChild(scoreEl);
        rankingsContainer.appendChild(row);
    });
}

// Handle New Question
socket.on('newQuestion', (question) => {
    clearTimeout(leaderboardTransitionTimer);
    
    // Audio transitions
    if (currentFeedbackSound && currentFeedbackSound.playing()) {
        currentFeedbackSound.stop();
    }
    if (!bgm.playing()) {
        bgm.play();
    }

    // Hide everything except the game screen
    feedbackModal.classList.add('hidden');
    lobbyScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    hudTeam.innerText = `Squad: ${myTeam || 'Spectator'}`;
    lockoutBanner.classList.add('hidden');
    questionText.innerText = question.prompt;
    imageGrid.innerHTML = '';
    imageGrid.classList.remove('disabled');

    startCountdownBar(question.duration || 10);

    // Render options
    question.images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.setAttribute('data-id', img.id);

        const imageEl = document.createElement('img');
        imageEl.src = `assets/images/${img.src}`;
        imageEl.alt = "Athlete Option";

        card.appendChild(imageEl);

        card.addEventListener('click', () => {
            if (imageGrid.classList.contains('disabled')) return;
            clearInterval(shuffleInterval);
            clickSfx.play();
            socket.emit('submitAnswer', { selectedImageId: img.id });
        });

        imageGrid.appendChild(card);
    });

    startGridShuffle();
});

// Teammate Lockout
socket.on('teamLocked', (data) => {
    clearInterval(shuffleInterval);
    imageGrid.classList.add('disabled');
    const selectedCard = document.querySelector(`.image-card[data-id="${data.selectedImageId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    lockoutBanner.classList.remove('hidden');
});

// Feedback Event & Auto-Transition to Leaderboard
socket.on('roundFeedback', (data) => {
    clearInterval(timerInterval);
    clearInterval(shuffleInterval);
    clearTimeout(leaderboardTransitionTimer);

    hudTimer.innerText = "0s";
    timerProgressFill.style.width = '0%';

    bgm.pause();

    currentFeedbackSound = new Howl({
        src: [`assets/audio/${data.audioFile}`],
        volume: 0.9,
        html5: true
    });
    currentFeedbackSound.play();

    // Show Feedback Modal First
    feedbackModal.classList.remove('hidden');
    feedbackCard.className = `modal-card ${data.isCorrect ? 'correct' : 'wrong'}`;
    feedbackBadge.innerText = data.isCorrect ? "CORRECT!" : "WRONG!";
    
    const pointModifier = data.pointsChange > 0 ? `+${data.pointsChange}` : `${data.pointsChange}`;
    feedbackComment.innerText = `${data.comment}`;
    feedbackSubtext.innerText = `Round Score: ${pointModifier} pts`;

    const correctCard = document.querySelector(`.image-card[data-id="${data.correctAnswerId}"]`);
    if (correctCard) {
        correctCard.classList.add('correct-border');
    }

    // NEW: Wait 4.5 seconds, then wipe to the Live Standings Screen
    leaderboardTransitionTimer = setTimeout(() => {
        feedbackModal.classList.add('hidden');
        gameScreen.classList.add('hidden');
        
        renderLeaderboard();
        leaderboardScreen.classList.remove('hidden');
    }, 4500); 
});

// Finale Event
socket.on('gameCompleted', (finalScores) => {
    bgm.stop();
    if (currentFeedbackSound && currentFeedbackSound.playing()) {
        currentFeedbackSound.stop();
    }
    clearInterval(timerInterval);
    clearInterval(shuffleInterval);
    clearTimeout(leaderboardTransitionTimer);

    // Ensure we hide all background screens for the finale
    gameScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');

    const sortedTeams = Object.keys(finalScores).sort((a, b) => finalScores[b] - finalScores[a]);
    const myRank = sortedTeams.indexOf(myTeam) + 1;
    const isWinner = myRank === 1; 
    const finalPoints = finalScores[myTeam] !== undefined ? finalScores[myTeam] : 0;

    if (isWinner) {
        winSfx.play();
    } else {
        loseSfx.play();
    }

    feedbackModal.classList.remove('hidden');
    feedbackCard.className = `modal-card ${isWinner ? 'correct' : 'wrong'}`;
    feedbackBadge.innerText = isWinner ? "CHAMPIONS! 🏆" : "GAME OVER";
    
    feedbackComment.innerText = isWinner ? `You won the game with ${finalPoints} pts!` : `You finished Rank #${myRank} with ${finalPoints} pts.`;
    feedbackSubtext.innerText = "Thanks for playing Squad Grid!";
});

function startCountdownBar(seconds) {
    clearInterval(timerInterval);
    let remaining = seconds;
    hudTimer.innerText = `${remaining}s`;
    timerProgressFill.style.width = '100%';

    const stepMs = 100;
    const totalMs = seconds * 1000;
    let elapsedMs = 0;

    timerInterval = setInterval(() => {
        elapsedMs += stepMs;
        const fraction = Math.max(0, 1 - (elapsedMs / totalMs));
        timerProgressFill.style.width = `${fraction * 100}%`;

        const secLeft = Math.ceil((totalMs - elapsedMs) / 1000);
        hudTimer.innerText = `${Math.max(0, secLeft)}s`;

        if (elapsedMs >= totalMs) {
            clearInterval(timerInterval);
        }
    }, stepMs);
}

function startGridShuffle() {
    clearInterval(shuffleInterval);
    const cards = document.querySelectorAll('.image-card');
    
    shuffleInterval = setInterval(() => {
        if (imageGrid.classList.contains('disabled')) {
            clearInterval(shuffleInterval);
            return;
        }

        let orders = [1, 2, 3, 4];
        for (let i = orders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [orders[i], orders[j]] = [orders[j], orders[i]];
        }

        cards.forEach((card, index) => {
            card.style.order = orders[index];
        });
    }, 500); 
}