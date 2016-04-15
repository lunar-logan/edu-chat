// ============= socket io related code   =======================
var socket = io();

/**
 * Logs a new message onto console
 */
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

// ============= socket io related code ends ======================


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
    getInitialState: function () {
        return {
            unseenMessagesCount: 0,
            unseenMessagesLabel: ''
        };
    },
    handleClick: function (e) {
        console.log("Beginning to chat with: " + this.props.username + '#' + this.props.id);
        this.setState({
            unseenMessagesCount: 0,
            unseenMessagesLabel: ''
        });
        this.props.userSelected({uid: this.props.id, username: this.props.username});

    },

    componentDidMount: function () {
        var self = this;
        socket.on('private message', function (msg) {
            if (msg.fromUser == self.props.id && self.props.id != self.props.chattingWith.uid) {
                var newState = {
                    unseenMessagesCount: 1 + self.state.unseenMessagesCount
                };
                if (newState.unseenMessagesCount > 99) {
                    newState.unseenMessagesLabel = "99+";
                } else {
                    newState.unseenMessagesLabel = "" + newState.unseenMessagesCount;
                }
                self.setState(newState);
                self.props.onMessageArrival(msg.fromUser);
            }
        });
    },

    getUserItem: function () {
        var lastMessageStyle = {
            overflow: "auto",
            fontSize: "11px"
        };
        var itemStyle = {
            textDecoration: "none",
            color: "#ffffff"
            // borderBottom: "solid 1px #1a415f"
        };
        var imgStyle = {
            borderRadius: "4px"
        };
        return (
            <a href="#" style={itemStyle} onClick={this.handleClick}>
                <div className="row">
                    <div className="col-sm-4">
                        <img className="media-object" width="40px" src="http://www.gravatar.com/avatar/mm"
                             style={imgStyle}/>
                    </div>
                    <div className="col-sm-8">
                        <div className="row">
                            <div className="col-sm-9">{this.props.username}
                                <div style={lastMessageStyle}>{this.props.lastMessage}</div>
                            </div>
                            <div className="col-sm-3">
                                <span className="label label-success">{this.state.unseenMessagesLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        );
    },

    render: function () {
        var itemStyle = {
            borderRadius: 0,
            color: "#ffffff"
        };
        var lastMessageStyle = {
            overflow: "auto",
            fontSize: "11px"
        };

        return (
            // TODO : Remove default active class
            <li role="presentation" className={this.props.id === this.props.chattingWith.uid ? 'active' : ''}>
                {this.getUserItem()}
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
            background: "#1a415f",
            border: "none",
            width: "100%",
            paddingLeft: 0,
            color: "#ffffff"
        };
        var settingsBtnStyle = {
            background: "#1a415f",
            border: "none"
        };
        var searchIconStyle = {
            background: "#1a415f",
            border: "none"
        };
        var blockStyle = {
            paddingTop: "16px",
            paddingBottom: "16px"
        };
        /**
         * <span className="input-group-btn">
         <button className="btn btn-default" type="button" style={settingsBtnStyle}>
         <span className="glyphicon glyphicon-edit white" aria-hidden="true"></span>
         </button>
         </span>
         */
        return (
            <ul className="nav nav-pills nav-stacked">
                <li role="presentation">
                    <div style={blockStyle}>
                        <div className="input-group">
                            <span className="input-group-addon" id="basic-addon3" style={searchIconStyle}>
                                <span className="glyphicon glyphicon-search whiteish" aria-hidden="true"></span>
                            </span>
                            <input type="text"
                                   className="form-control"
                                   id="basic-url"
                                   aria-describedby="basic-addon3"
                                   placeholder="Search"
                                   style={inputStyle}
                                   value={this.state.value}
                                   onChange={this.handleChange}/>

                        </div>
                    </div>
                </li>
            </ul>
        );
    }
});

