/* global PollDancer */

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

let web = express();

web.use(bodyParser.urlencoded({extended: true}));
web.use('/public', express.static(path.join(__dirname, '..', 'static', 'public')));

web.post('/submit', (req, res) => {
	let poll = PollDancer.getPoll(req.body.id);
    if (poll && poll.isConfigurable) {
        if (poll.configure(req.body)) {
            poll.post();
            res.status(200).end('ok');
        } else {
            res.status(400).end('error');
        }
    } else {
        res.status(400).end('error');
    }
});

web.get('/get/:id', (req, res) => {
    let poll = PollDancer.getPoll(req.params.id);
    if (poll && poll.isConfigurable) {
        res.send({ 
            valid: true, 
            question: poll.question, 
            expires: poll.expires, 
            id: req.params.id, 
            channels: poll.discordInfo.channels, 
            roles: poll.discordInfo.roles, 
            defaultChannel: poll.discordInfo.defaultChannel
        }).end();;
    } else {
        res.send({ valid: false }).end();
    }
});

web.get('/:id', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'static', 'poll.html'));
});

web.listen(process.env.PORT || 7654);