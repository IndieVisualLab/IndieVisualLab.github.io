
import Vue from "./lib/vue.min";
import Member from "./components/member";
import Sketch from "./components/sketch";

class App {

    constructor() {
        const self = this;
        const vue = new Vue({
            el: "#main",
            data: {
                members: []
            },
            mounted: function() {
                self.request("/json/members.json").then((data) => {
                    this.members = data.map((d) => {
                        return new Member(d);
                    });
                });
            }
        });

        const canvas = document.getElementById("background");
        new Sketch(canvas);
    }

    request(path) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) { // `DONE`
                    let status = xhr.status;
                    if (status == 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(status);
                    }
                }
            };
            xhr.send();
        });

    }

}

new App();
