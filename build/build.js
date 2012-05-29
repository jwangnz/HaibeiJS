var Builder = require('./Builder.js'),
    fs = require('fs');

var identify = process.argv[2];
var file = process.argv[3];
if (!identify || !file) {
    console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " <identify> <file>");
    process.exit(1);
}

var code = fs.readFileSync(file, 'utf-8');
var code = Builder.build(identify, code, { beautify: true });
console.log(code);

