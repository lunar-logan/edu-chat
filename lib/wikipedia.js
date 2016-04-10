var wiki = require('node-wikipedia');
var fs = require('fs');
wiki.page.data("Zika virus", {content: true}, function (response) {
    fs.writeFile('out.json', JSON.stringify(response), function () {
        console.log('Content saved to the file');
    });
});

