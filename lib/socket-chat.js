var colors = require('colors/safe');
// var libChat = require('./libchat');
var models = require('./models');

function socketChat(io) {
    var onlineUsers = {};

    function makeResponse(code, text) {
        return {code: code, msg: text};
    }

    io.on('connection', function (socket) {
        console.log(colors.green('Connected to a user'));

        /*
         Joins the user to the real time chat system,
         Store the socket object into the dictionary

         TODO `onlineUsers` dictionary could be a bottleneck (memory leaks, tactics to improve)
         */
        socket.on('join', function (user) {
            console.log(colors.cyan("Request to join by user: " + JSON.stringify(user)));

            if (user && user.username && user.uid && user.token) {
                if (!(user.uid in onlineUsers)) {
                    onlineUsers[user.uid] = socket;
                    console.log(colors.green(user.username + "/" + user.uid + " added to the online users dict"));
                    socket.emit('join status', makeResponse(0, 'Connected to real-time EduChat'));
                } else {
                    // TODO: situation needs to be analyzed for potential vulnerabilities
                    console.log(colors.yellow('Warning: username "' + user.name + '" is already present'));
                    socket.emit('join status', makeResponse(0, 'You are already connected'));
                }
            } else {
                console.log(colors.red('Error: Invalid join request: ' + JSON.stringify(user)));
                socket.emit('join status', makeResponse(-1, 'Bad join request. Required params: ["username", "uid", "token"]'));
            }
        });


        /**
         * Broadcast the event if somebody is found typing
         * TODO: Is broadcasting this event safe? Does this possess some security vulnerability?
         */
        socket.on('writing', function (msg) {
            io.emit('writing', msg);
        });


        /**
         */
        function hasUser(obj) {
            return obj && obj.uid && obj.token;
        }

        /**
         * Creates a new group conversation
         */
        socket.on('create conversation', function (data) {
            if (data && hasUser(data.user) && data.participants) {

            } else {
                console.log(colors.red("ERROR:") + " Bad request for event 'begin conversation'");
                socket.emit('conversation status', makeResponse(-1, 'Bad request, not enough parameters'));
            }
        });


        /**
         * Handles private chat messages
         */
        socket.on('private message', function (message) {
            console.log(colors.cyan("Private message received: " + JSON.stringify(message)));

            // Both of these are user IDs(numeric)
            var fromUser = message.fromUser;
            var toUser = message.toUser;

            // store the message in a persistent store
            models.Inbox.create({
                fromUser: fromUser,
                toUser: toUser,
                content: message.content
            }).then(function (msg) {
                console.log(colors.green("Message inserted with id: " + msg.id));
            });

            // Push the message to intended user
            if (fromUser in onlineUsers && toUser in onlineUsers) {
                onlineUsers[toUser].emit('private message',
                    {
                        fromUser: fromUser,
                        content: message.content
                    }
                );
            } else {
                console.log(colors.yellow('Warning: Zombie message from: "' + fromUser + '" for: "' + toUser + '"'));
            }
        });


        socket.on('disconnect', function () {
            console.log('one user disconnected');

            Object.keys(onlineUsers).forEach(function (name) {
                if (onlineUsers[name] === socket) {
                    delete onlineUsers[name];
                    console.log(colors.red('Deleted socket object for user: "' + name + '"'));
                }
            });
        });

    });

}

module.exports = socketChat;