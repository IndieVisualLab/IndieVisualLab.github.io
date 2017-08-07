
export default class Member {

    constructor(data) {
        this.name = "@" + data.name;
        this.github = "https://github.com/" + data.github;
        this.twitter = (data.twitter) ? "https://twitter.com/" + data.twitter : "";
        this.personal = (data.personal) ? "http://" + data.personal : "";
    }

}

