var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mookit = require('./lib/mookit');
var socketChat = require('./lib/socket-chat')(io);
var models = require('./lib/eclib');

var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(process.cwd(), 'uploads'));
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '_' + Date.now());
    }
});
var upload = multer({storage: storage, fileSize: 2 * 1024 * 1024}).single('payload');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Route definitions begin

app.get('/', function (req, res) {
    console.log(req.cookies);
    mookit.authenticate(req.cookies, function (val) {
        if (val) {
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
    mookit.getOnlineUsers(req.cookies, function (users) {
        res.json(users);
    });
});

/**
 * Returns the private messages from the inbox
 */
app.post('/api/inbox', function (req, res) {
    var user = req.body.uid;
    var withUser = req.body.withUid;
    var rangeStart = parseInt(req.body.rangeStart);

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
        limit: 15
    }).then(function (messages) {
        if (messages) {
            res.json(messages);
        } else {
            res.json([]);
        }
    });
});

app.post('/api/users', function (req, res) {
    mookit.authenticate(req.body, function (d) {
        if (!d) {
            res.json({code: -1, msg: "Not authorized"});
        } else {
            res.json({code: 0, msg: d});
        }
    });
});

app.post('/upload', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end('could not upload your file');
        }
        res.end('File uploaded suc')
    });
});


var port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('listening on 0.0.0.0:' + port);
});