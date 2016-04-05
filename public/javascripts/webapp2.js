// ============= socket io code     =======================
var socket = io();

function L(msg) {
    console.log("eduChat real-time server says: " + JSON.stringify(msg));
}

socket.on('join status', function (msg) {
    L(msg);
});

function requestToJoin(name, uid, token) {
    var joinReq = {"username": name, "uid": uid, "token": token};
    console.log('Requesting to join: ' + JSON.stringify(joinReq));

    socket.emit('join', joinReq);
}

function dispatchMessage(msg) {
    console.log("Dispatching message: " + JSON.stringify(msg));
    socket.emit('private message', msg);
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

                Lockr.set('session', data.msg[0]);
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

// ------------------------ Login form component ends --------------------------


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
        console.log("Beginning to chat with: " + this.props.username + '#' + this.props.id);
        this.props.userSelected({uid: this.props.id, username: this.props.username});
    },
    render: function () {
        var itemStyle = {
            borderRadius: 0
        };
        return (
            // TODO : Remove default active class
            <li role="presentation" className={this.props.username === "anurag" ? "active": ""}>
                <a href="#" style={itemStyle}>
                    <div id={this.props.id + this.props.username} className="media" onClick={this.handleClick}>
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
        var inputStyle = {
            boxShadow: "none",
            background: "#F2F2F2",
            border: "none",
            width: "94%",
            paddingLeft: 0
        };
        var settingsBtnStyle = {
            borderRadius: 0,
            background: "#F2F2F2",
            border: "none"
        };
        var searchIconStyle = {
            background: "#F2F2F2",
            borderRadius: 0,
            border: "none"
        };
        var blockStyle = {
            paddingBottom: "16px"
        };
        return (
            <ul className="nav nav-pills nav-stacked">
                <li role="presentation">
                    <div style={blockStyle}>
                        <div className="input-group">
                            <span className="input-group-addon" id="basic-addon3" style={searchIconStyle}>
                                <span className="glyphicon glyphicon-search" aria-hidden="true"></span>
                            </span>
                            <input type="text"
                                   className="form-control"
                                   id="basic-url"
                                   aria-describedby="basic-addon3"
                                   placeholder="Search"
                                   style={inputStyle}
                                   value={this.state.value}
                                   onChange={this.handleChange}/>
                            <span className="input-group-btn">
                                <button className="btn btn-default" type="button" style={settingsBtnStyle}>
                                    <span className="glyphicon glyphicon-align-justify" aria-hidden="true"></span>
                                </button>
                            </span>
                        </div>
                    </div>
                </li>
            </ul>
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
                            userSelected={self.props.userSelected}/>
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
            height: "80vh",
            backgroundColor: "#ffffff"
        };
        return (
            <div style={activeUsersListStyle}>
                <SearchField onSearchInput={this.handleSearchInput}/>
                <OnlineUsersList
                    users={this.state.users}
                    filterText={this.state.filterText}
                    userSelected={this.props.userSelected}/>
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
            boxShadow: "none",
            height: "70vh",
            overflow: "auto",
            borderRadius: 0,
            marginBottom: 0,
            borderBottom: "solid 2px #ccc"
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
            console.log("Sending message to: " + JSON.stringify(this.props.chattingWith));
            var message = {
                content: this.state.value,
                toUser: this.props.chattingWith.uid,
                fromUser: Lockr.get('session').uid
            };
            this.props.onMessageDispatch(message);
            dispatchMessage(message);
            this.setState({value: ''});
        }
    },
    render: function () {
        var inputStyle = {
            borderRadius: 0,
            border: "none"
        };

        return (
            <div className="input-group">
                <input
                    type="text"
                    className="form-control"
                    aria-label="..."
                    onKeyDown={this.handleKeyDown}
                    onChange={this.handleChange}
                    value={this.state.value}
                    style={inputStyle}
                    placeholder="Type a message..."/>
                <div className="input-group-btn">
                    <div class="btn-group" role="group" aria-label="">
                        <button type="button" class="btn btn-default">Send</button>
                        <button type="button" class="btn btn-default">2</button>
                    </div>
                </div>
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
            <div className="chat-room">
                <div style={chatTitleStyle}>
                    <p className="navbar-text">{this.props.chattingWith.username}</p>
                </div>
                <ChatList messages={this.props.messages}/>
                <MessageInput
                    chattingWith={this.props.chattingWith}
                    onMessageDispatch={this.props.onMessageDispatch}/>
            </div>
        );
    }
});

var Messenger = React.createClass({
    getInitialState: function () {
        return {messages: [], chattingWith: {username: '', uid: ''}};
    },
    loadConversation: function () {
        var self = this;
        socket.on('private message', function (msg) {
            L(msg);
            if (msg.fromUser === self.state.chattingWith.uid) {
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
    handleUserSelected: function (user) {
        var self = this;

        // Load conversation from the persistent store
        var currentUser = Lockr.get('session').uid;

        $.post("/api/inbox", {
            "uid": currentUser,
            withUid: user.uid,
            rangeStart: 0
        }, function (data) {
            if (data) {
                data.map(function (m) {
                    return {toUser: m.uid, fromUser: m.fromUser, content: m.content, ts: m.createdAt};
                });
                self.setState(function (prevState, curProps) {
                    return {messages: data, chattingWith: {uid: user.uid, username: user.username}};
                });

            } else {
                self.setState(function (prevState, curProps) {
                    return {messages: [], chattingWith: {uid: user.uid, username: user.username}};
                });
            }
        });
    },
    onMessageDispatch: function (message) {
        this.setState(function (prevState, curProps) {
            var messages = this.state.messages;
            var chattingWith = this.state.chattingWith;
            messages.push(message);
            return {messages: messages, chattingWith: chattingWith};
        });
    },
    render: function () {
        var onlineUsersListStyle = {
            overflow: "auto",
            borderLeft: "solid 1px #ccc"
        };
        return (
            <div>
                <div className="row">
                    <div className="col-md-3">
                        <FilterableOnlineUsersList
                            activeUsersUrl="/api/users/active"
                            pollInterval={5000}
                            userSelected={this.handleUserSelected}/>
                    </div>
                    <div className="col-md-9" style={onlineUsersListStyle}>
                        <ChatRoom
                            messages={this.state.messages}
                            chattingWith={this.state.chattingWith}
                            onMessageDispatch={this.onMessageDispatch}/>
                    </div>
                </div>
            </div>
        );
    }
});


function cbOnLoginSuccess() {
    console.log("Login success callback called");
    requestToJoin(Lockr.get('session').name, Lockr.get('session').uid, "Lockr.get('session').token");
    ReactDOM.render(
        <Messenger/>,
        document.getElementById('content')
    );
}

$(document).ready(function () {
    if (Lockr.get('session')) {
        cbOnLoginSuccess();
    } else {
        ReactDOM.render(
            <LoginForm onLoginSuccess={cbOnLoginSuccess}/>,
            document.getElementById('content')
        );
    }
});
