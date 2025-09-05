// =====================
//        STATE
// =====================
let hunger       = parseInt(localStorage.getItem("hunger") || "100", 10);
let happiness    = parseInt(localStorage.getItem("happiness") || "100", 10);
let energy       = parseInt(localStorage.getItem("energy") || "100", 10);
let coins        = parseInt(localStorage.getItem("coins") || "0", 10);
let friendship   = parseInt(localStorage.getItem("friendship") || "50", 10);
let cleanliness  = parseInt(localStorage.getItem("cleanliness") || "100", 10);

let isSleeping   = false;
let isPetting    = false;
let isDragging   = false;

let pettingInterval = null;
let wanderInterval  = null;

// =====================
//         DOM
// =====================
const hungerFill       = document.getElementById("hungerFill");
const happinessFill    = document.getElementById("happinessFill");
const energyFill       = document.getElementById("energyFill");
const friendshipFill   = document.getElementById("friendshipFill");
const cleanlinessFill  = document.getElementById("cleanlinessFill");

const coinsEl     = document.getElementById("coins");
const talkBox     = document.getElementById("talkBox");

const feedBtn     = document.getElementById("feedBtn");
const sleepBtn    = document.getElementById("sleepBtn");
const shopToggle  = document.getElementById("shopToggle");
const shop        = document.getElementById("shop");

const settingsBtn     = document.getElementById("settingsBtn");
const settingsPanel   = document.getElementById("settingsPanel");
const darkModeToggle  = document.getElementById("darkModeToggle");
const idleTalkToggle  = document.getElementById("idleTalkToggle");

const themeSelect = document.getElementById("themeSelect");

const fumoDiv  = document.getElementById("fumo");
const fumoImg  = document.getElementById("fumoImg");
const petHand  = document.getElementById("petHand");

const fumosBtn   = document.getElementById("fumosBtn");
const gamesBtn   = document.getElementById("gamesBtn");
const gamesPanel = document.getElementById("gamesPanel");
const resetBtn   = document.getElementById("resetBtn"); // optional

const soap = document.getElementById("soap");

// Prevent browser drag “ghost” images
if (fumoImg) fumoImg.setAttribute("draggable", "false");
if (soap)    soap.setAttribute("draggable", "false");

// Make sure soap stays on top of fumo
if (soap) {
  soap.style.position = "fixed";
  soap.style.zIndex = "9999";
}

// Optional: ensure fumo container is above most things
if (fumoDiv) {
  fumoDiv.style.position = "fixed";
  fumoDiv.style.left = fumoDiv.style.left || "300px";
  fumoDiv.style.top  = fumoDiv.style.top  || "200px";
  fumoDiv.style.zIndex = "1000";
}

// =====================
//      THEMES
// =====================
const savedTheme = localStorage.getItem("theme") || "default";
document.body.classList.add("theme-" + savedTheme);
if (themeSelect) themeSelect.value = savedTheme;

if (themeSelect) {
  themeSelect.addEventListener("change", () => {
    document.body.className = "";
    document.body.classList.add("theme-" + themeSelect.value);
    localStorage.setItem("theme", themeSelect.value);
  });
}

// =====================
//      HELPERS
// =====================
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function save() {
  localStorage.setItem("hunger", hunger);
  localStorage.setItem("happiness", happiness);
  localStorage.setItem("energy", energy);
  localStorage.setItem("coins", coins);
  localStorage.setItem("friendship", friendship);
  localStorage.setItem("cleanliness", cleanliness);
}

function updateUI() {
  const updateBar = (bar, value) => {
    if (!bar) return;
    bar.style.width = value + "%";
    bar.style.backgroundColor = (value < 20) ? "red" : "";
  };

  updateBar(hungerFill, hunger);
  updateBar(happinessFill, happiness);
  updateBar(energyFill, energy);
  updateBar(friendshipFill, friendship);
  updateBar(cleanlinessFill, cleanliness);

  if (coinsEl) coinsEl.textContent = "Coins: " + coins;

  save();
}

function talk(text) {
  if (!talkBox) return;
  const fumo = fumos[currentFumo];
  const d = document.createElement("div");
  d.textContent = `${fumo.name}: ${text}`;
  talkBox.appendChild(d);
  talkBox.scrollTop = talkBox.scrollHeight;
}

