/**
 * Applies a label to all files larger than a specified size.
 */

var read = require('read'),
    timebomb = require('./timebomb');

var LARGE_FILE_RULES = [
  {
    name: '1MB - 5MB',
    filter: [
      ['LARGER', 1 * 1024 * 1024],
      ['SMALLER', 5 * 1024 * 1024]
    ],
    ttl: 0,
    label: '1MB - 5MB'
  },
  {
    name: '5MB+',
    filter: [
      ['LARGER', 5 * 1024 * 1024]
    ],
    ttl: 0,
    label: '5MB+'
  }
];


read({prompt: 'Gmail Username: '}, function (err, username) {
  read({prompt: 'Password: ', silent: true}, function (err, password) {
    new timebomb.TimeBomb({
        username: username,
        password: password,
        rules: LARGE_FILE_RULES,
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
