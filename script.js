// Element Selectors
const startBtn = document.querySelector('.game-rules__start');
const gameModal = document.querySelector('.game-modal');
const coinFaces = {
  all: gameModal.querySelectorAll('.coin > div'),
  chick: gameModal.querySelector('.coin__front'),
  duck: gameModal.querySelector('.coin__back'),
};
const turnStatus = document.querySelector('.turn-status');
const gameSquares = document.querySelectorAll('.game__square');
const audioTracks = {
  all: document.querySelectorAll('audio'),
  chick: document.querySelector('[data-type="chick"]'),
  duck: document.querySelector('[data-type="duck"]'),
  applause: document.querySelector('[data-type="applause"]'),
  tryAgain: document.querySelector('[data-type="tryAgain"]')
}

// Event Listeners
startBtn.addEventListener('click', startGame);
turnStatus.addEventListener('transitionend',function(){this.classList.remove('--active')});
gameSquares.forEach(square => square.addEventListener('click',makeAMove));


// Control Variables
let isPlayerTurn;
let currentTurn = 1;
let isWinner = false;
let getSquareValues = () => [...gameSquares].map(square => square.dataset.value);
const ranges = [
// Horizontal
  [0,1,2],
  [3,4,5],
  [6,7,8],
// Vertical
  [0,3,6],
  [1,4,7],
  [2,5,8],
// Diagonal
  [0,4,8],
  [2,4,6]
]

// Functions

function startGame(){
  if (typeof isPlayerTurn !== undefined) {
    resetGame()
  }
  this.textContent = 'Reset';
  gameModal.classList.add('--active');
  const randomRotations = Math.floor(Math.random()*(8-5)+5);
  const calculatedRotations = (randomRotations * 180);
  const isChick = randomRotations % 2 === 0;
  setTimeout(() => {
    coinFaces.chick.style.transform = `rotateY(${calculatedRotations}deg)`;
    coinFaces.duck.style.transform = `rotateY(${calculatedRotations+180}deg)`;
  }, 500);
  setTimeout(() => {
    gameModal.classList.remove('--active');
    isPlayerTurn = isChick;
    isChick?turnStatus.textContent='Players Turn!':'Computers Turn!';
    turnStatus.classList.add('--active');
    if(!isPlayerTurn) evaluateMove();
  }, 5500);
}

function resetGame() {
  isPlayerTurn = undefined;
  currentTurn = 1;
  isWinner = false;
  gameSquares.forEach(square => {
    square.dataset.value = '';
    square.textContent = '';
    square.classList.remove('--winning');
  });
  turnStatus.textContent = `Let's go!`;
  coinFaces.all.forEach(side => side.removeAttribute('style'));
  audioTracks.all.forEach(audio => audio.currentTime = 0);
}

// even = chick
// odd = duck

function makeAMove({},target = this){
  if (typeof isPlayerTurn === undefined || isWinner) return;
  if (target.dataset.value) return;
  audioTracks.all.forEach(audio => {
    audio.currentTime = 0;
    audio.pause();
  });
  if (isPlayerTurn) {
    target.dataset.value = '🐤';
    target.textContent = '🐤';
    audioTracks.chick.play();
  } else {
    target.dataset.value = '🦆';
    target.textContent = '🦆';
    audioTracks.duck.play();
  };
  if (currentTurn >= 3) {
    checkForWinner(isPlayerTurn,getSquareValues());
  }
  currentTurn += 1;
  if (!isWinner) toggleTurn();
}

function toggleTurn(){
  isPlayerTurn = !isPlayerTurn;
  turnStatus.textContent=isPlayerTurn?'Players Turn!':'Computers Turn!';
  turnStatus.classList.add('--active');
  if(!isPlayerTurn) evaluateMove();
}

function checkCells(squareValues) {
  let threats = [];
  let vacant = [];

  for (let i = 0; i < ranges.length; i++) {
    const values = [squareValues[ranges[i][0]],squareValues[ranges[i][1]],squareValues[ranges[i][2]]];
    const allOccupied = values.every(val => val !== '');

    if (!allOccupied) {
      const isOpportunity =  values.filter(cell => cell === '🦆').length > 1;
      const isThreat = values.filter(cell => cell === '🐤').length > 1;
      
      if (isOpportunity) {
        const opportunityIndex = ranges[i][values.findIndex(cell => cell == '')];
        return opportunityIndex;
      } else if (isThreat) {
        threats.push(ranges[i][values.findIndex(cell => cell == '')]);
      } else {
        values.forEach((value,index) => {
          if(value == '') vacant.push(ranges[i][index]);
        })
      }
    }
  };

  if (threats.length == 0) {
    const randomVacant = Math.floor(Math.random()*vacant.length);
    return vacant[randomVacant];
  } else {
    const threatCount = threats.reduce((count,current) => {
      !count[current]?count[current] = 1:count[current] += 1;
      let currentHighest = Object.values(count.highest)[0];
      if (count[current] > currentHighest) count.highest = {[current]: count[current]};
      return count;
    },{highest:{index:0}});
    return Object.keys(threatCount.highest)[0]
  }
}

function evaluateMove(){
  let squareValues = getSquareValues();
  if(squareValues.every(val => val==='')) {
    let randomSquare = Math.floor(Math.random()*9);
    return makeAMove({},gameSquares[randomSquare]);
  };
  let targetIndex = checkCells(squareValues);
  setTimeout(() => {
    return makeAMove({},gameSquares[targetIndex]);
  }, 1600);
}

function checkForWinner(isPlayerTurn,squareValues){
  let icon = isPlayerTurn?'🐤':'🦆';
  for (let i = 0; i < ranges.length; i++) {
    let rangeValues = ranges[i].map(iVal => squareValues[iVal])
    if (rangeValues.every(val => val === icon)) {
      ranges[i].forEach(index => {
        gameSquares[index].classList.add('--winning');
      })
      turnStatus.classList.add('--active');
      turnStatus.textContent = isPlayerTurn?'We have a winner!':'Better luck next time...';
      isWinner = true;
      isPlayerTurn?audioTracks.applause.play():audioTracks.tryAgain.play();
      return;
    }
  }
  if(currentTurn===9) {
    turnStatus.classList.add('--active');
    turnStatus.textContent =  `It's a draw!`;
    isWinner = true;
    audioTracks.tryAgain.play()
    return;
  }
}