document.addEventListener("DOMContentLoaded", async () => {
    const daysContainer = document.getElementById("days-container");
    const mealView = document.getElementById("meal-view");
    
    let pianoAlimentare = {};

    try {
        // Importa e legge il file JSON esterno
        const response = await fetch('dieta.json');
        if (!response.ok) throw new Error('Impossibile caricare il file JSON');
        pianoAlimentare = await response.json();
    } catch (error) {
        console.error(error);
        mealView.innerHTML = `<p style="text-align: center; color: red;">Errore nel caricamento della dieta.</p>`;
        return;
    }

    // Determina il giorno corrente (fallback a Lunedì se non trovato)
    let giornoSelezionato = getGiornoCorrente();
    if (!pianoAlimentare[giornoSelezionato]) {
        giornoSelezionato = Object.keys(pianoAlimentare)[0] || "Lunedì";
    }

    // Genera i bottoni dei giorni presenti nel JSON
    Object.keys(pianoAlimentare).forEach(giorno => {
        const btn = document.createElement("button");
        btn.className = `day-btn ${giorno === giornoSelezionato ? 'active' : ''}`;
        btn.textContent = giorno;
        btn.onclick = () => {
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mostraGiorno(giorno, pianoAlimentare);
        };
        daysContainer.appendChild(btn);
    });

    // Mostra i dati iniziali
    mostraGiorno(giornoSelezionato, pianoAlimentare);
});

function getGiornoCorrente() {
    const giorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
    return giorni[new Date().getDay()];
}

function mostraGiorno(giorno, data) {
    const mealView = document.getElementById("meal-view");
    mealView.innerHTML = "";
    const pasti = data[giorno];
    
    if (!pasti) return;

    pasti.forEach(item => {
        let card = document.createElement("div");
        card.className = "meal-card";
        
        let htmlList = `<div class="meal-title">${item.pasto}</div>`;
        item.alimenti.forEach(alimento => {
            htmlList += `
                <div class="food-item">
                    <span class="food-name">${alimento.nome}</span>
                    <span class="food-quantity">${alimento.qta}</span>
                </div>
            `;
        });
        card.innerHTML = htmlList;
        mealView.appendChild(card);
    });
}