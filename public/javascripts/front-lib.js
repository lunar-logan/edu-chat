function isUserAuthenticated() {
    return docCookies.getItem("uid") &&
        docCookies.getItem("username") &&
        docCookies.getItem("token") &&
        docCookies.getItem("eduId");
}

function getUserName() {
    return docCookies.getItem('username');
}

function getUserId() {
    return docCookies.getItem('eduId');
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
    docCookies.removeItem('eduId');
    docCookies.removeItem('username');
}