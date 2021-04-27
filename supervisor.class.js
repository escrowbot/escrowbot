const Messenger = require("./messenger.class.js");
const Database = require("./database.class.js");
const Prompter = require("./prompter.class.js");
const Escrowbot = require("./escrowbot.class.js");

class Supervisor {
    constructor() {
        this.Prompter = new Prompter();
        this.Database = new Database();
        this.Escrowbot = new Escrowbot({"Database":this.Database});
        this.Messenger = new Messenger({"Prompter":this.Prompter,"Escrowbot":this.Escrowbot});
    }
}

module.exports = Supervisor;