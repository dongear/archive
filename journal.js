function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const postList = document.querySelector(".post-list");
const filters = document.querySelector(".filters");

// BK: "название — автор", FM: "название — режиссёр, год", PH: "название".
// Пустые поля (null) просто пропускаются.
function postTitle(item) {
    let title = item.title;

    if (item.type === "BK" && item.author) {
        title = title + " — " + item.author;
    }

    if (item.type === "FM") {
        const extra = [item.director, item.year].filter(Boolean).join(", ");
        if (extra) {
            title = title + " — " + extra;
        }
    }

    return title;
}

function createPost(item) {
    const li = document.createElement("li");
    li.className = "post";
    li.dataset.type = item.type;

    const images = item.images.map(function (src, index) {
        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(item.number)}" class="post-thumb" data-index="${index}" loading="lazy">`;
    }).join("");

    const text = item.text.map(function (paragraph) {
        return `<p class="post-text">${escapeHtml(paragraph)}</p>`;
    }).join("");

    li.innerHTML = `
        <div class="post-row">
            <span class="post-number">${escapeHtml(item.number)}</span>
            <span class="post-title">${escapeHtml(postTitle(item))}</span>
            <span class="post-date">${escapeHtml(item.date)}</span>
        </div>
        <div class="post-details">
            ${images ? `<div class="post-images">${images}</div>` : ""}
            ${text}
        </div>
    `;

    li.querySelector(".post-row").addEventListener("click", function () {
        li.classList.toggle("open");
    });

    li.querySelectorAll(".post-thumb").forEach(function (thumb) {
        thumb.addEventListener("click", function () {
            openLightbox(item.images, Number(thumb.dataset.index));
        });
    });

    return li;
}

// Кнопки BK / FM / PH берутся из POST_TYPES в build-tracks.js.
function createFilters(types) {
    types.forEach(function (type) {
        const button = document.createElement("button");
        button.className = "filter-btn";
        button.dataset.filter = type.code;
        button.title = type.name;
        button.textContent = type.code;

        filters.appendChild(document.createTextNode(" / "));
        filters.appendChild(button);
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

    document.querySelectorAll(".post").forEach(function (post) {
        if (filter === "ALL" || post.dataset.type === filter) {
            post.style.display = "";
        } else {
            post.style.display = "none";
        }
    });
});

// Лайтбокс: картинка крупно поверх страницы.
const lightbox = document.querySelector(".lightbox");
const lightboxImg = lightbox.querySelector(".lightbox-img");
const lightboxCount = lightbox.querySelector(".lightbox-count");
const lightboxPrev = lightbox.querySelector(".lightbox-prev");
const lightboxNext = lightbox.querySelector(".lightbox-next");

let lightboxImages = [];
let lightboxIndex = 0;

function showImage(index) {
    // По кругу: после последней — первая, перед первой — последняя.
    lightboxIndex = (index + lightboxImages.length) % lightboxImages.length;
    lightboxImg.src = lightboxImages[lightboxIndex];
    lightboxCount.textContent = (lightboxIndex + 1) + " / " + lightboxImages.length;
}

function openLightbox(images, index) {
    lightboxImages = images;
    lightbox.classList.toggle("single", images.length === 1);
    showImage(index);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    document.body.style.overflow = "";
}

lightboxPrev.addEventListener("click", function () {
    showImage(lightboxIndex - 1);
});

lightboxNext.addEventListener("click", function () {
    showImage(lightboxIndex + 1);
});

// Клик по фону закрывает, клик по картинке и кнопкам — нет.
lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

document.addEventListener("keydown", function (event) {
    if (lightbox.hidden) {
        return;
    }
    if (event.key === "Escape") {
        closeLightbox();
    } else if (event.key === "ArrowLeft") {
        showImage(lightboxIndex - 1);
    } else if (event.key === "ArrowRight") {
        showImage(lightboxIndex + 1);
    }
});

fetch("posts.json", { cache: "no-cache" })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }
        return response.json();
    })
    .then(function (data) {
        createFilters(data.types);

        data.posts.forEach(function (item) {
            postList.appendChild(createPost(item));
        });
    })
    .catch(function (error) {
        console.error("Не удалось загрузить posts.json:", error);
        postList.innerHTML = '<li class="track-error">posts.json не найден. Запусти: node build-tracks.js</li>';
    });
