const COMMENTS_SERVER = "https://archive-comments.vercel.app";

const WALINE_URL = "https://unpkg.com/@waline/client@v3/dist/";

let walineLoading = null;

function loadWaline() {
    if (!walineLoading) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = WALINE_URL + "waline.css";
        document.head.appendChild(css);

        walineLoading = import(WALINE_URL + "waline.js");
    }
    return walineLoading;
}

function mountComments(container, id) {
    if (!COMMENTS_SERVER || container.dataset.mounted) {
        return;
    }
    container.dataset.mounted = "true";

    loadWaline()
        .then(function (waline) {
            waline.init({
                el: container,
                serverURL: COMMENTS_SERVER,
                path: id,
                lang: "en",
                locale: {
                    nick: "Name",
                    placeholder: "Leave a comment",
                    sofa: "No comments yet.",
                },
                login: "disable",
                meta: ["nick"],
                requiredMeta: ["nick"],
                emoji: false,
                reaction: false,
                search: false,
                imageUploader: false,
                pageview: false,
                comment: false,
                noCopyright: true,
                noRss: true,
            });
        })
        .catch(function (error) {
            console.error("Не удалось загрузить комментарии:", error);
            delete container.dataset.mounted;
        });
}
