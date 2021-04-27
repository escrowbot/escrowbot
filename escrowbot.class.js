const Promise = require("bluebird");
const fburl="facebook.com/";


class Escrowbot {
    constructor(options) {
        if(typeof options !== "undefined")
            Object.keys(options).forEach(optionName => {
                this[optionName] = options[optionName];
            });
    }
    async processMsg(api,message) {
        api = Promise.promisifyAll(api);
        const senderfbuser = await this.getFbUser(api,message.senderID);
        let reg = false;
        try{
            await this.addFbUser(senderfbuser);
            reg = true;
            setTimeout(()=>{
                api.sendMessageAsync(
`ℹ️Ahora estás registrad@ en Escrowbot, tu 🆔 es: ${senderfbuser.fbid}. Compartilo a quien quieras!
También mediante el sitio web escrowbot.io/${senderfbuser.fbid}
Para más comandos hablanos`,message.threadID);
            },100);
        }catch(e){
            if(e.code !== "ER_DUP_ENTRY")
                return api.sendMessageAsync(`❌Lo lamentamos, hubo un problema. Pronto lo solucionaremos.\n`,message.threadID);
            // update
            let user_db = await this.getUser(senderfbuser.fbid);
            if(user_db.fbname != senderfbuser.fbname || user_db.fbprofileurl != senderfbuser.fbprofileurl)
            {
                if(user_db.fbname !== senderfbuser.fbname) {
                    await this.logUpdate({
                        tipo: "fbname",
                        original: user_db.fbname,
                        reemplazo: senderfbuser.fbname
                    });
                    user_db.fbname = senderfbuser.fbname;
                }
                if(user_db.fbprofileurl !== senderfbuser.fbprofileurl) {
                    await this.logUpdate({
                        tipo: "fbprofileurl",
                        original: user_db.fbprofileurl,
                        reemplazo: senderfbuser.fbprofileurl
                    });
                    user_db.fbname = senderfbuser.fbname;
                    user_db.vanity = typeof senderfbuser.vanity !== "undefined" ? senderfbuser.vanity : "";
                }
                user_db.fbprofileurl = senderfbuser.fbprofileurl;
                await this.updateFbUser(user_db);
                setTimeout(()=>{
                    api.sendMessageAsync("Notamos que cambiaste tus nombres en facebook asi que los hemos actualizado",message.threadID);
                },100);
            }

        }
        message.body = message.body.toLowerCase();
        switch(true) {
           /* case message.body === "balance":
                /*api.sendMessage({
                    body: 'Hello @Sender! @Sender!',
                    mentions: [{
                         tag: '@Sender',
                         id: message.senderID,
                         fromIndex: 1, // Highlight the second occurrence of @Sender
                    }],
                }, message.threadID, (err, messageInfo) => {
                    if(err) return console.error(err);
                });*/
/*
                api.createPoll("Example Poll", , {
                    "Option 1": false,
                    "Option 2": true
                }, (err) => {
                    if(err) return console.error(err);
                });
                break; */
            case /^(buscar) ((http|https):\/\/)?(www\.)?(fb\.me\/|facebook.com\/)((profile\.php\?id=)([0-9]+)|[a-zA-Z0-9.]{5,50})(\?|\/)?/.test(message.body):
                this.buscar_fbprofileurl(api,message);
                break;
            case /^(id|buscar) ([0-9]{5,30})$/.test(message.body):
            case /^([0-9]{5,30})$/.test(message.body):
                this.id_info(api,message);
                break;
            case /^(buscar) /.test(message.body):
                this.buscar_fbid(api,message);
                break;
            case /^(confiar) ([0-9]{5,30})$/.test(message.body):
                this.agregar_confidente(api,message);
                break;
            case /^(confidentes) ([0-9]{5,30})$/.test(message.body):
                this.listar_confidentes(api,message);
                break;
            case /^(confiantes) ([0-9]{5,30})$/.test(message.body):
                this.listar_confiados(api,message);
                break;
            case /^(desconfiar) ([0-9]{5,30})$/.test(message.body):
                this.eliminar_confidente(api,message);
                break;
            case /^(mis confidentes|mis confiantes)$/.test(message.body):
                message.body = message.body.split(" ")[1]+" "+senderfbuser.fbid;
                this.processMsg(api,message);
                return;
            break;
            case /^(mi id)$/.test(message.body):
                if(!reg) {
                    message.body = "id";
                    this.processMsg(api,message);
                    return;
                }
            break;
           /* case /(garantizar) ([a-zA-Z0-9]+) ([0-9].[0-9])/.test(message.body)://A tiene BTC, B tiene fiat
                api.sendMessage("0.5 BTC fueron garantizados a A , op: #41345", message.threadID, (err, messageInfo) => {
                    if(err) return console.error(err);
                });
                break;
            case message.body === "garantías":
                api.sendMessage("B te garantizó 0.5 BTC , op: #41356", message.threadID, (err, messageInfo) => {
                    if(err) return console.error(err);
                });
                break;
            case message.body === "liberar 41356":
                api.sendMessage("0.5 BTC fueron liberados , op: #41356", message.threadID, (err, messageInfo) => {
                    if(err) return console.error(err);
                });
                break;
            case message.body === "soporte":
                api.sendMessage("para disputas publicá en el grupo o contactanos a info@escrowbot.io", message.threadID, (err, messageInfo) => {
                    if(err) return console.error(err);
                });
                break;
            */
            case message.body === "id":
                    api.sendMessageAsync(`${senderfbuser.fbid}`,message.threadID);
                    setTimeout(()=>{
                        api.sendMessageAsync(`escrowbot.io/${senderfbuser.fbid}`,message.threadID);
                    },500);
                break;
            case message.body === "contacto":
                api.sendMessageAsync(`info@escrowbot.io`,message.threadID);
                api.sendMessageAsync(`Grupo oficial: facebook.com/groups/escrowbot/`,message.threadID);
            break;
            case message.body === "mi link":
                    api.sendMessageAsync(`escrowbot.io/${senderfbuser.fbid}`,message.threadID);
                break;
            case message.body === "ejemplos":
                this.ejemplos(api,message);
            break;
            default:
                this.enviar_ayuda(api,message);
            break;
        }
    }
    
enviar_ayuda(api,message) {
    return api.sendMessageAsync(
`➡️➡️COMANDOS⬅️⬅️
🔎 buscar X
🙆‍♂️ confiar X
🙅‍♂️ desconfiar X
📋 confiantes X
📋 confidentes X
🆔 mi id
🔗 mi link
📋 mis confidentes
📋 mis confiantes
💬 contacto
🆘 ejemplos`, message.threadID);
}
/*
: ℹ️Busca a alguien
: ℹ️Das fe de que alguien es confiable
: ℹ️Dejas de confiar en alguien
: ℹ️Lista quienes confían en alguien
: ℹ️Lista en quiénes confía alguien
*/
ejemplos(api,message) {
    api.sendMessageAsync(`buscar marcelo`, message.threadID);
    api.sendMessageAsync(`buscar facebook.com/0marce`, message.threadID);
    api.sendMessageAsync(`confidentes 100000198787604`, message.threadID);
    setTimeout(()=> {
        api.sendMessageAsync(`NO USAR COMILLAS`, message.threadID);
    },500);
}


async getFbUser(api,fbid) {
    const userData = await api.getUserInfoAsync([fbid]);
    console.log(userData);
    const fbname = userData[fbid].name;
    const fbvanity = userData[fbid].vanity;
    const fbprofileurl = userData[fbid].profileUrl.replace(/^((http|https):\/\/)?(www\.)?(fb\.me\/|facebook.com\/)/,"");
    return {fbid,fbname,fbvanity,fbprofileurl};
}

async agregar_confidente(api,message) {
    const fbid_confidente = message.body.split(" ")[1];
    if(message.senderID === fbid_confidente)
        return api.sendMessageAsync(`Buen autoestima :)`,message.threadID);

    const fbuser_confidente = await this.getUser(fbid_confidente);
    if(!fbuser_confidente)
        return api.sendMessageAsync(`El usuario ID ${fbid_confidente} no está registrad@`,message.threadID);

    
    const fbuser_confiado = await this.getUser(message.senderID);
    if(!fbuser_confiado)
        return api.sendMessageAsync(`El usuario ID ${message.senderID} no está registrad@`,message.threadID);

    if((await this.addConfidente(fbuser_confidente.fbid,fbuser_confiado.fbid) ).affectedRows)
        return api.sendMessageAsync(
`Ahora confías en ${fbuser_confidente.fbname} 🔒.
ID ${fbuser_confidente.fbid}
${fburl}${fbuser_confidente.fbprofileurl}
escrowbot.io/${fbuser_confidente.fbid}`, message.threadID);
    else
        return api.sendMessageAsync(
`Ya confías en ${fbuser_confidente.fbname} 🔒.
ID ${fbuser_confidente.fbid}
${fburl}${fbuser_confidente.fbprofileurl}
escrowbot.io/${fbuser_confidente.fbid}`,message.threadID);
}

async eliminar_confidente(api,message) {
    const fbid_confidente = message.body.split(" ")[1];
    if(message.senderID === fbid_confidente)
        return api.sendMessageAsync(`¡Hay que tener más autoestima! 💪`,message.threadID);

    const fbuser_confidente = await this.getUser(fbid_confidente);
    if(!fbuser_confidente)
        return api.sendMessageAsync(`El usuario ID ${fbid_confidente} no está registrad@`,message.threadID);

    const fbuser_confiado = await this.getUser(message.senderID);
    if(!fbuser_confiado)
        return api.sendMessageAsync(`El usuario ID ${message.senderID} no está registrad@`,message.threadID);

    if((await this.removeConfidente(fbuser_confidente.fbid,fbuser_confiado.fbid) ).affectedRows)
        return api.sendMessageAsync(
`Ya no confías en ${fbuser_confidente.fbname}.
ID ${fbuser_confidente.fbid}
${fburl}${fbuser_confidente.fbprofileurl}
escrowbot.io/${fbuser_confidente.fbid}`,message.threadID);
    else
        return api.sendMessageAsync(
`Ya no confíabas en ${fbuser_confidente.fbname}.
ID ${fbuser_confidente.fbid}
${fburl}${fbuser_confidente.fbprofileurl}
escrowbot.io/${fbuser_confidente.fbid}`,message.threadID);
}

async addFbUser(fbuser) {
    console.log(fbuser);
    fbuser.fbprofileurl = fbuser.fbprofileurl.replace(/^((http|https):\/\/)?(www\.)?(fb\.me\/|facebook.com\/)/,"");
    const columns = Object.keys(fbuser).join(",");
    const values = `'${Object.values(fbuser).join("','")}'`;
    await this.Database.connection.
        queryAsync(
        `INSERT INTO db_escrowbot.bot_usuarios (${columns}) VALUES (${values})`
        );
}

async updateFbUser(fbuser) {
    fbuser.fbprofileurl = fbuser.fbprofileurl.replace(/^((http|https):\/\/)?(www\.)?(fb\.me\/|facebook.com\/)/,"");
    let set = [];
    set.push(`fbname = '${fbuser.fbname}'`);
    set.push(`fbvanity = '${fbuser.fbvanity}'`);
    set.push(`fbprofileurl = '${fbuser.fbprofileurl}'`);
    await this.Database.connection.
        queryAsync(`UPDATE db_escrowbot.bot_usuarios SET ${set.join(" , ")} WHERE (fbid = '${fbuser.fbid}');`);
}

async logUpdate(cambio) {
    const columns = Object.keys(cambio).join(",");
    const values = `'${Object.values(cambio).join("','")}'`;
    await this.Database.connection.
        queryAsync(
            `INSERT INTO db_escrowbot.bot_cambios (${columns}) VALUES (${values})`
        );
}

async getUser(fbid) {
    if( ! /^[0-9]{5,30}$/.test(fbid) ) return;
    const results = await this.Database.connection.queryAsync(`SELECT * FROM db_escrowbot.bot_usuarios WHERE fbid = ${fbid};`);
    if(results.length)
        return results[0];
    else
        return false;
}

async buscar_fbprofileurl(api,message) {
    let fbprofileuri_withoutarguments = message.body.match(/((http|https):\/\/)?(www\.)?(fb\.me\/|facebook.com\/)((profile\.php\?id=)([0-9]+)|[a-zA-Z0-9.]{5,50})(\?|\/)?/)[0];
    let fbprofileurn = fbprofileuri_withoutarguments.replace(/((http|https):\/\/)?(www\.)?(fb\.me\/|facebook.com\/)/,"");
    let results = await this.getUser_fbprofileurl(fbprofileurn);
    //console.log(fbprofilesanitized,results)
    if(results.length) {
        let fbuser = results[0];
        api.sendMessageAsync(
`${fbuser.fbname}
${fburl}${fbuser.fbprofileurl}
escrowbot.io/${fbuser.fbid}`,message.threadID);
    }else
        api.sendMessageAsync(
`El usuario no está registrad@`,message.threadID);
}

async getUser_fbprofileurl(fbprofilesanitized) {
    return await this.Database.connection.queryAsync(`SELECT * FROM db_escrowbot.bot_usuarios WHERE fbprofileurl = '${fbprofilesanitized}';`);
}

async addConfidente(fbid_confidente,fbid_confiado) {
    if( ! /^[0-9]+$/.test(fbid_confidente) ) return;
    if( ! /^[0-9]+$/.test(fbid_confiado) ) return;
    return await this.Database.connection.
        queryAsync(
            `
            INSERT INTO db_escrowbot.bot_confidencias (usuario_confidente,usuario_confiado)
            SELECT '${fbid_confidente}', '${fbid_confiado}' FROM DUAL 
            WHERE NOT EXISTS (
                SELECT * FROM db_escrowbot.bot_confidencias
                WHERE usuario_confidente='${fbid_confidente}' AND usuario_confiado='${fbid_confiado}' LIMIT 1
            );`
        );
}

async removeConfidente(fbid_confidente,fbid_confiado) {
    if( ! /^[0-9]+$/.test(fbid_confidente) ) return;
    if( ! /^[0-9]+$/.test(fbid_confiado) ) return;
    return await this.Database.connection.
        queryAsync(
            `
            DELETE FROM db_escrowbot.bot_confidencias WHERE usuario_confiado = '${fbid_confiado}' AND usuario_confidente = '${fbid_confidente}';
            `
        );
}

async listar_confiados(api,message) {
    let fbid = typeof message.body.split(" ")[1] === "string" ? message.body.split(" ")[1] : message.senderID;

    const queriedUser = await this.getUser(fbid);
    if(!queriedUser)
        return api.sendMessageAsync(`El usuario ID ${fbid} no está registrad@`,message.threadID);

    let users = [];
    await this.asyncForEach(await this.getConfiados(fbid), async (confidencia) => {
        users.push( await this.getUser(confidencia.usuario_confiado) );
    });
    
    let response = 
`${queriedUser.fbname}
escrowbot.io/${queriedUser.fbid}
${fburl}${queriedUser.fbprofileurl}
`;
if(users.length) {
response += 
`________________
Confía${(users.length > 1 ? 'n' : '')} en ${queriedUser.fbname}:
▔▔▔▔▔▔▔▔▔`;

    users.forEach( user => {
        response += `
${user.fbname}
escrowbot.io/${user.fbid}
${fburl}${user.fbprofileurl}
`;
    });
}else{
    response += 
`________________
Aún nadie confía en ${queriedUser.fbname}
▔▔▔▔▔▔▔▔▔`
}
    api.sendMessageAsync(response,message.threadID);

}

async getConfidentes(fbid) {
    if( ! /^[0-9]+$/.test(fbid) ) return;
    return await this.Database.connection.queryAsync(
        `SELECT * FROM db_escrowbot.bot_confidencias WHERE usuario_confiado = '${fbid}';`);
}

async listar_confidentes(api,message) {
    let fbid = typeof message.body.split(" ")[1] === "string" ? message.body.split(" ")[1] : message.senderID;

    const queriedUser = await this.getUser(fbid);
    if(!queriedUser)
        return api.sendMessageAsync(`El usuario ID ${fbid} no está registrad@`,message.threadID);

    let users = [];
    await this.asyncForEach(await this.getConfidentes(fbid), async (confidencia) => {
        users.push( await this.getUser(confidencia.usuario_confidente) );
    });
    
    let response = 
`${queriedUser.fbname}
escrowbot.io/${queriedUser.fbid}
${fburl}${queriedUser.fbprofileurl}
`;
if(users.length) {
response += 
`________________
${queriedUser.fbname} confía en :
▔▔▔▔▔▔▔▔▔`;

    users.forEach( user => {
        response += `
${user.fbname}
escrowbot.io/${user.fbid}
${fburl}${user.fbprofileurl}
`;
    });
}else{
    response += 
`________________
${queriedUser.fbname} aún no confía en nadie
▔▔▔▔▔▔▔▔▔`
}
    api.sendMessageAsync(response,message.threadID);

}

async getConfiados(fbid) {
    if( ! /^[0-9]+$/.test(fbid) ) return;
    return await this.Database.connection.queryAsync(
        `SELECT * FROM db_escrowbot.bot_confidencias WHERE usuario_confidente = '${fbid}';`);
}

async buscar_fbid(api,message) {
    let message_arr = message.body.split(" ");
    message_arr.splice(0,1);
    let query = message_arr.join(" ");
    let results = await api.getUserIDAsync(query);
    if(!results.length)
        return await api.sendMessageAsync(`El usuario no se encontró o no está registrado`,message.threadID);
    let firstResult = results[0];
    let requestedUserID = firstResult.userID;
    message.body = "id "+requestedUserID;
    this.id_info(api,message);
}

async id_info(api,message) {
    let fbid = message.body.match(/([0-9]{5,30})$/g)[0];

    const queriedUser = await this.getUser(fbid);
    if(!queriedUser)
        return await api.sendMessageAsync(`El usuario no se encontró o no está registrado`,message.threadID);
    
    api.sendMessageAsync(
`${queriedUser.fbname}
escrowbot.io/${queriedUser.fbid}
${fburl}${queriedUser.fbprofileurl}`,message.threadID);
}

async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
}

module.exports = Escrowbot;