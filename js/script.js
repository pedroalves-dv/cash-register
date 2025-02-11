// // V.4 hopefully the last (best one so far, calculation almost works, change not deducted fropm units amount)

// Constants and Elements
const display = document.getElementById("cash");
const priceBox = document.getElementById("price-box"); // Reference to price box
const priceDisplay = document.querySelector(".price-amount");
const changeDueDisplay = document.querySelector(".change-amount");
const registerAmountDisplay = document.querySelector(".register-amount");
const unitsGrid = document.getElementById("units-grid");
const toggleButton = document.getElementById("toggle-price-btn");
const alertScreen = document.querySelector(".alert-screen");

// Initial values
let price = 1.87; // Static price
let cid = [
  ["PENNY", 1.01],
  ["NICKEL", 2.05],
  ["DIME", 3.1],
  ["QUARTER", 4.25],
  ["ONE", 90.0],
  ["FIVE", 55.0],
  ["TEN", 20.0],
  ["TWENTY", 60.0],
  ["ONE HUNDRED", 100.0],
];

// Deep copy of initial register values
const initialCid = JSON.parse(JSON.stringify(cid));
let currentRegister = JSON.parse(JSON.stringify(cid));

// State for selection
let isPriceSelected = false;

// Initialize display values
priceDisplay.textContent = `$${price.toFixed(2)}`;
updateRegisterDisplay();

// Reset the register to initial state
function resetRegister() {
  currentRegister = JSON.parse(JSON.stringify(initialCid));
  updateRegisterDisplay();
  changeDueDisplay.textContent = `$0.00`;
  typeMessage(alertScreen, "Register has been reset.");
  // clearDisplay();
}

