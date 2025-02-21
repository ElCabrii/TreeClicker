let currentForestImage = 'https://raw.githubusercontent.com/ElCabrii/TreeClicker/refs/heads/main/assets/images/forest.jpg';
let gameEnded = false;
let parsedJson;
let treePerClick = 1;
let moneyPerTree = 1;
let afkTreePerSecond = 0;

// DOM Elements
const plantButton = document.getElementById('plant-button');
const treesCounter = document.getElementById('trees-counter');
const moneyCounter = document.getElementById('money-counter');
const yearCounter = document.getElementById('years-counter');
const idleCounter = document.getElementById('trees-per-second');
let statsContainer = null;

function initializeStatsContainer() {
    const container = document.createElement('div');
    container.className = 'bg-white px-6 py-2 rounded-full shadow-md mb-8';
    container.innerHTML = `
        <div class="flex items-center space-x-6">
            <div class="flex items-center">
                <span class="text-gray-600 text-sm">Trees/click:</span>
                <span class="font-bold text-green-600 text-lg ml-2" data-stat="trees-per-click">1.0</span>
            </div>
            <div class="flex items-center">
                <span class="text-gray-600 text-sm">$/tree:</span>
                <span class="font-bold text-green-600 text-lg ml-2" data-stat="money-per-tree">1.0</span>
            </div>
            <div class="flex items-center">
                <span class="text-gray-600 text-sm">Idle:</span>
                <span class="font-bold text-green-600 text-lg ml-2" id="trees-per-second">0.0</span>
            </div>
        </div>
    `;
    
    const gameBackground = document.getElementById('game-background');
    gameBackground.appendChild(container);
    statsContainer = container;
}

function reduceYears() {
    let yearsRemaining = parseInt(yearCounter.textContent);

    const countdownInterval = setInterval(() => {
        if (gameEnded) {
            clearInterval(countdownInterval);
            return;
        }

        yearsRemaining -= 1;
        yearCounter.textContent = `${yearsRemaining} years`;

        if (yearsRemaining <= 0) {
            clearInterval(countdownInterval);
            yearCounter.textContent = "0 years";
            yearCounter.classList.remove('text-green-600');
            yearCounter.classList.add('text-red-600');
            endGame(false);
        }
    }, 10000);
}

function increaseTreeCount() {
    let treeCount = parseInt(treesCounter.textContent);
    treeCount += treePerClick;
    treesCounter.textContent = `${treeCount}`;
}

function increaseMoney() {
    let moneyCount = parseInt(moneyCounter.textContent.substring(1));
    moneyCount += moneyPerTree * treePerClick;
    moneyCounter.textContent = `$${moneyCount}`;
}

function parseJson() {
    return fetch('innovations.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return response.json();
        })
        .catch(error => {
            console.error("Problem fetching file:", error);
            throw error;
        });
}

function showInnovations() {
    if (!parsedJson) {
        console.error("Innovation data not available");
        return;
    }

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

        // Add multiplier information
        const changes = innovation.Changes;
        ['treePerClick', 'moneyPerTree', 'afkTreePerSecond'].forEach(stat => {
            if (changes[stat] !== 1) {
                const element = document.createElement('p');
                element.className = 'text-sm text-gray-600';
                element.textContent = `${stat} x${changes[stat]}`;
                innovationBlock.appendChild(element);
            }
        });

        const cost = document.createElement('p');
        cost.className = 'text-sm text-gray-600 font-bold';
        cost.textContent = `Cost: $${innovation.Cost}`;
        innovationBlock.appendChild(cost);

        innovationsContainer.appendChild(innovationBlock);
        innovationBlock.addEventListener('click', () => buyInnovation(innovation));
    });
}

function updateBackgroundImage(newImage) {
    const gameBackground = document.getElementById('game-background');
    if (gameBackground) {
        currentForestImage = newImage;
        gameBackground.style.backgroundImage = `url('${newImage}')`;
    }
}

