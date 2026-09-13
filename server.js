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

// Master Question Database
// Master Question Database
const masterQuestions = [
    {
        id: "q1",
        prompt: "Who scored the winning penalty for Senegal to claim their first AFCON title in 2021?",
        correctImageId: "q1_mane",
        images: [
            { id: "q1_mane", src: "q1_mane.avif" },
            { id: "q1_salah", src: "q1_salah.webp" },
            { id: "q1_koulibaly", src: "q1_koulibaly.jpg" },
            { id: "q1_mendy", src: "q1_mendy.jpg" }
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
            { id: "q3_olajuwon", src: "q3_olajuwon.webp" },
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
            { id: "q5_embiid", src: "q5_embid.jpg" },
            { id: "q5_siakam", src: "q5_siakam.jpg" },
            { id: "q5_giannis", src: "q5_antetokounmpo.webp" },
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

// Meme Audio Pools
const goodAudioPool = [
    'correct sound1.mp3',
    'golazo.mp3',
    'correct sound 2.mp3',
    'correct sound 3.mp3',
    'correct sound 4.mp3'
];

const badAudioPool = [
    'wrong sound 1.mp3',
    'wrong sound 2.mp3',
    'wrong sound 3.mp3',
    'wrong sound 4.mp3',
    'wrong sound 5.mp3'
];

const goodComments = [
    "GOLAZOOOOO! Clean strike!",
    "BALL KNOWLEDGE OVERLOAD! 🧠🔥",
    "Top bins! No keeper is stopping that!",
    "Pure class! Tekkers on display!"
];

const badComments = [
    "VAR checked... NO GOAL! ❌",
    "Straight into row Z! What was that?",
    "Sent to the stands! Complete disaster!",
    "Offside and out of bounds! Try again!"
];

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

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
let teamAnswers = {}; // { 'Team A': { imageId: '...', timestamp: 12345 } }
let registeredTeams = new Set(['Team A', 'Team B', 'Team C']);
let questionTimer = null;
const QUESTION_TIME_LIMIT = 10000; // 10 seconds

function startNewGame() {
    activeQuestionPool = shuffleArray([...masterQuestions]);
    sendNextQuestion();
}

function sendNextQuestion() {
    if (activeQuestionPool.length === 0) {
        io.emit('gameCompleted');
        return;
    }

    teamAnswers = {};
    currentQuestion = activeQuestionPool.pop();
    const shuffledImages = shuffleArray([...currentQuestion.images]);

    const payload = {
        id: currentQuestion.id,
        prompt: currentQuestion.prompt,
        images: shuffledImages,
        duration: QUESTION_TIME_LIMIT / 1000
    };

    io.emit('newQuestion', payload);
    console.log(`Round started: "${currentQuestion.prompt}"`);

    // 10-Second Server Authority Timer
    clearTimeout(questionTimer);
    questionTimer = setTimeout(() => {
        resolveRoundFeedback();
    }, QUESTION_TIME_LIMIT);
}

function resolveRoundFeedback() {
    console.log("10s expired. Resolving round feedback...");

    registeredTeams.forEach(team => {
        const submission = teamAnswers[team];
        const isCorrect = submission && submission.imageId === currentQuestion.correctImageId;

        const feedbackPayload = {
            isCorrect: Boolean(isCorrect),
            comment: isCorrect ? getRandomItem(goodComments) : getRandomItem(badComments),
            audioFile: isCorrect ? getRandomItem(goodAudioPool) : getRandomItem(badAudioPool),
            correctAnswerId: currentQuestion.correctImageId
        };

        io.to(team).emit('roundFeedback', feedbackPayload);
    });
}

io.on('connection', (socket) => {
    socket.on('joinTeam', (teamName) => {
        socket.join(teamName);
        socket.teamName = teamName;
        registeredTeams.add(teamName);
        socket.emit('joined', { team: teamName });
    });

    socket.on('adminStartGame', () => {
        startNewGame();
    });

    socket.on('adminNextQuestion', () => {
        sendNextQuestion();
    });

    socket.on('submitAnswer', (data) => {
        const team = socket.teamName;
        if (!team) return;

        // First-Responder check
        if (teamAnswers[team]) return;

        teamAnswers[team] = {
            imageId: data.selectedImageId,
            timestamp: Date.now()
        };

        console.log(`[LOCKED] ${team} selected ${data.selectedImageId}`);
        io.to(team).emit('teamLocked', { selectedImageId: data.selectedImageId });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Squad Grid Server running on port ${PORT}`);
});