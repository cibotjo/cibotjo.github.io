const book = document.getElementById("book");
const pages = Array.from(book.querySelectorAll(".page"));
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");
const pageTurnEffectsContainer = document.getElementById("page-turn-effects");
const backgroundAnimationContainer = document.querySelector(".background-animation");
const backgroundMusic = document.getElementById("background-music");
const musicToggleBtn = document.getElementById("music-toggle-btn");

// Calculate the number of spreads (pairs of pages + covers)
const numContentPages = pages.length - 2; // Exclude covers
const numSpreads = 1 + Math.ceil(numContentPages / 2) + 1; // Front Cover + Content Spreads + Back Cover
let currentSpreadIndex = 0; // 0 is the front cover
let musicPlaying = false;

// --- Music Control Logic ---
function toggleMusic() {
    if (musicPlaying) {
        backgroundMusic.pause();
        musicToggleBtn.innerHTML = "&#128263; Musik Mati"; // Muted speaker icon
    } else {
        // Attempt to play, handle potential promise rejection
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Autoplay started!
                musicToggleBtn.innerHTML = "&#128266; Musik Hidup"; // Speaker icon
            }).catch(error => {
                // Autoplay was prevented.
                console.log("Autoplay prevented: ", error);
                // Maybe show a message asking the user to click the button
                musicToggleBtn.innerHTML = "&#128263; Klik untuk Musik";
                musicPlaying = false; // Ensure state is correct
                return; // Exit early if play failed
            });
        }
    }
    musicPlaying = !musicPlaying;
}

// Add event listener to the music toggle button
musicToggleBtn.addEventListener("click", toggleMusic);

// Attempt to play music after first user interaction (e.g., clicking the book)
// This helps bypass autoplay restrictions in some browsers.
function attemptMusicPlayOnInteraction() {
    if (!musicPlaying) {
        console.log("Attempting to play music on user interaction...");
        toggleMusic(); // Try playing now
        // Remove this listener after the first attempt
        document.body.removeEventListener("click", attemptMusicPlayOnInteraction);
        document.body.removeEventListener("touchstart", attemptMusicPlayOnInteraction);
    }
}

// --- Page Flipping Logic ---
function goToSpread(index) {
    // Validate index
    if (index < 0) index = 0;
    if (index >= numSpreads) index = numSpreads - 1;

    const previousSpreadIndex = currentSpreadIndex;
    currentSpreadIndex = index;

    console.log(`Going to spread: ${currentSpreadIndex}`);

    // Update page states (flipped class and z-index)
    pages.forEach((page, i) => {
        const pageDepth = parseInt(page.dataset.pageDepth);
        let zIndex = numSpreads - Math.abs(currentSpreadIndex - pageDepth);

        if (page.classList.contains("cover-front")) {
            if (currentSpreadIndex > 0) {
                page.classList.add("flipped");
                zIndex = numSpreads - currentSpreadIndex;
            } else {
                page.classList.remove("flipped");
                zIndex = numSpreads;
            }
        } else if (page.classList.contains("cover-back")) {
            if (currentSpreadIndex === numSpreads - 1) {
                page.classList.remove("flipped");
                zIndex = numSpreads;
            } else {
                page.classList.add("flipped");
                zIndex = -1;
            }
        } else if (page.classList.contains("page-right")) {
            if (pageDepth < currentSpreadIndex) {
                page.classList.add("flipped");
                zIndex = numSpreads - (currentSpreadIndex - pageDepth);
            } else {
                page.classList.remove("flipped");
            }
        } else if (page.classList.contains("page-left")) {
            if (pageDepth <= currentSpreadIndex) {
                 page.classList.add("flipped");
                 zIndex = numSpreads - (currentSpreadIndex - pageDepth);
            } else {
                 page.classList.remove("flipped");
            }
        }
        page.style.zIndex = zIndex;
    });

    updateNavButtons();

    if (previousSpreadIndex !== currentSpreadIndex) {
        triggerPageTurnEffects(previousSpreadIndex < currentSpreadIndex ? "next" : "prev");
    }
}

// --- Navigation Button Logic ---
function updateNavButtons() {
    prevPageBtn.disabled = currentSpreadIndex === 0;
    nextPageBtn.disabled = currentSpreadIndex === numSpreads - 1;
}

