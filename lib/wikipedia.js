var wiki = require('node-wikipedia');
var request = require('request');

var WikiPedia = {
    getUrl: function (topic, callback) {
        wiki.page.data(topic, {content: false}, function (wikiResponse) {
            if (wikiResponse) {
                var pageId = wikiResponse.pageid;
                request('https://en.wikipedia.org/w/api.php?action=query&prop=info&inprop=url&inprop=url&format=json&pageids=' + pageId,
                    function (error, response, body) {
                        if (error) {
                            console.log(error);
                            return callback(null);
                        }
                        body = JSON.parse(body);
                        callback(body.query.pages[pageId].fullurl)
                    }
                );
            } else {
                callback(null);
            }
        });
    }
};
/*
 WikiPedia.getUrl('dynamic', function (url) {
 console.log(url);
 });
 */
module.exports = WikiPedia;