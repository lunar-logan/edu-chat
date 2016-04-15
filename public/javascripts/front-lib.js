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

function processMessage(text) {
    var tokens = text.split(/ +/).filter(function (v) {
        return v && v.length > 0;
    });

   /* tokens.forEach(function (t) {
        if (t.startsWith('@w:')) {
            var colonIndex = t.indexOf(':');
            var topic = t.substring(colonIndex + 1);
            getWikipediaUrl(topic, function () {
                
            })
        }
    });*/

}

function getWikipediaUrl(topic, callback) {
    $.get('/api/wiki?topic=' + topic).done(function (data) {
        callback(data);
    }).fail(function (e) {
        callback(null);
    });
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