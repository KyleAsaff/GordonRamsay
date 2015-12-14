var RamsayBot = require('../lib/ramsaybot');

var token = process.env.BOT_API_KEY;
var name = process.env.BOT_NAME;

var ramsaybot = new RamsayBot({
    token: token,
    name: name
});

ramsaybot.run();