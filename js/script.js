let questions = [];
let currentIdx = 0;
let currentCat = [];

// Fonction pour mélanger un tableau (Algorithme de Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function initGame(catName) {
    const res = await fetch('questions.json');
    const data = await res.json();
    
    // 1. Debugging: Check if data and the specific category exist
    console.log("Loaded data:", data);
    console.log("Attempting to access:", catName);

    if (!data[catName]) {
        console.error(`Error: Category "${catName}" not found in JSON.`);
        return; // Stop execution to prevent the crash
    }
    
    // 2. Safe assignment
    currentCat = shuffle([...data[catName]]); 
    
    currentIdx = 0;
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
        q.reponse.forEach(opt => content.innerHTML += `<div class="option-btn" onclick="this.classList.toggle('selected')">${opt}</div>`);
    } else {
        content.innerHTML += `<input type="text" id="simple-input">`;
    }
    document.getElementById('btnValid').style.display = 'inline-block';
    document.getElementById('btnNext').style.display = 'none';
}

function validate() {
    const q = currentCat[currentIdx];
    if (Array.isArray(q.reponse)) {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.style.backgroundColor = q.bonneReponse.includes(btn.innerText) ? 'green' : 'red';
        });
    } else {
        const val = document.getElementById('simple-input').value;
        document.getElementById('simple-input').style.backgroundColor = (val === q.reponse) ? 'green' : 'red';
    }
    document.getElementById('btnValid').style.display = 'none';
    document.getElementById('btnNext').style.display = 'inline-block';
}

function nextQuestion() {
    currentIdx++;
    if (currentIdx < currentCat.length) renderQuestion();
    else location.reload(); // Fin de catégorie, on recharge
}

// Fonction pour charger le menu dynamiquement au démarrage
async function loadMenu() {
    const res = await fetch('questions.json');
    const data = await res.json();
    const container = document.getElementById('category-list');

    Object.keys(data).forEach(cat => {
        // Nettoyage : remplace '-' par ' ' et met une majuscule au début
        let label = cat.replace(/-/g, ' '); 
        label = label.charAt(0).toUpperCase() + label.slice(1);

        const btn = document.createElement('button');
        btn.innerText = label;
        btn.className = 'cat-btn'; // Ajout d'une classe pour le style
        btn.onclick = () => initGame(cat);
        container.appendChild(btn);
    });
}

// Appeler cette fonction quand la page est chargée
window.onload = loadMenu;