function reduceYears() {
    let yearsRemaining = parseInt(yearCounter.textContent);

    const countdownInterval = setInterval(() => {
        yearsRemaining -= 1;

        yearCounter.textContent = `${yearsRemaining} years`;

        if (yearsRemaining <= 0) {
            clearInterval(countdownInterval);
            yearCounter.textContent = "0 years";
            yearCounter.classList.remove('text-green-600');
            yearCounter.classList.add('text-red-600');
            plantButton.remove();
        }
    }, 10000);
}

function increaseTreeCount() {
    // Utilisation du multiplicateur treePerClick
    let treeCount = parseInt(treesCounter.textContent);
    // Ajout de la valeur du multiplicateur plutôt que +1
    treeCount += treePerClick;

    treesCounter.textContent = `${treeCount}`;
}

function increaseMoney() {
    // Récupération de l'argent actuel
    let moneyCount = parseInt(moneyCounter.textContent.substring(1));

    // Calcul de l'argent gagné en tenant compte du multiplicateur moneyPerTree
    // et du nombre d'arbres plantés par clic (treePerClick)
    moneyCount += moneyPerTree * treePerClick;

    moneyCounter.textContent = `$${moneyCount}`;
}

function parseJson() {
    return fetch('innovations.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .catch(erreur => {
            console.error("Problème lors de la récupération du fichier:", erreur);
            throw erreur;
        });
}

function showInnovations() {
    if (!parsedJson) {
        console.error("Les données d'innovations ne sont pas disponibles");
        return;
    }

    // Vider la liste des innovations existantes pour éviter les doublons
    const innovationsContainer = document.querySelector("#innovations-list .space-y-4");
    innovationsContainer.innerHTML = "";

    parsedJson.forEach(innovation => {
        const innovationBlock = document.createElement('div');
        innovationBlock.className = 'p-3 border rounded-lg hover:bg-green-50 cursor-pointer mb-3';
        innovationBlock.dataset.name = innovation.Name;

        const title = document.createElement('h3');
        title.className = 'font-semibold';
        title.textContent = innovation.Name;
        innovationBlock.appendChild(title);

        const description = document.createElement('p');
        description.className = 'text-sm text-gray-600';
        description.textContent = innovation.Description;
        innovationBlock.appendChild(description);

        const changes = innovation.Changes;

        if (changes.treePerClick !== 1) {
            const treePerClickElement = document.createElement('p');
            treePerClickElement.className = 'text-sm text-gray-600';
            treePerClickElement.textContent = `Tree Per Click x${changes.treePerClick}`;
            innovationBlock.appendChild(treePerClickElement);
        }

        if (changes.moneyPerTree !== 1) {
            const moneyPerTreeElement = document.createElement('p');
            moneyPerTreeElement.className = 'text-sm text-gray-600';
            moneyPerTreeElement.textContent = `Money Per Tree x${changes.moneyPerTree}`;
            innovationBlock.appendChild(moneyPerTreeElement);
        }

        if (changes.afkTreePerSecond !== 1) {
            const afkTreeElement = document.createElement('p');
            afkTreeElement.className = 'text-sm text-gray-600';
            afkTreeElement.textContent = `Passive Trees Per Second x${changes.afkTreePerSecond}`;
            innovationBlock.appendChild(afkTreeElement);
        }

        const cost = document.createElement('p');
        cost.className = 'text-sm text-gray-600 font-bold';
        cost.textContent = `Cost: $${innovation.Cost}`;
        innovationBlock.appendChild(cost);

        innovationsContainer.appendChild(innovationBlock);

        innovationBlock.addEventListener('click', () => {
            buyInnovation(innovation);
        });
    });
}

function buyInnovation(innovation) {
    // Récupérer l'argent actuel du joueur
    const currentMoney = parseInt(moneyCounter.textContent.substring(1));

    // Vérifier si le joueur a assez d'argent pour acheter l'innovation
    if (currentMoney >= innovation.Cost) {
        // Soustraire le coût de l'innovation de l'argent du joueur
        moneyCounter.textContent = `$${currentMoney - innovation.Cost}`;

        // Appliquer les changements de l'innovation
        applyInnovation(innovation);

        // Déplacer l'innovation dans l'historique
        moveInnovationToHistory(innovation);

        console.log(`Innovation "${innovation.Name}" achetée!`);
    } else {
        console.log(`Pas assez d'argent pour acheter "${innovation.Name}"!`);
        // Optionnel : ajouter une notification visuelle pour l'utilisateur
        alert(`Vous n'avez pas assez d'argent pour acheter "${innovation.Name}". Il vous manque $${innovation.Cost - currentMoney}.`);
    }
}

