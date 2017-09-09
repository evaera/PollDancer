require('dotenv').config();
const Discord = require('discord.js');

const bot = new Discord.Client();

bot.on('message', async message => {
	await message.react('👍');
	await message.react('👎');
	console.log(message.reactions.find(reaction => reaction.emoji.name === '👍').count);
});


bot.login(process.env.TOKEN);