function buyInnovation(innovation) {
    const currentMoney = parseInt(moneyCounter.textContent.substring(1));

    if (currentMoney >= innovation.Cost) {
        moneyCounter.textContent = `$${currentMoney - innovation.Cost}`;
        applyInnovation(innovation);
        moveInnovationToHistory(innovation);

        if (innovation.Image) {
            updateBackgroundImage(innovation.Image);
        }

        const remainingInnovations = document.querySelectorAll("#innovations-list .space-y-4 > div").length;
        if (remainingInnovations === 0) {
            endGame(true);
        }
    } else {
        alert(`Not enough money to buy "${innovation.Name}". You need $${innovation.Cost - currentMoney} more.`);
    }
}

function endGame(won) {
    gameEnded = true;
    plantButton.disabled = true;
    plantButton.classList.add('opacity-50', 'cursor-not-allowed');

    const gameBackground = document.getElementById('game-background');
    if (won) {
        gameBackground.classList.add('bg-green-100');
        setTimeout(() => {
            alert('Congratulations! You have saved the planet by researching all innovations in time!');
            if (confirm('Would you like to play again?')) location.reload();
        }, 500);
    } else {
        gameBackground.classList.add('bg-red-100');
        setTimeout(() => {
            alert('Game Over! Time has run out before completing all research.');
            if (confirm('Would you like to try again?')) location.reload();
        }, 500);
    }
}

function applyInnovation(innovation) {
    if (innovation.Changes.treePerClick) treePerClick *= innovation.Changes.treePerClick;
    if (innovation.Changes.moneyPerTree) moneyPerTree *= innovation.Changes.moneyPerTree;
    if (innovation.Changes.afkTreePerSecond) {
        afkTreePerSecond += innovation.Changes.afkTreePerSecond;
        manageAfk();
    }
    updateMultiplierDisplay();
}

function moveInnovationToHistory(innovation) {
    const innovationsContainer = document.querySelector("#innovations-list .space-y-4");
    const innovationToRemove = innovationsContainer.querySelector(`[data-name="${innovation.Name}"]`);
    if (innovationToRemove) innovationsContainer.removeChild(innovationToRemove);

    const historyContainer = document.querySelector(".space-y-2.h-48");
    const noInnovationMessage = historyContainer.querySelector("div");
    if (noInnovationMessage?.textContent === "No innovations has been done yet") {
        historyContainer.removeChild(noInnovationMessage);
    }

    const historyItem = document.createElement('div');
    historyItem.className = 'text-sm text-gray-600';
    historyItem.textContent = `${innovation.Name} - $${innovation.Cost}`;
    historyContainer.appendChild(historyItem);

    parsedJson = parsedJson.filter(item => item.Name !== innovation.Name);
}

function updateMultiplierDisplay() {
    if (!statsContainer) return;
    
    const treesPerClickStat = statsContainer.querySelector('[data-stat="trees-per-click"]');
    const moneyPerTreeStat = statsContainer.querySelector('[data-stat="money-per-tree"]');
    const treesPerSecondStat = statsContainer.querySelector('#trees-per-second');

    if (treesPerClickStat) treesPerClickStat.textContent = treePerClick.toFixed(1);
    if (moneyPerTreeStat) moneyPerTreeStat.textContent = moneyPerTree.toFixed(1);
    if (treesPerSecondStat) treesPerSecondStat.textContent = afkTreePerSecond.toFixed(1);
}

// Remove the idleCounter constant since we'll get it dynamically when needed
function manageAfk() {
    if (window.afkInterval) clearInterval(window.afkInterval);
    
    if (afkTreePerSecond > 0) {
        window.afkInterval = setInterval(() => {
            if (gameEnded) {
                clearInterval(window.afkInterval);
                return;
            }
            
            let currentTrees = parseInt(treesCounter.textContent);
            let currentMoney = parseInt(moneyCounter.textContent.substring(1));
            
            let treeIncrease = Math.floor(afkTreePerSecond);
            currentTrees += treeIncrease;
            currentMoney += Math.floor(treeIncrease * moneyPerTree);
            
            treesCounter.textContent = currentTrees;
            moneyCounter.textContent = `$${currentMoney}`;
        }, 1000);
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    reduceYears();
    initializeStatsContainer();
    parseJson()
        .then(data => {
            parsedJson = data;
            showInnovations();
            updateMultiplierDisplay();
            manageAfk();
        })
        .catch(error => console.error("Error loading JSON:", error));
});

plantButton.addEventListener('click', () => {
    if (!gameEnded) {
        increaseTreeCount();
        increaseMoney();
    }
});