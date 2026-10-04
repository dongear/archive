let currentAudio = null;

const nowPlaying = document.querySelector(".now-playing");
const nowText = document.querySelector(".now-playing-text");
const nowTime = document.querySelector(".now-playing-time");

function formatTime(seconds) {
    if (isNaN(seconds)) {
        return "00:00";
    }
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

function stopOthers(currentAudio) {
    document.querySelectorAll("audio").forEach(function (audio) {
        if (audio !== currentAudio) {
            audio.pause();
        }
    });
}

let loopOn = false;

function findFirstTrack() {
    let firstTrack = document.querySelector(".track");
    while (firstTrack && firstTrack.style.display === "none") {
        firstTrack = firstTrack.nextElementSibling;
    }
    return firstTrack;
}

function findNextTrack(track) {
    let nextTrack = track.nextElementSibling;
    while (nextTrack && nextTrack.style.display === "none") {
        nextTrack = nextTrack.nextElementSibling;
    }
    return nextTrack;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function createTrack(item) {
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.group = item.group;
    li.dataset.label = item.number + "  " + item.artist + " - " + item.title;

    const cover = item.cover
        ? `<img src="${escapeHtml(item.cover)}" alt="Обложка ${escapeHtml(item.number)}" class="track-cover" loading="lazy">`
        : "";

    const description = item.description.map(function (paragraph) {
        return `<p class="track-description">${escapeHtml(paragraph)}</p>`;
    }).join("");

    li.innerHTML = `
        <div class="track-row">
            <button class="play-btn">▶</button>
            <span class="track-number">${escapeHtml(item.number)}</span>
            <span class="track-title">${escapeHtml(item.artist)} - ${escapeHtml(item.title)}</span>
            <div class="progress"><div class="progress-fill"></div></div>
            <span class="track-time">00:00 / 00:00</span>
        </div>
        <div class="track-details">
            ${cover}
            <div class="track-info">
                ${description}
                <p class="track-date">${escapeHtml(item.date)}</p>
            </div>
        </div>
        <audio src="${escapeHtml(item.audio)}" preload="metadata"></audio>
    `;

    return li;
}

function setupTrack(track) {
    const audio = track.querySelector("audio");
    const playBtn = track.querySelector(".play-btn");
    const title = track.querySelector(".track-title");
    const progress = track.querySelector(".progress");
    const progressFill = track.querySelector(".progress-fill");
    const time = track.querySelector(".track-time");

    function updateTime() {
        const text = formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
        time.textContent = text;
        if (audio === currentAudio) {
            nowTime.textContent = text;
        }
    }

    playBtn.addEventListener("click", function () {
        if (audio.paused) {
            stopOthers(audio);
            audio.play().catch(function () {
                console.error("Не удалось воспроизвести: " + audio.getAttribute("src"));
            });
        } else {
            audio.pause();
        }
    });

    audio.addEventListener("play", function () {
        playBtn.textContent = "■";
        track.classList.add("playing");
        currentAudio = audio;

        nowPlaying.classList.add("visible");
        nowPlaying.classList.remove("paused");
        nowText.textContent = "> playing: " + track.dataset.label;
        updateTime();
    });

    audio.addEventListener("pause", function () {
        playBtn.textContent = "▶";
        track.classList.remove("playing");
        if (audio === currentAudio) {
            nowPlaying.classList.add("paused");
            nowText.textContent = "> paused: " + track.dataset.label;
        }
    });

    audio.addEventListener("loadedmetadata", updateTime);

    audio.addEventListener("timeupdate", function () {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = percent + "%";
        updateTime();
    });

    audio.addEventListener("ended", function () {
        audio.currentTime = 0;

        let nextTrack = findNextTrack(track);
        if (!nextTrack && loopOn) {
            nextTrack = findFirstTrack();
        }
        if (nextTrack) {
            nextTrack.querySelector(".play-btn").click();
        }
    });

    progress.addEventListener("click", function (event) {
        if (!audio.duration) {
            return;
        }
        const rect = progress.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        audio.currentTime = (clickX / rect.width) * audio.duration;
    });

    title.addEventListener("click", function () {
        track.classList.toggle("open");
    });
}

const trackList = document.querySelector(".track-list");
const filters = document.querySelector(".filters");
const loopBtn = filters.querySelector(".loop-btn");


function createFilters(artists) {
    artists.forEach(function (artist) {
        const button = document.createElement("button");
        button.className = "filter-btn";
        button.dataset.filter = artist.code;
        button.title = artist.name;
        button.textContent = artist.code;

        filters.insertBefore(document.createTextNode(" / "), loopBtn);
        filters.insertBefore(button, loopBtn);
    });
}

filters.addEventListener("click", function (event) {
    const button = event.target.closest(".filter-btn");
    if (!button) {
        return;
    }
    const filter = button.dataset.filter;

    filters.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active");
    });
    button.classList.add("active");

    document.querySelectorAll(".track").forEach(function (track) {
        if (filter === "ALL" || track.dataset.group === filter) {
            track.style.display = "";
        } else {
            track.style.display = "none";
        }
    });
});

fetch("tracks.json", { cache: "no-cache" })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }
        return response.json();
    })
    .then(function (data) {
        createFilters(data.artists);

        data.tracks.forEach(function (item) {
            const track = createTrack(item);
            trackList.appendChild(track);
            setupTrack(track);
        });
    })
    .catch(function (error) {
        console.error("Не удалось загрузить tracks.json:", error);
        trackList.innerHTML = '<li class="track-error">tracks.json не найден. Запусти: node build-tracks.js</li>';
    });

loopBtn.addEventListener("click", function () {
    loopOn = !loopOn;
    loopBtn.classList.toggle("active", loopOn);
    loopBtn.setAttribute("aria-pressed", loopOn);
});

document.addEventListener("keydown", function (event) {
    if (event.code !== "Space") {
        return;
    }
    if (event.target.tagName === "BUTTON") {
        return;
    }

    event.preventDefault();
    if (!currentAudio) {
        const firstTrack = findFirstTrack();
        if (!firstTrack) {
            return;
        }
        currentAudio = firstTrack.querySelector("audio");
    }

    if (currentAudio.paused) {
        stopOthers(currentAudio);
        currentAudio.play().catch(function () {
            console.error("Не удалось воспроизвести: " + currentAudio.getAttribute("src"));
        });
    } else {
        currentAudio.pause();
    }
});
