/*************************************************
 is html elementai
*************************************************/
const resultDisplay = document.getElementById('result');   // ekranas
const keysForm = document.querySelector('.keys');     // mygtuku konteineris

/*************************************************
 defaultines reiksmes
*************************************************/
let currentOperand = '0';
let previousOperand = null;
let operation = null;                 // '+', '-', '*', '/', 'mod', 'pow'
let isWaitingForNextOperand = false;
let isError = false;

/*************************************************
pagalbines funkcijos
*************************************************/
function symbolFor(op) {
  if (op === 'pow') return '^';
  if (op === 'mod') return '%';
  if (op === '/')   return '÷';
  if (op === '*')   return '×';
  return op;
}

function simplifyResult(num) {
  if (!isFinite(num)) {
    displayError('Begalybė');
    return null;
  }
  // 10 skaitmenu tikslumu
  return parseFloat(Number(num).toPrecision(10));
}

function displayError(_) {
  isError = true;
  currentOperand = 'Error';
  previousOperand = null;
  operation = null;
  isWaitingForNextOperand = false;
  resultDisplay.textContent = 'Error';
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/*************************************************
 ekrano atnaujinimas (kad viskas i ekrane matytus)
*************************************************/
function updateDisplay() {
  if (operation) {
    const left = previousOperand;
    const sym  = symbolFor(operation);
    if (isWaitingForNextOperand) {
      resultDisplay.textContent = `${left} ${sym}`;
    } else {
      resultDisplay.textContent = `${left} ${sym} ${currentOperand}`;
    }
  } else {
    resultDisplay.textContent = currentOperand;
  }
}

/*************************************************
pagrindines funkcijos: clear, del, appendNumber, chooseOperation
*************************************************/
function clear() {
  currentOperand = '0';
  previousOperand = null;
  operation = null;
  isWaitingForNextOperand = false;
  isError = false;
  resultDisplay.textContent = '0';
}

function del() {
  if (isWaitingForNextOperand) return; // kai laukiam antro sk., nieko netrinam
  currentOperand = currentOperand.length > 1 ? currentOperand.slice(0, -1) : '0';
}

function appendNumber(num) {
  // neleisti antro kablelio rasyti
  if (num === '.' && currentOperand.includes('.')) return;

  if (isWaitingForNextOperand) {
    currentOperand = (num === '.') ? '0.' : num;
    isWaitingForNextOperand = false;
  } else {
    currentOperand = (currentOperand === '0' && num !== '.') ? num : currentOperand + num;
  }
}

function chooseOperation(op) {
  const inputValue = parseFloat(currentOperand);
  if (isNaN(inputValue)) return;

  // kad jei minusas pirmas, tai jis nebutu kaip operatorius, o kaip dalis skaiciaus
  if (op === '-' && previousOperand == null && currentOperand === '0') {
    currentOperand = '-';
    updateDisplay();
    return;
  }

  if (previousOperand == null) {
    previousOperand = inputValue;
  } else if (operation && !isWaitingForNextOperand) {
    // paskaiciuojami tarpiniai rez
    const result = performCalculation();
    if (result == null) return;
    currentOperand = String(result);
    previousOperand = result;
  }

  operation = op;                 // '+', '-', '*', '/', 'mod', 'pow'
  isWaitingForNextOperand = true;
  updateDisplay();
}

/*************************************************
 funkciju mygtukai (sqrt, sq, pow, fact, percent)
*************************************************/
function handleFunction(name) {
  const value = parseFloat(currentOperand);
  if (isNaN(value)) return;

  switch (name) {
    case 'percent':      // mod (%) (dvieju nariu reik)
      chooseOperation('mod');
      return;
    case 'pow':          // xʸ (dvieju nariu reik)
      chooseOperation('pow'); 
      return;

    case 'sqrt': {       // √x (vieno nario reik)
      const r = value < 0 ? NaN : Math.sqrt(value);
      if (!isFinite(r) || isNaN(r)) return displayError('Klaida');
      currentOperand = String(simplifyResult(r));
      isWaitingForNextOperand = true;
      break;
    }
    case 'sq': {         // x² (vieno nario reik)
      const r = Math.pow(value, 2);
      currentOperand = String(simplifyResult(r));
      isWaitingForNextOperand = true;
      break;
    }
    case 'fact': {       // x! (tik sveiki sk ir vieno nario reik)
      const r = factorial(value);
      if (isNaN(r)) return displayError('Klaida');
      currentOperand = String(simplifyResult(r));
      isWaitingForNextOperand = true;
      break;
    }
    default:
      return;
  }
  updateDisplay();
}

/*************************************************
skaiciavimai
*************************************************/
function performCalculation() {
  const a = previousOperand;
  const b = parseFloat(currentOperand);
  if (isNaN(a) || isNaN(b)) return null;

  let r;
  switch (operation) {
    case '+':  r = a + b; break;
    case '-':  r = a - b; break;
    case '*':  r = a * b; break;
    case '/':
      if (b === 0) return displayError('Klaida'), null;
      r = a / b; break;
    case 'mod':
      if (b === 0) return displayError('Klaida'), null;
      r = a % b; break;
    case 'pow': r = Math.pow(a, b); break;
    default:   return null;
  }
  return simplifyResult(r);
}

/*************************************************
atsakymo skaiciavimas (=)
*************************************************/
function compute() {
  if (operation == null || isWaitingForNextOperand) return;
  const result = performCalculation();
  if (result == null) return;
  currentOperand = String(result);
  previousOperand = null;
  operation = null;
  isWaitingForNextOperand = false;
  updateDisplay();  // rodomas tik rezultatas
}

/*************************************************
ivedimas pele
*************************************************/
keysForm.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const { val, act } = btn.dataset;

  // Jei buvo klaida tai bet koks mygtukas (isskyrus AC) resetina
  if (isError && act !== 'ac') clear();

  if (val && !btn.classList.contains('key-op')) {
    appendNumber(val);               // skaičiai ir .
  } else if (val && btn.classList.contains('key-op')) {
    chooseOperation(val);            // + - * /
  } else if (act === 'equals') {
    compute();                       // =
  } else if (act === 'ac') {
    clear();                         // AC
  } else if (act === 'del') {
    del();                           // DEL
  } else if (act && btn.classList.contains('key-fn')) {
    handleFunction(act);             // sqrt, sq, pow, fact, percent
  }

  updateDisplay();
});

/*************************************************
ivedimas su klaviatura
*************************************************/
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') e.preventDefault();

  if (isError && e.key !== 'Escape') clear();

  // Skaiciai ir .
  if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
    appendNumber(e.key);
    updateDisplay();
    return;
  }

  // Operatoriai
  if (['+', '-', '*', '/'].includes(e.key)) {
    chooseOperation(e.key);
    return;
  }

  // mod (%), pow (^)
  if (e.key === '%') { chooseOperation('mod'); return; }
  if (e.key === '^') { chooseOperation('pow'); return; }

  // =
  if (e.key === 'Enter' || e.key === '=') { compute(); return; }

  // DEL, AC
  if (e.key === 'Backspace') { del(); updateDisplay(); return; }
  if (e.key === 'Escape' || e.key === 'Delete') { clear(); return; }
});

/*************************************************
 puslapiui uzsikrovus kad 0 butu
*************************************************/
clear();