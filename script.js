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
    let treeCount = parseInt(treesCounter.textContent) + 1;

    treesCounter.textContent = `${treeCount}`;
}

function increaseMoney() {
    let moneyCount = parseInt(moneyCounter.textContent.substring(1)) + 1;

    moneyCounter.textContent = `$${moneyCount}`;
}

const plantButton = document.getElementById('plant-button');
const treesCounter = document.getElementById('trees-counter');
const moneyCounter = document.getElementById('money-counter');
const yearCounter = document.getElementById('years-counter');

document.addEventListener('DOMContentLoaded', reduceYears);



plantButton.addEventListener('click', () => {
    increaseTreeCount();
    increaseMoney();
});