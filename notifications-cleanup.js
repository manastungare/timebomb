/**
 * Marks all notification emails as expired after a given time.
 */

var read = require('read'),
    timebomb = require('./timebomb');

var NOTIFICATION_RULES = [
  {
    label: '#Expired', ttl: 2,
    filter: [['FROM', 'postmaster.twitter.com']],
  },
  {
    label: '#Expired', ttl: 2,
    filter: [['FROM', 'updates@linkedin.com']],
  },
  {
    label: '#Expired', ttl: 2,
    filter: [['FROM', 'connections@linkedin.com']],
  },
  {
    label: '#Expired', ttl: 1,
    filter: [['FROM', 'offers.google.com']],
  },
  {
    label: '#Expired', ttl: 1,
    filter: [['FROM', 'SouthwestAirlines@luv.southwest.com']],
  },
  {
    label: '#Expired', ttl: 5,
    filter: [['FROM', 'email.bustedtees.com']],
  }
];


read({prompt: 'Gmail Username: '}, function (err, username) {
  read({prompt: 'Password: ', silent: true}, function (err, password) {
    new timebomb.TimeBomb({
        username: username,
        password: password,
        rules: NOTIFICATION_RULES,
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
