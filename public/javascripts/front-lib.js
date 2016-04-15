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

/**
 * @author http://stackoverflow.com/users/1066579/nrnazifi
 * @see http://stackoverflow.com/questions/11715646/scroll-automatically-to-the-bottom-of-the-page
 * @param div
 */
function scroll_to(div) {
    if (div.scrollTop < div.scrollHeight - div.clientHeight)
        div.scrollTop += 10; // move down

}