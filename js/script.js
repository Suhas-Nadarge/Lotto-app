
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const BASE_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin';

// Set today's date as the default value of the date input field
document.addEventListener('DOMContentLoaded', function () {
    const dateInput = document.getElementById('dateInput');
    dateInput.value = getTodayDatetimeString();
});


document.getElementById('lottoForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent form from submitting the traditional way
    var date = new Date(document.getElementById('dateInput').value);

    let nextDrawDate = getNextLottoDraw(date);


    try {
        const [historicalPrice, currentPrice] = await Promise.all([
            getBitcoinPriceOnDate(nextDrawDate),
            getCurrentBitcoinPrice()
        ]);
        // Remove "No record" row if it exists
        if (historicalPrice && currentPrice) {
            removeNoRecordRow();
            const investedAmount = 100; // EUR 100
            const bitcoinAmount = investedAmount / historicalPrice; // Amount of Bitcoin bought on draw date
            const currentValue = bitcoinAmount * currentPrice; // Current value of the Bitcoin amount


            // Add the result to the table with a transition effect
            const tableBody = document.querySelector('#resultsTable tbody');
            const newRow = document.createElement('tr');
            const drawDateCell = document.createElement('td');
            const bitcoinValueCell = document.createElement('td');

            var date = new Date(nextDrawDate);

            // // Format the date
            var day = padToTwoDigits(date.getDate());
            var month = padToTwoDigits(date.getMonth() + 1); // Months are zero-indexed
            var year = date.getFullYear();

            // Extract time components
            var hours = padToTwoDigits(date.getHours());
            var minutes = padToTwoDigits(date.getMinutes());

            // Combine date and time into the desired format
            var formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;

            drawDateCell.textContent = formattedDate.toString();
            bitcoinValueCell.textContent = '€' + currentValue.toFixed(2);
            newRow.appendChild(drawDateCell);
            newRow.appendChild(bitcoinValueCell);
            tableBody.appendChild(newRow);

            // Apply animation
            newRow.classList.add('animated-row');
        }
    } catch (error) {
        console.error('Error fetching Bitcoin prices:', error);
    }
});

function padToTwoDigits(num) {
    return num.toString().padStart(2, '0');
}

function getTodayDatetimeString() {
    // had to set 1 month old date, as api had some issues with providing data with future and current months
    const today = new Date(Date.now() - 30 * 86400000);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function removeNoRecordRow() {
    const tableBody = document.querySelector('#resultsTable tbody');
    var noRecordsElements = tableBody.getElementsByClassName('no-records');

    // Check if any elements exist with class "no-records"
    if (noRecordsElements.length > 0) {
        // Remove the first element with class "no-records" (assuming there's only one)
        noRecordsElements[0].remove();
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
    const url = `${BASE_URL}/history?date=${formattedDate}`;
    try {
        const data = await fetchWithErrorHandling(url);
        return data.market_data.current_price.eur;
    } catch (error) {
        console.error(`Error fetching Bitcoin price on date ${formattedDate}:`, error);
        displayErrorMessage('Error fetching Bitcoin prices. Please try again later.');
        return null;
    }
}

async function getCurrentBitcoinPrice() {
    const url = BASE_URL;
    try {
        const data = await fetchWithErrorHandling(url);
        return data.market_data.current_price.eur;
    } catch (error) {
        console.error('Error fetching current Bitcoin price:', error);
        displayErrorMessage('Error fetching current Bitcoin prices. Please try again later.');
        return null;
    }
}

function formatDateForAPI(date) {
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

async function fetchWithErrorHandling(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        displayErrorMessage(`Error fetching data: ${error.message}`);
        throw error;
    }
}

function displayErrorMessage(message) {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = message;
}
