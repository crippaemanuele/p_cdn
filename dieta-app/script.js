document.addEventListener("DOMContentLoaded", async () => {
    const daysContainer = document.getElementById("days-container");
    const mealView = document.getElementById("meal-view");
    const currentDateEl = document.getElementById("current-date");
    const currentTimeEl = document.getElementById("current-time");
    const nextMealBanner = document.getElementById("next-meal-banner");
    const todayBtn = document.getElementById("today-btn");
    const calendarToggle = document.getElementById("calendar-toggle");
    const calendarPanel = document.getElementById("calendar-panel");
    const datePicker = document.getElementById("date-picker");
    const nextMealBtn = document.getElementById("next-meal-btn");

    let pianoAlimentare = {};
    let giornoSelezionato = null;

    // ORARI DEI PASTI
    // Puoi modificarli liberamente
    const mealTimes = {
        "Colazione": "07:30",
        "Spuntino mattutino": "10:30",
        "Pranzo": "13:00",
        "Merenda": "16:30",
        "Cena": "20:00",
        "Spuntino serale": "22:00"
    };

    // ICONE DEI PASTI
    const mealIcons = {
        "Colazione": "☕",
        "Spuntino mattutino": "🍎",
        "Pranzo": "🍽️",
        "Merenda": "🥪",
        "Cena": "🌙",
        "Spuntino serale": "🍫",
        "Durante la giornata": "💧"
    };

    // CARICAMENTO DEL FILE dieta.json
    try {
        const response = await fetch("dieta.json");

        if (!response.ok) {
            throw new Error("Impossibile caricare dieta.json");
        }

        pianoAlimentare = await response.json();

    } catch (error) {
        console.error(error);

        mealView.innerHTML = `
            <div class="error-card">
                <strong>⚠️ Errore nel caricamento della dieta</strong>
                <p>
                    Controlla che il file
                    <code>dieta.json</code>
                    sia nella stessa cartella di index.html.
                </p>
            </div>
        `;

        return;
    }


    // ---------------------------------------------------
    // FUNZIONI DATA E ORA
    // ---------------------------------------------------

    function getNomeGiorno(date = new Date()) {
        const giorni = [
            "Domenica",
            "Lunedì",
            "Martedì",
            "Mercoledì",
            "Giovedì",
            "Venerdì",
            "Sabato"
        ];

        return giorni[date.getDay()];
    }


    function formatDate(date = new Date()) {
        return new Intl.DateTimeFormat("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(date);
    }


    function formatTime(date = new Date()) {
        return new Intl.DateTimeFormat("it-IT", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    }


    function timeToMinutes(time) {
        const [h, m] = time.split(":").map(Number);

        return h * 60 + m;
    }


    // ---------------------------------------------------
    // CALCOLO DEL PASTO PIÙ PROSSIMO
    // ---------------------------------------------------

    function getNextMeal(date = new Date()) {

        const currentMinutes =
            date.getHours() * 60 +
            date.getMinutes();

        const entries = Object.entries(mealTimes)
            .map(([name, time]) => ({
                name: name,
                time: time,
                minutes: timeToMinutes(time)
            }))
            .sort((a, b) => a.minutes - b.minutes);


        // Cerca il primo pasto non ancora trascorso
        for (const meal of entries) {

            if (meal.minutes >= currentMinutes) {

                return {
                    ...meal,
                    diff: meal.minutes - currentMinutes,
                    isTomorrow: false
                };
            }
        }


        // Se tutti i pasti sono già trascorsi,
        // il prossimo sarà la colazione del giorno successivo
        const firstMeal = entries[0];

        return {
            ...firstMeal,
            diff:
                (24 * 60 - currentMinutes) +
                firstMeal.minutes,
            isTomorrow: true
        };
    }


    // ---------------------------------------------------
    // AGGIORNAMENTO OROLOGIO
    // ---------------------------------------------------

    function updateClock() {

        const now = new Date();

        if (currentDateEl) {
            currentDateEl.textContent = formatDate(now);
        }

        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(now);
        }

        updateNextMealBanner(now);
    }


    // ---------------------------------------------------
    // BANNER PASTO PIÙ PROSSIMO
    // ---------------------------------------------------

    function updateNextMealBanner(now = new Date()) {

        if (!nextMealBanner) {
            return;
        }

        const next = getNextMeal(now);

        const hours = Math.floor(next.diff / 60);

        const minutes = next.diff % 60;

        let remaining = "";


        if (next.diff === 0) {

            remaining = "adesso";

        } else if (hours > 0 && minutes > 0) {

            remaining =
                `tra ${hours} h ${minutes} min`;

        } else if (hours > 0) {

            remaining =
                `tra ${hours} h`;

        } else {

            remaining =
                `tra ${minutes} min`;
        }


        const tomorrowText =
            next.isTomorrow
                ? " · domani"
                : "";


        nextMealBanner.innerHTML = `
            <span class="next-meal-icon">
                ${mealIcons[next.name] || "🍴"}
            </span>

            <div>

                <div class="next-meal-label">
                    Pasto più prossimo
                </div>

                <div class="next-meal-name">
                    ${next.name}
                </div>

                <div class="next-meal-time">
                    ${next.time}
                    ${tomorrowText}
                    ·
                    ${remaining}
                </div>

            </div>
        `;
    }


    // ---------------------------------------------------
    // CREAZIONE PULSANTI DEI GIORNI
    // ---------------------------------------------------

    function buildDayButtons() {

        if (!daysContainer) {
            return;
        }

        daysContainer.innerHTML = "";


        Object.keys(pianoAlimentare)
            .forEach(giorno => {

                const btn =
                    document.createElement("button");

                btn.className = "day-btn";

                btn.dataset.day = giorno;

                btn.textContent = giorno;


                btn.addEventListener(
                    "click",
                    () => {

                        selectDay(
                            giorno,
                            false
                        );

                    }
                );


                daysContainer.appendChild(btn);

            });
    }


    // ---------------------------------------------------
    // EVIDENZIA IL GIORNO ATTIVO
    // ---------------------------------------------------

    function updateActiveDayButton(giorno) {

        document
            .querySelectorAll(".day-btn")
            .forEach(btn => {

                btn.classList.toggle(
                    "active",
                    btn.dataset.day === giorno
                );

            });
    }


    // ---------------------------------------------------
    // CREA LA CARD DEL PASTO
    // ---------------------------------------------------

    function createMealCard(
        item,
        isNextMeal = false
    ) {

        const card =
            document.createElement("section");


        card.className = "meal-card";

        card.dataset.meal =
            item.pasto;


        if (isNextMeal) {

            card.classList.add(
                "next-meal"
            );

        }


        const icon =
            mealIcons[item.pasto] ||
            "🍴";


        const time =
            mealTimes[item.pasto];


        const foodsHtml =
            (item.alimenti || [])
                .map(alimento => `

                    <div class="food-item">

                        <span class="food-name">
                            ${alimento.nome}
                        </span>

                        <span class="food-quantity">
                            ${alimento.qta}
                        </span>

                    </div>

                `)
                .join("");


        card.innerHTML = `

            ${
                isNextMeal
                    ? `
                        <div class="next-ribbon">
                            PROSSIMO
                        </div>
                      `
                    : ""
            }


            <div class="meal-header">

                <div class="meal-icon">
                    ${icon}
                </div>


                <div>

                    <div class="meal-title">
                        ${item.pasto}
                    </div>


                    ${
                        time
                            ? `
                                <div class="meal-time">
                                    🕒 ${time}
                                </div>
                              `
                            : ""
                    }

                </div>

            </div>


            <div class="meal-foods">

                ${foodsHtml}

            </div>
        `;


        return card;
    }


    // ---------------------------------------------------
    // MOSTRA UNA GIORNATA
    // ---------------------------------------------------

    function mostraGiorno(
        giorno,
        autoScrollToNext = false
    ) {

        if (!mealView) {
            return;
        }


        mealView.innerHTML = "";


        const pasti =
            pianoAlimentare[giorno];


        if (!pasti) {

            mealView.innerHTML = `

                <div class="error-card">

                    Nessun dato disponibile
                    per ${giorno}.

                </div>
            `;

            return;
        }


        const todayName =
            getNomeGiorno();


        const isToday =
            giorno === todayName;


        const nextMeal =
            isToday
                ? getNextMeal()
                : null;


        pasti.forEach(
            (item, index) => {

                const isNext =
                    isToday &&
                    nextMeal &&
                    !nextMeal.isTomorrow &&
                    item.pasto ===
                    nextMeal.name;


                const card =
                    createMealCard(
                        item,
                        isNext
                    );


                // Piccolo ritardo per
                // creare un effetto animato
                card.style.animationDelay =
                    `${index * 55}ms`;


                mealView.appendChild(card);

            }
        );


        // SCROLL AUTOMATICO
        // AL PASTO PIÙ PROSSIMO
        if (
            autoScrollToNext &&
            isToday &&
            nextMeal &&
            !nextMeal.isTomorrow
        ) {

            requestAnimationFrame(() => {

                const cards =
                    document.querySelectorAll(
                        ".meal-card"
                    );


                let target = null;


                cards.forEach(card => {

                    if (
                        card.dataset.meal ===
                        nextMeal.name
                    ) {

                        target = card;

                    }

                });


                if (target) {

                    setTimeout(() => {

                        target.scrollIntoView({

                            behavior: "smooth",

                            block: "center"

                        });

                    }, 250);

                }

            });

        }

    }


    // ---------------------------------------------------
    // SELEZIONA UN GIORNO
    // ---------------------------------------------------

    function selectDay(
        giorno,
        autoScrollToNext = false
    ) {

        giornoSelezionato = giorno;


        updateActiveDayButton(
            giorno
        );


        mostraGiorno(
            giorno,
            autoScrollToNext
        );


        const buttons =
            document.querySelectorAll(
                ".day-btn"
            );


        let activeBtn = null;


        buttons.forEach(btn => {

            if (
                btn.dataset.day === giorno
            ) {

                activeBtn = btn;

            }

        });


        if (activeBtn) {

            activeBtn.scrollIntoView({

                behavior: "smooth",

                inline: "center",

                block: "nearest"

            });

        }

    }


    // ---------------------------------------------------
    // TORNA A OGGI
    // ---------------------------------------------------

    function goToToday(
        scrollToMeal = true
    ) {

        const today =
            getNomeGiorno();


        if (
            pianoAlimentare[today]
        ) {

            selectDay(
                today,
                scrollToMeal
            );

        } else {

            const firstDay =
                Object.keys(
                    pianoAlimentare
                )[0];


            if (firstDay) {

                selectDay(
                    firstDay,
                    false
                );

            }

        }


        // Aggiorna anche
        // la data del calendario
        if (datePicker) {

            const now =
                new Date();


            const yyyy =
                now.getFullYear();


            const mm =
                String(
                    now.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            const dd =
                String(
                    now.getDate()
                ).padStart(
                    2,
                    "0"
                );


            datePicker.value =
                `${yyyy}-${mm}-${dd}`;

        }

    }


    // ---------------------------------------------------
    // APRE LA DATA SELEZIONATA DAL CALENDARIO
    // ---------------------------------------------------

    function openSelectedDate(
        dateString
    ) {

        if (!dateString) {
            return;
        }


        const [
            year,
            month,
            day
        ] =
            dateString
                .split("-")
                .map(Number);


        const chosenDate =
            new Date(
                year,
                month - 1,
                day
            );


        const weekday =
            getNomeGiorno(
                chosenDate
            );


        if (
            pianoAlimentare[
                weekday
            ]
        ) {

            selectDay(
                weekday,
                false
            );

        }


        // Chiude il calendario
        if (calendarPanel) {

            calendarPanel.classList.remove(
                "open"
            );

        }

    }


    // ---------------------------------------------------
    // EVENTO: APERTURA CALENDARIO
    // ---------------------------------------------------

    if (
        calendarToggle &&
        calendarPanel
    ) {

        calendarToggle.addEventListener(
            "click",
            () => {

                calendarPanel.classList.toggle(
                    "open"
                );

            }
        );

    }


    // ---------------------------------------------------
    // EVENTO: PULSANTE OGGI
    // ---------------------------------------------------

    if (todayBtn) {

        todayBtn.addEventListener(
            "click",
            () => {

                goToToday(true);

            }
        );

    }


    // ---------------------------------------------------
    // EVENTO: SCELTA DATA DAL CALENDARIO
    // ---------------------------------------------------

    if (datePicker) {

        datePicker.addEventListener(
            "change",
            event => {

                openSelectedDate(
                    event.target.value
                );

            }
        );

    }


    // ---------------------------------------------------
    // EVENTO: PULSANTE PASTO PIÙ PROSSIMO
    // ---------------------------------------------------

    if (nextMealBtn) {

        nextMealBtn.addEventListener(
            "click",
            () => {

                goToToday(true);

            }
        );

    }


    // ---------------------------------------------------
    // CHIUDE IL CALENDARIO
    // CLICCANDO FUORI
    // ---------------------------------------------------

    document.addEventListener(
        "click",
        event => {

            if (
                !calendarPanel ||
                !calendarToggle
            ) {

                return;
            }


            const clickedInsidePanel =
                calendarPanel.contains(
                    event.target
                );


            const clickedToggle =
                calendarToggle.contains(
                    event.target
                );


            if (
                !clickedInsidePanel &&
                !clickedToggle
            ) {

                calendarPanel.classList.remove(
                    "open"
                );

            }

        }
    );


    // ---------------------------------------------------
    // AVVIO APP
    // ---------------------------------------------------

    buildDayButtons();


    // All'apertura:
    // seleziona automaticamente
    // il giorno corrente
    // e porta al pasto più prossimo
    goToToday(true);


    // Mostra data e ora
    updateClock();


    // ---------------------------------------------------
    // AGGIORNAMENTO AUTOMATICO
    // OGNI MINUTO
    // ---------------------------------------------------

    setInterval(() => {

        updateClock();


        const currentDay =
            getNomeGiorno();


        // Se l'utente sta visualizzando
        // proprio il giorno corrente,
        // aggiorna l'evidenziazione
        // del pasto più prossimo
        if (
            giornoSelezionato ===
            currentDay
        ) {

            mostraGiorno(
                currentDay,
                false
            );

        }

    }, 60000);

});