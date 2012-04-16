# TimeBomb: A library for expiring emails after a set due date.

Copyright 2012 Manas Tungare. <http://manas.tungare.name/>

TimeBomb is a library to expire old messages from an IMAP mailbox. It logs in to an IMAP
server using the provided credentials, and applies the provided rules. Rules are provided in
somewhat machine-friendly syntax (JSON). Multiple criteria may be used for each rule. A TTL
(time-to-live) value (in days) indicates how long a message matching that rule can live. When
its time is up, TimeBomb will apply the specified label, (e.g. "Expired") to that email. You
can then manually delete all emails that have the Expired label.

TimeBomb is based on a [paper][tungare_2009_best] I wrote in 2009. It implements a subset of features described in
that paper.

It has only been tested with Gmail, but may work with other IMAP servers too.

[tungare_2009_best]: http://manas.tungare.name/publications/tungare_2009_best ("Best If Used By": Expiration Dates for Email)

## Requirements

* Node.js, tested with 0.6.15.
* Node packages: imap, read, util. (see below for installation tips).
* An IMAP account.

## Installation

    npm install -g timebomb

## Example

    var TIMEBOMB_RULES = [
      {
        name: 'Amazon Confirmations',
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
        name: 'Paypal',
        filter: [['FROM', 'service@paypal.com']],
        ttl: 30,
        label: 'Expired'
      }
    ];

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

## TODO

- The library does not support expiring messages individually. It can only be done via pre-defined
  rules.
