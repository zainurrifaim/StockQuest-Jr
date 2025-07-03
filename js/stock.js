// js/stock.js

// A list of all available stocks with more details for a richer experience
const initialStocks = [
    {
        id: 'TECH',
        name: 'Innovate Corp',
        ticker: 'INVT',
        price: 150,
        history: [],
        industry: 'Technology',
        change: 0, // NEW: To track daily price change
        description: 'A leading technology company known for its innovative software solutions and cutting-edge artificial intelligence research.'
    },
    {
        id: 'HEALTH',
        name: 'Vitality Inc',
        ticker: 'VITA',
        price: 120,
        history: [],
        industry: 'Healthcare',
        change: 0,
        description: 'A major pharmaceutical firm that develops and markets life-saving drugs and medical devices worldwide.'
    },
    {
        id: 'ENERGY',
        name: 'Power Grid Co',
        ticker: 'GRID',
        price: 80,
        history: [],
        industry: 'Energy',
        change: 0,
        description: 'A large utility company that generates and distributes electricity to millions of homes and businesses.'
    },
    {
        id: 'FIN',
        name: 'Secure Bank',
        ticker: 'SBNK',
        price: 200,
        history: [],
        industry: 'Finance',
        change: 0,
        description: 'A trusted financial institution offering a wide range of banking, investment, and insurance services.'
    },
    {
        id: 'RETAIL',
        name: 'MegaMart',
        ticker: 'MMRT',
        price: 60,
        history: [],
        industry: 'Retail',
        change: 0,
        description: 'A massive chain of superstores that sells everything from groceries to electronics at competitive prices.'
    },
    {
        id: 'AUTO',
        name: 'AutoMakers',
        ticker: 'AUTO',
        price: 180,
        history: [],
        industry: 'Automotive',
        change: 0,
        description: 'A global car manufacturer famous for its reliable vehicles and its pioneering work in electric cars.'
    }
];

let stocks = [];

// Initializes stocks with a deep copy and sets initial history
function initializeStocks() {
    stocks = JSON.parse(JSON.stringify(initialStocks));
    stocks.forEach(stock => {
        stock.history = [{ day: 0, price: stock.price }];
        stock.change = 0; // Ensure change is reset
    });
}

// Gets the current state of all stocks
function getStocks() {
    return stocks;
}

// Gets a single stock by its ID
function getStockById(id) {
    return stocks.find(stock => stock.id === id);
}

// Updates the price of a stock and records its change and history
function updateStockPrice(id, newPrice) {
    const stock = getStockById(id);
    if (stock) {
        const oldPrice = stock.price;
        stock.price = Math.max(1, newPrice); // Price cannot go below $1
        stock.change = stock.price - oldPrice; // NEW: Calculate and store the change
        stock.history.push({ day: null, price: stock.price }); // Day will be set in main.js
    }
}

export { initializeStocks, getStocks, getStockById, updateStockPrice };