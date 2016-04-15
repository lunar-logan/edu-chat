var wiki = require('node-wikipedia');
var fs = require('fs');
var http = require('http');

wiki.page.data("Space", {content: false}, function (response) {

    if (response) {
        var pageId = response.pageid;
        console.log("Page Id: " + pageId);
        var httpReq = http.request({
            host: 'en.wikipedia.org',
            path: '/w/api.php?action=query&prop=info&inprop=url&inprop=url&format=json&pageids=' + pageId,
            headers: {
                'User-Agent': 'EduChat live preview generator/1.0'
            }
        }, function (res) {
            var resText = '';
            console.log(res.statusCode);

            res.on('data', function (chunk) {
                console.log(chunk);
                resText += chunk;
            });

            res.on('end', function () {
                console.log('End called');
                console.log(resText);
            });
        });
        httpReq.on('error', function (e) {
            console.log(e);
        });
        httpReq.end();
    } else {
        console.log('No response');
    }
});

