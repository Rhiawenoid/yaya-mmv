let currentMode = 'code'; // 'code' ou 'conduite'
let currentCat = [];
let currentIdx = 0; 
let allQuestions = {}; 

// -------------------------------------------------------------
// GESTION DU MODE ET CHARGEMENT
// -------------------------------------------------------------

async function loadMode(mode) {
    currentMode = mode;
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    document.getElementById('app-title').innerText = mode === 'code' ? 'Code de la Route' : 'Vérifications Permis';

    // Vider les listes précédentes
    document.getElementById('category-list').innerHTML = '';
    document.getElementById('category-list-list').innerHTML = '';

    if (mode === 'code') {
        const res = await fetch('questions.json');
        allQuestions = await res.json();
    } else {
        const res = await fetch('banque_questions_permis.json');
        const rawData = await res.json();
        allQuestions = {};
        
        // On transforme le format "Conduite" pour qu'il ressemble à celui du "Code"
        rawData.forEach(mod => {
            const catName = `Module ${mod.module}`;
            allQuestions[catName] = mod.elements.map(el => ({
                question: el.question,
                image: null,
                reponse: null, // "null" déclenche l'affichage texte au lieu des boutons QCM
                bonneReponse: [el.reponse] // On met la réponse dans un tableau pour garder la compatibilité
            }));
        });
    }

    const listGame = document.getElementById('category-list');
    const listTab = document.getElementById('category-list-list');
    
    Object.keys(allQuestions).forEach(cat => {
        listGame.innerHTML += `<label class="cat-checkbox"><input type="checkbox" value="${cat}" onchange="toggleStartBtn()"><span>${cat}</span></label>`;
        listTab.innerHTML += `<label class="cat-checkbox"><input type="checkbox" value="${cat}"><span>${cat}</span></label>`;
    });

    backToMenu(); // Réinitialiser l'interface de jeu
}

function backToModeSelection() {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('mode-selection').style.display = 'block';
    
    // Remettre le premier onglet par défaut
    document.querySelectorAll('.tab-btn')[0].click();
}

// -------------------------------------------------------------
// GESTION DE LA SAUVEGARDE LOCALE (LOCALSTORAGE)
// -------------------------------------------------------------

// Récupérer la liste des questions connues (Séparée par mode)
function getKnownQuestions() {
    const stored = localStorage.getItem(`allyokou_known_${currentMode}`);
    return stored ? JSON.parse(stored) : [];
}

function toggleKnownQuestion(checkbox) {
    const questionText = checkbox.getAttribute('data-question');
    let known = getKnownQuestions();
    
    if (checkbox.checked) {
        if (!known.includes(questionText)) known.push(questionText);
    } else {
        known = known.filter(q => q !== questionText);
    }
    
    localStorage.setItem(`allyokou_known_${currentMode}`, JSON.stringify(known));
    
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
    
    // Si c'est un QCM (Code)
    if (Array.isArray(q.reponse)) {
        q.reponse.forEach(opt => {
            content.innerHTML += `<div class="option-btn" onclick="selectOption(this)" data-value="${opt}">${opt}</div>`;
        });
    } else {
        // Si c'est une question ouverte (Conduite)
        content.innerHTML += `<p style="color: #aaa; font-style: italic;">Réfléchissez à la réponse, puis validez pour vérifier.</p>`;
    }
    
    document.getElementById('btnValid').style.display = 'inline-block';
    document.getElementById('btnNext').style.display = 'none';
}

function selectOption(element) {
    element.classList.toggle('selected');
}

function validate() {
    const q = currentCat[currentIdx];
    
    if (Array.isArray(q.reponse)) {
        // Validation QCM
        const allOptions = document.querySelectorAll('.option-btn');
        allOptions.forEach(btn => {
            const val = btn.dataset.value;
            if (q.bonneReponse.includes(val)) {
                btn.style.backgroundColor = 'green'; 
            } else if (btn.classList.contains('selected')) {
                btn.style.backgroundColor = 'red';   
            }
        });
    } else {
        // Validation Question Ouverte (Affichage de la solution)
        const content = document.getElementById('content');
        content.innerHTML += `
            <div class="answer-box">
                <strong>Réponse attendue :</strong><br>
                ${q.bonneReponse.join('<br>')}
            </div>
        `;
    }

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
// LISTES
// -------------------------------------------------------------

function createQuestionHTML(q) {
    const known = getKnownQuestions();
    const isKnown = known.includes(q.question);
    const checkedAttr = isKnown ? 'checked' : '';
    const knownClass = isKnown ? 'known-card' : '';
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
    
    checked.forEach(box => {
        const questionsToPlay = allQuestions[box.value].filter(q => !known.includes(q.question));
        currentCat = currentCat.concat(questionsToPlay);
    });

    if (currentCat.length === 0) {
        alert("Bravo ! Vous avez marqué toutes les questions de ces catégories comme 'déjà connues'. Décochez-en dans la liste pour rejouer.");
        return;
    }

    currentIdx = getRandomIdx();
    document.getElementById('menu-cat').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    renderQuestion();
}

function showTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    if(event) event.currentTarget.classList.add('active');

    // On ne charge plus toutes les questions automatiquement !
    if (tabId === 'list-tab') {
        document.getElementById('list-menu').style.display = 'block';
        document.getElementById('list-results').style.display = 'none';
        // On vide la liste pour ne pas accumuler les résultats d'anciennes recherches
        document.getElementById('all-questions-list').innerHTML = "";
    }
}

// Fonction pour tout cocher ou décocher facilement
function toggleSelectAll(containerId) {
    // On cible toutes les checkboxes du conteneur demandé
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);
    
    // On vérifie si elles sont déjà TOUTES cochées
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    // On inverse leur état
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });

    // On met à jour l'apparition du bouton "Lancer la partie" au cas où
    toggleStartBtn();
}