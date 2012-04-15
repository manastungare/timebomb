/**
 * TimeBomb: A library for expiring emails after a set due date.
 * Copyright 2012 Manas Tungare. All Rights Reserved.
 *
 * This file contains a sample of how the library can be used. A detailed syntax for filters is
 * available at <https://github.com/mscdex/node-imap>.
 *
 * The library is still a work-in-progress, and the license only permits private, personal use.
 */

var read = require('read'),
    timebomb = require('./timebomb');

var TIMEBOMB_RULES = [
  {
    name: 'Amazon confirmations',
    filter: [['FROM', 'auto-confirm@amazon.com']],
    ttl: 10,
    label: 'Expired'
  },
  {
    name: 'Facebook Notifications',
    filter: [['FROM', 'facebookmail.com']],
    ttl: 5,
    label: 'Expired'
  },
  {
    name: 'HTML5 Weekly',
    filter: [['FROM', 'html5weekly.com']],
    ttl: 10,
    label: 'Expired'
  },
  {
    name: 'Paypal',
    filter: [['FROM', 'service@paypal.com']],
    ttl: 30,
    label: 'Expired'
  },
  {
    name: 'LivingSocial',
    filter: [['FROM', 'deals@livingsocial.com']],
    ttl: 3,
    label: 'Expired'
  }
];


read({prompt: 'Gmail Username: '}, function (err, username) {
  read({prompt: 'Password: ', silent: true}, function (err, password) {
    new timebomb.TimeBomb({
        username: username,
        password: password,
        rules: TIMEBOMB_RULES,
        searchAllMail: true,
        callback: function(error) {
          if (error) {
            console.log(error);
            process.exit(1);
          } else {
            process.exit(0);
          }
        },
        debug: true});
    process.stdin.destroy();
  });
});