var OnlineUsersList = React.createClass({
    handleUserSelected: function (data) {
        this.props.userSelected(data);
    },
    render: function () {
        var onlineUsers = [];
        var self = this;

        this.props.users.forEach(function (user) {
            if (user && user.username && user.username.indexOf(self.props.filterText) !== -1) {
                onlineUsers.push(user);
            }
        });

        self.listNodes = onlineUsers.map(function (user) {
            return (
                <OnlineUser id={parseInt(user.uid)}
                            key={user.id}
                            username={user.username}
                            lastMessage={moment(Date.parse(user.createdAt)).fromNow(true)}
                            userSelected={self.handleUserSelected}
                            chattingWith={self.props.chattingWith}
                            onMessageArrival={self.props.onMessageArrival}/>
            );
        });
        return (
            <ul className="nav nav-pills nav-stacked">
                {self.listNodes}
            </ul>
        );
    }
});


var FilterableOnlineUsersList = React.createClass({
    getInitialState: function () {
        return {filterText: '', users: []};
    },
    handleMessageArrival: function (userId) {
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
            height: "88vh"
        };
        return (
            <div style={activeUsersListStyle}>
                <SearchField onSearchInput={this.handleSearchInput}/>
                <OnlineUsersList
                    users={this.state.users}
                    filterText={this.state.filterText}
                    userSelected={this.props.userSelected}
                    chattingWith={this.props.chattingWith}
                    onMessageArrival={this.handleMessageArrival}
                />
            </div>
        );
    }
});


