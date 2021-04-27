const mysql = require('mysql'),
    Promise = require("bluebird"),
    fs = require("fs");
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
class Database {
    constructor() {
        this.connection = mysql.createConnection({
            host: config.db_host,
            user: config.db_user,
            password: config.db_password,
            database: config.db_database
        });
        this.connection.connect();
        this.connection = Promise.promisifyAll(this.connection);
    }
}

module.exports = Database;