// =====================
//  PER-FUMO VOICE LINES
// =====================
const VO = {
  Cirno: {
    pet: ["Hehe~ petting feels nice!", "More more!", "Ehehe~ this is fun!"],
    feed: ["Yummy yummy~ Thank youuu!", "Snacks! Gimme!"],
    sleepStart: ["Cirno is gonna nap… zzz~"],
    wake: ["Cirno’s awake! Stronger than ever!"],
    clean: ["Sparkly clean! ✨", "Bubbly~"],
    ball: ["Hehe~ the ball bounced!", "Boing! Boing!"],
  },
  Reimu: {
    pet: ["Fine… just a little bit.", "Watch the ribbon.", "Mmm… okay."],
    feed: ["Thanks. Donation accepted… as food.", "That’s decent."],
    sleepStart: ["I’ll rest a bit… keep it quiet."],
    wake: ["Back to work… the shrine won’t run itself."],
    clean: ["Alright, that’s better.", "Don’t get soap in my hair."],
    ball: ["Mind the walls.", "Hm. Neat bounce."],
  },
  Marisa: {
    pet: ["Oi, easy on the hat, ze!", "Heh, feels pretty good, ze!"],
    feed: ["Sweet! Fuel for magic, ze!", "Tastes great, ze!"],
    sleepStart: ["Marisa will crash for a bit, ze…"],
    wake: ["Back in action, ze!"],
    clean: ["Shiny and ready, ze!", "Soap magic!"],
    ball: ["Bounce spell! Boing, ze!", "Wicked rebound, ze!"],
  }
};

function say(action, fallback) {
  const name = fumos[currentFumo].name;
  const lines = (VO[name] && VO[name][action]) || null;
  if (lines && lines.length) {
    talk(lines[Math.floor(Math.random() * lines.length)]);
  } else {
    talk(fallback);
  }
}

// =====================
//      BUTTONS
// =====================
if (feedBtn) {
  feedBtn.addEventListener("click", () => {
    if (isSleeping) return talk("Zzz… can’t eat while sleeping!");
    if (coins < 1)  return talk("No coins… Fumo wants food");
    coins -= 1;
    hunger = clamp(hunger + 20, 0, 100);
    updateUI();
    say("feed", "Yummy yummy~ Thank youuu!");
  });
}

if (sleepBtn) {
  sleepBtn.addEventListener("click", () => {
    if (isSleeping) return;
    isSleeping = true;
    stopPetting();
    say("sleepStart", "Fumo is going to sleep… zzz~");
    fumoImg.style.opacity = "0.6";

    const sleepInterval = setInterval(() => {
      energy = clamp(energy + 5, 0, 100);
      updateUI();
      if (energy >= 100) {
        clearInterval(sleepInterval);
        isSleeping = false;
        fumoImg.style.opacity = "1";
        say("wake", "Fumo is awake! Feeling refreshed ☆ミ");
      }
    }, 1000);
  });
}

if (shopToggle && shop) {
  shopToggle.addEventListener("click", () => {
    shop.classList.toggle("hidden");
  });

  shop.addEventListener("click", (e) => {
    if (!e.target.classList.contains("buy")) return;
    const cost  = parseInt(e.target.dataset.cost, 10);
    const type  = e.target.dataset.type;
    const value = parseInt(e.target.dataset.value || "0", 10);
    const item  = e.target.dataset.item;

    if (coins < cost) return talk("Not enough coins…");

    coins -= cost;

    if (item === "ball") {
      talk("Yay! A ball! Let’s play~");
      startBall();
    } else {
      if (type === "food") hunger    = clamp(hunger + value, 0, 100);
      if (type === "toy")  happiness = clamp(happiness + value, 0, 100);
    }
    updateUI();
  });
}

// Optional reset (needs #resetBtn in HTML)
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    const ok = confirm("Reset all progress? This cannot be undone.");
    if (!ok) return;

    localStorage.clear();
    hunger = happiness = energy = cleanliness = 100;
    friendship = 50;
    coins = 0;
    updateUI();
    talk("Everything’s fresh and new again!");
  });
}

// =====================
//       SETTINGS
// =====================
if (settingsBtn && settingsPanel) {
  settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden");
  });
}

if (darkModeToggle) {
  darkModeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", darkModeToggle.checked);
  });
}

