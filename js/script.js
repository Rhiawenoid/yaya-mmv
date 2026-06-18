let currentCat = []; // On garde juste la catégorie active

// Fonction pour obtenir un index aléatoire dans le tableau actuel
function getRandomIdx() {
    return Math.floor(Math.random() * currentCat.length);
}

// Global pour stocker l'index de la question en cours
let currentIdx = 0; 

async function initGame(catName) {
    const res = await fetch('questions.json');
    const data = await res.json();
    
    if (!data[catName]) return;
    
    currentCat = data[catName]; // Pas besoin de mélanger le tableau ici
    
    // On tire une première question au hasard
    currentIdx = getRandomIdx();
    
    document.getElementById('menu-cat').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    renderQuestion();
}

function renderImages(imageSource) {
    if (!imageSource) return ""; // Cas null ou undefined

    // Cas si c'est un tableau
    if (Array.isArray(imageSource)) {
        return imageSource.map(src => `<img src="${src}" style="max-width:200px; margin:5px;">`).join("");
    }

    // Cas si c'est une simple chaîne de caractère
    return `<img src="${imageSource}" style="max-width:200px"><br>`;
}

function renderQuestion() {
    const q = currentCat[currentIdx];
    const content = document.getElementById('content');
    
    content.innerHTML = renderImages(q.image);
    content.innerHTML += `<h3>${q.question}</h3>`;
    
    if (Array.isArray(q.reponse)) {
        // q.reponse est le tableau des choix. 
        // q.bonneReponse doit être la chaîne de caractère ou le tableau de la bonne réponse
        // Dans renderQuestion, assurez-vous que cette ligne est bien présente :
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
    // On bascule simplement la classe 'selected' sans enlever les autres
    element.classList.toggle('selected');
}

function validate() {
    const q = currentCat[currentIdx];
    const allOptions = document.querySelectorAll('.option-btn');
    const selectedOptions = document.querySelectorAll('.option-btn.selected');
    
    // Convertir les valeurs sélectionnées en tableau
    const selectedValues = Array.from(selectedOptions).map(el => el.dataset.value);

    allOptions.forEach(btn => {
        const val = btn.dataset.value;
        
        // Est-ce que cette option fait partie des bonnes réponses ?
        if (q.bonneReponse.includes(val)) {
            btn.style.backgroundColor = 'green'; // Bonne réponse
        } else if (btn.classList.contains('selected')) {
            btn.style.backgroundColor = 'red';   // Mauvaise réponse sélectionnée
        }
    });

    document.getElementById('btnValid').style.display = 'none';
    document.getElementById('btnNext').style.display = 'inline-block';
}

function nextQuestion() {
    let newIdx;
    do {
        newIdx = getRandomIdx();
    } while (newIdx === currentIdx && currentCat.length > 1); // Relance tant que c'est la même
    
    currentIdx = newIdx;
    renderQuestion();
}

function backToMenu() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('menu-cat').style.display = 'block';
}

let allQuestions = {}; // Stocke toutes les données

// Au chargement, on affiche les catégories avec des cases à cocher invisibles
// Remplacez la fonction loadCategories pour remplir aussi la liste
async function loadCategories() {
    const res = await fetch('questions.json');
    allQuestions = await res.json();
    
    // Remplissage du menu de jeu
    const listGame = document.getElementById('category-list');
    // Remplissage du menu de la liste
    const listTab = document.getElementById('category-list-list');
    
    Object.keys(allQuestions).forEach(cat => {
        // Pour le jeu
        listGame.innerHTML += `<label class="cat-checkbox"><input type="checkbox" value="${cat}" onchange="toggleStartBtn()"><span>${cat}</span></label>`;
        // Pour l'onglet liste (on réutilise la même classe CSS .cat-checkbox)
        listTab.innerHTML += `<label class="cat-checkbox"><input type="checkbox" value="${cat}"><span>${cat}</span></label>`;
    });
}

// Nouvelle fonction pour afficher la sélection
function displaySelectedQuestions() {
    const checked = document.querySelectorAll('#category-list-list input[type="checkbox"]:checked');
    const container = document.getElementById('all-questions-list');
    container.innerHTML = "";

    checked.forEach(box => {
        const cat = box.value;
        container.innerHTML += `<h3>${cat}</h3>`;
        allQuestions[cat].forEach(q => {
            container.innerHTML += `
                <div class="card question-item">
                    <h4>${q.question}</h4>
                    <p>Réponse : <span class="answer-text">${Array.isArray(q.bonneReponse) ? q.bonneReponse.join(', ') : q.bonneReponse}</span></p>
                </div>
            `;
        });
    });

    document.getElementById('list-menu').style.display = 'none';
    document.getElementById('list-results').style.display = 'block';
}

function backToListMenu() {
    document.getElementById('list-menu').style.display = 'block';
    document.getElementById('list-results').style.display = 'none';
}

function toggleStartBtn() {
    const checked = document.querySelectorAll('input[type="checkbox"]:checked');
    document.getElementById('btnStart').style.display = checked.length > 0 ? 'inline-block' : 'none';
}

function startSelectedGame() {
    const checked = document.querySelectorAll('input[type="checkbox"]:checked');
    currentCat = [];
    
    // On fusionne les questions des catégories cochées
    checked.forEach(box => {
        currentCat = currentCat.concat(allQuestions[box.value]);
    });

    currentIdx = getRandomIdx();
    document.getElementById('menu-cat').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    renderQuestion();
}

// Fonction pour basculer entre les onglets
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');

    if (tabId === 'list-tab') renderAllQuestions();
}

// Fonction pour afficher toutes les questions
function renderAllQuestions() {
    const listDiv = document.getElementById('all-questions-list');
    listDiv.innerHTML = "";

    Object.keys(allQuestions).forEach(cat => {
        listDiv.innerHTML += `<h3>Catégorie : ${cat}</h3>`;
        allQuestions[cat].forEach(q => {
            listDiv.innerHTML += `
                <div class="question-item">
                    <h4>${q.question}</h4>
                    <p>Réponse : <span class="answer-text">${q.bonneReponse}</span></p>
                </div>
            `;
        });
    });
}

loadCategories()