'use strict'

var util = require('util');
var path = require('path');
var Bot = require('slackbots');
var request = require('request');
var cheerio = require('cheerio');
var datejs = require('datejs');

var RamsayBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'ramsaybot';
    this.trucks = [];
};

// inherits methods and properties from the Bot constructor
util.inherits(RamsayBot, Bot);
module.exports = RamsayBot;

RamsayBot.prototype.run = function () {
	RamsayBot.super_.call(this, this.settings);
	this.on('message', this._onMessage);
}

RamsayBot.prototype._onMessage = function (message) {
	var resp = "";
    if (this._isChatMessage(message) && this._isChannelConversation(message) && !this._isFromRamsayBot(message) && this._isMentioningRamsay(message)) {
    	if(this._isMentioningHelp(message)) {
    		resp = "*Commands*\n<gordon|ramsay> food trucks <mon|tues|wed|thurs|fri>\n_Example: gordon food trucks mon_\n<gordon|ramsay> menu <truck name>\n_Example: ramsay calpe paellas menu_";
    		this.postMessage(message.channel, resp, {as_user: true});
    	} else if(this._isMentioningFoodTrucks(message)) {
    		var day = this._getWeekDay(message);
			if(day === "Saturday" || day === "Sunday") {
				var resp = "*"+day+"*"+"\n\n"+"No trucks avaliable";
				this.postMessage(message.channel, resp, {as_user: true});
			} else {
				this._getTabThenFoodTrucks(message, day);
			}
    	} else if(this._isMentioningMenu(message)) {
    		// get food truck name
    		var truck = message.text;
    		truck = truck.replace('gordon','');
    		truck = truck.replace('this.name','');
    		truck = truck.replace('menu', '');
    		truck = truck.replace('ramsay', ''); 
    		truck = truck.trim();
    		this._getTruckIdFromArrayThenFoodTruckMenus(message, truck);
    	} else if (this._isMentioningZeroCater(message)) {
    		var day = this._getZeroCaterDay(message);
			this._getZeroCaterMenu(message, day);
    	}
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
        message.text.toLowerCase().indexOf('gordon') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

RamsayBot.prototype._isMentioningFoodTrucks = function (message) {
    return message.text.toLowerCase().indexOf('foodtruck') > -1 ||
        message.text.toLowerCase().indexOf('food truck') > -1 ||
        message.text.toLowerCase().indexOf('truck') > -1;
};

RamsayBot.prototype._isMentioningMenu = function (message) {
	return message.text.toLowerCase().indexOf(' menu') > -1;
};

RamsayBot.prototype._isMentioningHelp = function (message) {
	return message.text.toLowerCase().indexOf(' help') > -1;
};

RamsayBot.prototype._isMentioningZeroCater = function(message) {
	return message.text.toLowerCase().indexOf(' zerocater') > -1 ||
		message.text.toLowerCase().indexOf(' zero cater') > -1;
};

RamsayBot.prototype._getWeekDay = function (message) {
	var day;
	if(message.text.toLowerCase().indexOf('mon') > -1 || message.text.toLowerCase().indexOf('monday') > -1) {
 		day = "Monday";
	} else if(message.text.toLowerCase().indexOf('tues') > -1 || message.text.toLowerCase().indexOf('tuesday') > -1) {
		day = "Tuesday";
	} else if(message.text.toLowerCase().indexOf('wed') > -1 || message.text.toLowerCase().indexOf('wednesday') > -1) {
		day = "Wednesday";
	} else if(message.text.toLowerCase().indexOf('thurs') > -1 || message.text.toLowerCase().indexOf('thursday') > -1) {
		day = "Thursday";
	} else if(message.text.toLowerCase().indexOf('fri') > -1 || message.text.toLowerCase().indexOf('friday') > -1) {
		day = "Friday";
	} else if(message.text.toLowerCase().indexOf('sat') > -1 || message.text.toLowerCase().indexOf('saturday') > -1) {
		day = "Saturday";
	} else if(message.text.toLowerCase().indexOf('sun') > -1 || message.text.toLowerCase().indexOf('sunday') > -1) {
		day = "Sunday";
	}  else {
		day = "Today's Trucks";
	}
	if(day === this._getToday()) {
		day = "Today's Trucks";
	}
	return day;
};

RamsayBot.prototype._getZeroCaterDay = function (message) {
	var day;
	var date = new Date.today().toString();
	if(message.text.toLowerCase().indexOf('mon') > -1) {
 		day = "mon";
 		if(date.toLowerCase().indexOf(day) > -1) {
 			return Date.today().toString('yyyy-MM-dd');
 		} else {
 			return Date.today().next().monday().toString('yyyy-MM-dd');
 		}
 	} else if(message.text.toLowerCase().indexOf('thurs') > -1) {
 		day = "thurs";
 		if(date.toLowerCase().indexOf(day) > -1) {
 			return Date.today().toString('yyyy-MM-dd');
 		} else {
 			return Date.today().next().thursday().toString('yyyy-MM-dd');
 		}
 	} else {
 		if(date.toLowerCase().indexOf("mon") > -1) {
 			return Date.today().toString('yyyy-MM-dd');
 		} if(date.toLowerCase().indexOf("thurs") > -1) {
 			return Date.today().toString('yyyy-MM-dd');
 		} else if(date.toLowerCase().indexOf("tues") > -1 || date.toLowerCase().indexOf("wed") > -1) {
 			return Date.today().next().thursday().toString('yyyy-MM-dd');
 		} else {
 			return Date.today().next().monday().toString('yyyy-MM-dd');
 		}
 	}
};

RamsayBot.prototype._getToday = function () {
	var d = new Date();
	var weekday = new Array(7);
	weekday[0]=  "Sunday";
	weekday[1] = "Monday";
	weekday[2] = "Tuesday";
	weekday[3] = "Wednesday";
	weekday[4] = "Thursday";
	weekday[5] = "Friday";
	weekday[6] = "Saturday";

	return weekday[d.getDay()];
};

RamsayBot.prototype._replyWithGreeting = function (message) {
	var self = this;
	self.postMessage(message.channel, "hi there", {as_user: true});
};

RamsayBot.prototype._getTruckIdFromArrayThenFoodTruckMenus = function (message, truckName) {
	var len = this.trucks.length;
	var resp = "";
	if(len > 0) {
		for(var i = 0; i<len; i++) {
			// If user mentions name close enough to a truck get the menu for it
			if(this.trucks[i].name.toLowerCase().indexOf(truckName.toLowerCase()) > -1) {
				this._passFoodTruckMenus(message, this.trucks[i].id, this.trucks[i].name);
				break;
			}
			if(i===len-1) {
				resp = "There is no truck with the name "+truckName+" for "+this.trucks[i].day;
			}
		}
	} else {
		resp = "Ask me about which trucks are avaliable first!";
	}
	this.postMessage(message.channel, resp, {as_user: true});
};

RamsayBot.prototype._passFoodTruckMenus = function (message, id, truckName) {
	var that = this;
	request.post('https://www.gfoodtrucks.com/ptgettruckproductajaxlist', {form: {truckId:id,schedule:'0',forceclose:'0',curTab:'0'}}, function (error, response, html) {
		var resp = "*"+truckName+"*\n";
		if (!error && response.statusCode == 200) {
	    	var $ = cheerio.load(html);
	    	if($('h3').length > 0) {
		    	$('li').each(function(i, element){
		    		var name = $(this).find('h2').text().trim();
		    		var item = $(this).find('h3').text().trim();
		    		var desc = $(this).find('#menu_item_detail').text().trim();
		    		var price = $(this).find('.price').text().trim();
		    		resp = resp+"\n*_"+item+"_*";
		    		if(item.toLowerCase() !== desc.toLowerCase()) {
		    			resp = resp+"\n_"+desc+"_";
		    		}
		    		resp = resp+"\n_"+price+"_\n";
		    	});
	    	} else {
	    		var resp = resp+"_No menu avaliable_";
	    	}
	    	that.postMessage(message.channel, resp, {as_user: true});
		} else {
			resp = "I couldn't find out which food trucks are avaliable. Please try again later."
			that.postMessage(message.channel, resp, {as_user: true});
		}
	});
};

RamsayBot.prototype._passFoodTrucks = function (message, html, tab, day) {
	var that = this;
	var resp = "*"+day+"*"+"\n\n";
	that.trucks = [];
	var $ = cheerio.load(html);
	if($(tab+' div.ordering_box').length === 0) {
		resp = resp+"No trucks avaliable";
	}
	else {
    	$(tab+' div.ordering_box').each(function(i, element){
    		var name = $(this).find('strong[itemprop="author"]').text().trim();
    		var desc = $(this).find('.truck_desc').text().trim();
    		var id = $(this).find('.mask').attr('id').split('_')[1];
    		that.trucks.push({tab:tab, id:id, name:name, desc:desc, day:day});
    		resp = resp+"*_"+name+"_*\n_"+desc+"_\n\n";
    	});
	}
	that.postMessage(message.channel, resp, {as_user: true});
};


RamsayBot.prototype._getTabThenFoodTrucks = function (message, day) {
	var that = this;
	request('https://www.gfoodtrucks.com/', function (error, response, html) {
		if (!error && response.statusCode == 200) {
	    	var $ = cheerio.load(html);
	    	$('.nav.nav-tabs > li > a').each(function(i, element){
	    		if($(this).text() === day) {
	    			var tab = $(this).attr('href');
	    			that._passFoodTrucks(message, html, tab, day);
	    		}
	    	});
		} else {
			resp = "I couldn't find out which food trucks are avaliable. Please try again later."
			that.postMessage(message.channel, resp, {as_user: true});
		}
	});
};

RamsayBot.prototype._getZeroCaterMenu = function (message, day) {
	var that = this;
	var date = Date.parse(day).toString('dddd, MMMM dd, yyyy');
	var resp = "*"+date+"*\n\n";
	request('https://zerocater.com/m/TQGB', function (error, response, html) {
		if (!error && response.statusCode == 200) {
	    	var $ = cheerio.load(html);
	    	var menu = $("div.menu[data-date='"+day+"']");
	    	if(menu.length > 0) {
	    		var name1 = $(menu).find('h1.vendor').first().text().trim();
	    		var name2 = $(menu).find('h3.order-name').last().text().trim();
	    		resp = resp+"*"+name1+"*";
	    		if(name1 !== name2) {
	    			resp = resp+" _("+name2+")_\n";
	    		} else {
	    			resp = resp+"\n";
	    		}
		    	$(menu).find('li.list-group-item').each(function(i, element){
		    		var item = $(element).find('div.item-header').text().trim();
		    		var dietary = $(element).find('div.dietary-info').text().trim();
		    		dietary = dietary.replace(/\s\s+/g, ' ');
		    		var desc = $(element).find('div.item-description').text().trim();
		    		resp = resp+"\n*_"+item+"_*";
		    		if(dietary != "") {
		    			resp = resp+"\n_"+dietary+"_";
		    		}
		    		if(desc != "") {
		    			resp = resp+"\n_"+desc+"_\n";
		    		} else {
		    			resp = resp+"\n";
		    		}
		    	});
	    	}
	    	else {
	    		resp = resp+"_No menu avaliable_"
	    	}
	    	that.postMessage(message.channel, resp, {as_user: true});
		} else {
			resp = "I couldn't find an avaliable menu for "+date+". Please try again later."
			that.postMessage(message.channel, resp, {as_user: true});
		}
	});
};