// =====================
//     IDLE LINES TICK
// =====================
setInterval(() => {
  if (!isSleeping && idleTalkToggle && idleTalkToggle.checked && Math.random() < 0.5) {
    const lines = fumos[currentFumo].lines;
    talk(lines[Math.floor(Math.random() * lines.length)]);
  }
}, 20000);

// =====================
//   PETTING (ROTATE)
// =====================
// NOTE: we keep the fumo’s size the same. We rotate only, while preserving scale via CSS vars.
function startPetting() {
  if (isPetting) return;
  isPetting = true;
  // rotate a bit but keep base scale & offset
  const baseScale = getComputedStyle(fumoImg).getPropertyValue("--base-scale") || "1";
  const offsetY   = getComputedStyle(fumoImg).getPropertyValue("--offset-y")   || "0px";
  fumoImg.style.transform = `translateY(${offsetY}) scale(${baseScale}) rotate(6deg)`;
  petHand.style.display = "block";

  pettingInterval = setInterval(() => {
    coins += 1;
    happiness  = clamp(happiness + 5, 0, 100);
    energy     = clamp(energy + 1, 0, 100);
    friendship = clamp(friendship + 2, 0, 100);
    updateUI();
    say("pet", "Hehe~ petting feels nice!");
  }, 1000);
}

function stopPetting() {
  if (!isPetting) return;
  isPetting = false;
  petHand.style.display = "none";
  const baseScale = getComputedStyle(fumoImg).getPropertyValue("--base-scale") || "1";
  const offsetY   = getComputedStyle(fumoImg).getPropertyValue("--offset-y")   || "0px";
  fumoImg.style.transform = `translateY(${offsetY}) scale(${baseScale}) rotate(0deg)`;
  if (pettingInterval) {
    clearInterval(pettingInterval);
    pettingInterval = null;
  }
}

// Start/stop petting on hover (blocked while dragging or cleaning)
fumoImg.addEventListener("mouseenter", () => {
  if (isSleeping || isDragging || isDraggingSoap) return;
  startPetting();
});
fumoImg.addEventListener("mouseleave", stopPetting);

// =====================
//   STATS – DECAY TICKS
// =====================
setInterval(() => {
  if (!isSleeping) {
    hunger    = clamp(hunger - 1, 0, 100);
    happiness = clamp(happiness - (hunger === 0 ? 2 : 1), 0, 100);
    energy    = clamp(energy - 1, 0, 100);
  }
  updateUI();

  if (hunger < 30)    talk("I'm so hungwy…");
  if (happiness < 30) talk("I'm feeling kinda sad…");
  if (energy < 30)    talk("Fumo is sleepy… zzz~");
}, 5000);

setInterval(() => {
  if (!isSleeping) {
    friendship  = clamp(friendship - 1, 0, 100);
    cleanliness = clamp(cleanliness - 1, 0, 100);
  }
  updateUI();

  if (friendship < 30)  talk("Do you still like me...?");
  if (cleanliness < 30) talk("I feel dirty... give me a bath!");
}, 7000);

// =====================
//  DRAGGING + WANDERING
// =====================
let offsetX = 0, offsetY = 0;

fumoImg.addEventListener("mousedown", (e) => {
  stopPetting();
  isDragging = true;
  clearInterval(wanderInterval);

  const rect = fumoDiv.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  fumoDiv.classList.add("dragging");
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  fumoDiv.style.left = (e.clientX - offsetX) + "px";
  fumoDiv.style.top  = (e.clientY - offsetY) + "px";
});

document.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  fumoDiv.classList.remove("dragging");

  wanderInterval = setInterval(() => {
    if (isSleeping || isPetting) return;

    let x = parseInt(fumoDiv.style.left) || 300;
    let y = parseInt(fumoDiv.style.top)  || 200;

    x += (Math.floor(Math.random() * 3) - 1) * 50;
    y += (Math.floor(Math.random() * 3) - 1) * 50;

    const maxX = window.innerWidth  - fumoDiv.offsetWidth;
    const maxY = window.innerHeight - fumoDiv.offsetHeight;
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));

    fumoDiv.style.left = x + "px";
    fumoDiv.style.top  = y + "px";
  }, 2000);
});

