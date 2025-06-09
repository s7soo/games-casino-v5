let allQuestions = [];
let questions = []; // Master list for the current category
let availableQuestions = []; // Pool of questions to draw from, prevents repeats
let currentQuestionIndex = 0;
let previousQuestionIndices = [];
let selectedCategoryName = ''; // NEW: To store the name of the selected category
const QUESTIONS_FILE_PATH = "questions.json";

// Function to show custom alert modal (existing)
function showAlertModal(message) {
    const modal = document.getElementById('custom-alert-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    modalMessage.textContent = message;
    modal.classList.add('active'); // Use class to show/hide with transition

    modalCloseBtn.onclick = null; // Clear previous listener
    modalCloseBtn.onclick = () => {
        modal.classList.remove('active');
    };
}

// NEW: Functions for Help Modal
function openHelpModal() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.add('active');
}

function closeHelpModal() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.remove('active');
}
// END NEW

async function fetchQuestions() {
    try {
        const response = await fetch(QUESTIONS_FILE_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let questionsData = await response.json();
        return questionsData.map(q => ({ ...q, category: q.category || "معلومات عامه" }));
    } catch (error) {
        console.error("Error fetching questions:", error);
        showAlertModal("فشل في تحميل الأسئلة من الملف.");
        return [];
    }
}

/**
 * Clears the question and answers from the display.
 */
function clearQuestionArea() {
    document.getElementById("question").textContent = "";
    document.getElementById("answers").innerHTML = "";
}

function renderQuestion(q) {
    if (!q) {
        clearQuestionArea();
        document.getElementById("question").textContent = "لا توجد أسئلة متبقية.";
        return;
    }
    document.getElementById("question").textContent = q.q;
    const answersContainer = document.getElementById("answers");
    answersContainer.innerHTML = "";
    q.options.forEach((opt, index) => {
        const label = document.createElement("label");
        label.textContent = opt;
        label.dataset.index = index; // Add data attribute to easily identify the answer later
        answersContainer.appendChild(label);
    });
    // Hide the "Show Answer" button when a new question is rendered
    document.getElementById("show-answer-btn").style.display = "block";
}

function randomQuestion() {
    // --- UPDATED LOGIC: Handle running out of questions ---
    if (availableQuestions.length === 0) {
        // Alert the user with the specific category name
        showAlertModal(`انتهت جميع الأسئلة في مجال '${selectedCategoryName}'. يرجى اختيار فئة أخرى لمواصلة اللعب.`);
        clearQuestionArea(); // Clear the last question
        showCategorySelection(); // Go back to category selection screen
        return; // Stop the function
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const [chosenQuestion] = availableQuestions.splice(randomIndex, 1);

    currentQuestionIndex = questions.findIndex(q => q.q === chosenQuestion.q);
    previousQuestionIndices.push(currentQuestionIndex);

    renderQuestion(chosenQuestion);
}

function prevQuestion() {
    if (previousQuestionIndices.length > 1) {
        previousQuestionIndices.pop(); // Remove current
        currentQuestionIndex = previousQuestionIndices[previousQuestionIndices.length - 1];
        renderQuestion(questions[currentQuestionIndex]);
    } else {
        showAlertModal("لا يوجد سؤال سابق.");
    }
}

function showCorrectAnswer() {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const answersContainer = document.getElementById("answers");
    // Remove any existing highlights
    answersContainer.querySelectorAll('.correct-answer-highlight').forEach(el => {
        el.classList.remove('correct-answer-highlight');
    });

    // Add highlight to the correct answer
    const correctLabel = answersContainer.querySelector(`label[data-index="${currentQ.correct}"]`);
    if (correctLabel) {
        correctLabel.classList.add('correct-answer-highlight');
    }
    // Optionally hide the "Show Answer" button after it's clicked
    document.getElementById("show-answer-btn").style.display = "none";
}


function checkWinner(name, score) {
    // Determine winning score based on game rules or a fixed value, e.g., 10 points
    const WINNING_SCORE = 10; 
    if (score >= WINNING_SCORE) { 
        endGameAndDeclareWinner(); 
    }
}


function endGameAndDeclareWinner() {
    // This alert might be better as a specific winner announcement,
    // but keeping it as a general end-of-category message for now.
    showAlertModal("انتهت جميع الأسئلة في هذه الفئة! سيتم الآن تحديد الفائز."); 

    const players = [];
    document.querySelectorAll('.player').forEach(playerDiv => {
        const name = playerDiv.querySelector('.player-name').textContent;
        const score = parseInt(playerDiv.querySelector('span[id^="score-"]').textContent);
        players.push({ name, score });
    });

    if (players.length === 0) {
        document.getElementById("winner-name").textContent = "لا يوجد متسابقون لإنهاء اللعبة.";
        document.getElementById("game-section").style.display = "none";
        document.getElementById("winner-screen").style.display = "block";
        return;
    }

    const maxScore = players.length > 0 ? Math.max(...players.map(p => p.score)) : 0;
    const winners = players.filter(p => p.score === maxScore);

    let winnerMessage;
    if (winners.length > 1) {
        winnerMessage = `تعادل بين الفائزين: ${winners.map(w => w.name).join(' و ')} بنتيجة ${maxScore} نقطة!`;
    } else if (winners.length === 1) {
        winnerMessage = `الفائز هو: ${winners[0].name} بنتيجة ${winners[0].score} نقطة!`;
    } else {
        winnerMessage = "لا يوجد فائزين في هذه الجولة."; 
    }

    document.getElementById("winner-name").textContent = winnerMessage;
    document.getElementById("game-section").style.display = "none";
    document.getElementById("winner-screen").style.display = "block";
}


function restartGame() {
    document.getElementById("winner-screen").style.display = "none";
    document.getElementById("player-form").style.display = "block";
    document.getElementById("game-section").style.display = "none";
    showCategorySelection();
    allQuestions = [];
    questions = [];
    availableQuestions = [];
    previousQuestionIndices = [];
    selectedCategoryName = ''; // Reset category name
    // Clear player scores for a fresh start
    document.getElementById("players").innerHTML = "";
    // Reset player input field
    document.getElementById("player-input").value = "";
}

function renderCategories() {
    const categoriesContainer = document.getElementById("categories-container");
    categoriesContainer.innerHTML = "";
    const uniqueCategories = [...new Set(allQuestions.map(q => q.category))];
    uniqueCategories.forEach(category => {
        const label = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "category";
        radio.value = category;
        label.appendChild(radio);
        const span = document.createElement("span");
        span.textContent = category;
        label.appendChild(span);
        categoriesContainer.appendChild(label);
    });
}

function applyCategorySelection() {
    const selectedRadio = document.querySelector('input[name="category"]:checked');
    if (selectedRadio) {
        selectedCategoryName = selectedRadio.value; // UPDATED: Store the category name
        questions = allQuestions.filter(q => q.category === selectedCategoryName);
        availableQuestions = [...questions];
        previousQuestionIndices = [];

        document.getElementById("category-selection-view").style.display = "none";
        document.getElementById("game-view").style.display = "flex";

        randomQuestion();
    } else {
        showAlertModal("الرجاء اختيار فئة من الأسئلة.");
    }
}

function showCategorySelection() {
    document.getElementById("category-selection-view").style.display = "block";
    document.getElementById("game-view").style.display = "none";
}

async function startGame() {
    const input = document.getElementById("player-input").value.trim();
    const names = input ? input.split(",").map(n => n.trim()).filter(Boolean) : [];
    if (names.length === 0) {
        showAlertModal("يرجى إدخال أسماء المتسابقين.");
        return;
    }

    allQuestions = await fetchQuestions();
    if (allQuestions.length === 0) {
        return; 
    }

    const playersContainer = document.getElementById("players");
    playersContainer.innerHTML = "";
    names.forEach(name => {
        const playerDiv = document.createElement("div");
        playerDiv.className = "player";
        const nameSpan = document.createElement("span");
        nameSpan.className = "player-name";
        nameSpan.textContent = name;
        const scoreSpan = document.createElement("span");
        scoreSpan.id = `score-${name}`;
        scoreSpan.textContent = "0";
        const controls = document.createElement("div");
        controls.className = "score-controls";
        const plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.onclick = () => {
            scoreSpan.textContent = parseInt(scoreSpan.textContent) + 1;
            // Only check winner if player reaches or exceeds winning score
            if (parseInt(scoreSpan.textContent) >= 10) { // Assuming 10 is the winning score
                 checkWinner(name, parseInt(scoreSpan.textContent));
            }
        };
        const minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.onclick = () => {
            if (parseInt(scoreSpan.textContent) > 0) {
                 scoreSpan.textContent = parseInt(scoreSpan.textContent) - 1;
            }
        };
        controls.appendChild(plusBtn);
        controls.appendChild(minusBtn);
        playerDiv.appendChild(nameSpan);
        playerDiv.appendChild(scoreSpan);
        playerDiv.appendChild(controls);
        playersContainer.appendChild(playerDiv);
    });

    document.getElementById("player-form").style.display = "none";
    document.getElementById("game-section").style.display = "flex";
    renderCategories();
    showCategorySelection();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("game-section").style.display = "none";
    document.getElementById("winner-screen").style.display = "none";
});