function applyInnovation(innovation) {
    // Appliquer les modifications aux multiplicateurs du jeu
    if (innovation.Changes.treePerClick) {
        treePerClick *= innovation.Changes.treePerClick;
    }

    if (innovation.Changes.moneyPerTree) {
        moneyPerTree *= innovation.Changes.moneyPerTree;
    }

    if (innovation.Changes.afkTreePerSecond) {
        afkTreePerSecond *= innovation.Changes.afkTreePerSecond;
    }

    // Stocker les valeurs dans localStorage pour persistance
    saveGameState();

    // Mettre à jour l'affichage des multiplicateurs
    updateMultiplierDisplay();

    // Mettre à jour la fonction AFK si nécessaire
    manageAfk();

    console.log(`Multiplicateurs mis à jour - Arbres/clic: ${treePerClick}, Argent/arbre: ${moneyPerTree}, Arbres passifs/s: ${afkTreePerSecond}`);
}

function moveInnovationToHistory(innovation) {
    // Trouver le bloc d'innovation correspondant et le supprimer de la liste des innovations
    const innovationsContainer = document.querySelector("#innovations-list .space-y-4");
    const innovationToRemove = innovationsContainer.querySelector(`[data-name="${innovation.Name}"]`);

    if (innovationToRemove) {
        innovationsContainer.removeChild(innovationToRemove);
    }

    // Créer un nouvel élément pour l'historique
    const historyItem = document.createElement('div');
    historyItem.className = 'text-sm text-gray-600';
    historyItem.textContent = `${innovation.Name} - $${innovation.Cost}`;

    // Remplacer le message "No innovations has been done yet" s'il est présent
    const historyContainer = document.querySelector(".space-y-2.h-48");
    const noInnovationMessage = historyContainer.querySelector("div");

    if (noInnovationMessage && noInnovationMessage.textContent === "No innovations has been done yet") {
        historyContainer.removeChild(noInnovationMessage);
    }

    // Ajouter l'innovation à l'historique
    historyContainer.appendChild(historyItem);

    // Supprimer cette innovation du tableau parsedJson pour qu'elle ne soit plus disponible
    parsedJson = parsedJson.filter(item => item.Name !== innovation.Name);

    // Enregistrer l'état du jeu après cette modification
    saveGameState();
}

// Variables pour le système AFK
let afkAccumulated = 0; // Pour suivre les fractions d'arbres générés
let lastTimestamp = Date.now(); // Pour mesurer le temps écoulé précisément

function manageAfk() {
    // S'assurer qu'il n'y a qu'un seul intervalle AFK actif
    if (window.afkInterval) {
        clearInterval(window.afkInterval);
    }

    // Ne démarrer l'intervalle que si le taux d'arbres passifs est supérieur à zéro
    if (afkTreePerSecond > 0) {
        // Enregistrer le timestamp au démarrage du système AFK
        lastTimestamp = Date.now();

        window.afkInterval = setInterval(() => {
            // Calculer le temps précis écoulé depuis la dernière mise à jour
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastTimestamp) / 1000; // Convertir en secondes
            lastTimestamp = currentTime;

            // Calculer la fraction précise d'arbres à ajouter en tenant compte du temps exact écoulé
            const exactTreesToAdd = afkTreePerSecond * deltaTime;

            // Accumuler la fraction pour éviter de perdre des arbres dus aux arrondis
            afkAccumulated += exactTreesToAdd;

            // Déterminer combien d'arbres entiers peuvent être ajoutés
            const treesToAdd = Math.floor(afkAccumulated);

            // Soustraire les arbres ajoutés de l'accumulateur, gardant la fraction restante
            afkAccumulated -= treesToAdd;

            if (treesToAdd > 0) {
                // Ajouter des arbres
                let currentTrees = parseInt(treesCounter.textContent);
                currentTrees += treesToAdd;
                treesCounter.textContent = `${currentTrees}`;

                // Ajouter de l'argent basé sur les arbres ajoutés
                let currentMoney = parseInt(moneyCounter.textContent.substring(1));
                currentMoney += treesToAdd * moneyPerTree;
                moneyCounter.textContent = `$${Math.floor(currentMoney)}`;

                // Enregistrer l'état du jeu après chaque mise à jour significative
                saveGameState();
            }

        }, 1000); // Intervalle d'une seconde
    }

    // Mettre à jour l'affichage des arbres par seconde dans le bas de l'écran
    treesPerSecondCounter.textContent = afkTreePerSecond.toFixed(1);
}

