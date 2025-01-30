const API_BASE_URL = 'http://127.0.0.1:8000';

let currentDealId = null;
let selectedOptionId = null;

const createDealForm = document.getElementById('createDealForm');
const transactionList = document.getElementById('transactionList');
const createDealNav = document.getElementById('createDealNav');
const manageTransactionsNav = document.getElementById('manageTransactionsNav');
const alertContainer = document.getElementById('alertContainer');
const createClientGives = document.getElementById('createClientGives');
const createClientReceives = document.getElementById('createClientReceives');
const dealList = document.getElementById('dealList');

// Toggle sections
function toggleSections(activeNav) {
  document.querySelectorAll('.navbar a').forEach(nav => nav.classList.remove('active'));
  activeNav.classList.add('active');

  document.getElementById('dealCreationSection').style.display =
    activeNav === createDealNav ? 'block' : 'none';
  document.getElementById('dealManagementSection').style.display =
    activeNav === manageTransactionsNav ? 'block' : 'none';

  if (activeNav === manageTransactionsNav) fetchTransactions();
}

createDealNav.addEventListener('click', () => toggleSections(createDealNav));
manageTransactionsNav.addEventListener('click', () => toggleSections(manageTransactionsNav));

// Show alerts
function showAlert(message, type = 'danger') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  alertContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

// Create deal
document.getElementById('createDealBtn').addEventListener('click', async () => {
  const dealName = prompt('Enter deal name:');
  if (!dealName) return;

  try {
    const response = await fetch(`${API_BASE_URL}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: dealName }),
    });

    if (!response.ok) throw new Error('Failed to create deal');
    const data = await response.json();
    currentDealId = data.id;
    selectedOptionId = null;
    showAlert('Deal created successfully!', 'success');
    manageTransactionsNav.style.display = 'block';
    toggleSections(manageTransactionsNav);
    fetchDeals();
  } catch (err) {
    showAlert(err.message);
  }
});

// Fetch and display deals
async function fetchDeals() {
  try {
    const response = await fetch(`${API_BASE_URL}/deals`);
    const deals = await response.json();
    dealList.innerHTML = '';
    deals.forEach(deal => {
      const card = document.createElement('div');
      card.className = 'card mb-3';
      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${deal.name}</h5>
          <button class="btn btn-primary" onclick="selectDeal(${deal.id})">Manage</button>
        </div>
      `;
      dealList.appendChild(card);
    });
  } catch {
    showAlert('Failed to fetch deals');
  }
}

// Select a deal
function selectDeal(dealId) {
  currentDealId = dealId;
  selectedOptionId = null;
  toggleSections(manageTransactionsNav);
  fetchTransactions();
}

// Fetch and display transactions
async function fetchTransactions() {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions?deal_id=${currentDealId}`);
    const transactions = await response.json();
    transactionList.innerHTML = '';
    transactions.forEach(addTransactionToList);
  } catch {
    showAlert('Failed to fetch transactions');
  }
}

// Add transaction to list
function addTransactionToList(transaction) {
  const container = transaction.type === 'Client Gives' ? 'success' : 'danger';
  const card = document.createElement('div');
  card.className = `compact-transaction-card ${container}`;
  card.dataset.transactionId = transaction.id;

  card.innerHTML = `
    <div class="compact-status-indicator ${transaction.type === 'Client Gives' ? 'success' : 'danger'}"></div>
    <div class="transaction-info">
      <div class="compact-title">${transaction.name}</div>
      <div class="compact-transaction-info">${transaction.type}</div>
      <div>${transaction.amount} ${transaction.currency}</div>
      <div>
        <button class="btn btn-sm btn-primary" onclick="editTransaction(${transaction.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${transaction.id})">Delete</button>
      </div>
    </div>
  `;
  transactionList.appendChild(card);
}

// Edit transaction
async function editTransaction(transactionId) {
  const transaction = await fetchTransactionById(transactionId);
  const card = document.querySelector(`[data-transaction-id="${transactionId}"]`);

  card.querySelector('.compact-title').setAttribute('contenteditable', 'true');
  card.querySelector('.compact-transaction-info').setAttribute('contenteditable', 'true');
  card.querySelector('.transaction-info').setAttribute('contenteditable', 'true');
  card.querySelector('button').style.display = 'none';

  const saveButton = document.createElement('button');
  saveButton.className = 'btn btn-sm btn-success';
  saveButton.innerText = 'Save';
  saveButton.onclick = async () => {
    const updatedTitle = card.querySelector('.compact-title').innerText;
    const updatedInfo = card.querySelector('.compact-transaction-info').innerText;

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedTitle,
          type: updatedInfo,
        }),
      });
      if (!response.ok) throw new Error('Failed to update transaction');
      showAlert('Transaction updated successfully!', 'success');
      fetchTransactions();
    } catch (err) {
      showAlert(err.message);
    }
  };

  card.querySelector('.transaction-info').appendChild(saveButton);
}

// Fetch single transaction
async function fetchTransactionById(transactionId) {
  const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`);
  return await response.json();
}

// Delete transaction
async function deleteTransaction(transactionId) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
    showAlert('Transaction deleted successfully!', 'success');
    fetchTransactions();
  } catch (err) {
    showAlert(err.message);
  }
}

// Create transactions (Client Gives/Receives) with currency dropdown
function showCurrencyOptions(type) {
  const currencies = ['USD', 'EUR', 'RON'];
  const currencyButtons = currencies.map(currency => {
    return `<button class="btn btn-secondary" onclick="createTransaction('${type}', '${currency}')">${currency}</button>`;
  }).join('');

  const dropdown = document.createElement('div');
  dropdown.className = 'currency-dropdown';
  dropdown.innerHTML = currencyButtons;

  document.querySelector(`#create${type}`).appendChild(dropdown);
}

createClientGives.addEventListener('click', () => showCurrencyOptions('Client Gives'));
createClientReceives.addEventListener('click', () => showCurrencyOptions('Client Receives'));

// Create transactions
async function createTransaction(type, currency) {
  const amount = Math.floor(Math.random() * 1000) + 1; // Random amount for now

  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        option_id: selectedOptionId || 1, // Replace with actual selected option logic
        name: `${type} Transaction`,
        type,
        amount,
        currency,
      }),
    });

    if (!response.ok) throw new Error('Failed to create transaction');
    const transaction = await response.json();
    addTransactionToList(transaction);
    showAlert('Transaction created successfully!', 'success');
  } catch (err) {
    showAlert(err.message);
  }
}

// Initialization
fetchDeals();
