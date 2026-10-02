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

function createTrack(item) {
    const file = item.number.toLowerCase();
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.group = item.number.slice(0, 2);

    li.innerHTML = `
        <div class="track-row">
            <button class="play-btn">▶</button>
            <span class="track-number">${item.number}</span>
            <span class="track-title">${item.artist} - ${item.title}</span>
            <div class="progress"><div class="progress-fill"></div></div>
            <span class="track-time">00:00 / 00:00</span>
        </div>
        <div class="track-details">
            <img src="covers/${file}.jpg" alt="Обложка ${item.number}" class="track-cover" loading="lazy">
            <div class="track-info">
                <p class="track-description">${item.description}</p>
                <p class="track-date">${item.date}</p>
            </div>
        </div>
        <audio src="music/${file}.mp3" preload="metadata"></audio>
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
        time.textContent = formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
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
    });

    audio.addEventListener("pause", function () {
        playBtn.textContent = "▶";
    });

    audio.addEventListener("loadedmetadata", updateTime);

    audio.addEventListener("timeupdate", function () {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = percent + "%";
        updateTime();
    });

    audio.addEventListener("ended", function () {
        audio.currentTime = 0;
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

archive.forEach(function (item) {
    const track = createTrack(item);
    trackList.appendChild(track);
    setupTrack(track);
});

const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const filter = button.dataset.filter;

        filterButtons.forEach(function (b) {
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
});