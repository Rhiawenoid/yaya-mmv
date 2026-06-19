let currentCat = [];
let currentIdx = 0; 
let allQuestions = {}; 

// -------------------------------------------------------------
// GESTION DE LA SAUVEGARDE LOCALE (LOCALSTORAGE)
// -------------------------------------------------------------

// Récupérer la liste des questions connues
function getKnownQuestions() {
    const stored = localStorage.getItem('allyokou_known_questions');
    return stored ? JSON.parse(stored) : [];
}

// Ajouter ou retirer une question des connues
function toggleKnownQuestion(checkbox) {
    const questionText = checkbox.getAttribute('data-question');
    let known = getKnownQuestions();
    
    if (checkbox.checked) {
        if (!known.includes(questionText)) known.push(questionText);
    } else {
        known = known.filter(q => q !== questionText);
    }
    
    localStorage.setItem('allyokou_known_questions', JSON.stringify(known));
    
    // Effet visuel immédiat
    const card = checkbox.closest('.question-item');
    if (checkbox.checked) {
        card.classList.add('known-card');
    } else {
        card.classList.remove('known-card');
    }
}

// -------------------------------------------------------------
// LOGIQUE DE JEU
// -------------------------------------------------------------

function getRandomIdx() {
    return Math.floor(Math.random() * currentCat.length);
}

function renderImages(imageSource) {
    if (!imageSource) return "";
    if (Array.isArray(imageSource)) {
        return imageSource.map(src => `<img src="${src}" style="max-width:200px; margin:5px;">`).join("");
    }
    return `<img src="${imageSource}" style="max-width:200px"><br>`;
}

function renderQuestion() {
    const q = currentCat[currentIdx];
    const content = document.getElementById('content');
    
    content.innerHTML = renderImages(q.image);
    content.innerHTML += `<h3>${q.question}</h3>`;
    
    if (Array.isArray(q.reponse)) {
        q.reponse.forEach(opt => {
            content.innerHTML += `<div class="option-btn" onclick="selectOption(this)" data-value="${opt}">${opt}</div>`;
        });
    } else {
        content.innerHTML += `<input type="text" id="simple-input">`;
    }
    
    document.getElementById('btnValid').style.display = 'inline-block';
    document.getElementById('btnNext').style.display = 'none';
}

function selectOption(element) {
    element.classList.toggle('selected');
}

function validate() {
    const q = currentCat[currentIdx];
    const allOptions = document.querySelectorAll('.option-btn');
    const selectedOptions = document.querySelectorAll('.option-btn.selected');
    
    allOptions.forEach(btn => {
        const val = btn.dataset.value;
        if (q.bonneReponse.includes(val)) {
            btn.style.backgroundColor = 'green'; 
        } else if (btn.classList.contains('selected')) {
            btn.style.backgroundColor = 'red';   
        }
    });

    document.getElementById('btnValid').style.display = 'none';
    document.getElementById('btnNext').style.display = 'inline-block';
}

function nextQuestion() {
    let newIdx;
    do {
        newIdx = getRandomIdx();
    } while (newIdx === currentIdx && currentCat.length > 1); 
    
    currentIdx = newIdx;
    renderQuestion();
}

function backToMenu() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('menu-cat').style.display = 'block';
}

// -------------------------------------------------------------
// CHARGEMENT ET LISTES
// -------------------------------------------------------------

async function loadCategories() {
    const res = await fetch('questions.json');
    allQuestions = await res.json();
    
    const listGame = document.getElementById('category-list');
    const listTab = document.getElementById('category-list-list');
    
    Object.keys(allQuestions).forEach(cat => {
        listGame.innerHTML += `<label class="cat-checkbox"><input type="checkbox" value="${cat}" onchange="toggleStartBtn()"><span>${cat}</span></label>`;
        listTab.innerHTML += `<label class="cat-checkbox"><input type="checkbox" value="${cat}"><span>${cat}</span></label>`;
    });
}

// Fonction générique pour générer le HTML d'une question dans les listes
function createQuestionHTML(q) {
    const known = getKnownQuestions();
    const isKnown = known.includes(q.question);
    const checkedAttr = isKnown ? 'checked' : '';
    const knownClass = isKnown ? 'known-card' : '';
    // On échappe les guillemets pour ne pas casser le HTML
    const safeQuestionText = q.question.replace(/"/g, '&quot;'); 

    return `
        <div class="card question-item ${knownClass}">
            <div class="known-toggle">
                <label>
                    <input type="checkbox" data-question="${safeQuestionText}" onchange="toggleKnownQuestion(this)" ${checkedAttr}>
                    ✅ Je connais déjà cette question
                </label>
            </div>
            ${renderImages(q.image)} <h4>${q.question}</h4>
            <p>Réponse : <span class="answer-text">${Array.isArray(q.bonneReponse) ? q.bonneReponse.join('<br> ') : q.bonneReponse}</span></p>
        </div>
    `;
}

function displaySelectedQuestions() {
    const checked = document.querySelectorAll('#category-list-list input[type="checkbox"]:checked');
    const container = document.getElementById('all-questions-list');
    container.innerHTML = "";

    checked.forEach(box => {
        const cat = box.value;
        container.innerHTML += `<h3>${cat}</h3>`;
        allQuestions[cat].forEach(q => {
            container.innerHTML += createQuestionHTML(q);
        });
    });

    document.getElementById('list-menu').style.display = 'none';
    document.getElementById('list-results').style.display = 'block';
}

function renderAllQuestions() {
    const listDiv = document.getElementById('all-questions-list');
    listDiv.innerHTML = "";

    Object.keys(allQuestions).forEach(cat => {
        listDiv.innerHTML += `<h3>Catégorie : ${cat}</h3>`;
        allQuestions[cat].forEach(q => {
            listDiv.innerHTML += createQuestionHTML(q);
        });
    });
}

function backToListMenu() {
    document.getElementById('list-menu').style.display = 'block';
    document.getElementById('list-results').style.display = 'none';
}

function toggleStartBtn() {
    const checked = document.querySelectorAll('#category-list input[type="checkbox"]:checked');
    document.getElementById('btnStart').style.display = checked.length > 0 ? 'inline-block' : 'none';
}

function startSelectedGame() {
    const checked = document.querySelectorAll('#category-list input[type="checkbox"]:checked');
    currentCat = [];
    const known = getKnownQuestions();
    
    // On fusionne les questions des catégories cochées, en IGNORANT celles qui sont connues
    checked.forEach(box => {
        const questionsToPlay = allQuestions[box.value].filter(q => !known.includes(q.question));
        currentCat = currentCat.concat(questionsToPlay);
    });

    // Sécurité si l'utilisateur connaît déjà toutes les questions
    if (currentCat.length === 0) {
        alert("Bravo ! Vous avez marqué toutes les questions de ces catégories comme 'déjà connues'. Décochez-en dans la liste pour rejouer.");
        return;
    }

    currentIdx = getRandomIdx();
    document.getElementById('menu-cat').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    renderQuestion();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');

    if (tabId === 'list-tab') renderAllQuestions();
}

loadCategories();