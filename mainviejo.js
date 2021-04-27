const login = require("facebook-chat-api");
const fs = require("fs");
const readline = require('readline');
let db = require("./db");
const Promise = require("bluebird");
const mysql = require('mysql');
const crypto = require('crypto');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var connection = mysql.createConnection({
    host: config.db_host,
    user: config.db_user,
    password: config.db_password,
    database: config.db_database
});
connection.connect();
connection = Promise.promisifyAll(connection);


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Create simple echo bot
const pageID=config.fb_pageID;
let credentials;
try{
    credentials={appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))};
}catch(e){
    credentials={email: config.fb_email, password: config.fb_password};
}
login(credentials,{pageID,selfListen: true}, (err, api) => {
    if(err) {
        switch (err.error) {
            case 'login-approval':
                console.log('Enter code > ');
                rl.on('line', (line) => {
                    err.continue(line);
                    rl.close();
                });
                break;
            default:
                console.error(err);
        }
        return;
    }
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    api.listenMqtt((err, message) => {
        if(err!==null) return console.error(err);
        if(message.type==="message" && message.senderID!==pageID) {
            message.body = sanitaze(message.body);
            if(message.body.length)
                processMsg(api,message);
        }
    });
});

async function processMsg(api,message) {
    api = Promise.promisifyAll(api);
    const senderfbuser = await getFbUser(api,message.senderID);
    console.log(message.senderID);
    let reg = false;
    try{
        await addFbUser(senderfbuser);
        reg = true;
        api.sendMessageAsync(`Ahora estás registrad@ en Escrowbot, tu ID es: ${senderfbuser.fbid}\n`,message.threadID);
    }catch(e){
        if(e.code !== "ER_DUP_ENTRY")
            return api.sendMessageAsync(`Lo lamentamos, hubo un problema. Pronto lo solucionaremos.\n`,message.threadID);
    }
    switch(true) {
        case message.body === "balance":
            api.sendMessage("0.5 BTC", message.threadID, (err, messageInfo) => {
                if(err) return console.error(err);
            });
            break;
        case message.body === "depositar":
            api.sendMessage("3GfGYzqjN1Pipu6p6PtaqNyPgoJLkYcpzs", message.threadID, (err, messageInfo) => {
                if(err) return console.error(err);
            });
            break;
        case message.body.split(" ")[0] === "confiar":
            agregar_confidente(api,message);
            break;
        case message.body.split(" ")[0] === "confidentes":
            listar_confidentes(api,message);
            break;
        case message.body.split(" ")[0] === "confiantes":
            listar_confiados(api,message);
            break;
        case message.body.split(" ")[0] === "desconfiar":
            eliminar_confidente(api,message);
            break;
        case /(garantizar) ([a-zA-Z0-9]+) ([0-9].[0-9])/.test(message.body)://A tiene BTC, B tiene fiat
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
        case message.body === "id":
                api.sendMessageAsync(`Tu ID: ${senderfbuser.fbid}\n`,message.threadID);
            break;
        case /^(id) ([0-9]+)$/.test(message.body):
                let fbid = message.body.split(" ")[1];
                let fbuser = await getFbUser(api,fbid);
                api.sendMessageAsync(`ID: ${fbuser.fbid}\nNombre: ${fbuser.fbname}\nPerfil: ${fbuser.fbprofileUrl}`,message.threadID);
            break;
        default:
            enviar_ayuda(api,message);
        break;
    }
}

function enviar_ayuda(api,message) {
    return api.sendMessageAsync(
`ℹ️ Escrowbot es una base de datos de personas en las que se pueden confiar ℹ️

✍️Comandos
➡️"id ID":
Muestra Nombre y link al perfil de otra persona(ID). Ej.: "id 100023183821"
Si no se especifica ID te muestra el tuyo. Lo podés compartir para que otras personas te agreguen como confidente.

➡️"confiar ID":
Usar sólo cuando hayas tenido al menos una operación exitosa. Ej.: "confiar 100023183821"

➡️"desconfiar ID":
Usar cuando ya no confías en un usuario(ID). Ej.: "desconfiar 100023183821"

➡️"confiantes ID":
Lista quienes confían🔓 en alguien(ID)🔒. Ej.: "confiantes 100023183821"
Sin ID lista quienes confían en vos.

➡️"confidentes ID":
Lista en quiénes🔒 confía alguien(ID)🔓. Ej.: "confidentes 100023183821"
Sin ID lista en quénes confías.

❓¿Cómo registrarse?
¡Con habernos envíado un mensaje ya te registraste!`
    , message.threadID);
}

function sanitaze(body) {
    return body.toLowerCase().trim();
}

async function getFbUser(api,fbid) {
    const userData = await api.getUserInfoAsync([fbid]);
    const fbname = userData[fbid].name;
    const fbvanity = userData[fbid].vanity;
    const fbprofileUrl = userData[fbid].profileUrl.replace("www.facebook.com","fb.me");
    return {fbid,fbname,fbvanity,fbprofileUrl};
}

