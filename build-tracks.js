// Собирает tracks.json из папок tracks/<номер>/
// и posts.json из папок posts/<номер>/.
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

// Типы постов журнала: первые две буквы номера → название.
// Кнопки фильтра на journal.html идут в том же порядке.
const POST_TYPES = {
    BK: "Books",
    FM: "Films",
    PH: "Photos",
};

const TRACKS_DIR = path.join(__dirname, "tracks");
const OUTPUT_FILE = path.join(__dirname, "tracks.json");
const POSTS_DIR = path.join(__dirname, "posts");
const POSTS_FILE = path.join(__dirname, "posts.json");
const IMAGE_FILE = /\.(jpe?g|png)$/i;

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

// Папки внутри dir (без скрытых), или [] если dir нет.
function listFolders(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(function (entry) {
            return entry.isDirectory() && !entry.name.startsWith(".");
        })
        .map(function (entry) {
            return entry.name;
        });
}

// Новые сверху; при одинаковой дате — больший номер выше.
function newestFirst(a, b) {
    return dateValue(b.date) - dateValue(a.date) || b.number.localeCompare(a.number);
}

function buildTracks() {
    const tracks = [];

    listFolders(TRACKS_DIR).forEach(function (folder) {
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

    tracks.sort(newestFirst);

    const artists = Object.keys(ARTISTS).map(function (code) {
        return { code: code, name: ARTISTS[code] };
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ artists: artists, tracks: tracks }, null, 2) + "\n");
    console.log("tracks.json: " + tracks.length + " трек(ов)");
}

function buildPosts() {
    const posts = [];

    listFolders(POSTS_DIR).forEach(function (folder) {
        const dir = path.join(POSTS_DIR, folder);

        const infoPath = path.join(dir, "info.txt");
        if (!fs.existsSync(infoPath)) {
            console.warn("Пропускаю " + folder + ": нет info.txt");
            return;
        }
        const info = parseInfo(fs.readFileSync(infoPath, "utf8"));

        const number = folder.toUpperCase();
        const type = number.slice(0, 2);
        if (!POST_TYPES[type]) {
            console.warn(folder + ": неизвестный тип " + type + ", добавь его в POST_TYPES");
        }
        if (!info.date) {
            console.warn(folder + ": нет date, пост уйдёт в самый низ");
        } else if (!dateValue(info.date)) {
            console.warn(folder + ": дата \"" + info.date + "\" не в формате ДД.ММ.ГГГГ");
        }

        // Все .jpg/.jpeg/.png по имени файла (numeric: 2.jpg раньше 10.jpg).
        const images = fs.readdirSync(dir)
            .filter(function (name) {
                return IMAGE_FILE.test(name);
            })
            .sort(function (a, b) {
                return a.localeCompare(b, undefined, { numeric: true });
            })
            .map(function (name) {
                return "posts/" + folder + "/" + encodeURIComponent(name);
            });

        // Поля, которых нет в info.txt, в JSON будут null.
        posts.push({
            number: number,
            type: type,
            title: info.title || number,
            author: info.author || null,
            director: info.director || null,
            year: info.year || null,
            date: info.date || "",
            text: info.description,
            images: images,
        });
    });

    posts.sort(newestFirst);

    const types = Object.keys(POST_TYPES).map(function (code) {
        return { code: code, name: POST_TYPES[code] };
    });

    fs.writeFileSync(POSTS_FILE, JSON.stringify({ types: types, posts: posts }, null, 2) + "\n");
    console.log("posts.json: " + posts.length + " пост(ов)");
}

buildTracks();
buildPosts();
