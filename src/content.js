
import $ from 'jquery'

let top_window = window.top || window;


function prepareDownload(target, playlist) {
    let siblings = $(target).siblings("[data-res-author]");
    if (siblings.length > 0) {
        let sibling = siblings[0];
        let url = `http://music.163.com/song/media/outer/url?id=${sibling.dataset.resId}.mp3`;

        chrome.runtime.sendMessage({
            action: "download",
            data: {
                url: url,
                playlist: playlist,
                name: sibling.dataset.resName,
                author: sibling.dataset.resAuthor
            }
        }, (response) => {
            console.log(response)
        })
    }

}


function patch() {
    console.log("try patch");
    try {
        let dls = $("[data-res-action='download']", top_window.frames[0].document);

        let _targets = $("[data-res-action='download'][data-res-type='13']", top_window.frames[0].document);

        if (_targets.length > 0) {
            dls.off();
            dls.on("click", function (e) {
                let resType = parseInt($(this).data("resType"));
                // 歌单下载按钮
                if (resType === 13) {
                    let playlist = $(this).siblings("[data-res-author]")[0].dataset.resName;
                    for (let target of $("[data-res-action='download'][data-res-type='18']", top_window.frames[0].document)) {
                        prepareDownload(target, playlist);
                    }
                }
                // 单曲下载按钮
                else if (resType === 18) {
                    let siblings = $("[data-res-action='download'][data-res-type='13']", top_window.frames[0].document).siblings("[data-res-author]");
                    let playlist;
                    if (siblings.length > 0) {
                        playlist = siblings[0].dataset.resName;
                    }
                    prepareDownload(this, playlist)
                }
                e.stopPropagation();
            })
            console.log("patch successful !")
        }
        else {
            setTimeout(() => { patch() }, 1000)
        }
    }
    catch (err) {
        setTimeout(() => { patch() }, 1000)
    }

}


window.addEventListener("hashchange", function (e) {
    console.log("hashchange", window.location.href)
    setTimeout(() => { patch() }, 1000)
})

patch()