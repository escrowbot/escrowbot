const Messenger_API = require("facebook-chat-api"),
    fs = require("fs");
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
class Messenger {
    constructor(options) {
        if(typeof options !== "undefined")
            Object.keys(options).forEach(optionName => {
                this[optionName] = options[optionName];
            });

        this.pageID=config.fb_pageID;
        try{
            this.credentials = {appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))};
        }catch(e){
            this.credentials = {email: config.fb_email, password: config.fb_password};
        }
        
        Messenger_API(this.credentials,{"pageID":this.pageID,selfListen: true}, (err, api) => {
            if(err) {
                switch (err.error) {
                    case 'login-approval':
                        setTimeout(()=>{
                            err.continue(this.Prompter.prompt("Code:"));
                        },500);
                        break;
                    default:
                        console.error(err);
                }
                return;
            }
            fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
            
            api.listenMqtt((err, message) => {
                if(err!==null) return console.error(err);
                if(message.type==="message" && message.senderID!==this.pageID) {
                    message.body = this.sanitaze(message.body);
                    if(message.body.length)
                        this.Escrowbot.processMsg(api,message);
                }
            });
        });
    }

    sanitaze(body) {
        return body.toLowerCase().trim();
    }
}

module.exports = Messenger;