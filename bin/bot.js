var RamsayBot = require('../lib/ramsaybot');

//var token = process.env.BOT_API_KEY;
//var name = process.env.BOT_NAME;

var token = 'xoxb-15179089074-tngobgb21Lyqw5s0t0BSOhi4'
var name = 'ramsay_bot'

var ramsaybot = new RamsayBot({
    token: token,
    name: name
});

ramsaybot.run();