// =====================
//     FUMOS SWITCHER
// =====================
const fumos = [
  {
    name: "Cirno",
    img:  "https://img1.picmix.com/output/stamp/normal/6/8/3/2/2012386_9113c.png",
    scale: 1,
    offsetY: 0,
    lines: [
      "Cirno is the STRONGEST!!",
      "Hehe~ do you have snacks?",
      "Pet me more, baka~"
    ],
  },
  {
    name: "Reimu",
    img:  "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/5d3a8ba0-53ad-48d4-a297-f3053504eca9/dequhbw-dd854a4c-a580-4958-a239-2f8d56d1e17b.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzVkM2E4YmEwLTUzYWQtNDhkNC1hMjk3LWYzMDUzNTA0ZWNhOVwvZGVxdWhidy1kZDg1NGE0Yy1hNTgwLTQ5NTgtYTIzOS0yZjhkNTZkMWUxN2IucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Zecw4QOgY0Dy7UE71DnsQ8gNegFoBVmja0XUci2L6XI",
    scale: 1.2,
    offsetY: 20,
    lines: [
      "Donate to the shrine please~",
      "Too many youkai today...",
      "Don’t slack off!"
    ],
  },
  {
    name: "Marisa",
    img:  "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/edbbe96e-e6e4-4343-981d-7eaf881a1964/dg34yrq-0630e5c4-0f90-4710-a140-8ff4f5cce984.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2VkYmJlOTZlLWU2ZTQtNDM0My05ODFkLTdlYWY4ODFhMTk2NFwvZGczNHlycS0wNjMwZTVjNC0wZjkwLTQ3MTAtYTE0MC04ZmY0ZjVjY2U5ODQucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.o3ckC06nlqKW3Os5wmaiejGM_nhoHyKxxsQ_D8AvaGU",
    scale: 1.4,
    offsetY: 50,
    lines: [
      "Da ze~!",
      "Magic is the best, ze!",
      "Did ya see my new broom?"
    ],
  }
];

let currentFumo = 0;
function applyFumoAppearance() {
  const f = fumos[currentFumo];
  fumoImg.src = f.img;
  // Use CSS vars so transforms keep size consistent
  fumoImg.style.setProperty("--base-scale", f.scale);
  fumoImg.style.setProperty("--offset-y", f.offsetY + "px");
  fumoImg.style.transform = `translateY(${f.offsetY}px) scale(${f.scale}) rotate(0deg)`;
}

if (fumosBtn) {
  fumosBtn.addEventListener("click", () => {
    currentFumo = (currentFumo + 1) % fumos.length;
    applyFumoAppearance();
    talk(`${fumos[currentFumo].name} is here now!`);
  });
}

// =====================
//        SOAP
// =====================
let isDraggingSoap = false;
let lastCleanTime  = 0;
let lastCleanTalk  = 0;

soap.addEventListener("mousedown", (e) => {
  isDraggingSoap = true;
  stopPetting(); // disable petting while cleaning
  soap._offsetX = e.clientX - soap.getBoundingClientRect().left;
  soap._offsetY = e.clientY - soap.getBoundingClientRect().top;
});

document.addEventListener("mousemove", (e) => {
  if (!isDraggingSoap) return;
  soap.style.left = (e.clientX - soap._offsetX) + "px";
  soap.style.top  = (e.clientY - soap._offsetY) + "px";

  const soapRect = soap.getBoundingClientRect();
  const fumoRect = fumoImg.getBoundingClientRect();

  const overlap = (
    soapRect.left < fumoRect.right &&
    soapRect.right > fumoRect.left &&
    soapRect.top < fumoRect.bottom &&
    soapRect.bottom > fumoRect.top
  );

  if (overlap) {
    const now = Date.now();
    if (now - lastCleanTime > 100) { // 0.1s cooldown for stat
      cleanliness = clamp(cleanliness + 1, 0, 100);
      updateUI();
      lastCleanTime = now;
    }
    if (now - lastCleanTalk > 800) { // throttle messages
      say("clean", "Thanks for the soap!");
      lastCleanTalk = now;
    }
  }
});

document.addEventListener("mouseup", () => {
  isDraggingSoap = false;
});

// =====================
//        BALL
// =====================
const ball = document.createElement("div");
ball.id = "ball";
ball.style.display = "none";
ball.style.position = "fixed";
ball.style.left = "100px";
ball.style.top  = "100px";
document.body.appendChild(ball);

let ballInterval = null;
let ballX = 100, ballY = 100;
let ballVX = 3,   ballVY = 3;
let isDraggingBall = false;
let dragOffsetX = 0, dragOffsetY = 0;
let lastMouseX = 0, lastMouseY = 0;