var MessageBlock = React.createClass({
    render: function () {
        var i = 0;
        var textNodes = this.props.messages.map(function (text) {
            i++;
            return (
                <div>
                    {text}
                </div>
            );
        });
        return (
            <div>
                {textNodes}
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
    rawMarkup: function () {
        var rawHtml = emoji.replace_colons(this.props.content);
        return {
            __html: rawHtml
        };
    },
    getFileUrl: function () {
        var self = this;
        if (self.props.isFile) {
            return "/api/object?id=" + self.props.id;
        }
        return null;
    },
    getLeftItem: function () {
        var itemStyle = {
            margin: "4px"
        };
        var imgStyle = {
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "solid 1px #337AB7"
            // boxShadow: "0 0 4px #d2d2d2"
        };
        var msgStyle = {
            padding: "8px 16px",
            borderRadius: "2px",
            background: "#337AB7",
            color: "#ffffff",
            display: "table",
            minWidth: "0%",
            maxWidth: "100%"
        };
        if (this.props.isFile) {
            var isImage = this.props.mimeType.startsWith("image");
            var url = this.getFileUrl();

            return (
                <div className="row" style={itemStyle}>
                    <div className="col-sm-1">
                        <img src="" width="32" style={imgStyle}/>
                    </div>
                    <div className="col-sm-6">
                        <span style={msgStyle}>
                            <a href={url} target="_blank">{isImage ? <img src={url} width='200px' alt={url}/> : url}</a>
                        </span>
                    </div>
                    <div className="col-sm-5"></div>
                </div>
            );
        } else {
            return (
                <div className="row" style={itemStyle}>
                    <div className="col-sm-1">
                        <img src="" width="32" style={imgStyle}/>
                    </div>
                    <div className="col-sm-6">
                        <span style={msgStyle} dangerouslySetInnerHTML={this.rawMarkup()}></span>
                    </div>
                    <div className="col-sm-5"></div>
                </div>
            );
        }
    },
    getRightItem: function () {

        var itemStyle = {
            margin: "4px"
        };
        var imgStyle = {
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "solid 1px #ccc"
            // boxShadow: "0 0 4px #d2d2d2"
        };
        var msgStyle = {
            background: "#ffffff",
            border: "solid 1px #ccc",
            padding: "8px 16px",
            borderRadius: "2px",
            color: "#000",
            display: "table",
            minWidth: "0%",
            maxWidth: "100%",
            float: "right"
            // boxShadow: "0 0 4px #d2d2d2"
        };
        if (this.props.isFile) {
            var isImage = this.props.mimeType.startsWith("image");
            var url = this.getFileUrl();

            return (
                <div className="row" style={itemStyle}>
                    <div className="col-sm-5"></div>
                    <div className="col-sm-6">
                       <span style={msgStyle}>
                            <a href={url} target="_blank">{isImage ? <img src={url} width='200px' alt={url}/> : url}</a>
                        </span>
                    </div>
                    <div className="col-sm-1">
                        <img src="" width="32" style={imgStyle}/>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="row" style={itemStyle}>
                    <div className="col-sm-5"></div>
                    <div className="col-sm-6">
                        <span style={msgStyle} dangerouslySetInnerHTML={this.rawMarkup()}></span>
                    </div>
                    <div className="col-sm-1">
                        <img src="" width="32" style={imgStyle}/>
                    </div>
                </div>
            );
        }
    },
    render: function () {
        var curUserId = getUserId();
        var chatItemStyle = {
            border: "none",
            borderRadius: 0,
            background: "transparent"
        };

        if (curUserId == this.props.fromUser) {
            return (
                <li className="list-group-item" style={chatItemStyle}>
                    {this.getLeftItem()}
                </li>
            );
        }
        return (
            <li className="list-group-item" style={chatItemStyle}>
                {this.getRightItem()}
            </li>
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
    componentDidMount: function () {
    },
    render: function () {

        this.props.messages.sort(function (a, b) {
            if (a.createdAt > b.createdAt) {
                return 1;
            } else if (a.createdAt < b.createdAt) {
                return -1;
            }
            return 0;
        });

        var messageNodes = this.props.messages.map(function (chat) {
            if (!('createdAt' in chat)) {
                chat.createdAt = Date.now();
            }
            return (
                <ChatItem
                    id={chat.id}
                    fromUser={chat.fromUser}
                    content={chat.content}
                    ts={chat.ts}
                    mimeType={chat.mimeType}
                    isFile={chat.isFile}
                    createdAt={chat.createdAt}
                    // key={Date.now()}
                    fromUsername={chat.fromUsername}/>
            );
        });

        var chatListStyle = {
            boxShadow: "none",
            height: "74vh",
            overflow: "auto",
            borderRadius: 0,
            marginBottom: 0
        };
        return (
            <ul className="list-group" id="message-list" style={chatListStyle}>
                {messageNodes}
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
            if (currentMessage && currentMessage !== '') { // If the message typed is not empty
                console.log("Sending message to: " + JSON.stringify(this.props.chattingWith));
                var message = {
                    content: this.state.value,
                    toUser: this.props.chattingWith.uid,
                    fromUser: getUserId(),
                    isFile: false,
                    createdAt: Date.now()
                };
                this.props.onMessageDispatch(message);
                dispatchMessage(message);
                this.setState({value: ''});
            }
        } else {
            // Emit the event that the current user is typing
            console.log("Emiting the event of typing for " + JSON.stringify(getUserId()));
            socket.emit('writing', {uid: getUserId()});
        }
    },
    handleUploadButtonClick: function (e) {
        this.refs.fileInputButton.click();
    },
    handleFileInput: function () {
        var fileList = this.refs.fileInputButton.files;
        var self = this;
        if (fileList.length === 1) {
            var formData = new FormData();
            formData.append('payload', fileList[0]);
            formData.append('toUser', this.props.chattingWith.uid);

            $.ajax({
                url: '/upload',
                type: 'POST',
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                success: function (data) {
                    console.log(data);
                    if (data.code === 0) {
                        socket.emit('private message', data.msg);
                        self.props.onMessageDispatch(data.msg);
                    } else {
                        console.log("Could not upload the file, reason: " + data.msg);
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    console.log(textStatus);
                    console.log(error);
                }
            });
        }
        console.log("Following file(s) have been uploaded");
        console.log(fileList);
    },
    render: function () {
        var inputBockStyle = {
            overflow: "auto",
            paddingTop: "8px",
            paddingBottom: "8px",
            paddingLeft: "16px",
            paddingRight: "16px",
            background: "#eeeeee"
        };
        var inputStyle = {
            borderRadius: "4px",
            border: "none",
            overflow: "hidden",
            boxShadow: "none",
            background: "#fff"
        };
        var actionButtonStyle = {
            border: "none",
            boxShadow: "none",
            background: "transparent",
            fontSize: "16px"
        };

        var fileInputStyle = {
            display: "none"
        };

        return (
            <div className="input-group" style={inputBockStyle}>
                <input
                    type="text"
                    className="form-control"
                    onKeyDown={this.handleKeyDown}
                    onChange={this.handleChange}
                    value={this.state.value}
                    style={inputStyle}
                    placeholder="Type a message..."/>
                <div className="input-group-btn">
                    <div className="input-group-btn" role="group">
                        <input type="file" style={fileInputStyle} ref="fileInputButton"
                               onChange={this.handleFileInput}/>
                        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown"
                                style={actionButtonStyle} onClick={this.handleUploadButtonClick}>
                            <span className="glyphicon glyphicon-paperclip whiteish"></span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
});


var ChatRoom = React.createClass({
    getInitialState: function () {
        return {
            isWriting: '',
            timeLeft: 0
        };
    },

    updateWhoIsWriting: function () {
        var self = this;
        socket.on('writing', function (msg) {
            if (msg.uid == self.props.chattingWith.uid && self.state.timeLeft === 0) {
                self.setState(function (oldState, currentProps) {
                    return {
                        isWriting: 'is writing',
                        timeLeft: 3000
                    };
                });
                setTimeout(function () {
                    self.setState(function (oldState, currentProps) {
                        return {
                            isWriting: '',
                            timeLeft: 0
                        };
                    });
                }, self.state.timeLeft);
            }
        });
    },

    componentDidMount: function () {
        this.updateWhoIsWriting();
    },

    render: function () {
        var chatRootStyle = {
            background: "#ffffff"
        };
        return (
            <div className="chat-room" style={chatRootStyle}>
                <div className="container-fluid">
                    <div className="row" style={chatTitleStyle}>
                        <div className="col-sm-6">
                            <span>{this.props.chattingWith.username}</span>
                            <span className="is-writing">{this.state.isWriting}</span>
                        </div>
                        <div className="col-sm-4"></div>
                        <div className="col-sm-2" style={loadMoreButtonGroupStyle}>
                            <div className="btn-group" role="group">
                                <button type="button" className="btn btn-default" style={buttonStyle}
                                        title="Click to load previous messages" onClick={this.props.onLoadMoreMessages}>
                                    <span className="glyphicon glyphicon-download pinkish"
                                          style={glyphIconStyle}></span>
                                </button>
                            </div>
                        </div>
                    </div>
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
        return {messages: [], chattingWith: {username: '', uid: ''}, rangeStart: 0};
    },
    handleLogout: function (e) {
        Lockr.rm('session');
        document.location.reload(true);
    },
    loadConversation: function () {
        var self = this;
        socket.on('private message', function (msg) {
            L(msg);
            if (msg.fromUser == self.state.chattingWith.uid && msg.createdAt) {
                msg.createdAt = Date.parse(msg.createdAt) || msg.createdAt;
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
        var currentUserId = getUserId();

        $.post("/api/inbox", {
            "uid": currentUserId,
            withUid: user.uid,
            rangeStart: 0
        }, function (data) {
            if (data) {
                console.log("Messages received from server: ");
                // console.log(data);
                self.setState({rangeStart: data.length});
                data = data.map(function (m) {
                    return {
                        id: m.id,
                        toUser: m.toUser,
                        fromUser: m.fromUser,
                        content: m.content,
                        mimeType: m.mimeType,
                        isFile: m.isFile,
                        ts: m.createdAt,
                        createdAt: Date.parse(m.createdAt)
                    };
                });
                console.log(data);
                self.setState(function (prevState, curProps) {
                    return {messages: data, chattingWith: {uid: user.uid, username: user.username}};
                });

            } else {
                self.setState(function (prevState, curProps) {
                    return {messages: [], chattingWith: {uid: user.uid, username: user.username}, rangeStart: 0};
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
    onClickToLoadMoreMessages: function () {
        var self = this;

        // Load conversation from the persistent store
        var currentUserId = getUserId();
        var user = this.state.chattingWith;

        $.post("/api/inbox", {
            "uid": currentUserId,
            withUid: user.uid,
            rangeStart: self.state.rangeStart
        }, function (data) {
            if (data) {
                self.setState({rangeStart: self.state.rangeStart + data.length});
                data = data.map(function (m) {
                    return {
                        id: m.id,
                        toUser: m.toUser,
                        fromUser: m.fromUser,
                        content: m.content,
                        mimeType: m.mimeType,
                        isFile: m.isFile,
                        ts: m.createdAt,
                        createdAt: Date.parse(m.createdAt)
                    };
                });
                self.setState(function (prevState, curProps) {
                    var messages = self.state.messages;
                    data.forEach(function (m) {
                        messages.push(m);
                    });
                    return {messages: messages, chattingWith: {uid: user.uid, username: user.username}};
                });

            } else {
                self.setState(function (prevState, curProps) {
                    return {messages: [], chattingWith: {uid: user.uid, username: user.username}, rangeStart: 0};
                });
            }
        });
    },
    render: function () {
        var onlineUsersListStyle = {
            overflow: "auto",
            background: "hotpink",
            padding: "0"
        };

        var topHeaderStyle = {
            overflow: "auto",
            background: "#1a415f",
            paddingTop: "8px",
            paddingBottom: "8px"
        };

        var btnStyle = {
            background: "transparent",
            border: "solid 1px #47b0ff",
            boxShadow: "none",
            paddingLeft: "8px",
            paddingRight: "8px",
            paddingTop: "2px",
            paddingBottom: "2px"
        };

        var glyphStyle = {
            fontSize: "14px"
        };
        return (
            <div>
                <div className="row" style={topHeaderStyle}>
                    <div className="col-sm-1">
                        <button className="btn btn-success" style={btnStyle} title="Create a group">
                            <span className="glyphicon glyphicon-pencil whiteish" style={glyphStyle}></span>
                        </button>
                    </div>
                    <div className="col-sm-10"></div>
                    <div className="col-sm-1">
                        <button className="btn btn-danger" style={btnStyle} title="Click to logout"
                                onClick={this.handleLogout}>
                            <span className="glyphicon glyphicon-log-out whiteish" style={glyphStyle}></span>
                        </button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-3" style={leftPanelStyle}>
                        <FilterableOnlineUsersList
                            activeUsersUrl="/api/users/active"
                            pollInterval={8000}
                            userSelected={this.handleUserSelected}
                            chattingWith={this.state.chattingWith}/>
                    </div>
                    <div className="col-md-9" style={onlineUsersListStyle}>
                        <ChatRoom
                            messages={this.state.messages}
                            chattingWith={this.state.chattingWith}
                            onMessageDispatch={this.onMessageDispatch}
                            onLoadMoreMessages={this.onClickToLoadMoreMessages}/>
                    </div>
                </div>
            </div>
        );
    }
});


function cbOnLoginSuccess() {
    console.log("Login success callback called");

    // Request the server to join the real-time edu-chat server
    requestToJoin(getUserName(), getUserId(), getMookitToken());

    // Render the main DOM
    ReactDOM.render(
        <Messenger/>,
        document.getElementById('content')
    );
}

$(document).ready(function () {

    emoji.sheet_path = '/images/emoji/sheet_apple_64.png';
    emoji.use_sheet = true;

    if (isUserAuthenticated()) {
        cbOnLoginSuccess();
    } else {
        document.getElementById('content').innerHTML = '<h1>Yo You are not authorized to chat Yo</h1>';
    }
});
