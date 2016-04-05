var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var _mookit = require('./lib/mookit');
var socketChat = require('./lib/socket-chat')(io);
var libChat = require('./lib/libchat');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var mookit = new _mookit({});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


/**
 * Returns the currently active users on mookit
 */
app.get('/api/users/active', function (req, res) {
    mookit.getActiveUsers(function (users) {
        res.json(users);
    });
});

/**
 * Returns the private messages from the inbox
 */
app.post('/api/inbox', function (req, res) {
    var username = req.body.uid;
    var withUsername = req.body.withUid;
    var rangeStart = parseInt(req.body.rangeStart);

    libChat.getPrivateMessages(username, withUsername, rangeStart, function (rows) {
        if (rows) {
            res.json(rows);
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

var port = process.env.PORT || 3000;

http.listen(port, function () {
    console.log('listening on *:' + port);
});