const socket = io();
let myTeam = null;
let currentFeedbackSound = null;
let timerInterval = null;
let shuffleInterval = null;

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

// NEW: Finale Audio
const winSfx = new Howl({
    src: ['assets/audio/winner sound.mp3'],
    volume: 0.9,
    html5: true
});

const loseSfx = new Howl({
    src: ['assets/audio/looser sound .mp3'], // Exactly matching your file name
    volume: 0.9,
    html5: true
});

// UI Elements
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
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

// Team Selection & Audio Unlock
document.querySelectorAll('.join-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        myTeam = e.target.getAttribute('data-team');
        socket.emit('joinTeam', myTeam);

        if (!bgm.playing()) {
            bgm.play();
        }

        statusMessage.innerText = `Joined ${myTeam}! Waiting for kickoff...`;
        statusMessage.style.color = '#28a745';

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

// Leaderboard Updater (Called whenever server updates scores)
socket.on('updateLeaderboard', (scores) => {
    if (document.getElementById('score-a') && scores['Team A'] !== undefined) {
        document.getElementById('score-a').innerText = scores['Team A'];
    }
    if (document.getElementById('score-b') && scores['Team B'] !== undefined) {
        document.getElementById('score-b').innerText = scores['Team B'];
    }
    if (document.getElementById('score-c') && scores['Team C'] !== undefined) {
        document.getElementById('score-c').innerText = scores['Team C'];
    }
});

// Handle New Question
socket.on('newQuestion', (question) => {
    // 1. Audio transitions
    if (currentFeedbackSound && currentFeedbackSound.playing()) {
        currentFeedbackSound.stop();
    }
    if (!bgm.playing()) {
        bgm.play();
    }

    // 2. Clear previous popups and views
    feedbackModal.classList.add('hidden');
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    hudTeam.innerText = `Squad: ${myTeam || 'Spectator'}`;
    lockoutBanner.classList.add('hidden');
    questionText.innerText = question.prompt;
    imageGrid.innerHTML = '';
    imageGrid.classList.remove('disabled');

    // 3. Client countdown bar animation
    startCountdownBar(question.duration || 10);

    // 4. Render options
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

            // Instantly freeze the visual shuffle for the person clicking
            clearInterval(shuffleInterval);
            
            // Trigger tap SFX
            clickSfx.play();

            socket.emit('submitAnswer', {
                selectedImageId: img.id
            });
        });

        imageGrid.appendChild(card);
    });

    // 5. Kick off the dynamic visual shuffle mechanic
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

// Feedback Event
socket.on('roundFeedback', (data) => {
    clearInterval(timerInterval);
    clearInterval(shuffleInterval);

    hudTimer.innerText = "0s";
    timerProgressFill.style.width = '0%';

    bgm.pause();

    currentFeedbackSound = new Howl({
        src: [`assets/audio/${data.audioFile}`],
        volume: 0.9,
        html5: true
    });
    currentFeedbackSound.play();

    feedbackModal.classList.remove('hidden');
    feedbackCard.className = `modal-card ${data.isCorrect ? 'correct' : 'wrong'}`;
    feedbackBadge.innerText = data.isCorrect ? "CORRECT!" : "WRONG!";
    
    // Inject the points modifier (+900 pts or -100 pts) directly into the comment
    const pointModifier = data.pointsChange > 0 ? `+${data.pointsChange}` : `${data.pointsChange}`;
    feedbackComment.innerText = `${data.comment}`;
    feedbackSubtext.innerText = `Round Score: ${pointModifier} pts`;

    const correctCard = document.querySelector(`.image-card[data-id="${data.correctAnswerId}"]`);
    if (correctCard) {
        correctCard.classList.add('correct-border');
    }
});

// Finale Event
socket.on('gameCompleted', (finalScores) => {
    // Silence everything
    bgm.stop();
    if (currentFeedbackSound && currentFeedbackSound.playing()) {
        currentFeedbackSound.stop();
    }
    clearInterval(timerInterval);
    clearInterval(shuffleInterval);

    // Determine rankings based on final scores
    const sortedTeams = Object.keys(finalScores).sort((a, b) => finalScores[b] - finalScores[a]);
    const myRank = sortedTeams.indexOf(myTeam) + 1;
    const isWinner = myRank === 1; // Rank #1 Wins
    const finalPoints = finalScores[myTeam] !== undefined ? finalScores[myTeam] : 0;

    // Trigger Finale Audio
    if (isWinner) {
        winSfx.play();
    } else {
        loseSfx.play();
    }

    // Display Finale Modal
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