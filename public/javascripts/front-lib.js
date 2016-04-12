function isUserAuthenticated() {
    return docCookies.getItem("uid") &&
        docCookies.getItem("username") &&
        docCookies.getItem("token");
}

function getUserName() {
    return docCookies.getItem('username');
}

function getUserId() {
    return docCookies.getItem('uid');
}

function getMookitToken() {
    return docCookies.getItem('token');
}

function getUser() {
    return {
        username: getUserId(),
        uid: getUserId(),
        token: getMookitToken()
    };
}

function logout() {
    docCookies.removeItem('token');
    docCookies.removeItem('uid');
    docCookies.removeItem('username');
}