// Fonction pour mettre à jour l'affichage des multiplicateurs
function updateMultiplierDisplay() {
    // Transformer complètement la section du bas avec les multiplicateurs
    const statContainer = document.querySelector(".bg-white.px-6.py-2.rounded-full");

    // Vider le contenu existant
    statContainer.innerHTML = "";

    // Créer un conteneur flexible pour tous les stats
    const flexContainer = document.createElement('div');
    flexContainer.className = 'flex items-center space-x-6';

    // Ajouter les trois multiplicateurs et les arbres par seconde

    // 1. Arbres par clic
    const treeClickStat = document.createElement('div');
    treeClickStat.className = 'flex items-center';
    treeClickStat.innerHTML = `
        <span class="text-gray-600 text-sm">Trees/click:</span>
        <span class="font-bold text-green-600 text-lg ml-2">${treePerClick.toFixed(1)}</span>
    `;

    // 2. Argent par arbre
    const moneyTreeStat = document.createElement('div');
    moneyTreeStat.className = 'flex items-center';
    moneyTreeStat.innerHTML = `
        <span class="text-gray-600 text-sm">$/tree:</span>
        <span class="font-bold text-green-600 text-lg ml-2">${moneyPerTree.toFixed(1)}</span>
    `;

    // 3. Arbres par seconde
    const treesPerSecondStat = document.createElement('div');
    treesPerSecondStat.className = 'flex items-center';
    treesPerSecondStat.innerHTML = `
        <span class="text-gray-600 text-sm">Trees/sec:</span>
        <span class="font-bold text-green-600 text-lg ml-2" id="trees-per-second">${afkTreePerSecond.toFixed(1)}</span>
    `;

    // Ajouter tous les éléments au conteneur flexible
    flexContainer.appendChild(treeClickStat);
    flexContainer.appendChild(moneyTreeStat);
    flexContainer.appendChild(treesPerSecondStat);

    // Ajouter le conteneur flexible à la section stats
    statContainer.appendChild(flexContainer);

    // Mettre à jour la référence au compteur d'arbres par seconde
    treesPerSecondCounter = document.getElementById('trees-per-second');
}

