/**
 * Handles all the chat-database related stuff
 * This file is not used
 * @deprecated
 */

var path = require('path');
var fs = require('fs');
/*
 var Sequelize = require('sequelize');

 var seq = new Sequelize('educhat', 'root', '');

 var MessageAttachment = seq.define('attachments', {
 id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
 storagePath: {type: Sequelize.STRING, allowNull: false}
 });

 var Message = seq.define('messages', {
 id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
 content: {type: Sequelize.TEXT, allowNull: false}
 }, {timestamps: true});

 var MessageAttachments = seq.define('message_attachments', {
 id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
 messageId: {
 type: Sequelize.INTEGER,
 references: {
 model: Message,
 key: 'id'
 }
 },
 attachmentId: {
 type: Sequelize.INTEGER,
 references: {
 model: MessageAttachment,
 key: 'id'
 }
 }
 });

 var Inbox = seq.define('inbox', {
 id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
 username: {type: Sequelize.STRING, allowNull: false},
 fromUsername: {type: Sequelize.STRING, allowNull: false},
 message: {
 type: Sequelize.INTEGER,
 references: {
 model: Message,
 key: 'id'
 }
 }
 },
 {
 timestamps: true
 }
 );
 // Message.sync({force: true}).then(function () {
 //     // Table created
 //     return Message.create({content: 'Hello'});
 //
 // });

 */

/*
 fs.readFile(path.join(__dirname, 'db-config.json'), 'utf8', function (err, data) {
 if (err) return;
 var config = JSON.parse(data);


 });*/

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'educhat'
});

connection.connect();

var PersistentStore = {
    __addMessage: function (msg, callback) {
        var sql = "INSERT INTO messages SET ?";
        connection.query(sql, {content: msg.content}, function (err, result) {
            if (err) return callback(null);
            callback(result.insertId);
        });
    },
    addMessage: function (msg, callback) {
        // msg = {fromUser: <>, toUser: <>, content: <>}
        this.__addMessage(msg, function (insertedId) {
            if (insertedId) {
                var sql = "INSERT INTO inbox SET ?";
                connection.query(
                    sql,
                    {
                        username: msg.toUser,
                        fromUsername: msg.fromUser,
                        messageId: insertedId
                    },
                    function (err, result) {
                        if (err) return callback(null);
                        return callback(result.insertId);
                    });
            } else {
                return callback(null);
            }
        });
    },
    getMessages: function (username, fromUsername, rangeStart, callback) {
        var sql = "SELECT * FROM inbox INNER JOIN messages ON inbox.messageId = messages.id WHERE inbox.username=? AND inbox.fromUsername=? ORDER BY messages.createdAt DESC LIMIT ?, ? ";
        connection.query(sql, [username, fromUsername, rangeStart, 10], function (err, rows) {
            if (err) {
                console.error(err);
                return callback(null);
            }
            callback(rows);
        });
    },
    getConversation: function (username1, username2, rangeStart, callback) {
        var sql = "SELECT * FROM inbox INNER JOIN messages ON inbox.messageId = messages.id " +
            "WHERE inbox.username=? AND inbox.fromUsername=? OR inbox.username=? AND inbox.fromUsername=? " +
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

// PersistentStore.getConversation('anurag', 'nitisha', 0, function (data) {
//     console.log(data);
// });
/*
 PersistentStore.addMessage(
 {fromUser: 'anurag', toUser: 'nitisha', content: 'reaply me bitch'},
 function (id) {
 if (id) {
 console.log("Insert success with id " + id);
 } else {
 console.error("Insert faliure");
 }
 }
 );
 */

// PersistentStore.getMessages('nitisha', 'anurag', 0, function (rows) {
//     if (!rows) {
//         console.log('Nothing found');
//     } else {
//         console.log(rows.length + " rows found ");
//         console.log(JSON.stringify(rows));
//     }
// });
module.exports = PersistentStore;