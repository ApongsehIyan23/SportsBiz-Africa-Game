const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Master Question Database (10 African Sports & Esports Questions)
const masterQuestions = [
    {
        id: "q1",
        prompt: "Who scored the winning penalty for Senegal to claim their first AFCON title in 2021?",
        correctImageId: "q1_mane",
        images: [
            { id: "q1_mane", src: "q1_mane.jpg" },
            { id: "q1_salah", src: "q1_salah.webp" },
            { id: "q1_koulibaly", src: "q1_koulibaly.jpg" },
            { id: "q1_mendy", src: "q1_mendy.avif" }
        ]
    },
    {
        id: "q2",
        prompt: "Who remains the only African footballer to ever win the Ballon d'Or?",
        correctImageId: "q2_weah",
        images: [
            { id: "q2_weah", src: "q2_weah.jpg" },
            { id: "q2_etoo", src: "q2_eto'o.jpg" },
            { id: "q2_drogba", src: "q2_drogba.jpg" },
            { id: "q2_milla", src: "q2_milla.jpg" }
        ]
    },
    {
        id: "q3",
        prompt: "Which Nigerian legend was drafted #1 overall in the 1984 NBA Draft and won two titles with Houston?",
        correctImageId: "q3_olajuwon",
        images: [
            { id: "q3_olajuwon", src: "q3_Olajuwon.webp" },
            { id: "q3_mutombo", src: "q3_mutombo.webp" },
            { id: "q3_bol", src: "q3_bol.jpg" },
            { id: "q3_jordan", src: "q3_jordan.webp" }
        ]
    },
    {
        id: "q4",
        prompt: "Which Nigerian striker has won African Women's Footballer of the Year a record 6 times?",
        correctImageId: "q4_oshoala",
        images: [
            { id: "q4_oshoala", src: "q4_oshoala.jpeg" },
            { id: "q4_kgatlana", src: "q4_kgatlana.jpg" },
            { id: "q4_banda", src: "q4_banda.jpg" },
            { id: "q4_nkwocha", src: "q4_nkwocha.webp" }
        ]
    },
    {
        id: "q5",
        prompt: "Which Cameroonian basketball superstar was named NBA MVP for the 2022-2023 season?",
        correctImageId: "q5_embiid",
        images: [
            { id: "q5_embiid", src: "q5_embiid.jpg" },
            { id: "q5_siakam", src: "q5_siakam.jpg" },
            { id: "q5_giannis", src: "q5_antekokounmpo.webp" },
            { id: "q5_wemby", src: "q5_wembanyama.webp" }
        ]
    },
    {
        id: "q6",
        prompt: "Who won the Golden Boot in the 2026 Women's Africa Cup of Nations (WAFCON)?",
        correctImageId: "q6_chawinga",
        images: [
            { id: "q6_chawinga", src: "q6_chawinga.webp" },
            { id: "q6_alozie", src: "q6_alozie.webp" },
            { id: "q6_manga", src: "q6_manga.webp" },
            { id: "q6_konan", src: "q6_konan.jpg" }
        ]
    },
    {
        id: "q7",
        prompt: "Which Kenyan Tekken athlete made history as the first East African female signed by an international esports org?",
        correctImageId: "q7_gathoni",
        images: [
            { id: "q7_gathoni", src: "q7_gathoni.png" },
            { id: "q7_dianga", src: "q7_dianga.jpg" },
            { id: "q7_bianchi", src: "q7_bianchi.jpg" },
            { id: "q7_moloi", src: "q7_moloi.webp" }
        ]
    },
    {
        id: "q8",
        prompt: "Which South African FIFA/EA FC player became the first African esports athlete to secure an official Red Bull deal?",
        correctImageId: "q8_moloi",
        images: [
            { id: "q8_moloi", src: "q8_moloi.webp" },
            { id: "q8_patel", src: "q8_patel.jpg" },
            { id: "q8_dexx", src: "q8_dexx.jpg" },
            { id: "q8_golz", src: "q8_golz.avif" }
        ]
    },
    {
        id: "q9",
        prompt: "Who holds the all-time record for the most goals scored in the history of the AFCON tournament?",
        correctImageId: "q9_etoo",
        images: [
            { id: "q9_etoo", src: "q9_etoo.webp" },
            { id: "q9_drogba", src: "q9_drogba.jpg" },
            { id: "q9_yekini", src: "q9_yekini.jpg" },
            { id: "q9_aboubakar", src: "q9_aboubakar.jpg" }
        ]
    },
    {
        id: "q10",
        prompt: "Which player was named the MVP of the 2023 Basketball Africa League (BAL) Finals in Kigali?",
        correctImageId: "q10_omot",
        images: [
            { id: "q10_omot", src: "q10_omot.webp" },
            { id: "q10_perry", src: "q10_perry.jpg" },
            { id: "q10_mahmoud", src: "q10_mahmoud.jpg" },
            { id: "q10_lual", src: "q10_lual.jpg" }
        ]
    }
];

// Helper: In-place array shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Active Match State
let activeQuestionPool = [];
let currentQuestion = null;
let roundLockedTeams = new Set(); // Tracks teams that already answered this question

function startNewGame() {
    activeQuestionPool = shuffleArray([...masterQuestions]);
    console.log(`New game initialized with ${activeQuestionPool.length} randomized questions.`);
    sendNextQuestion();
}

function sendNextQuestion() {
    if (activeQuestionPool.length === 0) {
        console.log("All questions completed!");
        io.emit('gameCompleted');
        return;
    }

    roundLockedTeams.clear();
    currentQuestion = activeQuestionPool.pop();

    // Shuffle the 4 images so the correct one is never in a fixed position
    const shuffledImages = shuffleArray([...currentQuestion.images]);

    // Omit `correctImageId` from the client broadcast to prevent DOM inspection cheating
    const payload = {
        id: currentQuestion.id,
        prompt: currentQuestion.prompt,
        images: shuffledImages
    };

    io.emit('newQuestion', payload);
    console.log(`Dispatched Question: ${payload.id} - "${payload.prompt}"`);
}

io.on('connection', (socket) => {
    socket.on('joinTeam', (teamName) => {
        socket.join(teamName);
        socket.teamName = teamName;
        console.log(`Socket ${socket.id} joined ${teamName}`);
        socket.emit('joined', { team: teamName });
    });

    // Admin trigger to launch the match or advance questions during testing
    socket.on('adminStartGame', () => {
        startNewGame();
    });

    socket.on('adminNextQuestion', () => {
        sendNextQuestion();
    });

    // First-Responder Answer Lockout
    socket.on('submitAnswer', (data) => {
        const team = socket.teamName;
        if (!team) return;

        // Check if the squad has already submitted an answer for this question
        if (roundLockedTeams.has(team)) {
            console.log(`Ignored duplicate answer from ${socket.id} (${team})`);
            return;
        }

        // Lock the squad immediately
        roundLockedTeams.add(team);
        console.log(`[FIRST-RESPONDER] ${team} locked answer: ${data.selectedImageId}`);

        // Broadcast lockout state specifically to this team's room
        io.to(team).emit('teamLocked', {
            selectedImageId: data.selectedImageId
        });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Squad Grid Server running on port ${PORT}`);
});