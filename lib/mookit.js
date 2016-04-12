/**
 * Contains all the mookit related functions
 * @author Anurag Gautam
 * @version 0.2.1
 */

var mysql = require('mysql');
var fs = require('fs');
var crypto = require('crypto');
var models = require('./eclib');
var colors = require('colors/safe');


function Mookit(config) {

    var connectionConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'educhat',
        loginUrl: null,
        tokenUrl: null
    };

    if (config) {
        if ("db-host" in config) {
            connectionConfig['host'] = config["db-host"];
        }
        if ("db-user" in config) {
            connectionConfig['user'] = config['db-user'];
        }
        if ('db-password' in config) {
            connectionConfig['password'] = config['db-password'];
        }
        if ('db-name' in config) {
            connectionConfig['database'] = config['db-name'];
        }
    }

    this.connection = mysql.createConnection(connectionConfig);

    /**
     * Privilidged method to access the loginUrl
     * @returns {connectionConfig.loginUrl|none}
     */
    this.getLoginUrl = function () {
        return connectionConfig.loginUrl;
    };

    this.getTokenRefreshUrl = function () {
        return connectionConfig.tokenUrl;
    };
}


Mookit.prototype.authenticateFromLocal = function (user, callback) {
    if (user && user.username && user.password) {
        var hash = crypto.createHash('sha1');
        hash.update(user.password);

        var sql = "SELECT * FROM users WHERE name=? AND pass=?";
        this.connection.query(sql, [user.username, hash.digest('hex')], function (err, data) {
            if (err) {
                console.error(err);
                return callback(null);
            }
            if (data.length === 0) {
                callback(null);
            } else {
                callback(data);
            }
        });
    }
};

Mookit.prototype.dummyAuthenticate = function (user, callback) {
    if (user && user.username && user.password) {
        var hash = crypto.createHash('sha256');
        hash.update(user.password);
        var userPassword = hash.digest('hex');

        fs.readFile('lib/dummyUsers.json', 'utf8', function (err, data) {
            if (err)
                return callback(null);
            var users = JSON.parse(data);
            var validUser = null;
            if (users.some(function (u) {
                    validUser = u;
                    return u.name === user.username && u.pass === userPassword;
                })) {
                callback(validUser);
            } else {
                callback(null);
            }
        });
    } else {
        callback(null);
    }
};

Mookit.prototype.authenticate = function (user, callback) {
    if (user) {
        var loginUrl = this.getLoginUrl();
        if (loginUrl) {
            console.log('Add code to authenticate from the mookit url. Ask Ravi to get you the URL');
        } else {
            this.authenticateFromLocal(user, callback);
        }
    } else {
        callback(null);
    }
};

Mookit.prototype.checkToken = function (user, callback) {
    if (user) {
        var tokenUrl = this.getTokenRefreshUrl();
        if (tokenUrl) {
            console.log('Add code to check the status of token from URL. Ask Ravi to get you the URL');
        } else {
            callback({result: 1});
        }
    } else {
        callback(null);
    }
};

Mookit.prototype.getActiveUsers = function (callback) {
    this.connection.query('SELECT * FROM mookit_token;', function (err, rows) {
        if (err) {
            console.error(err);
            return callback(null);
        } else {
            // console.log(JSON.stringify(rows));
            callback(rows);

        }
    });
};

/*
 var mk = new Mookit();
 mk.authenticate({username: 'anurag', password: '123'}, function (data) {
 if (data) {
 console.log("Autheticated: " + JSON.stringify(data));
 } else {
 console.log("Could not authenticate: " + JSON.stringify(data));
 }
 });

 mk.getActiveUsers(function (us) {
 if (us) {
 console.log("Active users: " + JSON.stringify(us));
 } else {
 console.log("Could not find active users");
 }
 });
 */
module.exports = Mookit;