// Fonctions pour la persistance des données
function saveGameState() {
    const gameState = {
        trees: parseInt(treesCounter.textContent),
        money: parseInt(moneyCounter.textContent.substring(1)),
        years: parseInt(yearCounter.textContent),
        treePerClick: treePerClick,
        moneyPerTree: moneyPerTree,
        afkTreePerSecond: afkTreePerSecond,
        afkAccumulated: afkAccumulated,
        lastSaved: Date.now(),
        boughtInnovations: []
    };

    // Stocker les noms des innovations qui ont été achetées
    const historyContainer = document.querySelector(".space-y-2.h-48");
    const historyItems = historyContainer.querySelectorAll("div");

    historyItems.forEach(item => {
        if (item.textContent !== "No innovations has been done yet") {
            gameState.boughtInnovations.push(item.textContent);
        }
    });

    localStorage.setItem('treeClicker', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('treeClicker');
    if (!savedState) return false;

    try {
        const gameState = JSON.parse(savedState);

        // Restaurer les compteurs
        treesCounter.textContent = gameState.trees;
        moneyCounter.textContent = `$${gameState.money}`;

        // L'année n'est pas restaurée car cela changerait la logique du jeu
        // et c'est plus fun de recommencer avec une nouvelle limite de temps

        // Restaurer les multiplicateurs
        treePerClick = gameState.treePerClick;
        moneyPerTree = gameState.moneyPerTree;
        afkTreePerSecond = gameState.afkTreePerSecond;
        afkAccumulated = gameState.afkAccumulated || 0;

        // Calculer le nombre d'arbres générés pendant l'absence du joueur
        const currentTime = Date.now();
        const timeDifference = (currentTime - gameState.lastSaved) / 1000; // en secondes

        if (timeDifference > 60 && afkTreePerSecond > 0) { // Si plus d'une minute s'est écoulée
            const treesGenerated = Math.floor(afkTreePerSecond * timeDifference);
            const moneyGenerated = Math.floor(treesGenerated * moneyPerTree);

            if (treesGenerated > 0) {
                // Ajouter les arbres et l'argent générés pendant l'absence
                let currentTrees = parseInt(treesCounter.textContent);
                currentTrees += treesGenerated;
                treesCounter.textContent = `${currentTrees}`;

                let currentMoney = parseInt(moneyCounter.textContent.substring(1));
                currentMoney += moneyGenerated;
                moneyCounter.textContent = `$${currentMoney}`;

                // Informer le joueur de ce qui s'est passé pendant son absence
                setTimeout(() => {
                    alert(`Pendant votre absence (${formatTime(timeDifference)}), vos arbres ont continué à pousser !\n\nVous avez gagné :\n- ${treesGenerated} arbres\n- $${moneyGenerated}`);
                }, 1000);
            }
        }

        return true;
    } catch (error) {
        console.error("Erreur lors du chargement des données sauvegardées:", error);
        return false;
    }
}

// Utilitaire pour formater le temps en heures/minutes/secondes
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${secs}s`;

    return result;
}

// Fonction pour gérer les événements de visibilité de page
function handleVisibilityChange() {
    if (document.hidden) {
        // La page est cachée, sauvegarder l'état et arrêter l'intervalle
        saveGameState();
        if (window.afkInterval) {
            clearInterval(window.afkInterval);
            window.afkInterval = null;
        }
    } else {
        // La page est visible à nouveau, redémarrer le système AFK
        lastTimestamp = Date.now();
        manageAfk();
    }
}

const plantButton = document.getElementById('plant-button');
const treesCounter = document.getElementById('trees-counter');
const moneyCounter = document.getElementById('money-counter');
const yearCounter = document.getElementById('years-counter');
let treesPerSecondCounter = document.querySelector(".bg-white.px-6.py-2 .font-bold");
const innovationsList = document.getElementById('innovations-list');

// Initialisation des variables de jeu avec des valeurs par défaut
let parsedJson;
let treePerClick = 1;
let moneyPerTree = 1;
let afkTreePerSecond = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Essayer de charger les données sauvegardées d'abord
    const dataLoaded = loadGameState();

    // Démarrer le compte à rebours des années
    reduceYears();

    // Charger les innovations depuis le fichier JSON
    parseJson()
        .then(donnees => {
            parsedJson = donnees;

            // Si des innovations ont été achetées (données chargées), les filtrer
            if (dataLoaded) {
                // Récupérer les noms des innovations achetées depuis l'historique
                const historyContainer = document.querySelector(".space-y-2.h-48");
                const historyItems = historyContainer.querySelectorAll("div");

                const boughtNames = Array.from(historyItems)
                    .filter(item => item.textContent !== "No innovations has been done yet")
                    .map(item => {
                        // Extraire juste le nom de l'entrée "Nom - $Coût"
                        const nameWithCost = item.textContent;
                        return nameWithCost.split(' - ')[0];
                    });

                // Filtrer les innovations déjà achetées
                parsedJson = parsedJson.filter(innovation =>
                    !boughtNames.includes(innovation.Name)
                );
            }

            // Afficher les innovations disponibles
            showInnovations();

            // Mettre en place l'affichage des multiplicateurs
            updateMultiplierDisplay();

            // Démarrer la gestion AFK
            manageAfk();
        })
        .catch(erreur => {
            console.error("Erreur lors de la récupération du fichier JSON:", erreur);
        });

    // Configurer la sauvegarde automatique toutes les minutes
    setInterval(saveGameState, 60000);

    // Ajouter des gestionnaires d'événements pour la visibilité de la page
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sauvegarder avant que la page ne soit fermée
    window.addEventListener('beforeunload', saveGameState);
});

plantButton.addEventListener('click', () => {
    increaseTreeCount();
    increaseMoney();
});