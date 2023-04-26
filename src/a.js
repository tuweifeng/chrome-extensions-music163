// ==UserScript==
// @name         网易云下载
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  try to take over the world!
// @author       You
// @include      *music.163.com*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @grant        none
// ==/UserScript==



function main() {


    // interval 类
    function Intervaler(timeout) {
        this.funcs = {}
        this.queue = []
        this.timeout = timeout
    }


    Intervaler.prototype.start = function () {
        if (this.hasOwnProperty("interval")) {
            this.stop()
        }

        for (let prop in this) {
            if (prop.startsWith("task_") && typeof (this[prop]) == "function") {
                this.funcs[prop] = this[prop]
            }
        }


        this.interval = setInterval(
            handler = async () => {
                for (var funcname in this.funcs) {
                    await this.funcs[funcname]()
                }
                try {
                    this.queue.pop()()
                } catch (error) {

                }
            },
            timeout = this.timeout
        )

        console.log(`Intervaler start`)
        console.log(this.funcs)
    }

    Intervaler.prototype.stop = function () {
        clearInterval(this.interval)
        delete this.interval
    }


    Intervaler.prototype.add = function (...funcs) {
        funcs.forEach(func => {
            this.funcs[func.name] = func
            console.log(`Intervaler add ${func.name}`)
        });
    }

    Intervaler.prototype.remove = function (...funcs) {
        funcs.forEach(func => {
            if (!!func) {
                let funcname = func
                if (typeof (func) == "function") {
                    funcname = func.name
                }
                delete this.funcs[funcname]
            }
            else {
                this.funcs = {}
            }
        });
    }


    function Mp3Downloader(limit = 2) {
        this.name = ""
        this.tasks = []
        this.limit = limit
        this.running = 0
    }
    Mp3Downloader.status = ["READY", "PROGRESS", "SUCCESS", "FAILED", "CANCEL"]

    Mp3Downloader.prototype.get_task = function (mp3_id) {
        for (var i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i]["id"] == mp3_id) {
                return this.tasks[i]
            }
        }
    }

    Mp3Downloader.prototype.cancel = async function (task) {
        if (task["status"] == "READY" || task["status"] == "PROGRESS") {
            console.log("cancel", task)
            task["action"] = "CANCEL"
            this._update_status(task["id"], "CANCEL")
        }
    }

    Mp3Downloader.prototype.cancel_all = async function () {
        for (var i = 0; i < this.tasks.length; i++) {
            this.cancel(this.tasks[i])
        }
    }

    Mp3Downloader.prototype.cancel_current_page_task = async function () {
        let tasks = this.get_current_page_tasks()
        for (var i = 0; i < tasks.length; i++) {
            this.cancel(tasks[i])
        }
    }

    Mp3Downloader.prototype.add_task = async function (mp3_id, filename) {
        let task = this.get_task(mp3_id)
        if (task) {
            if (task["status"] == "READY" || task["status"] == "PROGRESS" || task["status"] == "SUCCESS") {
                console.log(`${filename} 已在下载任务中，请不要重复下载`)
            }
            else {
                this._update_status(mp3_id, "READY")
                task["action"] = ""
            }
        }
        else {
            this.tasks.push({
                "id": mp3_id,
                "filename": filename,
                "url": `http://music.163.com/song/media/outer/url?id=${mp3_id}.mp3`,
                "status": "READY",
                "action": ""
            })
        }
    }

    Mp3Downloader.prototype._update_status = async function (mp3_id, status = '') {
        let status_map = {
            "READY": {
                "progress": false,
                "msg": {
                    "text": "准备下载",
                    "show": true,
                    "css": {
                        "color": "#333"
                    },
                }
            },
            "PROGRESS": {
                "progress": true,
                "msg": {
                    "text": "正在下载",
                    "show": false,
                    "css": {
                        "color": "blue"
                    }
                }
            },
            "SUCCESS": {
                "progress": false,
                "msg": {
                    "text": "下载成功",
                    "show": true,
                    "css": {
                        "color": "green"
                    }
                }
            },
            "FAILED": {
                "progress": false,
                "msg": {
                    "show": true,
                    "text": "下载失败",
                    "css": {
                        "color": "red"
                    }
                }
            },
            "CANCEL": {
                "progress": false,
                "msg": {
                    "show": true,
                    "text": "已被取消",
                    "css": {
                        "color": "red"
                    }
                }
            },
        }
        let progress = $(`#progress_${mp3_id}`, frames["contentFrame"].document)
        let progress_status = $(`#progress_status_${mp3_id}`, frames["contentFrame"].document)
        let close_btn = $(`#progress_close_${mp3_id}`, frames["contentFrame"].document)
        let redo_btn = $(`#progress_redo_${mp3_id}`, frames["contentFrame"].document)
        let success_btn = $(`#progress_success_${mp3_id}`, frames["contentFrame"].document)

        let task = this.get_task(mp3_id)
        status = status || task["status"]
        progress_status.text(status_map[status]["msg"]["text"])
        progress_status.css(status_map[status]["msg"]["css"])
        if (status_map[status]["msg"]["show"]) {
            progress_status.show()
        }
        else {
            progress_status.hide()
        }
        if (status_map[status]["progress"]) {
            progress.show()
            close_btn.show()
            redo_btn.hide()
            success_btn.hide()
        }
        else {
            progress.hide()
            if (status == "READY") {
                close_btn.show()
                redo_btn.hide()
                success_btn.hide()
            }
            else {
                close_btn.hide()
                if (status == "SUCCESS") {
                    success_btn.show()
                }
                else {
                    redo_btn.show()
                }
            }
        }
        task["status"] = status
    }

    Mp3Downloader._cancel_download_mp3 = function (e) {
        let close_btn = $(e.target)
        // close_btn.parent().remove()
        let task = window.top.mp3downloader.get_task(close_btn.data("id"))
        window.top.mp3downloader.cancel(task)
    }

    Mp3Downloader._redo_download_mp3 = function (e) {
        let redo_btn = $(e.target)
        let task = window.top.mp3downloader.get_task(redo_btn.data("id"))
        window.top.mp3downloader.add_task(task["id"], task["filename"])
    }


    Mp3Downloader.prototype._add_progress = async function (parent, mp3_id, tagname = "div", attrs = "") {
        let child = parent.children(`#progress_td_${mp3_id}`)
        if (!!!child.length) {
            child = $(`
            <${tagname} ${attrs} id="progress_td_${mp3_id}">
                <span id="progress_status_${mp3_id}">准备下载</span>
                &nbsp
                <progress style="display:none" id="progress_${mp3_id}"></progress>
            </${tagname}>`)
            child.css({
                "white-space": "nowrap",
                "display": "flex",
                "justify-content": "space-between",
                "align-items": "center",
            })
            let close_btn = $(`<span id="progress_close_${mp3_id}" class="close-progress" data-id="${mp3_id}">X</span>`)
            close_btn.css({
                "background-color": "red",
                "cursor": "pointer",
                "border-radius": "50%",
                "width": "12px",
                "min-width": "12px",
                "height": "12px",
                "min-height": "12px",
                "line-height": "12px",
                "display": "inline-block",
                "text-align": "center",
                "font-weight": "bold",
                "color": "white"
            })
            close_btn.click(Mp3Downloader._cancel_download_mp3)
            child.prepend(close_btn)

            let redo_btn = $(`<span id="progress_redo_${mp3_id}" class="redo-progress" data-id="${mp3_id}">↺</span>`)
            redo_btn.css({
                "background-color": "red",
                "cursor": "pointer",
                "border-radius": "50%",
                "width": "12px",
                "min-width": "12px",
                "height": "12px",
                "min-height": "12px",
                "line-height": "12px",
                "display": "none",
                "text-align": "center",
                "font-weight": "bold",
                "color": "white"
            })
            redo_btn.click(Mp3Downloader._redo_download_mp3)
            child.prepend(redo_btn)

            let success_btn = $(`<span id="progress_success_${mp3_id}" class="success-progress" data-id="${mp3_id}">✓</span>`)
            success_btn.css({
                "background-color": "green",
                "cursor": "pointer",
                "border-radius": "50%",
                "width": "12px",
                "min-width": "12px",
                "height": "12px",
                "min-height": "12px",
                "line-height": "12px",
                "display": "none",
                "text-align": "center",
                "font-weight": "bold",
                "color": "white"
            })
            child.prepend(success_btn)

            parent.append(child);
        }

    }


    Mp3Downloader.prototype._update_progress = async function (mp3_id, max, value) {
        let progress = $(`#progress_${mp3_id}`, frames["contentFrame"].document)
        let progress_status = $(`#progress_status_${mp3_id}`, frames["contentFrame"].document)
        let task = this.get_task(mp3_id)
        let status = task["status"]

        if (Number.isInteger(value) && Number.isInteger(max)) {
            if (value == 0 && max == 0) {
                status = "READY"
            }
            else if (max == value && max != 0) {
                status = "SUCCESS"
            }
            else {
                status = "PROGRESS"
            }
            progress.attr({
                "max": max,
                "value": value
            })
        }

        this._update_status(mp3_id, status)
    }


    Mp3Downloader.prototype.start = async function () {
        if (this.running < this.limit) {
            for (var i = 0; i < this.tasks.length; i++) {
                let task = this.tasks[i]
                if (task && task["status"] == "READY") {
                    this.running += 1
                    this._update_progress(task["id"], 100, 0)
                    // this._update_status(task["id"], "PROGRESS")
                    this._download(task["id"], task["url"], task["filename"])
                    break
                }
            }
        }
    }

    Mp3Downloader.prototype.get_current_page_tasks = function () {
        let dlbtn = $("[data-res-action=download]", frames["contentFrame"].document)
        let cur_page_tasks = []
        for (var i = 0; i < dlbtn.length; i++) {
            let mp3_id = $(dlbtn[i]).data("res-id")
            let task = this.get_task(mp3_id)
            if (task) {
                cur_page_tasks.push(task)
            }
        }
        return cur_page_tasks
    }

    Mp3Downloader.prototype._download = async function (mp3_id, url, filename) {
        console.log("正在下载:", filename, mp3_id, url)
        let response = await fetch(url)
        let contentLength = response.headers.get('content-length')
        let total = parseInt(contentLength, 10)
        let loaded = 0;
        let this_downloader = this
        let res = new Response(new ReadableStream({
            async start(controller) {
                let reader = response.body.getReader();
                for (; ;) {
                    if (this_downloader.get_task(mp3_id)["action"] == "CANCEL") {
                        console.log("取消中")
                        break
                    }
                    let { done, value } = await reader.read();
                    if (done) break;
                    loaded += value.byteLength;
                    this_downloader._update_progress(mp3_id, total, loaded)
                    controller.enqueue(value);
                }
                controller.close();
            },
        }));
        console.log(response)
        if (response.url.endsWith(".mp3")) {
            // 内容转变成blob地址
            let blob = await res.blob()
            if (this_downloader.get_task(mp3_id)["action"] == "CANCEL") {
                console.log("取消下载")
                this_downloader._update_status(mp3_id, "CANCEL")
            }
            else {
                // 创建隐藏的可下载链接
                let objectUrl = window.URL.createObjectURL(blob)
                console.log("正在转换:", objectUrl)
                let _dlbtn = $(`<a class="u-btni u-btni-dl" href="${objectUrl}" target="_blank" download="${filename}"><i>下载</i></a>`)
                _dlbtn[0].click()
                console.log("下载成功:", `${filename}`)
            }
        }
        else {
            console.log("下载失败")
            this._update_status(mp3_id, "FAILED")
        }
        this.running -= 1
    }



    function Monkeypatch() {
        this.patch_map = {
            "/artist?": [
                {
                    "handler": Monkeypatch.handler.add_meta,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_download_all_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.fix_table_download_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_progress,
                    "open": true
                }
            ],
            "/playlist?": [
                {
                    "handler": Monkeypatch.handler.add_meta,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_download_all_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.fix_table_download_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_progress,
                    "open": true
                }
            ],
            "/toplist?": [
                {
                    "handler": Monkeypatch.handler.add_meta,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_download_all_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.fix_table_download_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_progress,
                    "open": true
                }
            ],

            "/album?": [
                {
                    "handler": Monkeypatch.handler.add_meta,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_download_all_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.fix_table_download_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_table_progress,
                    "open": true
                }
            ],
            "/song?": [
                {
                    "handler": Monkeypatch.handler.add_meta,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.fix_download_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_progress,
                    "open": true
                }
            ],
            "/home?": [
                {
                    "handler": Monkeypatch.handler.add_meta,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.fix_list_download_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_list_progress,
                    "open": true
                }
            ],
            "/rank?": [
                {
                    "handler": Monkeypatch.handler.add_meta,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.fix_list_download_btn,
                    "open": true
                },
                {
                    "handler": Monkeypatch.handler.add_list_progress,
                    "open": true
                }
            ]
        }
    }

    Monkeypatch.handler = function () { }

    Monkeypatch.handler.add_meta = function () {
        // 添加meta，支持http升级为https
        let meta = `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`
        $("head").prepend(meta)
        return true
    }

    Monkeypatch.handler.download_mp3 = function (dlbtn) {

        let title = $(".cnt .f-ff2").first().text()
        let artist = $(".cnt .des .s-fc7").first().text()
        let filename = `${title} - ${artist}.mp3`
        let mp3_id = dlbtn.data("res-id")
        window.top.mp3downloader._add_progress($("#content-operation"), mp3_id, tagname = "a", attrs = `class="u-btni"`)
        return window.top.mp3downloader.add_task(mp3_id, filename)
    }




    Monkeypatch.handler.table_download_mp3 = function (curbtn) {
        let tr = curbtn.closest("tr")
        let title = tr.children("td:nth-child(2)").find("b").attr("title")
        let artist = $("#artist-name").first().text()
        if (!artist) {
            artist = tr.children("td:nth-child(4)").find("span").attr("title")
        }

        let filename = `${title} - ${artist}.mp3`
        let mp3_id = curbtn.data("res-id")
        window.top.mp3downloader._add_progress(tr, mp3_id, tagname = "td")
        return window.top.mp3downloader.add_task(mp3_id, filename)
    }

    Monkeypatch.handler.list_download_mp3 = function (curbtn) {
        let tr = curbtn.closest("li")
        console.log(tr)
        let title = tr.children(".song").find(".txt b").attr("title")
        let artist = tr.children(".song").find(".ar span").attr("title")
        let filename = `${title} - ${artist}.mp3`
        let mp3_id = curbtn.data("res-id")
        window.top.mp3downloader._add_progress(tr.find(".tops"), mp3_id, tagname = "div")
        return window.top.mp3downloader.add_task(mp3_id, filename)
    }

    Monkeypatch.handler.fix_download_btn = function () {
        let dlbtn = $("[data-res-action=download]")
        if (dlbtn) {
            dlbtn.on("click", function (e) {
                Monkeypatch.handler.download_mp3(dlbtn)
                e.stopPropagation();
            })
            console.log("替换 download_btn 成功")
            return true
        }
    }

    Monkeypatch.handler.fix_list_download_btn = function () {
        let dlbtn = $("[data-res-action=download]")
        console.log("dltbn", dlbtn)
        if (dlbtn) {
            dlbtn.on("click", function (e) {
                Monkeypatch.handler.list_download_mp3($(e.target))
                e.stopPropagation();
            })
            console.log("替换 download_btn 成功")
            return true
        }
    }

    Monkeypatch.handler.fix_table_download_btn = function () {
        let dlbtn = $("table [data-res-action=download]")
        if (dlbtn) {
            dlbtn.on("click", function (e) {
                Monkeypatch.handler.table_download_mp3($(e.target))
                e.stopPropagation();
            })
            console.log("替换 download_btn2 成功")
            return true
        }
    }

    Monkeypatch.handler.add_table_progress = function () {
        for (var i = 0; i < window.top.mp3downloader.tasks.length; i++) {
            try {
                let task = window.top.mp3downloader.tasks[i]
                let tr = $(`[data-res-id="${task["id"]}"][data-res-action="download"]`).closest("tr")
                window.top.mp3downloader._add_progress(tr, task["id"], tagname = "td")
                window.top.mp3downloader._update_status(task["id"], task["status"])
            }
            catch (e) {
                console.log(e)
            }
        }
        return true
    }

    Monkeypatch.handler.add_list_progress = function () {
        for (var i = 0; i < window.top.mp3downloader.tasks.length; i++) {
            try {
                let task = window.top.mp3downloader.tasks[i]
                let tr = $(`[data-res-id="${task["id"]}"][data-res-action="download"]`).closest("li")
                console.log("add_list_progress", tr)
                window.top.mp3downloader._add_progress(tr.find(".tops"), task["id"], tagname = "div")
                window.top.mp3downloader._update_status(task["id"], task["status"])
            }
            catch (e) {
                console.log(e)
            }
        }
        return true
    }

    Monkeypatch.handler.add_progress = function () {
        try {
            $("[data-res-action=comment]").hide()
            $("[data-res-action=share]").hide()
            let mp3_id = $("[data-res-action=download]").data("res-id")
            let task = window.top.mp3downloader.get_task(mp3_id)
            if (!!task) {
                window.top.mp3downloader._add_progress($("#content-operation"), task["id"], tagname = "a", attrs = `class="u-btni"`)
                window.top.mp3downloader._update_status(task["id"], task["status"])
            }
            return true
        }
        catch (e) {
            console.log(e)
        }
    }

    Monkeypatch.handler.add_table_download_all_btn = function () {
        console.log("add_table_download_all_btn", $('body'))
        let operations = $("[class='btns f-cb']")
        let download_all_btn = $("#download_all")
        if (operations && download_all_btn.length == 0) {

            cancel_download_all_btn = $(`<a class="u-btni"></span>取消</a>`)
            cancel_download_all_btn.click(function (e) {
                console.log("取消下载")
                window.top.mp3downloader.cancel_current_page_task()
                e.stopPropagation();
            })

            download_all_btn = $(`<a id="download_all" class="u-btni u-btni-dl" hidefocus="true" title="下载"><i>下载</i></a>`)
            download_all_btn.click(function (e) {
                console.log("全部下载")
                let dlbtn = $("[data-res-action=download]")
                for (var i = 0; i < dlbtn.length; i++) {
                    Monkeypatch.handler.table_download_mp3($(dlbtn[i]))
                }
                e.stopPropagation();
            })
            $("[class='btns f-cb'] [data-res-action=download]").remove()
            $("[class='btns f-cb'] [data-res-action=comment]").remove()
            operations.append(download_all_btn)
            operations.append(cancel_download_all_btn)
            return true
        }
    }

    let intervaler = window.top.intervaler || new Intervaler(1000)
    window.top.intervaler = intervaler
    let monkeypatch = new Monkeypatch()
    window.top.mp3downloader = window.top.mp3downloader || new Mp3Downloader(2)

    intervaler.task_monkeypatch = async function () {
        var flag = true
        for (var route in monkeypatch.patch_map) {

            console.log(window.location.href)

            if (window.location.href.indexOf(route) > -1) {
                console.log(`match patch_map '${route}'`)
                for (var i in monkeypatch.patch_map[route]) {
                    var func = monkeypatch.patch_map[route][i]
                    if (func["open"]) {
                        console.log(route, func)
                        flag = flag & !!func["handler"]()
                    }
                }
                break
            }
        }
        if (flag) {
            console.log("替换成功")
            intervaler.remove("task_monkeypatch")
        }

    }

    intervaler.task_download_mp3 = async function () {
        window.top.mp3downloader.start()
    }



    if (window.name != "contentFrame") {
        return
    }

    intervaler.start()

}

(function () {
    window.addEventListener("hashchange", function (e) {
        console.log("hashchange", window.location.href)
        main()
    })
    main()
}

)();

