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
        defaultValue: 0
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

var Group = sequelize.define('group', {
    uid: {
        type: Sequelize.INTEGER,
        field: 'uid',
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: Sequelize.STRING,
        field: 'username'
    },
    token: {
        type: Sequelize.STRING,
        field: 'token',
        defaultValue: 'fake-group-token'
    }
});

var GroupMember = sequelize.define('group_members', {
    groupUid: {
        type: Sequelize.INTEGER,
        field: 'group_uid'
    },
    userUid: {
        type: Sequelize.INTEGER,
        field: 'user_uid'
    }
});

var GroupMessage = sequelize.define('group_messages', {
    toUser: { // actually the group id
        type: Sequelize.INTEGER,
        field: 'toUser'
    },
    fromUser: {
        type: Sequelize.INTEGER,
        field: 'fromUser'
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
});

User.sync();
Inbox.sync();
SharedObject.sync();
Group.sync();
GroupMember.sync();
GroupMessage.sync();


module.exports.User = User;
module.exports.Inbox = Inbox;
module.exports.SharedObject = SharedObject;
module.exports.Group = Group;
module.exports.GroupMember = GroupMember;
module.exports.GroupMessage = GroupMessage;

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