// ============= socket io code     =======================
var socket = io();

function L(msg) {
    console.log("eduChat real-time server says: " + JSON.stringify(msg));
}

socket.on('join status', function (msg) {
    L(msg);
});

function requestToJoin(user) {
    console.log('Requesting to join');
    socket.emit('join', user);
}

function dispatchMessage(msg) {
    socket.emit('chat message', msg);
}


// ============= socket io code ends ======================


var LoginForm = React.createClass({
    getInitialState: function () {
        return {username: '', password: ''};
    },
    handleChange: function (e) {
        var state = {};
        if (this.refs.usernameField === e.target) {
            state['username'] = e.target.value;
        } else if (this.refs.passwordField === e.target) {
            state['password'] = e.target.value;
        }
        this.setState(state);
    },
    handleSubmit: function (event) {
        var self = this;
        event.preventDefault();
        console.log('Ready to submit: ' + JSON.stringify(this.state));
        $.post("/api/users", this.state, function (data) {
            if (data.code === 0) {
                console.log('You are now logged in ');
                console.log(JSON.stringify(data.msg));
                Lockr.set('session', data.msg);
                self.props.onLoginSuccess();
            }
            else {
                console.log('Un authorized');
                console.log(data.msg);
            }
        });
    },
    render: function () {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <input
                        ref="usernameField"
                        type="text"
                        placeholder="Type in your username"
                        value={this.state.username}
                        onChange={this.handleChange}/><br/>
                    <input
                        ref="passwordField"
                        type="password"
                        placeholder="Type in your password"
                        value={this.state.password}
                        onChange={this.handleChange}/><br/>
                    <input type="submit" value="Login to mookit"/>
                </form>
            </div>
        );
    }
});


/**
 * Represents a single online-user-list item
 *
 * <b>List of properties:</b>
 * <b>name</b>:        Unique username of the online user
 * <b>picture</b>:     Picture id of the user
 * <b>lastMessage</b>: Last conversation between this and the current user
 */
var OnlineUser = React.createClass({
    handleClick: function (e) {
        // ReactDOM.render(<Messenger messages={DUMMY_CHAT}
        //                            chattingWith={this.props.name}/>, document.getElementById('content'));
        console.log("Beginning to chat with: " + this.props.username+'#'+this.props.id);
        /*ReactDOM.render(
         <Messenger chattingWith={this.props.name}/>,
         document.getElementById('content')
         );*/

        this.props.conversationSelected({id: this.props.id, username: this.props.username});

    },
    render: function () {
        return (
            // TODO : Remove default active class
            <li role="presentation" className={this.props.username === "anurag" ? "active": ""}>
                <a href="#">
                    <div id={this.props.key + this.props.username} className="media" onClick={this.handleClick}>
                        <div className="media-left"><img className="media-object" src=""/></div>
                        <div className="media-body">
                            <div className="media-heading">{this.props.username}</div>
                            <div>{this.props.lastMessage}</div>
                        </div>
                    </div>
                </a>
            </li>
        );
    }
});

var SearchField = React.createClass({
    getInitialState: function () {
        return {value: ''};
    },
    handleChange: function (e) {
        this.setState({value: e.target.value});
        this.props.onSearchInput(e.target.value);
    },
    render: function () {
        return (
            <input
                type="text"
                placeholder="Search"
                value={this.state.value}
                onChange={this.handleChange}/>
        );
    }
});

var OnlineUsersList = React.createClass({
    render: function () {
        var onlineUsers = [];
        var self = this;
        this.props.users.forEach(function (user) {
            if (user.username.indexOf(self.props.filterText) !== -1) {
                onlineUsers.push(user);
            }
        });
        var listNodes = onlineUsers.map(function (user) {
            return (
                <OnlineUser id={user.uid} key={user.uid} username={user.username}
                            lastMessage={'Here comes the last message okay i get it'}
                            conversationSelected={self.props.conversationSelected}/>
            );
        });
        return (
            <ul className="nav nav-pills nav-stacked">
                {listNodes}
            </ul>
        );
    }
});

var FilterableOnlineUsersList = React.createClass({
    getInitialState: function () {
        return {filterText: '', users: []};
    },
    loadActiveUsers: function () {
        var self = this;
        $.get(this.props.activeUsersUrl, function (data) {
            if (data) {
                self.setState(function (oldState, currentProps) {
                    return {filterText: oldState.filterText, users: data};
                });
            } else {
                console.log("Error: Server fault while fetching active users list");
            }
        });
    },
    componentDidMount: function () {
        this.loadActiveUsers();
        setInterval(this.loadActiveUsers, this.props.pollInterval);
    },
    handleSearchInput: function (text) {
        this.setState({filterText: text});
    },
    render: function () {
        var activeUsersListStyle = {
            height: "80vh"
        };
        return (
            <div className="online-user-list" style={activeUsersListStyle}>
                <SearchField onSearchInput={this.handleSearchInput}/>
                <OnlineUsersList
                    users={this.state.users}
                    filterText={this.state.filterText}
                    conversationSelected={this.props.conversationSelected}/>
            </div>
        );
    }
});


/**
 * Represents a single chat message in the list of messages
 * Properties:
 * fromUser: username of the sender
 * content: content of the chat
 */
