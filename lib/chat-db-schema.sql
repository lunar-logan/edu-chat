create table if not exists users (
    uid INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    pass VARCHAR(255) NOT NULL,
    mail VARCHAR(255) NOT NULL,
    picture INTEGER
);

create table if not exists mookit_token (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    uid INTEGER NOT NULL,
    username VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    FOREIGN KEY(uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY(username) REFERENCES users(name) ON DELETE CASCADE
);


create table if not exists conversation (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255), -- title of the conversation
    description TEXT,    -- about
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table if not exists participants (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    conversationId INTEGER,
    uid INTEGER NOT NULL,
    username VARCHAR(255) NOT NULL,
    isActive INT NOT NULL DEFAULT 1,
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- time at which this person joined the group
    leftAt TIMESTAMP,                                   -- time at which this person left the group

    FOREIGN KEY(uid) REFERENCES users(uid) ON DELETE CASCADE,       -- comment this line after testing
    FOREIGN KEY(username) REFERENCES users(name) ON DELETE CASCADE,     -- comment this line after testing
    FOREIGN KEY(conversationId) REFERENCES conversation(id) ON DELETE SET NULL
);

create table if not exists messages (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    conversationId INTEGER NOT NULL,
    uid INTEGER NOT NULL,
    content VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(conversationId) REFERENCES conversation(id) ON DELETE CASCADE,
    FOREIGN KEY(uid) REFERENCES users(uid) ON DELETE CASCADE         -- comment this line after testing
);

create table if not exists inbox (
-- place for storing private messages
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    fromUser INTEGER NOT NULL,
    toUser INTEGER NOT NULL,
    content TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(fromUser) REFERENCES users(uid) ON DELETE CASCADE,    -- comment this line after testing
    FOREIGN KEY(toUser) REFERENCES users(uid) ON DELETE CASCADE    -- comment this line after testing
);

create table if not exists uploads (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    filepath VARCHAR(255) NOT NULL,
    fromUser INTEGER NOT NULL,
    toUser INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);