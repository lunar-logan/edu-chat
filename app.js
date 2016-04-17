var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var multer = require('multer');
var session = require('express-session')({secret: 'keyboard-cat', cookie: {}});
var sharedsession = require("express-socket.io-session");
var colors = require('colors/safe');

var mookit = require('./lib/mookit');
var socketChat = require('./lib/socket-chat')(io);
var models = require('./lib/models');
var wiki = require('./lib/wikipedia');

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(process.cwd(), 'uploads'));
    },
    filename: function (req, file, callback) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(file.originalname);

        callback(null, Math.random().toString(36).slice(2, 10) + '_' + md5sum.digest('hex') + '_' + Date.now());
    }
});
// Set the upload limit to 2 MiB and the field name to payload
// TODO: add more filters on the file
var upload = multer({storage: storage, fileSize: 2 * 1024 * 1024}).single('payload');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session);
app.use(express.static(path.join(__dirname, 'public')));

io.use(sharedsession(session));


// Route definitions begin

app.get('/', function (req, res) {
    mookit.authenticate(req.cookies, function (val) {
        if (val) {
            req.session.authToken = req.cookies.token;
            req.session.eduId = val.uid;
            res.cookie('eduId', val.uid);
            res.sendFile(path.join(__dirname, 'views', 'index.html'));
        } else {
            res.send('Sorry, you are not authorized');
        }
    });
});


app.get('/api/user', function (req, res) {
    var username = req.query.username;
    models.User.findOne({where: {username: username}}).then(function (user) {
        if (user) {
            res.json(user);
        } else {
            res.json({code: -1});
        }
    });
});

/**
 * Returns the currently active users on mookit
 */
app.get('/api/users/active', function (req, res) {
    var uid = req.query.uid;
    mookit.getOnlineUsers({
        uid: req.cookies.uid,
        username: req.cookies.username,
        token: req.cookies.token,
        eduId: uid,
        mookitUid: req.cookies.uid
    }, function (users) {
        res.json(users);
    });
});


/**
 * Returns the private messages from the inbox
 */
app.post('/api/inbox', function (req, res) {
    if (req.session.authToken) {
        var user = req.body.uid;
        var withUser = req.body.withUid;
        var rangeStart = parseInt(req.body.rangeStart);
        var type = req.body.type;

        if (type === 'user') {
            models.Inbox.findAll({
                where: {
                    $or: [
                        {
                            fromUser: user,
                            $and: {
                                toUser: withUser
                            }
                        },
                        {
                            fromUser: withUser,
                            $and: {
                                toUser: user
                            }
                        }
                    ]
                },
                order: [['createdAt', 'DESC']],
                offset: rangeStart,
                limit: 15
            }).then(function (messages) {
                if (messages) {
                    res.json(messages);
                } else {
                    res.json([]);
                }
            });
        } else if (type === 'group') {
            models.GroupMessage.findAll({
                where: {toUser: withUser},
                order: [['createdAt', 'DESC']],
                offset: rangeStart,
                limit: 15
            }).then(function (messages) {
                if (messages) {
                    res.json(messages);
                } else {
                    res.json([]);
                }
            });

        } else {    // unknown type
            res.json({
                code: -1,
                msg: 'Unknown user type: ' + type
            });
        }
    } else {
        res.json({
            code: -1,
            msg: 'You are not authorized to view the content'
        });
    }
});

// TODO: Remove this route definition, seems its of NO USE!!
app.post('/api/users', function (req, res) {
    mookit.authenticate(req.body, function (d) {
        if (!d) {
            res.json({code: -1, msg: "Not authorized"});
        } else {
            res.json({code: 0, msg: d});
        }
    });
});

app.get('/api/object', function (req, res) {
    if (req.session.authToken || req.query.clc) {
        var objectId = parseInt(req.query.id);
        var type = req.query.type;

        if (objectId && type && type === 'user') {
            models.Inbox.findOne({
                where: {id: objectId}
            }).then(function (obj) {
                if (obj && obj.isFile) {
                    var filePath = path.join(process.cwd(), 'uploads', obj.content);
                    res.setHeader('Content-Type', obj.mimeType);
                    var filestream = fs.createReadStream(filePath);
                    filestream.pipe(res);
                } else {
                    res.json({
                        code: -1,
                        msg: "Object with the given id was not found"
                    });
                }
            });
        } else if (objectId && type && type === 'group') {
            models.GroupMessage.findOne({
                where: {id: objectId}
            }).then(function (obj) {
                if (obj && obj.isFile) {
                    var filePath = path.join(process.cwd(), 'uploads', obj.content);
                    console.log(colors.cyan("Filepath: " + filePath));
                    res.setHeader('Content-Type', obj.mimeType);
                    var filestream = fs.createReadStream(filePath);
                    filestream.pipe(res);
                } else {
                    res.json({
                        code: -1,
                        msg: "Object with the given id was not found"
                    });
                }
            });
        } else {
            res.json({
                code: -1,
                msg: "Bad request. Object Id not specified"
            });
        }
    } else {
        res.json({
            code: -1,
            msg: 'Not authorized to view the content. Try logging in first'
        });
    }
});

app.post('/upload', function (req, res) {
    if (req.session.authToken) {
        upload(req, res, function (err) {
            if (err) {
                console.log(err);
                return res.json({code: -1, msg: 'Could not upload your file'});
            }
            if (req.body.type === 'user') {
                models.Inbox.create({
                    fromUser: parseInt(req.session.eduId),
                    toUser: parseInt(req.body.toUser),
                    content: req.file.filename,
                    mimeType: req.file.mimetype,
                    isFile: true
                }).then(function (so) {
                    if (so) {
                        res.json({code: 0, msg: so});
                    } else {
                        res.json({code: -1, msg: 'Object could not be uploaded'});
                    }
                });
            } else if (req.body.type === 'group') {
                models.GroupMessage.create({
                    toUser: parseInt(req.body.toUser),
                    fromUser: parseInt(req.session.eduId),
                    content: req.file.filename,
                    mimeType: req.file.mimetype,
                    isFile: true
                }).then(function (so) {
                    if (so) {
                        res.json({code: 0, msg: so});
                    } else {
                        res.json({code: -1, msg: 'Object could not be uploaded'});
                    }
                });
            } else {
                console.log(colors.red("Unknown type: '" + req.body.type + "' for uploading file"));
                res.json({code: -1, msg: "Unknown type for the uploaded object"});
            }
        });
    } else {
        res.json({code: -1, msg: "Aapko upload krne ka adhikaar nahi hai"});
    }
});


app.get('/api/wiki', function (req, res) {
    var topic = req.query.topic;
    if (topic) {
        wiki.getUrl(topic, function (url) {
            if (url) {
                res.json({code: 0, msg: url});
            } else {
                res.json({code: -1, msg: 'Could not get the url'});
            }
        });
    } else {
        res.json({code: -1, msg: 'Topic not specified'});
    }
});


app.get('/api/group/users', function (req, res) {
    var groupId = req.query.id;
    if (groupId) {
        models.GroupMember.findAll({
            where: {
                groupUid: groupId
            }
        }).then(function (members) {
            if (members) {
                var memberIds = members.map(function (m) {
                    return m.userUid;
                });
                models.User.findAll({
                    where: {
                        uid: {
                            $in: memberIds
                        }
                    }
                }).then(function (users) {
                    res.json({code: 0, msg: users || []});
                });
            } else {
                res.json({code: -1, msg: []});
            }
        })
    } else {
        res.json({code: -1, msg: "Group id not specified"});
    }

});

var port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('listening on 0.0.0.0:' + port);
});