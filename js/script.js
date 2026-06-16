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
    
    // On récupère la catégorie ET on la mélange immédiatement
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