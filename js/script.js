let questions = [];
let currentIdx = 0;
let currentCat = [];
let score = 0; // Ajout du score
let questionsAnswered = 0; // Compteur pour le total des questions répondues

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
    score = 0; // Reset du score au début
    questionsAnswered = 0;
    document.getElementById('score-display').innerText = "Score : 0 / 0";
    
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
    
    // Empêcher de cliquer plusieurs fois sur Valider
    if (document.getElementById('btnValid').style.display === 'none') return;

    let isCorrect = false;

    if (Array.isArray(q.reponse)) {
        // On récupère tous les éléments qui ont la classe 'selected'
        const selected = Array.from(document.querySelectorAll('.option-btn.selected')).map(b => b.innerText);
        
        // Comparaison des tableaux triés
        isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(q.bonneReponse.sort());
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            // Couleur rouge/verte pour toutes les options
            if (q.bonneReponse.includes(btn.innerText)) {
                btn.style.backgroundColor = 'green';
            } else if (btn.classList.contains('selected')) {
                btn.style.backgroundColor = 'red';
            }
        });
    } else {
        const val = document.getElementById('simple-input').value;
        isCorrect = (val.trim() === q.reponse.trim()); // .trim() pour éviter les erreurs d'espaces
        document.getElementById('simple-input').style.backgroundColor = isCorrect ? 'green' : 'red';
    }

    // Mise à jour des variables globales
    if (isCorrect) score++;
    questionsAnswered++;
    
    // Mise à jour de l'affichage
    document.getElementById('score-display').innerText = `Score : ${score} / ${questionsAnswered}`;
    
    // Bascule des boutons
    document.getElementById('btnValid').style.display = 'none';
    document.getElementById('btnNext').style.display = 'inline-block';
}

function backToMenu() {
    // 1. On cache le jeu
    document.getElementById('game-container').style.display = 'none';
    
    // 2. On affiche le menu
    document.getElementById('menu-cat').style.display = 'block';
    
    // 3. Optionnel : Réinitialiser le score si vous voulez repartir à zéro
    score = 0;
    questionsAnswered = 0;
    document.getElementById('score-display').innerText = "Score : 0 / 0";
}

function nextQuestion() {
    currentIdx++;
    if (currentIdx < currentCat.length) {
        renderQuestion();
    } else {
        // Au lieu de recharger la page, on affiche un petit message et on revient au menu
        alert("Catégorie terminée ! Votre score final est de " + score + "/" + questionsAnswered);
        backToMenu(); 
    }
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