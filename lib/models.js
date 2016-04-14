var path = require('path');
var fs = require('fs');
var Sequelize = require('sequelize');

// Read and load the database configuration
var data = fs.readFileSync(path.join(process.cwd(), 'lib', 'db-config.json'));
var dbConfig = JSON.parse(data);


var sequelize = new Sequelize(dbConfig.connectionUrl);

var User = sequelize.define('user', {
    uid: {
        type: Sequelize.INTEGER,
        field: 'uid',
        autoIncrement: true
    },
    username: {
        type: Sequelize.STRING,
        field: 'username'
    },
    token: {
        type: Sequelize.STRING,
        field: 'token'
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        field: 'isActive',
        defaultValue: false
    },
    picture: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'picture'
    }
});

var Inbox = sequelize.define('inbox', {
    fromUser: {
        type: Sequelize.INTEGER,
        field: 'fromUser'
    },
    toUser: {
        type: Sequelize.INTEGER,
        field: 'toUser'
    },
    content: {
        type: Sequelize.STRING,
        field: 'content'
    },
    isFile: {
        type: Sequelize.BOOLEAN,
        field: 'isFile',
        defaultValue: false
    },
    mimeType: {
        type: Sequelize.STRING,
        field: 'mimeType',
        defaultValue: ''
    },
    seen: {
        type: Sequelize.BOOLEAN,
        field: 'seen',
        defaultValue: false
    }
}, {
    freezeTableName: true,
    timestamps: true
});

var SharedObject = sequelize.define('shared_object', {
    fromUser: {
        type: Sequelize.INTEGER,
        field: 'fromUser'
    },
    toUser: {
        type: Sequelize.INTEGER,
        field: 'toUser'
    },
    storagePath: {
        type: Sequelize.STRING,
        field: 'storagePath'
    },
    mimeType: {
        type: Sequelize.STRING,
        field: 'mimeType'
    }
}, {
    freezeTableName: true,
    timestamps: true
});

User.sync();
Inbox.sync();
SharedObject.sync();


module.exports.User = User;
module.exports.Inbox = Inbox;
module.exports.SharedObject = SharedObject;

/*
 User.sync().then(function () {
 console.log(colors.green('user table created'));
 });
 Inbox.sync().then(function () {
 console.log(colors.green('Tables created'));
 });

 SharedObject.sync().then(function () {
 console.log(colors.green('shared object Table created'));
 });
 */