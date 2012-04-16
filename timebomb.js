/**
 * TimeBomb: A library for expiring emails after a set due date.
 * Copyright 2012 Manas Tungare.
 * http://manas.tungare.name/publications/tungare_2009_best
 */

(function(){
  exports.TimeBomb = TimeBomb;

  var util = require('util'),
      ImapConnection = require('imap').ImapConnection;

  var ONE_DAY_MS = 1000 * 60 * 60 * 24;

  /**
   * TimeBomb is a utility to "expire" old messages from an IMAP mailbox. It logs in to an IMAP
   * server using the provided credentials, and applies the provided rules. Rules are provided in
   * somewhat machine-friendly syntax. Multiple criteria may be used for each rule. A TTL
   * (time-to-live) value (in days) indicates how long a message matching that rule can live. When
   * its time is up, TimeBomb will apply the specified label, (e.g. "Expired") to that email. You
   * can then manually delete all emails that have the Expired label.
   * @param {Object} parameters An object containing the following parameters.
   *      username: IMAP username.
   *      password: IMAP password.
   *      rules: Array. A set of rules to apply. See TimeBomb docs for more details.
   *      searchAllMail: (optional) false. Whether TimeBomb should look outside your INBOX folder.
   *      debug: (optional) false. Emits diagnostic information.
   *      callback: (optional) Function. Called when TimeBomb is done processing all rules.
   * @constructor
   */
  function TimeBomb(parameters) {
    this.pendingSearchRequests_ = 0;
    this.pendingLabelRequests_ = 0;
    this.atLeastOneMessageWasLabeled_ = false;

    this.callback_ = parameters.callback;
    this.debug_ = parameters.debug;
    this.log_('Connecting to Gmail...');

    this.imap_ = new ImapConnection({
      username: parameters.username,
      password: parameters.password,
      host: 'imap.gmail.com',
      port: 993,
      secure: true
    });

    var that = this;
    this.imap_.connect(function(error) {
      if (error) {
        that.handleError_(error);
        return;
      }

      var mailbox = parameters.searchAllMail ? '[Gmail]/All Mail' : 'INBOX';
      that.log_('Opening mailbox %s...', mailbox);
      that.imap_.openBox(mailbox, false, function(error, box) {
        if (error) {
          that.handleError_(error);
          return;
        }

        that.box_ = box;
        that.applyRules_(parameters.rules);
      });
    });
  }

  /**
   * Applies the specified rules to the IMAP mailbox.
   * @param {Array.<*>} rules IMAP filter rules.
   * @private
   */
  TimeBomb.prototype.applyRules_ = function(rules) {
    var that = this;
    var now = new Date();

    util.log(util.format('Applying %s rules...', rules.length));
    for (var i = 0; i < rules.length; i++) {
      (function(rule) {
        // Create a filter using criteria provided by user, plus TTL.
        var earliestAcceptableDate = new Date(now.getTime() - ONE_DAY_MS * rule.ttl);
        var filter = ['ALL', ['BEFORE', earliestAcceptableDate]].concat(rule.filter);
        that.log_(util.inspect(filter));

        that.pendingSearchRequests_++;
        that.imap_.search(filter, function(error, results) {
          that.pendingSearchRequests_--;
          if (error) {
            that.handleError_(error);
            return;
          }

          that.applyLabel_(rule, results);
          that.logoutIfDone_();
        });
      })(rules[i]);
    }
  };

  /**
   * Applies the specified rule to the matching messages.
   * @param {Array.<*>} rule The rule to match.
   * @param {Array.<String>} messagesToLabel Messages to be labeled.
   * @private
   */
  TimeBomb.prototype.applyLabel_ = function(rule, messagesToLabel) {
    var that = this;

    util.log(util.format('%s matched rule "%s"%s.',
        (messagesToLabel.length == 0 ?
            'No messages' :
            (messagesToLabel.length == 1 ?
                '1 message' :
                messagesToLabel.length + ' messages')),
        rule.name,
        ((messagesToLabel.length > 0) ? '; applying label "' + rule.label : '"')
        ));

    if (messagesToLabel.length == 0) {
      return;
    }

    this.log_('Applying labels for rule: "%s"...', rule.name);
    this.pendingLabelRequests_++;
    this.imap_.move(messagesToLabel, rule.label, function(error) {
      that.pendingLabelRequests_--;
      if (error) {
        that.handleErrorApplyingLabel_(rule.label, error);
        that.handleError_(error);
        return;
      }

      that.log_('Done applying labels for rule: %s.', rule.name);
      that.atLeastOneMessageWasLabeled_ = true;
      that.logoutIfDone_();
    });
  };

  /**
   * If an error occurs, this calls the provided callback and/or prints a debug message.
   * @param {string} error The error message.
   * @private
   */
  TimeBomb.prototype.handleError_ = function(error) {
    if (this.debug_) {
      util.log(error);
    }
    if (this.callback_) {
      this.callback_(error);
    }
  };

  /**
   * Prints a log message if debug mode is on.
   * @private
   */
  TimeBomb.prototype.log_ = function() {
    if (this.debug_) {
      util.debug(util.format.apply(null, Array.prototype.slice.call(arguments)));
    }
  };

  /**
   * If the destination label (folder) does not exist, creates it.
   * @param {Box} box The IMAP mailbox.
   * @param {string} error The error message.
   * @private
   */
  TimeBomb.prototype.handleErrorApplyingLabel_ = function(box, error) {
    if (error.message.indexOf('TRYCREATE') != -1) {
      this.imap_.addBox(box);
      util.log('A new mailbox [' + box + '] was created. Please re-run TimeBomb.');
    }
  };

  /**
   * Logs out of the IMAP connection if all pending tasks are done & calls the callback if one was
   * provided.
   * @private
   */
  TimeBomb.prototype.logoutIfDone_ = function() {
    var that = this;
    if (this.pendingSearchRequests_ == 0 && this.pendingLabelRequests_ == 0) {
      this.imap_.logout(function() {
        util.log(that.atLeastOneMessageWasLabeled_ ?
            'New labels have been applied. TimeBomb never removes messages from the Inbox.' :
            'No labels were changed.');
        if (that.callback_) {
          that.callback_();
        }
      });
    }
  };
})();
