const EmojiReplace = {
	'1': ':one:',
	'2': ':two:',
	'3': ':three:',
	'4': ':four:',
	'5': ':five:',
	'6': ':six:',
	'7': ':seven:',
	'8': ':eight:',
	'9': ':nine:',
	'0': ':zero:',
}

module.exports = 
class Poll {
	constructor(question, discordInfo) {
		this.question = question || '';
		this.answers = [];
		this.singleResponse = false;
		this.announce = '';
		this.aggregate = false;
		this.channel = null;
		this.hideAuthor = false;
		this.expires = Infinity;
		
		this.discordInfo = discordInfo;
		
		this.isConfigurable = true;
		this.isPosted = false;
		this.isExpired = false;
		
		this.lastUpdate = 0;
		this.updateTimeout = null;
		this.updateMinuteInterval = setInterval(this.update.bind(this), 60000);
		
		this._id = '';
	}
	
	get id() {
		if (!this._id) {
			let newId = Math.random().toString(36).substring(7);
			
			while (PollDancer.getPoll(newId) !== false) {
				newId = Math.random().toString(36).substring(7);
			}
			
			this._id = newId;
		}
		
		return this._id;
	}
	
	getLink() {
		return `${process.env.URL}/${this.id}`;
	}
	
	configure(data) {
		console.log(data);
		this.isConfigurable = false;
		
		this.question = data.question;
		this.answers = data.answers;
		
		if (data.expires > 90) {
			return false;
		}
		
		this.expires = (new Date()).getTime() + (parseInt(data.expires, 10) || 0) * 60 * 1000;
		
		this.singleResponse = data.singleResponse === 'true' ? true : false;
		this.pieChart = data.pieChart === 'true' ? true : false;
		this.hideAuthor = data.hideAuthor === 'true' ? true : false;
		this.aggregate = data.aggregate === 'true' ? true : false;
		
		this.channel = this.discordInfo.guild.channels.find('name', data.channel);
		if (!this.channel) return false;
		
		if (data.announce !== 'here' && data.announce !== 'everyone') {
			let role = this.discordInfo.guild.roles.find('name', data.announce);
			if (role) {
				this.announce = `<@&${role.id}>, `;
			}
		} else {
			this.announce = '@' + data.announce + ', ';
		}
		
		if (this.question.length < 2 || this.answers.length < 1) {
			return false;
		}
		
		return true;
	}
	
	checkExpired() {
		if (!this.message) return false;
		
		let expired = this.expires - (new Date()).getTime() <= 0;
		if (expired && !this.isExpired) {
			this.isExpired = true;
			PollDancer.unregisterReactionCollector(this.message);
			this.message.clearReactions();
			clearInterval(this.updateMinuteInterval);
		}
		return expired;
	}
	
	getMessageContent() {
		let embed = {
			title: this.question,
			description: "Pick as many as you like:\n\n",
			color: this.discordInfo.member.displayColor,
			// timestamp: new Date(),
			footer: {
				text: "Created using Poll Dancer"
			},
			thumbnail: {
				url: "https://i.imgur.com/wWDC7h4.png"
			},
			author: {
				name: this.discordInfo.member.user.tag,
				icon_url: this.discordInfo.member.user.displayAvatarURL
			},
			fields: []
		};
		
		let averageList = [];
		
		for (let [index, key] of this.answers.entries()) {
			let emoji = EmojiReplace[key.emoji.split('')[0]] || key.emoji;
			
			for (let i=0; i < key.votes; i++) {
				averageList.push(index);
			}
			
			embed.fields.push({
				name: `${index + 1}. ${emoji} ${key.text}`,
				value: `${key.votes || 0} votes`
			});
		}
		
		if (this.aggregate) {
			if (averageList.length > 0) {
				let sum = 0;
				for (let val of averageList) {
					sum += val;
				}
				let average = sum / averageList.length;
				
				let index = Math.round(average);
				let averageAnswer = this.answers[index];
				
				embed.fields.push({
					name: `Average result: ${averageAnswer.emoji} ${averageAnswer.text}`,
					value: `${((average+1)*(10/this.answers.length)).toPrecision(2)}/10`
				});
			} else {
				embed.fields.push({
					name: "Average result: ",
					value: "No data :grimacing:"
				});
			}
		}
		
		if (this.hideAuthor) {
			embed.author = {
				name: `${this.discordInfo.guild.name} Staff`,
				icon_url: this.discordInfo.guild.iconURL()
			}
		}
		
		if (this.singleResponse) {
			embed.description = "Only one of your reactions will be counted. To avoid confusion, select one reaction.\n\n";
		}
		
		if (this.pieChart) {
			let votes = [];
			let labels = [];
			for (let answer of this.answers) {
				if (answer.votes && answer.votes > 0) {
					votes.push(answer.votes || 0);
					labels.push(answer.text);
				}
			}
			if (votes.length > 0) {
				embed.image = {
					url: encodeURI(`https://chart.googleapis.com/chart?cht=p&chd=t:${votes.join(',')}&chs=400x200&chf=bg,s,00000000&chl=${labels.join('|')}`)
				}
			}
		}
		
		if (!this.checkExpired()) {
			embed.footer.text = `Expires in ${Math.ceil((this.expires - (new Date()).getTime()) / 1000 / 60)} minutes`
		} else {
			embed.footer.text = `Poll closed, results final.`;
		}
		
		return {
			content: this.announce,
			embed
		}
	}
	
	async update() {
		if (!this.isPosted) return; 
		
		let timeDifference = (new Date()).getTime() - this.lastUpdate;
		if (timeDifference < 5000) {
			if (this.updateTimeout === null) {
				this.updateTimeout = setTimeout(this.update.bind(this), 5000 - timeDifference);
			}
			return;
		}
		
		this.lastUpdate = (new Date()).getTime();
		this.updateTimeout = null;
		
		let countedUsers = [PollDancer.bot.user.id];
		for (let answer of this.answers) {
			answer.votes = 0;
			let reactionEmoji = this.message.reactions.find(reaction => reaction.emoji.name === answer.emoji);
			if (reactionEmoji) {
				let users = await reactionEmoji.fetchUsers();
				for (let user of users.array()) {
					if (countedUsers.indexOf(user.id) === -1) {
						answer.votes++;
						if (this.singleResponse) countedUsers.push(user.id);
					}
				}
			}
		}
		
		if (!this.aggregate) this.answers.sort((a, b) => a.votes < b.votes);
		
		let content = this.getMessageContent();
		this.message.edit(content.content, {embed: content.embed});
	}
	
	async post() {
		if (this.isPosted) return;
		this.isConfigurable = false;
		
		let descriptionStr = "Options: \n\n";
		for (let key of this.answers) {
			let emoji = EmojiReplace[key.emoji.split('')[0]] || key.emoji;
			
			descriptionStr += `${emoji} ${key.text}\n\n`;
		}
		
		let content = this.getMessageContent();
		this.message = await this.channel.send(content.content, {embed: content.embed});
		
		
		PollDancer.registerReactionCollector(this.message, this);
		
		for (let {emoji} of this.answers) {
			await this.message.react(emoji);
		}
		this.isPosted = true;
		this.update();
	}
}