/**
 * Contains all the mookit related functions
 * @author Anurag Gautam
 * @version 1.0.2
 */

var mysql = require('mysql');
var fs = require('fs');
var crypto = require('crypto');
var models = require('./models');
var http = require('http');
var colors = require('colors/safe');
var Promise = require('promise');

var requestOptions = {
    host: 'www.cs654.in',
    path: '/courseapi/onlineUsers',

    getOptions: function (userData) {
        return {
            host: this.host,
            path: this.path,
            headers: {
                uid: userData.uid,
                token: userData.token
            }
        };
    }
};

var Mookit = {
    /**
     * Authenticates the user and then updates the user table
     * @param userData object with following keys "uid", "username", "token"
     * @param callback
     */
    authenticate: function (userData, callback) {
        console.log(colors.cyan("user data: " + JSON.stringify(userData)));

        if (userData.username && userData.token) {
            models.User.findOne({where: {username: userData.username}}).then(function (user) {
                if (user) {
                    // User already present in the database, update the token
                    user.updateAttributes({
                        token: userData.token
                    }).then(callback);
                } else {
                    // User is not in our database, lets create her
                    models.User.create({
                        username: userData.username,
                        token: userData.token
                    }).then(function (user) {
                        if (user) {
                            user.updateAttributes({
                                uid: user.id
                            }).then(callback);
                        } else {
                            callback(null);
                        }
                    });
                }
            });
        } else {
            callback(null);
        }
    },

    /**
     * @param userData
     * @param callback
     */
    getActiveUsers: function (userData, callback) {
        var req = http.request(requestOptions.getOptions(userData), function (response) {
            var res = '';

            response.on('data', function (chunk) {
                res += chunk;
            });

            response.on('end', function () {
                console.log(colors.yellow('Got following response from mookit server: ' + res));
                callback(res);
            });
        });
        req.on('error', function (e) {
            console.log(e);
        });
        req.end();
    },

    getOnlineUsers: function (userData, callback) {
        this.getActiveUsers(userData, function (data) {
            var users = JSON.parse(data);

            if (('studentsOnline' in users) && ('instructorOnline' in users)) {
                var promises = [];

                // Get all the students currently online
                users.studentsOnline.forEach(function (name) {
                    promises.push(models.User.findOrCreate({
                        where: {username: name},
                        defaults: {token: 'fake-token'}
                    }).then(function (u) {
                        return u[0].updateAttributes({uid: u[0].id});
                    }));
                });

                // Get all the instructors currently online
                users.instructorOnline.forEach(function (name) {
                    promises.push(models.User.findOrCreate({
                        where: {username: name},
                        defaults: {token: 'fake-token'}
                    }).then(function (u) {
                        return u[0].updateAttributes({uid: u[0].id});
                    }));
                });

                Promise.all(promises).then(function (us) {
                    var them = us.map(function (u) {
                        return u;
                    });
                    console.log("First user from online group: " + colors.green(JSON.stringify(them[0])));
                    // callback(them);
                });
            } else {
                // callback([]);
            }
        });

        models.GroupMember.findAll({
            where: {
                userUid: userData.eduId
            }
        }).then(function (groups) {
            console.log(colors.red("Following groups found: " + JSON.stringify(groups) + " for user: " + userData.eduId));
            var groupUids = [];
            if (groups) {
                groupUids = groups.map(function (g) {
                    return g.groupUid;
                });
            }
            models.Group.findAll({
                where: {
                    uid: {
                        $in: groupUids
                    }
                }
            }).then(function (memberGroups) {
                var result = [];
                if (memberGroups) {
                    result = memberGroups.map(function (member) {
                        return {
                            uid: member.uid,
                            username: member.username,
                            type: 'group',
                            createdAt: member.createdAt,
                            updatedAt: member.updatedAt
                        };
                    });
                }
                models.User.all().then(function (users) {
                    users.forEach(function (user) {
                        result.push({
                            uid: user.uid,
                            username: user.username,
                            type: 'user',
                            token: user.token,
                            isActive: user.isActive,
                            picture: user.picture,
                            createdAt: user.createdAt,
                            updatedAt: user.updatedAt
                        });
                    });
                    callback(result);
                });
            });
        });
        // models.User.all().then(callback);
    }
};


function Mookit0(config) {

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


Mookit0.prototype.authenticateFromLocal = function (user, callback) {
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

Mookit0.prototype.dummyAuthenticate = function (user, callback) {
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

Mookit0.prototype.authenticate = function (user, callback) {
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

Mookit0.prototype.checkToken = function (user, callback) {
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

Mookit0.prototype.getActiveUsers = function (callback) {
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


/*Mookit.getOnlineUsers({
 uid: 4072, username: 'ganurag', token: '1d9293e9e360cd13cf6dd55fc59f79c971405be3'
 }, function (users) {
 users.forEach(function (u) {
 var u = u[0];
 console.log(colors.green(u.username, u.id, u.uid, u.token));
 });
 });*/
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