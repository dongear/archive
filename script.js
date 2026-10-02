function formatTime(seconds) {
    if (isNaN(seconds)) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return String(minutes).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

function stopOthers(currentAudio) {
    const allAudio = document.querySelectorAll("audio");
    allAudio.forEach(function (audio) {
        if (audio !== currentAudio) {
            audio.pause();
        }
    });
}

const tracks = document.querySelectorAll(".track");

tracks.forEach(function (track) {
    
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
            audio.play();
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
        if (isNaN(audio.duration)) {
            return;
        }
        const rect = progress.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        audio.currentTime = (clickX / rect.width) * audio.duration;
    });

    title.addEventListener("click", function () {
        track.classList.toggle("open");
    });
});