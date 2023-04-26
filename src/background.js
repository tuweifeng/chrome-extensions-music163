
function Action() { }

Action.download = async function (data) {
    let { url, playlist, name, author } = data;
    let filename = `《${name}》- ${author}.mp3`;
    playlist = playlist || author;
    if (playlist) {
        filename = `${playlist.replace(/\//g, " & ")}/${filename.replace(/\//g, " & ")}`
    }
    else {
        filename = `${filename.replace(/\//g, " & ")}`
    }

    try {
        let response = await fetch(url, { method: 'HEAD' });
        // 'audio/mpeg;charset=UTF-8'
        if (response.headers.get("content-type")?.startsWith("audio")) {
            chrome.downloads.download({ url: url, filename: filename, conflictAction: "prompt", method: "GET" }, (downloadId) => { })
        }
    }
    catch (err) {
        console.log(`${data} 资源不存在, 可能是VIP专享或者已下架`);

        chrome.notifications.create(Math.random() + "", {
            type: 'basic',
            title: `下载失败: VIP专享或者已下架`,
            message: `《${name}》- ${author}`,
            iconUrl: 'assets/icon/icon128.png',
        });

    }

}

chrome.runtime.onMessage.addListener(async ({ action, data }, sender, sendResponse) => {
    let handler = Reflect.get(Action, action);
    if (handler) {
        handler(data);
        sendResponse({ "code": 0, "data": { action: action, data: data }, "msg": "调用成功" });
    }
    else {
        sendResponse({ "code": 404, "data": { action: action, data: data }, "msg": "不存在该方法" });
    }
})
