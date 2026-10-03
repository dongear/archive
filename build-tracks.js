// Собирает tracks.json из папок tracks/<номер>/.
// Запуск: node build-tracks.js

const fs = require("fs");
const path = require("path");

// Альтер эго: первые две буквы номера → имя исполнителя.
// Чтобы добавить новое, допиши строку сюда — кнопка фильтра появится сама
// (кнопки идут в том же порядке, что и строки).
const ARTISTS = {
    DG: "Don gear",
    CC: "¢reepyforda¢reepin",
};

const TRACKS_DIR = path.join(__dirname, "tracks");
const OUTPUT_FILE = path.join(__dirname, "tracks.json");

// "title: ...", "date: ...", пустая строка, дальше описание.
function parseInfo(text) {
    const lines = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
    const info = {};

    let i = 0;
    for (; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") {
            break;
        }
        const colon = line.indexOf(":");
        if (colon === -1) {
            break;
        }
        const key = line.slice(0, colon).trim().toLowerCase();
        info[key] = line.slice(colon + 1).trim();
    }

    const description = lines.slice(i).join("\n").trim();
    info.description = description
        ? description.split(/\n\s*\n/).map(function (p) { return p.trim(); })
        : [];

    return info;
}

// "19.09.2026" → число для сортировки. Неправильная дата → 0 (уходит вниз).
function dateValue(date) {
    const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(date || "");
    if (!match) {
        return 0;
    }
    return Number(match[3]) * 10000 + Number(match[2]) * 100 + Number(match[1]);
}

const tracks = [];

const folders = fs.existsSync(TRACKS_DIR)
    ? fs.readdirSync(TRACKS_DIR, { withFileTypes: true })
    : [];

folders.forEach(function (entry) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
        return;
    }

    const folder = entry.name;
    const dir = path.join(TRACKS_DIR, folder);

    if (!fs.existsSync(path.join(dir, "audio.mp3"))) {
        console.warn("Пропускаю " + folder + ": нет audio.mp3");
        return;
    }

    const infoPath = path.join(dir, "info.txt");
    const info = fs.existsSync(infoPath)
        ? parseInfo(fs.readFileSync(infoPath, "utf8"))
        : { description: [] };
    if (!fs.existsSync(infoPath)) {
        console.warn(folder + ": нет info.txt, название = номер");
    }

    const number = folder.toUpperCase();
    const group = number.slice(0, 2);
    if (!ARTISTS[group]) {
        console.warn(folder + ": неизвестное альтер эго " + group + ", добавь его в ARTISTS");
    }
    if (info.date && !dateValue(info.date)) {
        console.warn(folder + ": дата \"" + info.date + "\" не в формате ДД.ММ.ГГГГ");
    }

    const hasCover = fs.existsSync(path.join(dir, "cover.jpg"));

    tracks.push({
        number: number,
        group: group,
        artist: ARTISTS[group] || group,
        title: info.title || number,
        date: info.date || "",
        description: info.description,
        audio: "tracks/" + folder + "/audio.mp3",
        cover: hasCover ? "tracks/" + folder + "/cover.jpg" : null,
    });
});

// Новые сверху; при одинаковой дате — больший номер выше.
tracks.sort(function (a, b) {
    return dateValue(b.date) - dateValue(a.date) || b.number.localeCompare(a.number);
});

const artists = Object.keys(ARTISTS).map(function (code) {
    return { code: code, name: ARTISTS[code] };
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ artists: artists, tracks: tracks }, null, 2) + "\n");
console.log("tracks.json: " + tracks.length + " трек(ов)");
