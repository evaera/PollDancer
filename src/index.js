require('dotenv').config();
require('./WebServer');

const PollDancer = require('./PollDancer');

global.PollDancer = new PollDancer();