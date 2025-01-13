let transactionCounter = 1;

// Initialize JSON data
const dealData = {
  operations: [
    { id: 1, gives: true, status: 'Approved by Client', code: 'TRNS - 1', order: 1, color: "#B78AF0", isEmpty: false, text: 'Cryptocurrency' },
    { id: 2, gives: false, status: 'New', code: 'TRNS - 2', order: 2, color: "#6AE1A1", isEmpty: false, text: 'Cash (Ukraine)' },
    { id: 3, gives: true, status: 'Rate received', code: 'TRNS - 3', order: 3, color: "#6AE1A1", isEmpty: false, text: 'Cash (World)' },
    { id: 4, gives: false, status: 'New', code: 'TRNS - 4', order: 4, color: "#6AE1A1", isEmpty: false, text: 'Bank card' },
  ],
};

function addTransaction(side) {
  const container = document.getElementById(side);

  // Create new transaction object and add it to JSON
  const newTransaction = {
    id: transactionCounter,
    gives: side === "client-gives",
    status: 'New',
    code: `TRNS - ${transactionCounter}`,
    order: transactionCounter,
    color: "#CCCCCC",
    isEmpty: false,
    text: side === "client-gives" ? "New Give" : "New Receive",
  };
  dealData.operations.push(newTransaction);

  const transaction = createTransactionElement(side, transactionCounter);
  const mirroredTransaction = createTransactionElement(
    side === "client-gives" ? "client-receives" : "client-gives",
    transactionCounter,
    true
  );

  container.appendChild(transaction);
  document.getElementById(side === "client-gives" ? "client-receives" : "client-gives").appendChild(mirroredTransaction);

  transactionCounter++;
}

function deleteTransaction(id) {
  // Remove transaction from JSON
  dealData.operations = dealData.operations.filter((op) => op.id !== id);

  // Remove the transaction and its mirrored version from DOM
  const transaction = document.getElementById(`transaction-${id}`);
  const mirroredTransaction = document.getElementById(`mirror-transaction-${id}`);

  if (transaction) transaction.remove();
  if (mirroredTransaction) mirroredTransaction.remove();

  updateOrderNumbers();
}

function createTransactionElement(side, id, isMirror = false) {
  const transaction = document.createElement("div");
  transaction.classList.add("transaction");
  if (isMirror) transaction.classList.add("mirror");
  transaction.id = `${isMirror ? "mirror-" : ""}transaction-${id}`;
  transaction.draggable = !isMirror;

  transaction.innerHTML = `
    <div class="details">
      <div class="title">Transaction</div>
      <div class="subtitle">${side === "client-gives" ? "Gives" : "Receives"} - ${id}</div>
      <div class="badge">New</div>
    </div>
    <div class="order-number"><span>${id}</span></div>
    ${
    !isMirror
      ? `<button onclick="deleteTransaction(${id})" class="delete-btn">Delete</button>`
      : ""
  }
  `;

  if (!isMirror) {
    transaction.addEventListener("dragstart", onDragStart);
    transaction.addEventListener("dragover", onDragOver);
    transaction.addEventListener("drop", onDrop);
    transaction.addEventListener("dragend", onDragEnd);
  }

  return transaction;
}

let currentDrag = null;

function onDragStart(event) {
  currentDrag = event.target;
  event.dataTransfer.setData("text/plain", currentDrag.id);
  currentDrag.style.opacity = 0.5;
}

function onDragOver(event) {
  event.preventDefault();
  const target = event.target.closest(".transaction");
  if (target && target !== currentDrag) {
    const rect = target.getBoundingClientRect();
    const isBelow = event.clientY > rect.top + rect.height / 2;
    const container = target.parentElement;

    if (isBelow) {
      container.insertBefore(currentDrag, target.nextSibling);
    } else {
      container.insertBefore(currentDrag, target);
    }
  }
}

function onDrop(event) {
  event.preventDefault();

  const transactionId = event.dataTransfer.getData("text/plain");
  const draggedTransaction = document.getElementById(transactionId);

  const containers = document.querySelectorAll(".side-container");

  containers.forEach((container) => {
    if (container.contains(draggedTransaction)) {
      const mirroredId = `mirror-${transactionId}`;
      const mirroredTransaction = document.getElementById(mirroredId);

      if (mirroredTransaction) {
        const transactions = Array.from(container.children).filter(
          (child) =>
            child.classList.contains("transaction") &&
            !child.classList.contains("mirror")
        );

        const mirroredContainer = document.getElementById(
          container.id === "client-gives" ? "client-receives" : "client-gives"
        );

        const currentIndex = transactions.indexOf(draggedTransaction);
        const mirroredTransactions = Array.from(
          mirroredContainer.children
        ).filter((child) => child.classList.contains("mirror"));

        mirroredContainer.insertBefore(
          mirroredTransaction,
          mirroredTransactions[currentIndex] || null
        );
      }
    }
  });

  updateOrderNumbers();
}

function onDragEnd(event) {
  event.target.style.opacity = 1;
  updateOrderNumbers();
}

function updateOrderNumbers() {
  const containers = Array.from(document.querySelectorAll(".side-container"));

  containers.forEach((container) => {
    const transactions = Array.from(container.children).filter(
      (child) =>
        child.classList.contains("transaction") &&
        !child.classList.contains("mirror")
    );

    transactions.forEach((transaction, index) => {
      const orderNumber = transaction.querySelector(".order-number span");
      orderNumber.textContent = index + 1;

      const id = parseInt(transaction.id.replace("transaction-", ""));
      const mirroredTransaction = document.getElementById(`mirror-transaction-${id}`);

      if (mirroredTransaction) {
        const mirroredOrderNumber = mirroredTransaction.querySelector(
          ".order-number span"
        );
        mirroredOrderNumber.textContent = index + 1;
      }
    });
  });
}
