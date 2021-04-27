const readline = require("readline");

class Prompter {
    constructor() {
        this.hide = false;
        this.active = false;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        process.stdin.custom = this;
        process.stdin.on("data", (char) => {
            if(process.stdin.custom.active && process.stdin.custom.hide) {
                char = char + "";
                switch (char) {
                    case "\n":
                    case "\r":
                    case "\u0004":
                        process.stdin.custom.stdin.pause();
                        break;
                    default:
                        process.stdout.write("\x1B[2K\x1B[200D" + process.stdin.custom.query /*+ Array(process.stdin.custom.rl.line.length+1).join("*")*/);
                        break;
                }
            }
        });
    }

    display(display) {
        process.stdin.custom.hide = !display;
    }

    prompt(query) {
        process.stdin.custom.active = true;
        process.stdin.custom.query = query;
        process.stdin.custom.stdin = process.openStdin();
        return new Promise((res,rej)=>{
            process.stdin.custom.rl.question(query, function(value) {
                process.stdin.custom.rl.history = process.stdin.custom.rl.history.slice(1);
                process.stdin.custom.active = false;
                res(value);
            });
        });
    }
}

module.exports = Prompter;