function startBall() {
  if (ballInterval) clearInterval(ballInterval);
  ball.style.display = "block";

  ballInterval = setInterval(() => {
    if (isDraggingBall) return;

    ballX += ballVX;
    ballY += ballVY;

    // wall collision
    if (ballX <= 0 || ballX + ball.offsetWidth >= window.innerWidth) {
      ballVX *= -1;
      coins += 1;
      happiness = clamp(happiness + 2, 0, 100);
      updateUI();
      say("ball", "Hehe~ the ball bounced! 🎉");
    }
    if (ballY <= 0 || ballY + ball.offsetHeight >= window.innerHeight) {
      ballVY *= -1;
      coins += 1;
      happiness = clamp(happiness + 2, 0, 100);
      updateUI();
      say("ball", "Bounce bounce~!");
    }

    ball.style.left = ballX + "px";
    ball.style.top  = ballY + "px";
  }, 16);
}

ball.addEventListener("mousedown", (e) => {
  isDraggingBall = true;
  clearInterval(ballInterval);

  const rect = ball.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

document.addEventListener("mousemove", (e) => {
  if (!isDraggingBall) return;
  ballX = e.clientX - dragOffsetX;
  ballY = e.clientY - dragOffsetY;
  ball.style.left = ballX + "px";
  ball.style.top  = ballY + "px";

  // velocity from mouse movement
  ballVX = (e.clientX - lastMouseX) / 2;
  ballVY = (e.clientY - lastMouseY) / 2;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

document.addEventListener("mouseup", () => {
  if (isDraggingBall) {
    isDraggingBall = false;
    startBall(); // resume bouncing immediately with new velocity
  }
});

// =====================
//        GAMES
// =====================
if (gamesBtn && gamesPanel) {
  gamesBtn.addEventListener("click", () => {
    gamesPanel.classList.toggle("hidden");
  });

  gamesPanel.addEventListener("click", (e) => {
    if (!e.target.classList.contains("playGame")) return;
    const game = e.target.dataset.game;

    if (game === "ballGame") {
      talk("Let’s play Ball Bounce!");
      startBall();
    }

    else if (game === "guessGame") {
      const number = Math.floor(Math.random() * 10) + 1;
      const guess = prompt("Guess a number (1–10):");
      if (parseInt(guess, 10) === number) {
        talk("Wow! You guessed it right 🎉");
        coins += 20;
      } else {
        talk(`Nope! It was ${number}`);
      }
      updateUI();
    }

    else if (game === "diceGame") {
      const roll = Math.floor(Math.random() * 6) + 1;
      talk(`You rolled a ${roll}`);
      coins += roll;
      happiness = clamp(happiness + roll, 0, 100);
      updateUI();
    }

    else if (game === "mathGame") {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      const answer = prompt(`What is ${a} + ${b}?`);
      if (parseInt(answer, 10) === a + b) {
        talk("Correct! You’re smart~ ✨");
        coins += 15;
        happiness = clamp(happiness + 10, 0, 100);
      } else {
        talk("Oops, wrong answer…");
      }
      updateUI();
    }

    else if (game === "rpsGame") {
      const choices = ["Rock", "Paper", "Scissors"];
      const fumoChoice = choices[Math.floor(Math.random() * 3)];
      const playerChoice = prompt("Choose: Rock, Paper, or Scissors?");
      if (!playerChoice) return;
      talk(`Fumo chose ${fumoChoice}!`);

      const p = playerChoice.toLowerCase();
      const f = fumoChoice.toLowerCase();

      if (p === f) {
        talk("It’s a tie~ 🤝");
      } else if (
        (p === "rock"     && f === "scissors") ||
        (p === "paper"    && f === "rock")     ||
        (p === "scissors" && f === "paper")
      ) {
        talk("You win! Waaah no fair ");
        happiness = clamp(happiness + 10, 0, 100);
        coins += 5;
      } else {
        talk("Hehe~ Fumo wins!");
        happiness = clamp(happiness + 5, 0, 100);
      }
      updateUI();
    }

    else if (game === "cardGame") {
      const card = Math.floor(Math.random() * 3) + 1;
      const guess = prompt("Pick a card: 1, 2, or 3?");
      if (parseInt(guess, 10) === card) {
        talk("Lucky! You picked the right card");
        coins += 10;
      } else {
        talk(`Nope! The winning card was ${card}`);
      }
      updateUI();
    }

    else if (game === "slotGame") {
      const symbols = ["🍒", "⭐", "7️⃣", "🍋", "🍀"];
      const roll = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];
      talk(`Slot Machine: ${roll.join(" | ")}`);

      if (roll[0] === roll[1] && roll[1] === roll[2]) {
        talk("JACKPOT!!! 🎰✨");
        coins += 50;
        happiness = clamp(happiness + 20, 0, 100);
      } else if (roll[0] === roll[1] || roll[1] === roll[2] || roll[0] === roll[2]) {
        talk("Two of a kind! Nice win~");
        coins += 15;
      } else {
        talk("Better luck next time~");
      }
      updateUI();
    }

    else if (game === "memoryGame") {
      const pairs = ["🐱", "🐶"];
      const deck = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
      const g1 = parseInt(prompt(`Pick a card 1-4: ${deck.map((_, i) => i+1).join(", ")}`), 10);
      const g2 = parseInt(prompt("Pick another card 1-4:"), 10);
      if (deck[g1-1] && deck[g1-1] === deck[g2-1]) {
        talk(`Matched! ${deck[g1-1]} + ${deck[g2-1]} 🎉`);
        coins += 20;
        happiness = clamp(happiness + 10, 0, 100);
      } else {
        talk("No match… try again!");
      }
      updateUI();
    }

    else if (game === "clickGame") {
      talk("Click Speed Test: Click OK and then click FAST!");
      let clicks = 0;
      const btn = document.createElement("button");
      btn.textContent = "CLICK ME FAST!";
      btn.style.position = "fixed";
      btn.style.top = "50%";
      btn.style.left = "50%";
      btn.style.transform = "translate(-50%, -50%)";
      btn.style.padding = "20px";
      btn.style.fontSize = "20px";
      btn.style.zIndex = "10000";
      document.body.appendChild(btn);

      btn.addEventListener("click", () => clicks++);

      setTimeout(() => {
        document.body.removeChild(btn);
        talk(`You clicked ${clicks} times!`);
        coins += clicks;
        happiness = clamp(happiness + Math.floor(clicks / 2), 0, 100);
        updateUI();
      }, 5000);
    }
  });
}

// =====================
//        INIT
// =====================
applyFumoAppearance();
updateUI();
talk("Yay! Fumo is here~ Take care of me!");
// ---- Mood System ----
const moodEl = document.createElement("div");
moodEl.id = "mood";
document.body.appendChild(moodEl);

function updateMood() {
  let mood = "Happy";
  if (hunger < 30) mood = "Hungry";
  else if (energy < 30) mood = "Sleepy";
  else if (happiness < 30) mood = "Sad";
  else if (cleanliness < 30) mood = "Dirty";

  moodEl.textContent = mood;

  // Position above Fumo
  const rect = fumoDiv.getBoundingClientRect();
  moodEl.style.left = rect.left + rect.width / 2 - 40 + "px";
  moodEl.style.top = rect.top - 30 + "px";
}

// Update mood every 2s
setInterval(updateMood, 10);

// ---- Quests ----
const quests = [
  { id: "pet", text: "Pet your Fumo for 10 seconds!", type: "pet", target: 10, reward: 50 },
  { id: "ball", text: "Bounce the ball 100 times!", type: "ball", target: 100, reward: 100 },
  { id: "feed", text: "Feed Fumo 5 times!", type: "feed", target: 5, reward: 30 },
  { id: "sleep", text: "Let Fumo sleep until full energy!", type: "sleep", target: 1, reward: 70 },
  { id: "clean", text: "Clean Fumo with soap 10 times!", type: "clean", target: 10, reward: 40 },
  { id: "happy", text: "Raise Happiness to 100!", type: "happy", target: 100, reward: 60 },
  { id: "friend", text: "Reach 80 Friendship!", type: "friend", target: 80, reward: 80 },
  { id: "coin", text: "Earn 200 coins!", type: "coin", target: 200, reward: 120 }
];

let currentQuest = null;
let questProgress = 0;

// UI element
const questEl = document.createElement("div");
questEl.id = "quest";
questEl.style.marginTop = "10px";
questEl.style.fontWeight = "bold";
questEl.style.fontSize = "14px";
questEl.style.textAlign = "center";
document.body.appendChild(questEl);

function newQuest() {
  currentQuest = quests[Math.floor(Math.random() * quests.length)];
  questProgress = 0;
  updateQuest();
}

function updateQuest() {
  if (!currentQuest) return;
  questEl.textContent = `Quest: ${currentQuest.text} (${questProgress}/${currentQuest.target})`;

  if (questProgress >= currentQuest.target) {
    coins += currentQuest.reward;
    friendship = clamp((friendship || 50) + 10, 0, 100);
    updateUI();
    talk(`${fumos[currentFumo].name}: Quest complete! 🎉 You earned ${currentQuest.reward} coins!`);

    // immediately start new quest
    newQuest();
  }
}

// ---- Progress hooks ----

// Petting progress (1s each)
let petSeconds = 0;
setInterval(() => {
  if (isPetting && currentQuest?.id === "pet") {
    petSeconds++;
    questProgress = petSeconds;
    updateQuest();
  }
}, 1000);

// Feeding
feedBtn.addEventListener("click", () => {
  if (currentQuest?.id === "feed") {
    questProgress++;
    updateQuest();
  }
});

// Ball bounce (call this inside bounce code)
function registerBounce() {
  if (currentQuest?.id === "ball") {
    questProgress++;
    updateQuest();
  }
}

// Cleaning (soap)
function registerClean() {
  if (currentQuest?.id === "clean") {
    questProgress++;
    updateQuest();
  }
}

// Sleep completion
function registerSleepComplete() {
  if (currentQuest?.id === "sleep") {
    questProgress = 1; // full done
    updateQuest();
  }
}

// Stats quests (check often)
setInterval(() => {
  if (!currentQuest) return;
  if (currentQuest.id === "happy") {
    questProgress = happiness;
    updateQuest();
  } else if (currentQuest.id === "friend") {
    questProgress = friendship;
    updateQuest();
  } else if (currentQuest.id === "coin") {
    questProgress = coins;
    updateQuest();
  }
}, 1000);

// Start first quest
newQuest();
/* ============================
   iPad / Touch support patch
   Paste this at the BOTTOM of script.js
============================ */
(function () {
  // Utility: get touch/mouse point
  function pt(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  function clampRectToViewport(el) {
    if (!el) return;
    const maxX = window.innerWidth  - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    const x = Math.max(0, Math.min(maxX, parseInt(el.style.left || 0)));
    const y = Math.max(0, Math.min(maxY, parseInt(el.style.top  || 0)));
    el.style.left = x + "px";
    el.style.top  = y + "px";
  }

  // Fallbacks in case variables weren’t global
  const FUMO_IMG = (typeof fumoImg !== "undefined" ? fumoImg : document.getElementById("fumoImg"));
  const FUMO_DIV = (typeof fumoDiv !== "undefined" ? fumoDiv : document.getElementById("fumo"));
  const SOAP_EL  = document.getElementById("soap");
  const BALL_EL  = (typeof ball !== "undefined" ? ball : document.getElementById("ball"));

  // Ensure globals exist (your file usually defines these already)
  if (typeof offsetX === "undefined") window.offsetX = 0;
  if (typeof offsetY === "undefined") window.offsetY = 0;

  /* -------- Fumo: touch pet + drag -------- */
  if (FUMO_IMG && FUMO_DIV) {
    FUMO_IMG.addEventListener("touchstart", (e) => {
      // Start petting (touch has no mouseenter)
      if (typeof isSleeping !== "undefined" && typeof isDragging !== "undefined") {
        if (!isSleeping && !isDragging) {
          window.isPetting = true;
          FUMO_IMG.classList.add("happy");
          if (typeof petHand !== "undefined") petHand.style.display = "block";
        }
      }
      // Prepare possible drag
      e.preventDefault();
      const p = pt(e);
      const rect = FUMO_DIV.getBoundingClientRect();
      window.offsetX = p.x - rect.left;
      window.offsetY = p.y - rect.top;
    }, { passive: false });

    FUMO_IMG.addEventListener("touchmove", (e) => {
      // If finger moves far enough, treat as dragging
      if (typeof isDragging === "undefined") return;
      const p = pt(e);
      const rect = FUMO_DIV.getBoundingClientRect();
      const dx = Math.abs(p.x - (rect.left + offsetX));
      const dy = Math.abs(p.y - (rect.top  + offsetY));
      if (!isDragging && (dx > 8 || dy > 8)) {
        window.isDragging = true;
        FUMO_DIV.classList.add("dragging");
        if (typeof wanderInterval !== "undefined") clearInterval(wanderInterval);
        // stop petting when drag starts
        window.isPetting = false;
        FUMO_IMG.classList.remove("happy");
        if (typeof petHand !== "undefined") petHand.style.display = "none";
      }
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
      if (typeof isDragging === "undefined" || !isDragging) return;
      e.preventDefault();
      const p = pt(e);
      FUMO_DIV.style.left = (p.x - offsetX) + "px";
      FUMO_DIV.style.top  = (p.y - offsetY) + "px";
    }, { passive: false });

    document.addEventListener("touchend", () => {
      if (typeof isDragging !== "undefined" && isDragging) {
        window.isDragging = false;
        FUMO_DIV.classList.remove("dragging");
        clampRectToViewport(FUMO_DIV);

        // resume wander like mouseup
        if (typeof wanderInterval !== "undefined")
          window.wanderInterval = setInterval(() => {
            if (typeof isSleeping !== "undefined" && isSleeping) return;
            if (typeof isPetting !== "undefined" && isPetting) return;
            let x = parseInt(FUMO_DIV.style.left) || 300;
            let y = parseInt(FUMO_DIV.style.top)  || 200;
            x += (Math.floor(Math.random() * 3) - 1) * 50;
            y += (Math.floor(Math.random() * 3) - 1) * 50;
            const maxX = window.innerWidth - FUMO_DIV.offsetWidth;
            const maxY = window.innerHeight - FUMO_DIV.offsetHeight;
            x = Math.max(0, Math.min(maxX, x));
            y = Math.max(0, Math.min(maxY, y));
            FUMO_DIV.style.left = x + "px";
            FUMO_DIV.style.top  = y + "px";
          }, 2000);
      }
      // stop petting on finger up
      window.isPetting = false;
      FUMO_IMG.classList.remove("happy");
      if (typeof petHand !== "undefined") petHand.style.display = "none";
    }, { passive: true });

    window.addEventListener("resize", () => clampRectToViewport(FUMO_DIV));
  }

  /* -------- Soap: touch drag (no ghost image) -------- */
  if (SOAP_EL) {
    SOAP_EL.setAttribute("draggable", "false");
    let draggingSoap = false, sx = 0, sy = 0;

    SOAP_EL.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const p = pt(e);
      const r = SOAP_EL.getBoundingClientRect();
      sx = p.x - r.left;
      sy = p.y - r.top;
      draggingSoap = true;
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
      if (!draggingSoap) return;
      e.preventDefault();
      const p = pt(e);
      SOAP_EL.style.left = (p.x - sx) + "px";
      SOAP_EL.style.top  = (p.y - sy) + "px";
      SOAP_EL.style.zIndex = 9999; // stay above fumo
    }, { passive: false });

    document.addEventListener("touchend", () => { draggingSoap = false; }, { passive: true });
  }

  /* -------- Ball: touch drag + fling -------- */
  if (BALL_EL) {
    BALL_EL.setAttribute("draggable", "false");

    BALL_EL.addEventListener("touchstart", (e) => {
      if (typeof isDraggingBall === "undefined") return;
      e.preventDefault();
      window.isDraggingBall = true;
      if (typeof ballInterval !== "undefined") clearInterval(ballInterval);
      const r = BALL_EL.getBoundingClientRect();
      const p = pt(e);
      window.dragOffsetX = p.x - r.left;
      window.dragOffsetY = p.y - r.top;
      window.lastMouseX = p.x;
      window.lastMouseY = p.y;
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
      if (typeof isDraggingBall === "undefined" || !isDraggingBall) return;
      e.preventDefault();
      const p = pt(e);
      window.ballX = p.x - dragOffsetX;
      window.ballY = p.y - dragOffsetY;
      BALL_EL.style.left = ballX + "px";
      BALL_EL.style.top  = ballY + "px";
      window.ballVX = (p.x - lastMouseX) / 2;
      window.ballVY = (p.y - lastMouseY) / 2;
      window.lastMouseX = p.x;
      window.lastMouseY = p.y;
    }, { passive: false });

    document.addEventListener("touchend", () => {
      if (typeof isDraggingBall !== "undefined" && isDraggingBall) {
        window.isDraggingBall = false;
        if (typeof startBall === "function") startBall(); // resume bouncing
      }
    }, { passive: true });
  }
})();
