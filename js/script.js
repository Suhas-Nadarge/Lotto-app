let noRecords =  true;
document.getElementById('lottoForm').addEventListener('submit', async function(event) {
    noRecords = false;
    event.preventDefault(); // Prevent form from submitting the traditional way

    const inputDate = new Date(document.getElementById('dateInput').value);
    const nextDrawDate = getNextLottoDraw(inputDate);

    try {
        const [historicalPrice, currentPrice] = await Promise.all([
            getBitcoinPriceOnDate(nextDrawDate),
            getCurrentBitcoinPrice()
        ]);
        // Remove "No record" row if it exists
        removeNoRecordRow();
        const investedAmount = 100; // EUR 100
        const bitcoinAmount = investedAmount / historicalPrice; // Amount of Bitcoin bought on draw date
        const currentValue = bitcoinAmount * currentPrice; // Current value of the Bitcoin amount

        // Add the result to the table with a transition effect
        const tableBody = document.querySelector('#resultsTable tbody');
        const newRow = document.createElement('tr');
        const drawDateCell = document.createElement('td');
        const bitcoinValueCell = document.createElement('td');

        drawDateCell.textContent = nextDrawDate.toString();
        bitcoinValueCell.textContent = currentValue.toFixed(2) + ' EUR';

        newRow.appendChild(drawDateCell);
        newRow.appendChild(bitcoinValueCell);
        tableBody.appendChild(newRow);

        // Apply animation
        newRow.classList.add('animated-row');
        newRow.classList.add('visible');
    } catch (error) {
        console.error('Error fetching Bitcoin prices:', error);
    }
});

function removeNoRecordRow() {
    const tableBody = document.querySelector('#resultsTable tbody');
    const noRecordRow = tableBody.querySelector('.no-record');
    if (noRecordRow) {
        tableBody.removeChild(noRecordRow);
    }
}

function getNextLottoDraw(inputDate = new Date()) {
    const nextDraws = [];
    const daysOfWeek = { WEDNESDAY: 3, SATURDAY: 6 };
    const drawTime = { hours: 20, minutes: 0, seconds: 0 }; // 8 PM

    // Create two potential next draw dates
    Object.values(daysOfWeek).forEach(day => {
        const nextDraw = new Date(inputDate);
        nextDraw.setHours(drawTime.hours, drawTime.minutes, drawTime.seconds, 0);
        nextDraw.setDate(nextDraw.getDate() + ((day + 7 - nextDraw.getDay()) % 7));

        if (nextDraw <= inputDate) {
            nextDraw.setDate(nextDraw.getDate() + 7);
        }
        nextDraws.push(nextDraw);
    });

    // Return the earliest of the two potential draw dates
    return nextDraws.sort((a, b) => a - b)[0];
}

async function getBitcoinPriceOnDate(date) {
    const formattedDate = formatDateForAPI(date);
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formattedDate}`);
    const data = await response.json();
    return data.market_data.current_price.eur;
}

async function getCurrentBitcoinPrice() {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin');
    const data = await response.json();
    return data.market_data.current_price.eur;
}

function formatDateForAPI(date) {
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}
