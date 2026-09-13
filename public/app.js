const socket = io();
let myTeam = null;
let currentFeedbackSound = null;
let timerInterval = null;
let shuffleInterval = null; // New global to track the shuffle state

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
    clearInterval(shuffleInterval); // Freeze the shuffle when a teammate locks in

    imageGrid.classList.add('disabled');
    const selectedCard = document.querySelector(`.image-card[data-id="${data.selectedImageId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    lockoutBanner.classList.remove('hidden');
});

// Feedback Event: Cut BGM, Play Meme Audio, Display Modal
socket.on('roundFeedback', (data) => {
    clearInterval(timerInterval);
    clearInterval(shuffleInterval); // Ensure the shuffle completely stops at the buzzer

    hudTimer.innerText = "0s";
    timerProgressFill.style.width = '0%';

    // 1. Instantly pause background music
    bgm.pause();

    // 2. Play the meme audio track
    currentFeedbackSound = new Howl({
        src: [`assets/audio/${data.audioFile}`],
        volume: 0.9,
        html5: true
    });
    currentFeedbackSound.play();

    // 3. Update Modal UI
    feedbackModal.classList.remove('hidden');
    feedbackCard.className = `modal-card ${data.isCorrect ? 'correct' : 'wrong'}`;
    feedbackBadge.innerText = data.isCorrect ? "CORRECT!" : "WRONG!";
    feedbackComment.innerText = data.comment;

    // 4. Highlight correct answer in green on the board
    const correctCard = document.querySelector(`.image-card[data-id="${data.correctAnswerId}"]`);
    if (correctCard) {
        correctCard.classList.add('correct-border');
    }
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

// --- NEW SHUFFLE ENGINE ---
function startGridShuffle() {
    clearInterval(shuffleInterval);
    const cards = document.querySelectorAll('.image-card');
    
    shuffleInterval = setInterval(() => {
        // Double check to ensure we don't shuffle a locked grid
        if (imageGrid.classList.contains('disabled')) {
            clearInterval(shuffleInterval);
            return;
        }

        // Create an array of grid positions [1, 2, 3, 4] and shuffle them
        let orders = [1, 2, 3, 4];
        for (let i = orders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [orders[i], orders[j]] = [orders[j], orders[i]];
        }

        // Apply the new CSS order to each card to instantly snap them to new spots
        cards.forEach((card, index) => {
            card.style.order = orders[index];
        });
    }, 300); // Shuffles every 200ms. You can adjust this to be faster/slower!
}