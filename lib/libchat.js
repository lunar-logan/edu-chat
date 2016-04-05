var path = require('path');
var fs = require('fs');
var colors = require('colors/safe');

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'educhat'
});

connection.connect();

var LibChat = {
    createConversation: function (callback) {
        var sql = "INSERT INTO conversation () VALUES ()";
        connection.query(sql, {}, function (err, result) {
            if (err) {
                console.log(err);
                return callback(null);
            }
            callback(result.insertId);
        });
    },
    addParticipant: function (conversationId, participant, callback) {
        var sql = "INSERT INTO participants SET ?";
        connection.query(sql, {
            conversationId: conversationId,
            uid: participant.uid,
            username: participant.username
        }, function (err, result) {
            if (err) {
                console.log(err);
                return callback(null);
            }
            callback(result.insertId);
        });
    },
    addParticipants: function (conversationId, participants, callback) {
        participants.forEach(function (participant) {
            this.addParticipant(conversationId, participant, callback);
        });
    },
    addGroupMessage: function (conversationId, message, callback) {
        var sql = "INSERT INTO messages SET ?";
        connection.query(sql, {
            conversationId: conversationId,
            uid: message.uid,
            content: message.content
        }, function (err, result) {
            if (err) {
                console.log(err);
                return callback(null);
            }
            callback(result.insertId);
        })
    },
    getGroupMessages: function (conversationId, rangeStart, callback) {
        var sql = "SELECT * FROM messages WHERE conversationId=? ORDER BY createdAt DESC LIMIT ?, ?";
        connection.query(sql, [conversationId, rangeStart, 15], function (err, data) {
            if (err) {
                console.log(err);
                return callback(null);
            }
            callback(data);
        })
    },

    addPrivateMessage: function (msg, callback) {
        var sql = "INSERT INTO inbox SET ?";
        connection.query(
            sql,
            {
                fromUser: msg.fromUser,
                toUser: msg.toUser,
                content: msg.content
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                    return callback(null);

                }
                callback(result.insertId);
            });
    },
    getPrivateMessages: function (username1, username2, rangeStart, callback) {
        var sql = "SELECT * FROM inbox " +
            "WHERE inbox.fromUser=? AND inbox.toUser=? OR inbox.fromUser=? AND inbox.toUser=? " +
            "ORDER BY createdAt DESC " +
            "LIMIT ?, ?";
        // TODO: LIMIT is a possible performance tactic
        connection.query(sql, [username1, username2, username2, username1, rangeStart, 10], function (err, rows) {
            if (err) {
                console.log(err);
                return callback(null);
            }
            callback(rows);
        });
    }
};

function test() {
    LibChat.createConversation(function (cid) {
        if (cid) {
            console.log("Insert successful with id: " + cid);

            LibChat.addParticipant(cid, {uid: 1, username: 'anurag'}, function (pid) {
                if (pid) {
                    console.log("Inserted into participants table with id: " + pid);
                } else {
                    console.log(colors.red('ERR: Could not insert in participants table'));
                }
            });

        } else {
            console.log(colors.red('ERR: Could not insert'));
        }
    });
}

// test();     // comment this line in production
module.exports = LibChat;