prevPageBtn.addEventListener("click", () => {
    goToSpread(currentSpreadIndex - 1);
});

nextPageBtn.addEventListener("click", () => {
    goToSpread(currentSpreadIndex + 1);
});

// --- Swipe Logic (Mobile) ---
let touchstartX = 0;
let touchendX = 0;

book.addEventListener("touchstart", (e) => {
    touchstartX = e.changedTouches[0].screenX;
    attemptMusicPlayOnInteraction(); // Also try playing on touch
}, { passive: true });

book.addEventListener("touchend", (e) => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchendX < touchstartX - swipeThreshold) {
        goToSpread(currentSpreadIndex + 1);
    } else if (touchendX > touchstartX + swipeThreshold) {
        goToSpread(currentSpreadIndex - 1);
    }
}

// --- Page Turn Effects Logic ---
function triggerPageTurnEffects(direction) {
    pageTurnEffectsContainer.innerHTML = "";
    const effectCount = 15;
    for (let i = 0; i < effectCount; i++) {
        createEffectElement(direction);
    }
}

function createEffectElement(direction) {
    const element = document.createElement("div");
    element.classList.add("effect-element");
    const isHeart = Math.random() > 0.5;
    element.innerHTML = isHeart ? "&#10084;" : "&#10047;";
    element.style.color = isHeart ? `hsl(${Math.random() * 30 + 330}, 100%, ${Math.random() * 30 + 60}%)` : `hsl(${Math.random() * 60 + 280}, 100%, ${Math.random() * 30 + 60}%)`;
    element.style.fontSize = `${Math.random() * 1.5 + 0.5}em`;

    const bookRect = book.getBoundingClientRect();
    const containerRect = pageTurnEffectsContainer.getBoundingClientRect();
    const startX = bookRect.width / 2;
    const startY = bookRect.height / 2;
    element.style.left = `${startX}px`;
    element.style.top = `${startY}px`;
    element.style.position = "absolute";
    pageTurnEffectsContainer.appendChild(element);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (containerRect.width / 3) + 50;
    const endX = startX + Math.cos(angle) * distance;
    const endY = startY + Math.sin(angle) * distance;
    const duration = Math.random() * 1000 + 800;

    element.animate([
        { transform: "translate(-50%, -50%) scale(0.5)", opacity: 1 },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.2) rotate(${Math.random() * 360}deg)`, opacity: 0 },
    ], {
        duration: duration,
        easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        fill: "forwards",
    });

    setTimeout(() => {
        if (element.parentNode === pageTurnEffectsContainer) {
            pageTurnEffectsContainer.removeChild(element);
        }
    }, duration);
}

// --- Background Animation Logic ---
function startBackgroundAnimation() {
    const numHearts = 20;
    for (let i = 0; i < numHearts; i++) {
        const heart = document.createElement("div");
        heart.classList.add("heart-particle");
        heart.innerHTML = "&#10084;";
        heart.style.setProperty("--delay", `${Math.random() * 10}s`);
        heart.style.setProperty("--left", `${Math.random() * 100}%`);
        heart.style.fontSize = `${Math.random() * 1 + 0.5}em`;
        backgroundAnimationContainer.appendChild(heart);
    }
    console.log("Background animation started");
}

// --- Initialization ---
function initializeBook() {
    // Image error handling
    const images = document.querySelectorAll(".page-image");
    images.forEach((img) => {
        img.onerror = () => {
            console.warn(`Image not found: ${img.src}. Hiding image.`);
            img.style.display = "none";
        };
    });

    // Initial music state
    backgroundMusic.pause(); // Ensure it starts paused
    musicPlaying = false;
    musicToggleBtn.innerHTML = "&#128263; Klik untuk Musik"; // Muted icon initially

    // Add listeners for first interaction to play music
    document.body.addEventListener("click", attemptMusicPlayOnInteraction, { once: true });
    document.body.addEventListener("touchstart", attemptMusicPlayOnInteraction, { once: true });

    goToSpread(0);
    startBackgroundAnimation();
}

document.addEventListener("DOMContentLoaded", initializeBook);