function typeMessage(element, message, speed = 20) {
  element.textContent = "";
  let i = 0;
  function type() {
    if (i < message.length) {
      element.textContent += message.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

// Attach reset button event
document.getElementById("reset-btn").addEventListener("click", resetRegister);

// Toggle price selection and input mode
toggleButton.addEventListener("click", function () {
  isPriceSelected = !isPriceSelected; // Toggle the state

  if (isPriceSelected) {
    // Allow price editing
    priceDisplay.style.color = "blue";
    toggleButton.textContent = "Set";
    clearDisplay();
    typeMessage(alertScreen, "Enter new price and press 'Set' to confirm.");
    // alertScreen.textContent = "Enter new price and press 'Set' to confirm.";
    
  } else {
    // Set new price and return to cash entry mode
    price = parseFloat(display.value);
    priceDisplay.textContent = `$${price.toFixed(2)}`;
    priceDisplay.style.color = "#333"; 
    toggleButton.textContent = "New Price";
    typeMessage(alertScreen, "New price has been set.");
    clearDisplay();
  
  }
});

// Keypad input handler
function appendToDisplay(value) {
  if (isPriceSelected) {
    updatePrice(value);
  } else {
    if (display.value === "0") display.value = value;
    else display.value += value;
  }
}

// Update the price when editing is enabled
function updatePrice(value) {
  if (display.value === "0") display.value = value;
  else display.value += value;
}

// Clear display
function clearDisplay() {
  if (isPriceSelected) {
    display.value = 0;
    priceDisplay.textContent = `$0.00`;
  } else {
    display.value = "0";
  }
}

// Calculate change and update register amounts
function calculateChange() {
  const cash = parseFloat(display.value);
  if (isNaN(cash) || cash <= 0) {
    typeMessage(alertScreen, "Please enter a valid amount.");
    alertScreen.classList.add("error");

    return;
  }

  const changeDue = roundToTwoDecimals(cash - price);
  if (changeDue < 0) {
    typeMessage(alertScreen, "Customer does not have enough money. Missing: $" + Math.abs(changeDue).toFixed(2));
    alertScreen.classList.add("error");

    return;
  }

  const paymentIntoRegister = cash;
  addToRegister(paymentIntoRegister);

  const changeGiven = deductChangeFromRegister(changeDue);
  changeDueDisplay.textContent = `$${changeGiven.toFixed(2)}`;
  typeMessage(alertScreen, "Change has been calculated and deducted from the register.");
  alertScreen.classList.remove("error");
  updateRegisterDisplay();
  clearDisplay();
}

// Distribute payment into register from largest to smallest units
function addToRegister(amount) {
  for (let i = currentRegister.length - 1; i >= 0; i--) {
    let [unit] = currentRegister[i];
    let unitValue = getUnitValue(unit);

    let amountToAdd = Math.floor(amount / unitValue) * unitValue;
    currentRegister[i][1] += amountToAdd;
    amount = roundToTwoDecimals(amount - amountToAdd);

    updateUnitAmount(unit, currentRegister[i][1]);
    if (amount <= 0) break;
  }
}

// Deduct change from register, distributing from largest to smallest units
function deductChangeFromRegister(changeDue) {
  let remainingChange = roundToTwoDecimals(changeDue);
  for (let i = currentRegister.length - 1; i >= 0; i--) {
    let [unit, amountInRegister] = currentRegister[i];
    let unitValue = getUnitValue(unit);

    let amountToDeduct = Math.min(
      amountInRegister,
      Math.floor(remainingChange / unitValue) * unitValue
    );
    currentRegister[i][1] -= amountToDeduct;
    remainingChange = roundToTwoDecimals(remainingChange - amountToDeduct);

    updateUnitAmount(unit, currentRegister[i][1]);
    if (remainingChange <= 0) break;
  }
  return roundToTwoDecimals(changeDue - remainingChange);
}

// Update displayed unit amounts
function updateUnitAmount(unitName, amount) {
  const labelMap = {
    PENNY: "Penny",
    NICKEL: "Nickel",
    DIME: "Dime",
    QUARTER: "Quarter",
    ONE: "1",
    FIVE: "5",
    TEN: "10",
    TWENTY: "20",
    "ONE HUNDRED": "100",
  };
  const labelText = labelMap[unitName];
  const unitDiv = Array.from(unitsGrid.getElementsByClassName("unit")).find(
    (unit) => unit.querySelector(".label").textContent === labelText
  );

  if (unitDiv)
    unitDiv.querySelector(".amount").textContent = `$${amount.toFixed(2)}`;
}

// Update the total register display
function updateRegisterDisplay() {
  registerAmountDisplay.textContent = `$${currentRegister
    .reduce((sum, unit) => sum + unit[1], 0)
    .toFixed(2)}`;
  currentRegister.forEach(([unit, amount]) => updateUnitAmount(unit, amount));
}

// Get unit values
function getUnitValue(unit) {
  switch (unit) {
    case "PENNY":
      return 0.01;
    case "NICKEL":
      return 0.05;
    case "DIME":
      return 0.1;
    case "QUARTER":
      return 0.25;
    case "ONE":
      return 1.0;
    case "FIVE":
      return 5.0;
    case "TEN":
      return 10.0;
    case "TWENTY":
      return 20.0;
    case "ONE HUNDRED":
      return 100.0;
    default:
      return 0;
  }
}

// Round numbers to two decimals
function roundToTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}

// Attach Purchase button event
document
  .getElementById("purchase-btn")
  .addEventListener("click", calculateChange);

// Keyboard input handler
display.addEventListener("keydown", (e) => {
  if (
    !((e.key >= "0" && e.key <= "9") || e.key === "." || e.key === "Backspace")
  )
    e.preventDefault();
});

// Add event listeners for keypad buttons
document.querySelectorAll(".key").forEach((key) => {
  key.addEventListener("click", () => {
    const value = key.textContent;
    alertScreen.textContent = "";
    if (key.classList.contains("clear")) clearDisplay();
    else appendToDisplay(value);
  });
});