var ChatItem = React.createClass({
    render: function () {
        var chatItemStyle = {
            border: "none",
            borderRadius: 0,
            margin: 0,
            padding: 0
        };
        return (
            <li className="list-group-item" style={chatItemStyle}>
                <div className="media">
                    <div className="media-left"><img className="media-object" src=""/></div>
                    <div className="media-body">
                        <div className="well well-sm">{this.props.content}</div>
                    </div>
                </div>
            </li >
        );
    }
});

/**
 * Represents a set of messages between
 *
 * Properties:
 * messages: A list of messages
 */
var ChatList = React.createClass({
    render: function () {
        var chatNodes = this.props.messages.map(function (chat) {
            return (
                <ChatItem
                    content={chat.content}
                    fromUser={chat.fromUser}
                    ts={chat.ts}
                    key={chat.id}
                    fromUsername={chat.fromUsername}/>
            );
        });

        var chatListStyle = {
            boxShadow: "none"
        };
        return (
            <ul className="list-group" style={chatListStyle}>
                {chatNodes}
            </ul>
        );
    }
});

var MessageInput = React.createClass({
    getInitialState: function () {
        return {value: ''};
    },
    handleChange: function (e) {
        this.setState({value: e.target.value});
    },
    handleKeyDown: function (e) {
        if (e.keyCode === 13) { // Enter key
            var currentMessage = this.state.value;
            console.log("Sending message: " + currentMessage);
            dispatchMessage({
                content: this.state.value,
                toUser: this.props.chattingWith,
                fromUser: Lockr.get('session').name
            });
            this.setState({value: ''});
        }
    },
    render: function () {
        return (
            <div className="message-input">
                <div>
                    <textarea onKeyDown={this.handleKeyDown}
                              onChange={this.handleChange}
                              value={this.state.value}
                              placeholder="Type a message..."/>
                </div>
                <div>Other actions</div>
            </div>
        );
    }
});

var ChatRoom = React.createClass({

    render: function () {
        var chatTitleStyle = {
            borderBottom: "solid 2px #e3e3e3",
            overflow: "auto"
        };
        return (
            <div>
                <div style={chatTitleStyle}>
                    <p className="navbar-text">{this.props.chattingWith}</p>
                </div>
                <ChatList messages={this.props.messages}/>
                <MessageInput chattingWith={this.props.chattingWith}/>
            </div>
        );
    }
});


var Messenger = React.createClass({
    getInitialState: function () {
        return {messages: [], chattingWith: ''};
    },
    loadConversation: function () {
        var self = this;
        socket.on('private message', function (msg) {
            L(msg);
            if (msg.fromUser === self.state.chattingWith) {
                self.setState(function (prevState, curProps) {
                    var messages = prevState.messages;
                    return messages.push(msg);
                });
            } else {
                console.log("ting ting ting, yatrigan kripya dhyaan dein ek msg aaya hai " + JSON.stringify(msg));
            }
        });
    },
    componentDidMount: function () {
        this.loadConversation();
    },
    handleConversationSelected: function (conversation) {
        var self = this;

        // Load conversation from the persistent store
        $.post("/api/inbox", {
            "user": self.state.chattingWith,
            withUser: conversation.name,
            rangeStart: 0
        }, function (data) {
            if (data) {
                data.map(function (m) {
                    return {toUser: m.username, fromUser: m.fromUsername, content: m.content, ts: m.createdAt};
                });
                self.setState(function (prevState, curProps) {
                    return {messages: data, chattingWith: conversation.name};
                });

            } else {
                self.setState(function (prevState, curProps) {
                    return {messages: [], chattingWith: conversation.name};
                });
            }
        });
    },
    render: function () {
        var onlineUsersListStyle = {
            border: "solid 1px cadetblue",
            overflow: "auto"
        };
        return (
            <div>
                <div><h1>Here comes the title</h1></div>
                <div className="row">
                    <div className="col-md-3" style={onlineUsersListStyle}>
                        <FilterableOnlineUsersList
                            activeUsersUrl="/api/users/active"
                            pollInterval={5000}
                            conversationSelected={this.handleConversationSelected}/>
                    </div>
                    <div className="col-md-9" style={onlineUsersListStyle}>
                        <ChatRoom messages={this.state.messages} chattingWith={this.state.chattingWith}/>
                    </div>
                </div>
            </div>
        );
    }
});


function cbOnLoginSuccess() {
    console.log("Login success callback called");
    ReactDOM.render(
        <Messenger/>,
        document.getElementById('content')
    );
}

var DUMMY_CHAT = [
    {content: 'This is a test', fromUser: 1024, ts: Date.now(), id: 0.7, fromUsername: 'anurag'},
    {
        content: 'The onChange event behaves as you would expect it to: whenever a form field is changed this event is fired rather than inconsistently on blur. We intentionally break from existing browser behavior because onChange is a misnomer for its behavior and React relies on this event to react to user input in real time. See Forms for more details.',
        fromUser: 1025,
        ts: Date.now(),
        id: 0.6, fromUsername: 'riva'
    }
];


var ONLINE_USERS = [
    {id: 0.1, name: "Superman"},
    {id: 0.2, name: "Batman"},
    {id: 0.3, name: "Darksied"},
    {id: 0.4, name: "Matron"},
    {id: 0.51, name: 'anurag'},
    {id: 0.52, name: 'nitisha'}

];

$(document).ready(function () {
    if (Lockr.get('session')) {
        requestToJoin(Lockr.get('session'));
        cbOnLoginSuccess();
    } else {
        ReactDOM.render(
            <LoginForm onLoginSuccess={cbOnLoginSuccess}/>,
            document.getElementById('content')
        );
    }
});
