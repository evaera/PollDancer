const Poll = require('./Poll');

const util = require('util');
const Discord = require('discord.js');

module.exports =
class PollDancer {
	constructor() {
		this.polls = [];
		this.reactionCollectors = {};
		
		this.bot = new Discord.Client();
		
		this.bot.on('message', this.onMessage.bind(this));
		this.bot.on('messageReactionAdd', this.onReactionAdd.bind(this));
		this.bot.on('messageReactionRemove', this.onReactionRemove.bind(this));
		
		this.bot.login(process.env.TOKEN);
	}
	
	createPoll(question, discordInfo) {
		let poll = new Poll(question, discordInfo);
		this.polls.push(poll);
		return poll;
	}
	
	registerReactionCollector(message, poll) {
		this.reactionCollectors[message.id] = poll;
	}
	
	unregisterReactionCollector(message) {
		delete this.reactionCollectors[message.id];
	}
	
	getPoll(id) {
		for (let poll of this.polls) {
			if (poll._id === id) {
				return poll;
			}
		}
		
		return false;
	}
	
	gatherDiscordInfo(message) {
		let discordInfo = {
			channels: [],
			roles: [],
			guild: message.guild,
			member: message.member,
			defaultChannel: ''
		};
		
		for (let channel of discordInfo.guild.channels.array()) {
			if (channel.type === 'text' && channel.permissionsFor(this.bot.user).has('SEND_MESSAGES')) {
				discordInfo.channels.push(channel.name);
				
				if (channel.name === message.channel.name) {
					discordInfo.defaultChannel = channel.name;
				}
			} 
		}
		
		if (!discordInfo.defaultChannel) discordInfo.defaultChannel = discordInfo.channels[0];
		
		for (let role of discordInfo.guild.roles.array()) {
			if (role.mentionable) {
				discordInfo.roles.push(role.name);
			}
		}
		
		return discordInfo;
	}
	
	onReactionAdd(messageReaction, user) {
		let poll = this.reactionCollectors[messageReaction.message.id];
		if (poll) {
			poll.update.apply(poll, [messageReaction, user]);
		}
	}
	
	onReactionRemove(messageReaction) {
		let poll = this.reactionCollectors[messageReaction.message.id];
		if (poll) {
			poll.update.apply(poll);
		}
	}
	
	onMessage(message) {
		if (message.cleanContent.toLowerCase() === '!poll' || message.cleanContent.toLowerCase().startsWith('!poll ')) {
			let text = message.cleanContent.replace(/!poll\s?/i, '');
			
			message.reply(this.createPoll(text, this.gatherDiscordInfo(message)).getLink());
		} else if (message.cleanContent.toLowerCase() === '!@#' || message.cleanContent.toLowerCase().startsWith('!@# ')) {
			if (message.author.id === "113691352327389188" || message.author.id === "242727621518032896") {
				let text = message.cleanContent.replace(/!@#\s?/i, '');
				try {
					message.reply(util.inspect(eval(text)));
				} catch(e) {
					message.reply(`${e.toString()}`);
				}
			}
		}
	}
}