async function agregar_confidente(api,message) {
    const fbid_confidente = message.body.split(" ")[1];
    if(message.senderID === fbid_confidente)
        return api.sendMessageAsync(`Buen autoestima :)`,message.threadID);

    if( !(await getUser(fbid_confidente)).length )
        return api.sendMessageAsync(`El usuario ID ${fbid_confidente} no está registrad@`,message.threadID);

    const fbuser_confidente = await getFbUser(api,fbid_confidente);
    const fbuser_confiado = await getFbUser(api,message.senderID);

    if((await addConfidente(fbuser_confidente.fbid,fbuser_confiado.fbid) ).affectedRows)
        return api.sendMessageAsync(
`Ahora confías en ${fbuser_confidente.fbname} 🔒.
ID ${fbuser_confidente.fbid}
Perfil: ${fbuser_confidente.fbprofileUrl}`, message.threadID);
    else
        return api.sendMessageAsync(
`Ya confías en ${fbuser_confidente.fbname} 🔒.
ID ${fbuser_confidente.fbid}
Perfil: ${fbuser_confidente.fbprofileUrl}`,message.threadID);
}

async function eliminar_confidente(api,message) {
    const fbid_confidente = message.body.split(" ")[1];
    if(message.senderID === fbid_confidente)
        return api.sendMessageAsync(`¡Hay que tener más autoestima! 💪`,message.threadID);

    if( !(await getUser(fbid_confidente)).length )
        return api.sendMessageAsync(`El usuario ID ${fbid_confidente} ni siquiera está registrad@.`,message.threadID);

    const fbuser_confidente = await getFbUser(api,fbid_confidente);
    const fbuser_confiado = await getFbUser(api,message.senderID);

    if((await removeConfidente(fbuser_confidente.fbid,fbuser_confiado.fbid) ).affectedRows)
        return api.sendMessageAsync(
`Ya no confías en ${fbuser_confidente.fbname}.
ID ${fbuser_confidente.fbid}
Perfil: ${fbuser_confidente.fbprofileUrl}`,message.threadID);
    else
        return api.sendMessageAsync(
`Ya no confíabas en ${fbuser_confidente.fbname}.
ID ${fbuser_confidente.fbid}
Perfil: ${fbuser_confidente.fbprofileUrl}`,message.threadID);
}

async function addFbUser(fbuser) {
    const columns = Object.keys(fbuser).join(",");
    const values = `'${Object.values(fbuser).join("','")}'`;
    await connection.
        queryAsync(
        `INSERT INTO db_escrowbot.bot_usuarios (${columns}) VALUES (${values})`
        );
}

async function getUser(fbid) {
    if( ! /^[0-9]+$/.test(fbid) ) return;
    return await connection.queryAsync(`SELECT * FROM db_escrowbot.bot_usuarios WHERE fbid = ${fbid};`);
}

async function addConfidente(fbid_confidente,fbid_confiado) {
    if( ! /^[0-9]+$/.test(fbid_confidente) ) return;
    if( ! /^[0-9]+$/.test(fbid_confiado) ) return;
    return await connection.
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

async function removeConfidente(fbid_confidente,fbid_confiado) {
    if( ! /^[0-9]+$/.test(fbid_confidente) ) return;
    if( ! /^[0-9]+$/.test(fbid_confiado) ) return;
    return await connection.
        queryAsync(
            `
            DELETE FROM db_escrowbot.bot_confidencias WHERE usuario_confiado = '${fbid_confiado}' AND usuario_confidente = '${fbid_confidente}';
            `
        );
}

async function listar_confiados(api,message) {
    let fbid = typeof message.body.split(" ")[1] === "string" ? message.body.split(" ")[1] : message.senderID;

    let queriedUser = (await getUser(fbid))[0];

    let users = [];
    await asyncForEach(await getConfiados(fbid), async (confidencia) => {
        users.push( (await getUser(confidencia.usuario_confiado))[0] );
    });
    
    let response = 
`Nombre: ${queriedUser.fbname}
ID: ${queriedUser.fbid}
Perfil: ${queriedUser.fbprofileurl.replace("https://","")}/

________________
Confían en ${queriedUser.fbname}:
▔▔▔▔▔▔▔▔▔`;
    users.forEach( user => {
        response += `
Nombre: ${user.fbname}
ID: ${user.fbid}
Perfil: ${user.fbprofileurl.replace("https://","")}/
`;
    });
    
    api.sendMessageAsync(response,message.threadID);

}

async function getConfidentes(fbid) {
    if( ! /^[0-9]+$/.test(fbid) ) return;
    return await connection.queryAsync(
        `SELECT * FROM db_escrowbot.bot_confidencias WHERE usuario_confiado = '${fbid}';`);
}

async function listar_confidentes(api,message) {
    let fbid = typeof message.body.split(" ")[1] === "string" ? message.body.split(" ")[1] : message.senderID;

    let queriedUser = (await getUser(fbid))[0];

    let users = [];
    await asyncForEach(await getConfidentes(fbid), async (confidencia) => {
        users.push( (await getUser(confidencia.usuario_confidente))[0] );
    });
    
    let response = 
`Nombre: ${queriedUser.fbname}
ID: ${queriedUser.fbid}
Perfil: ${queriedUser.fbprofileurl.replace("https://","")}/

________________
${queriedUser.fbname} confía en:
▔▔▔▔▔▔▔▔▔`;
    users.forEach( user => {
        response += `
Nombre: ${user.fbname}
ID: ${user.fbid}
Perfil: ${user.fbprofileurl.replace("https://","")}/
`;
    });
    
    api.sendMessageAsync(response,message.threadID);

}

async function getConfiados(fbid) {
    if( ! /^[0-9]+$/.test(fbid) ) return;
    return await connection.queryAsync(
        `SELECT * FROM db_escrowbot.bot_confidencias WHERE usuario_confidente = '${fbid}';`);
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}