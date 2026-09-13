const socket = io();

// Initialize Background Music (BGM)
// Make sure you have a dummy audio file at this path for testing
const bgm = new Howl({
    src: ['assets/bgm.mp3'], 
    loop: true,
    volume: 0.1 // Keep it quiet for the lobby
});

const buttons = document.querySelectorAll('.join-btn');
const statusMessage = document.getElementById('status-message');

buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        const teamName = e.target.getAttribute('data-team');
        
        // 1. Tell the server to put this socket in the specific team room
        socket.emit('joinTeam', teamName);
        
        // 2. CRUCIAL: Unlock and play the audio engine via user interaction
        if (!bgm.playing()) {
            bgm.play();
        }

        // 3. Update UI to prevent spam-clicking
        statusMessage.innerText = `Joined ${teamName}! Waiting for game to start...`;
        statusMessage.style.color = '#28a745'; 
        
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    });
});

// Confirm connection
socket.on('joined', (data) => {
    console.log(`Successfully joined Room: ${data.team}`);
});