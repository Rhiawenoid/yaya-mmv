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

function renderQuestion() {
    const q = currentCat[currentIdx];
    const content = document.getElementById('content');
    
    content.innerHTML = q.image ? `<img src="${q.image}" style="max-width:200px"><br>` : "";
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
async function loadCategories() {
    const res = await fetch('questions.json');
    allQuestions = await res.json();
    const list = document.getElementById('category-list');
    
    Object.keys(allQuestions).forEach(cat => {
        const label = document.createElement('label');
        label.className = 'cat-checkbox';
        label.innerHTML = `
            <input type="checkbox" value="${cat}" onchange="toggleStartBtn()">
            <span>${cat}</span>
        `;
        list.appendChild(label);
    });
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

loadCategories()