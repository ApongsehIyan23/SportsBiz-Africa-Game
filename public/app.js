const socket = io();
let myTeam = null;

// Audio setup
const bgm = new Howl({
    src: ['assets/bgm.mp3'],
    loop: true,
    volume: 0.15
});

// UI Elements
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const statusMessage = document.getElementById('status-message');
const hudTeam = document.getElementById('hud-team');
const hudStatus = document.getElementById('hud-status');
const questionText = document.getElementById('question-text');
const imageGrid = document.getElementById('image-grid');
const lockoutBanner = document.getElementById('lockout-banner');
const startGameBtn = document.getElementById('start-game-btn');

// Team Selection
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

// Admin start button
if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
        socket.emit('adminStartGame');
    });
}

// Receive new question from server
socket.on('newQuestion', (question) => {
    // Transition to game screen
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    hudTeam.innerText = `Squad: ${myTeam || 'Spectator'}`;
    hudStatus.innerText = 'TAP YOUR ANSWER!';
    hudStatus.style.color = '#ffffff';
    lockoutBanner.classList.add('hidden');

    questionText.innerText = question.prompt;
    imageGrid.innerHTML = '';
    imageGrid.classList.remove('disabled');

    // Render the 4 shuffled player photos
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

            // Immediately send answer for this team
            socket.emit('submitAnswer', {
                selectedImageId: img.id
            });
        });

        imageGrid.appendChild(card);
    });
});

// First-Responder Lockout Event (Received by all teammates in this room)
socket.on('teamLocked', (data) => {
    // Disable all 4 images on screen
    imageGrid.classList.add('disabled');

    // Highlight the chosen card
    const selectedCard = document.querySelector(`.image-card[data-id="${data.selectedImageId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    lockoutBanner.classList.remove('hidden');
    hudStatus.innerText = 'LOCKED IN!';
    hudStatus.style.color = '#ffaa00';
});