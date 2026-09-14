document.addEventListener("DOMContentLoaded", async () => {

    // ==========================================================
    // ELEMENTI DELLA PAGINA
    // ==========================================================

    const daysContainer =
        document.getElementById("days-container");

    const mealView =
        document.getElementById("meal-view");

    const currentDateEl =
        document.getElementById("current-date");

    const currentTimeEl =
        document.getElementById("current-time");

    const nextMealBanner =
        document.getElementById("next-meal-banner");

    const todayBtn =
        document.getElementById("today-btn");

    const calendarToggle =
        document.getElementById("calendar-toggle");

    const calendarPanel =
        document.getElementById("calendar-panel");

    const datePicker =
        document.getElementById("date-picker");

    const nextMealBtn =
        document.getElementById("next-meal-btn");

    const toast =
        document.getElementById("toast");


    // ==========================================================
    // VARIABILI
    // ==========================================================

    let pianoAlimentare = {};

    let giornoSelezionato = null;

    let dataSelezionata = new Date();


    // ==========================================================
    // ORARI DEI PASTI
    // Devono corrispondere ai nomi presenti nel JSON
    // ==========================================================

    const mealTimes = {

        "COLAZIONE": "07:30",

        "SPUNTINO MATT.": "10:30",

        "PRANZO": "13:00",

        "MERENDA": "16:30",

        "CENA": "20:00",

        "SPUNTINO SER.": "22:00"

    };


    // ==========================================================
    // ICONE
    // ==========================================================

    const mealIcons = {

        "COLAZIONE": "☕",

        "SPUNTINO MATT.": "🍎",

        "PRANZO": "🍽️",

        "MERENDA": "🥪",

        "CENA": "🌙",

        "SPUNTINO SER.": "🍫",

        "DURANTE LA GIORNATA": "💧"

    };


    // ==========================================================
    // CARICAMENTO JSON
    // ==========================================================

    try {

        const response =
            await fetch("dieta.json");


        if (!response.ok) {

            throw new Error(
                "Impossibile caricare dieta.json"
            );

        }


        pianoAlimentare =
            await response.json();


    } catch (error) {

        console.error(error);


        mealView.innerHTML = `

            <div class="error-card">

                <strong>
                    ⚠️ Errore nel caricamento
                </strong>

                <p>
                    Controlla che
                    <code>dieta.json</code>
                    si trovi nella stessa cartella
                    di index.html.
                </p>

            </div>
        `;


        return;

    }


    // ==========================================================
    // FUNZIONI DATA
    // ==========================================================

    function getNomeGiorno(
        date = new Date()
    ) {

        const giorni = [

            "Domenica",

            "Lunedì",

            "Martedì",

            "Mercoledì",

            "Giovedì",

            "Venerdì",

            "Sabato"

        ];


        return giorni[
            date.getDay()
        ];

    }


    function formatDate(
        date = new Date()
    ) {

        return new Intl.DateTimeFormat(

            "it-IT",

            {
                weekday: "long",

                day: "numeric",

                month: "long"
            }

        ).format(date);

    }


    function formatTime(
        date = new Date()
    ) {

        return new Intl.DateTimeFormat(

            "it-IT",

            {
                hour: "2-digit",

                minute: "2-digit"
            }

        ).format(date);

    }


    function dateToKey(date) {

        const yyyy =
            date.getFullYear();

        const mm =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const dd =
            String(
                date.getDate()
            ).padStart(2, "0");


        return `${yyyy}-${mm}-${dd}`;

    }


    // ==========================================================
    // OROLOGIO
    // ==========================================================

    function timeToMinutes(time) {

        const [h, m] =
            time
                .split(":")
                .map(Number);


        return h * 60 + m;

    }


    function getNextMeal(
        date = new Date()
    ) {

        const currentMinutes =

            date.getHours() * 60 +

            date.getMinutes();


        const entries =

            Object.entries(mealTimes)

                .map(

                    ([name, time]) => ({

                        name,

                        time,

                        minutes:
                            timeToMinutes(time)

                    })

                )

                .sort(

                    (a, b) =>
                        a.minutes -
                        b.minutes

                );


        for (
            const meal of entries
        ) {

            if (
                meal.minutes >=
                currentMinutes
            ) {

                return {

                    ...meal,

                    diff:
                        meal.minutes -
                        currentMinutes,

                    isTomorrow:
                        false

                };

            }

        }


        const firstMeal =
            entries[0];


        return {

            ...firstMeal,

            diff:

                (24 * 60 -
                    currentMinutes)

                +

                firstMeal.minutes,

            isTomorrow:
                true

        };

    }


    function updateClock() {

        const now =
            new Date();


        if (currentDateEl) {

            currentDateEl.textContent =
                formatDate(now);

        }


        if (currentTimeEl) {

            currentTimeEl.textContent =
                formatTime(now);

        }


        updateNextMealBanner(now);

    }


    // ==========================================================
    // BANNER PROSSIMO PASTO
    // ==========================================================

    function updateNextMealBanner(
        now = new Date()
    ) {

        if (!nextMealBanner) {
            return;
        }


        const next =
            getNextMeal(now);


        const hours =
            Math.floor(
                next.diff / 60
            );


        const minutes =
            next.diff % 60;


        let remaining = "";


        if (next.diff === 0) {

            remaining =
                "adesso";

        }

        else if (
            hours > 0 &&
            minutes > 0
        ) {

            remaining =
                `tra ${hours} h ${minutes} min`;

        }

        else if (hours > 0) {

            remaining =
                `tra ${hours} h`;

        }

        else {

            remaining =
                `tra ${minutes} min`;

        }


        nextMealBanner.innerHTML = `

            <span class="next-meal-icon">

                ${
                    mealIcons[
                        next.name
                    ] || "🍴"
                }

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

                    ${
                        next.isTomorrow
                            ? " · domani"
                            : ""
                    }

                    · ${remaining}

                </div>

            </div>
        `;

    }


    // ==========================================================
    // LOCAL STORAGE
    // ==========================================================

    /*
        Ogni sostituzione viene salvata
        separatamente per DATA + PASTO + ALIMENTO.

        Quindi una sostituzione fatta lunedì
        non modifica permanentemente tutti i lunedì.
    */


    function getStorageKey(
        giorno,
        pasto,
        foodIndex
    ) {

        const dateKey =
            dateToKey(
                dataSelezionata
            );


        return (

            "dieta_" +

            dateKey +

            "_" +

            giorno +

            "_" +

            pasto +

            "_" +

            foodIndex

        );

    }


    function saveChoice(
        giorno,
        pasto,
        foodIndex,
        choiceIndex
    ) {

        const key =
            getStorageKey(
                giorno,
                pasto,
                foodIndex
            );


        localStorage.setItem(
            key,
            String(choiceIndex)
        );

    }


    function getSavedChoice(
        giorno,
        pasto,
        foodIndex
    ) {

        const key =
            getStorageKey(
                giorno,
                pasto,
                foodIndex
            );


        const value =
            localStorage.getItem(
                key
            );


        if (value === null) {

            return 0;

        }


        return Number(value);

    }


    function removeSavedChoice(
        giorno,
        pasto,
        foodIndex
    ) {

        const key =
            getStorageKey(
                giorno,
                pasto,
                foodIndex
            );


        localStorage.removeItem(
            key
        );

    }


    // ==========================================================
    // TOAST
    // ==========================================================

    function showToast(message) {

        if (!toast) {
            return;
        }


        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        setTimeout(

            () => {

                toast.classList.remove(
                    "show"
                );

            },

            1800

        );

    }


    // ==========================================================
    // BOTTONI DEI GIORNI
    // ==========================================================

    function buildDayButtons() {

        daysContainer.innerHTML = "";


        const giorni = [

            "Lunedì",

            "Martedì",

            "Mercoledì",

            "Giovedì",

            "Venerdì",

            "Sabato",

            "Domenica"

        ];


        giorni.forEach(
            giorno => {

                if (
                    !pianoAlimentare[
                        giorno
                    ]
                ) {
                    return;
                }


                const btn =
                    document.createElement(
                        "button"
                    );


                btn.className =
                    "day-btn";


                btn.dataset.day =
                    giorno;


                btn.textContent =
                    giorno;


                btn.addEventListener(

                    "click",

                    () => {

                        giornoSelezionato =
                            giorno;


                        /*
                            Quando si usa la barra
                            settimanale teniamo la
                            settimana della data
                            selezionata.
                        */

                        selectDay(
                            giorno,
                            false
                        );

                    }

                );


                daysContainer.appendChild(
                    btn
                );

            }
        );

    }


    function updateActiveDayButton(
        giorno
    ) {

        document
            .querySelectorAll(
                ".day-btn"
            )
            .forEach(

                btn => {

                    btn.classList.toggle(

                        "active",

                        btn.dataset.day ===
                        giorno

                    );

                }

            );

    }


    // ==========================================================
    // RESTITUISCE ALIMENTO SELEZIONATO
    // ==========================================================

    function getSelectedFood(
        alimento,
        selectedIndex
    ) {

        /*
            Indice 0 = alimento originale.

            Indice 1 = prima alternativa.
            Indice 2 = seconda alternativa.
            ecc.
        */


        if (selectedIndex === 0) {

            return {

                nome:
                    alimento.nome,

                qta:
                    alimento.qta,

                nota:
                    alimento.nota || null

            };

        }


        const alternative =
            alimento.alternative || [];


        const selected =
            alternative[
                selectedIndex - 1
            ];


        if (!selected) {

            return {

                nome:
                    alimento.nome,

                qta:
                    alimento.qta,

                nota:
                    alimento.nota || null

            };

        }


        return selected;

    }


    // ==========================================================
    // CREA RIGA ALIMENTO
    // ==========================================================

    function createFoodItem(

        alimento,

        giorno,

        pasto,

        foodIndex

    ) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "food-wrapper";


        let selectedIndex =
            getSavedChoice(

                giorno,

                pasto,

                foodIndex

            );


        const selectedFood =
            getSelectedFood(

                alimento,

                selectedIndex

            );


        // --------------------------------------
        // RIGA PRINCIPALE
        // --------------------------------------

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "food-item";


        if (selectedIndex > 0) {

            row.classList.add(
                "food-modified"
            );

        }


        const info =
            document.createElement(
                "div"
            );


        info.className =
            "food-info";


        const name =
            document.createElement(
                "div"
            );


        name.className =
            "food-name";


        name.textContent =
            selectedFood.nome;


        info.appendChild(name);


        if (selectedIndex > 0) {

            const changed =
                document.createElement(
                    "div"
                );


            changed.className =
                "alternative-badge";


            changed.textContent =
                "✓ alternativa scelta";


            info.appendChild(
                changed
            );

        }


        if (selectedFood.nota) {

            const note =
                document.createElement(
                    "div"
                );


            note.className =
                "food-note";


            note.textContent =
                selectedFood.nota;


            info.appendChild(note);

        }


        const right =
            document.createElement(
                "div"
            );


        right.className =
            "food-right";


        const quantity =
            document.createElement(
                "span"
            );


        quantity.className =
            "food-quantity";


        quantity.textContent =
            selectedFood.qta;


        right.appendChild(
            quantity
        );


        // --------------------------------------
        // SE ESISTONO ALTERNATIVE
        // --------------------------------------

        const alternatives =
            alimento.alternative || [];


        if (
            alternatives.length > 0
        ) {

            const changeBtn =
                document.createElement(
                    "button"
                );


            changeBtn.className =
                "change-food-btn";


            changeBtn.innerHTML =
                "🔄 Cambia";


            right.appendChild(
                changeBtn
            );


            // ----------------------------------
            // PANNELLO ALTERNATIVE
            // ----------------------------------

            const panel =
                document.createElement(
                    "div"
                );


            panel.className =
                "alternatives-panel";


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "alternatives-title";


            title.textContent =
                "Scegli un'alternativa";


            panel.appendChild(
                title
            );


            // ----------------------------------
            // ORIGINALE
            // ----------------------------------

            const original =
                createAlternativeButton(

                    alimento.nome,

                    alimento.qta,

                    selectedIndex === 0,

                    true

                );


            original.addEventListener(

                "click",

                () => {

                    saveChoice(

                        giorno,

                        pasto,

                        foodIndex,

                        0

                    );


                    mostraGiorno(
                        giorno,
                        false
                    );


                    showToast(
                        "Pasto aggiornato ✓"
                    );

                }

            );


            panel.appendChild(
                original
            );


            // ----------------------------------
            // ALTERNATIVE
            // ----------------------------------

            alternatives.forEach(

                (alt, altIndex) => {

                    const index =
                        altIndex + 1;


                    const button =
                        createAlternativeButton(

                            alt.nome,

                            alt.qta,

                            selectedIndex ===
                                index,

                            false

                        );


                    button.addEventListener(

                        "click",

                        () => {

                            saveChoice(

                                giorno,

                                pasto,

                                foodIndex,

                                index

                            );


                            mostraGiorno(
                                giorno,
                                false
                            );


                            showToast(
                                "Alternativa selezionata ✓"
                            );

                        }

                    );


                    panel.appendChild(
                        button
                    );

                }

            );


            changeBtn.addEventListener(

                "click",

                event => {

                    event.stopPropagation();


                    panel.classList.toggle(
                        "open"
                    );

                }

            );


            wrapper.appendChild(
                row
            );


            wrapper.appendChild(
                panel
            );

        }

        else {

            wrapper.appendChild(
                row
            );

        }


        row.appendChild(
            info
        );


        row.appendChild(
            right
        );


        return wrapper;

    }


    // ==========================================================
    // BOTTONE ALTERNATIVA
    // ==========================================================

    function createAlternativeButton(

        nome,

        qta,

        selected,

        original

    ) {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "alternative-option";


        if (selected) {

            button.classList.add(
                "selected"
            );

        }


        button.innerHTML = `

            <span class="alternative-option-text">

                <strong>
                    ${nome}
                </strong>

                ${
                    original
                        ? `
                            <small>
                                alimento previsto
                            </small>
                          `
                        : ""
                }

            </span>


            <span class="alternative-option-qta">

                ${qta}

            </span>

        `;


        return button;

    }


    // ==========================================================
    // GENERA VARIANTE AUTOMATICA DEL PASTO
    // ==========================================================

    function generateMealAlternative(

        giorno,

        pasto

    ) {

        const pasti =
            pianoAlimentare[
                giorno
            ];


        const meal =
            pasti.find(

                item =>
                    item.pasto ===
                    pasto

            );


        if (!meal) {
            return;
        }


        let changed = 0;


        meal.alimenti.forEach(

            (alimento, foodIndex) => {

                const alternatives =
                    alimento.alternative || [];


                if (
                    alternatives.length === 0
                ) {

                    return;

                }


                /*
                    Possibili scelte:

                    0 = alimento originale
                    1...n = alternative

                    Per "crea alternativa"
                    privilegiamo una vera alternativa,
                    quindi scegliamo 1...n.
                */


                const randomIndex =

                    Math.floor(

                        Math.random() *
                        alternatives.length

                    )

                    + 1;


                saveChoice(

                    giorno,

                    pasto,

                    foodIndex,

                    randomIndex

                );


                changed++;

            }

        );


        mostraGiorno(
            giorno,
            false
        );


        if (changed > 0) {

            showToast(
                "✨ Variante del pasto creata"
            );

        }

        else {

            showToast(
                "Nessuna alternativa disponibile"
            );

        }

    }


    // ==========================================================
    // RIPRISTINA PASTO
    // ==========================================================

    function resetMeal(

        giorno,

        pasto

    ) {

        const pasti =
            pianoAlimentare[
                giorno
            ];


        const meal =
            pasti.find(

                item =>
                    item.pasto ===
                    pasto

            );


        if (!meal) {
            return;
        }


        meal.alimenti.forEach(

            (_, foodIndex) => {

                removeSavedChoice(

                    giorno,

                    pasto,

                    foodIndex

                );

            }

        );


        mostraGiorno(
            giorno,
            false
        );


        showToast(
            "↩ Pasto originale ripristinato"
        );

    }


    // ==========================================================
    // CREA CARD DEL PASTO
    // ==========================================================

    function createMealCard(

        item,

        giorno,

        isNextMeal = false,

        cardIndex = 0

    ) {

        const card =
            document.createElement(
                "section"
            );


        card.className =
            "meal-card";


        card.dataset.meal =
            item.pasto;


        card.style.animationDelay =
            `${cardIndex * 50}ms`;


        if (isNextMeal) {

            card.classList.add(
                "next-meal"
            );

        }


        if (isNextMeal) {

            const ribbon =
                document.createElement(
                    "div"
                );


            ribbon.className =
                "next-ribbon";


            ribbon.textContent =
                "PROSSIMO";


            card.appendChild(
                ribbon
            );

        }


        // --------------------------------------
        // HEADER PASTO
        // --------------------------------------

        const header =
            document.createElement(
                "div"
            );


        header.className =
            "meal-header";


        const icon =
            document.createElement(
                "div"
            );


        icon.className =
            "meal-icon";


        icon.textContent =
            mealIcons[
                item.pasto
            ] || "🍴";


        const titleArea =
            document.createElement(
                "div"
            );


        titleArea.className =
            "meal-title-area";


        const title =
            document.createElement(
                "div"
            );


        title.className =
            "meal-title";


        title.textContent =
            item.pasto;


        titleArea.appendChild(
            title
        );


        if (
            mealTimes[item.pasto]
        ) {

            const time =
                document.createElement(
                    "div"
                );


            time.className =
                "meal-time";


            time.textContent =
                `🕒 ${mealTimes[item.pasto]}`;


            titleArea.appendChild(
                time
            );

        }


        header.appendChild(
            icon
        );


        header.appendChild(
            titleArea
        );


        card.appendChild(
            header
        );


        // --------------------------------------
        // NOTA DEL PASTO
        // --------------------------------------

        if (item.nota) {

            const note =
                document.createElement(
                    "div"
                );


            note.className =
                "meal-note";


            note.innerHTML =
                `💡 ${item.nota}`;


            card.appendChild(
                note
            );

        }


        // --------------------------------------
        // ALIMENTI
        // --------------------------------------

        const foodContainer =
            document.createElement(
                "div"
            );


        foodContainer.className =
            "meal-foods";


        item.alimenti.forEach(

            (alimento, foodIndex) => {

                foodContainer.appendChild(

                    createFoodItem(

                        alimento,

                        giorno,

                        item.pasto,

                        foodIndex

                    )

                );

            }

        );


        card.appendChild(
            foodContainer
        );


        // --------------------------------------
        // AZIONI DEL PASTO
        // --------------------------------------

        const hasAlternatives =

            item.alimenti.some(

                alimento =>

                    Array.isArray(
                        alimento.alternative
                    )

                    &&

                    alimento.alternative.length >
                        0

            );


        if (hasAlternatives) {

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "meal-actions";


            const generateBtn =
                document.createElement(
                    "button"
                );


            generateBtn.className =
                "generate-btn";


            generateBtn.innerHTML =
                "✨ Crea alternativa";


            generateBtn.addEventListener(

                "click",

                () => {

                    generateMealAlternative(

                        giorno,

                        item.pasto

                    );

                }

            );


            const resetBtn =
                document.createElement(
                    "button"
                );


            resetBtn.className =
                "reset-btn";


            resetBtn.innerHTML =
                "↩ Ripristina";


            resetBtn.addEventListener(

                "click",

                () => {

                    resetMeal(

                        giorno,

                        item.pasto

                    );

                }

            );


            actions.appendChild(
                generateBtn
            );


            actions.appendChild(
                resetBtn
            );


            card.appendChild(
                actions
            );

        }


        return card;

    }


    // ==========================================================
    // MOSTRA GIORNO
    // ==========================================================

    function mostraGiorno(

        giorno,

        autoScrollToNext = false

    ) {

        mealView.innerHTML = "";


        const pasti =
            pianoAlimentare[
                giorno
            ];


        if (
            !Array.isArray(pasti)
        ) {

            mealView.innerHTML = `

                <div class="error-card">

                    Nessun piano disponibile
                    per ${giorno}.

                </div>
            `;


            return;

        }


        const today =
            getNomeGiorno();


        const selectedDateKey =
            dateToKey(
                dataSelezionata
            );


        const todayKey =
            dateToKey(
                new Date()
            );


        const isActualToday =

            giorno === today

            &&

            selectedDateKey ===
            todayKey;


        const nextMeal =

            isActualToday

                ? getNextMeal()

                : null;


        pasti.forEach(

            (item, index) => {

                const isNext =

                    isActualToday

                    &&

                    nextMeal

                    &&

                    !nextMeal.isTomorrow

                    &&

                    item.pasto ===
                    nextMeal.name;


                mealView.appendChild(

                    createMealCard(

                        item,

                        giorno,

                        isNext,

                        index

                    )

                );

            }

        );


        if (

            autoScrollToNext

            &&

            nextMeal

            &&

            !nextMeal.isTomorrow

        ) {

            setTimeout(

                () => {

                    const target =

                        Array.from(

                            document.querySelectorAll(
                                ".meal-card"
                            )

                        ).find(

                            card =>

                                card.dataset.meal ===
                                nextMeal.name

                        );


                    if (target) {

                        target.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "center"

                        });

                    }

                },

                350

            );

        }

    }


    // ==========================================================
    // SELEZIONE GIORNO
    // ==========================================================

    function selectDay(

        giorno,

        autoScrollToNext = false

    ) {

        giornoSelezionato =
            giorno;


        updateActiveDayButton(
            giorno
        );


        mostraGiorno(

            giorno,

            autoScrollToNext

        );


        const activeBtn =

            Array.from(

                document.querySelectorAll(
                    ".day-btn"
                )

            ).find(

                btn =>
                    btn.dataset.day ===
                    giorno

            );


        if (activeBtn) {

            activeBtn.scrollIntoView({

                behavior:
                    "smooth",

                inline:
                    "center",

                block:
                    "nearest"

            });

        }

    }


    // ==========================================================
    // OGGI
    // ==========================================================

    function goToToday(

        scrollToMeal = true

    ) {

        dataSelezionata =
            new Date();


        const today =
            getNomeGiorno(
                dataSelezionata
            );


        if (datePicker) {

            datePicker.value =
                dateToKey(
                    dataSelezionata
                );

        }


        selectDay(

            today,

            scrollToMeal

        );

    }


    // ==========================================================
    // CALENDARIO
    // ==========================================================

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


        dataSelezionata =
            new Date(

                year,

                month - 1,

                day

            );


        const weekday =
            getNomeGiorno(
                dataSelezionata
            );


        selectDay(

            weekday,

            false

        );


        calendarPanel.classList.remove(
            "open"
        );

    }


    // ==========================================================
    // EVENTI
    // ==========================================================

    calendarToggle.addEventListener(

        "click",

        event => {

            event.stopPropagation();


            calendarPanel.classList.toggle(
                "open"
            );

        }

    );


    todayBtn.addEventListener(

        "click",

        () => {

            goToToday(true);

        }

    );


    datePicker.addEventListener(

        "change",

        event => {

            openSelectedDate(
                event.target.value
            );

        }

    );


    nextMealBtn.addEventListener(

        "click",

        () => {

            goToToday(true);

        }

    );


    document.addEventListener(

        "click",

        event => {

            if (

                !calendarPanel.contains(
                    event.target
                )

                &&

                !calendarToggle.contains(
                    event.target
                )

            ) {

                calendarPanel.classList.remove(
                    "open"
                );

            }

        }

    );


    // ==========================================================
    // AVVIO APP
    // ==========================================================

    buildDayButtons();


    goToToday(true);


    updateClock();


    // Aggiornamento ogni minuto

    setInterval(

        () => {

            updateClock();


            const today =
                getNomeGiorno();


            const todayKey =
                dateToKey(
                    new Date()
                );


            const selectedKey =
                dateToKey(
                    dataSelezionata
                );


            if (

                giornoSelezionato ===
                today

                &&

                selectedKey ===
                todayKey

            ) {

                mostraGiorno(

                    today,

                    false

                );

            }

        },

        60000

    );

});
