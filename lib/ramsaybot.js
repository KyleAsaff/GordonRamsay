'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var request = require('request');
var cheerio = require('cheerio');

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
	this.on('start', this._scrapeFoodTrucks);
	//this.on('start', this._scrapeFoodTruckMenus);
	//this.on('start', this._getTab);
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

RamsayBot.prototype._scrapeFoodTrucks = function () {
	var tab = '#tab_0';
	request('https://www.gfoodtrucks.com/', function (error, response, html) {
		if (!error && response.statusCode == 200) {
	    	var $ = cheerio.load(html);
	    	$(tab+' div.ordering_box').each(function(i, element){
	    		var name = $(this).find('strong[itemprop="author"]').text().trim();
	    		var desc = $(this).find('.truck_desc').text().trim();
	    		var id = $(this).find('.mask').attr('id').split('_')[1];
	    		console.log("Name: "+name);
	    		console.log("Description: "+desc);
	    		console.log("id: "+id);
	    	});
		}
	});
};

RamsayBot.prototype._scrapeFoodTruckMenus = function () {
	var option = 5;
	var tab = '#tab_0';
	request('https://www.gfoodtrucks.com/', function (error, response, html) {
		if (!error && response.statusCode == 200) {
	    	var $ = cheerio.load(html);
	    	var len = $(tab+' div.ordering_box').length;
	    	if(option >= 0 && option < len) {
				var id = $('#tab_0 div.ordering_box').eq(option).find('.mask').attr('id').split('_')[1];
				request.post('https://www.gfoodtrucks.com/ptgettruckproductajaxlist', {form: {truckId:id,schedule:'0',forceclose:'0',curTab:'0'}}, function (error, response, html) {
					if (!error && response.statusCode == 200) {
				    	var $ = cheerio.load(html);
				    	if($('h3').length > 0) {
					    	$('li').each(function(i, element){
					    		var name = $(this).find('h2').text().trim();
					    		var item = $(this).find('h3').text().trim();
					    		var desc = $(this).find('#menu_item_detail').text().trim();
					    		var price = $(this).find('.price').text().trim();
					    		console.log(name);
					    		console.log();
					    		console.log("Item: "+item);
					    		if(item.toLowerCase() !== desc.toLowerCase()) {
					    			console.log("Description: "+desc);
					    		}
					    		console.log("Price: "+price);
					    		console.log();
					    	});
				    	} else {
				    		console.log("No Menu Avaliable");
				    	}
					}
				});
	    	} else {
	    		console.log("not valid");
	    	}
		}
	})
};

RamsayBot.prototype._getTab = function () {
	var option = "Wednesday";
	request('https://www.gfoodtrucks.com/', function (error, response, html) {
		if (!error && response.statusCode == 200) {
	    	var $ = cheerio.load(html);
	    	$('.nav.nav-tabs > li > a').each(function(i, element){
	    		if($(this).text() === option) {
	    			var tab = $(this).attr('href');
	    			console.log(tab);
	    		}
	    	});
		}
	});
}