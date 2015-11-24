'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var RamsayBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'ramsaybot';
};

// inherits methods and properties from the Bot constructor
util.inherits(RamsayBot, Bot);

module.exports = RamsayBot;

RamsayBot.prototype.run = function () {
	RamsayBot.super_.call(this, this.settings);
	this.on('message', this._onMessage);
}

RamsayBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) && this._isChannelConversation(message) && !this._isFromRamsayBot(message) && this._isMentioningRamsay(message)) {
        this._replyWithGreeting(message);
    }
};

// Check to see if a message is of type message and has text
RamsayBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

// Check if the message is directed at a chat channel
RamsayBot.prototype._isChannelConversation = function (message) {
	return typeof message.channel === 'string' && (message.channel[0] === 'C' || message.channel[0] === 'G');
};

// Check to see if the message comes from a user that is not RamsayBot
RamsayBot.prototype._isFromRamsayBot = function (message) {
	return message.user === this.self.id;
};

RamsayBot.prototype._isMentioningRamsay = function (message) {
    return message.text.toLowerCase().indexOf('ramsay') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

RamsayBot.prototype._replyWithGreeting = function (message) {
	var self = this;
	self.postMessage(message.channel, "hi there", {as_user: true});
};