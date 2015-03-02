
(function ($) {

/**
 * Add a keypress handler on text and password fields that catches
 * return and submits the form by triggering the first submit
 * button. Otherwise the browser standard handler is used, and it
 * doesn't post by AJAX.
 *
 * @todo possibly support more input types.
 */
Drupal.behaviors.ding_popup_form_submit = {
  attach: function (context, settings) {
    $('.ui-dialog-content input[type=text]:not(.ding-popup-processed), .ui-dialog-content input[type=password]:not(.ding-popup-processed)').addClass('ding-popup-processed').each(function () {
      $(this).keypress(function (event) {
        if (event.which == 13) {
          $($(this.form).find('input[type=submit]').get(0)).trigger('mousedown');
          return false;
        }
      });
    });
  }
};

/**
 * Object to handle popups.
 */
Drupal.ding_popup = {
  states: {},
  dialogs: {},

  setState: function (response) {
    if (this.dialogs[response.name] == undefined) {
      this.dialogs[response.name] = $('<div class="ding-popup-content"></div>').dialog({
          'autoOpen': false,
          'modal': true,
          'close': function(event, ui) {
            if (response['refresh']) {
              window.location.reload(true);
            }
          }
      });
    }
    // Add width to dialog. Supports width in percentage.
    if (typeof(response.width) != 'undefined' && response.width != -1) {
      var width = response.width;
      if (width.indexOf('%') != -1) {
        var percent = parseFloat(width);
        width = $('body').width() * percent/100;
      }
      this.dialogs[response.name].dialog('option', 'width', width);
    }
    // Set dialog title.
    this.dialogs[response.name].dialog('option', 'title', response.title);
    this.dialogs[response.name].html(response.data);
    Drupal.attachBehaviors(this.dialogs[response.name]);
    this.dialogs[response.name].dialog('open');
  },

  open: function(response) {
    if (this.states[response.name] == undefined) {
      this.states[response.name] = [];
    }
    if (response['resubmit']) {
      this.states[response.name].push(response);
    }
    this.setState(response);
  },

  close: function(response) {
    while (this.states[response.name].length > 0) {
      state = this.states[response.name].pop();
      Drupal.detachBehaviors(this.dialog);

      // Add in extra post vars.
      $.extend(state['orig_ajax'].options.data, state['extra_data']);
      // Call original ajax callback.
      state['orig_ajax'].eventResponse(state['orig_ajax'], null);
    }
    if (this.dialogs[response.name].refresh_on_close) {
      alert('refresh');
    }
    this.dialogs[response.name].dialog('close');
  }
};

// Drupal.ding_popup = []

/**
 * Command to create a popup.
 */
Drupal.ajax.prototype.commands['ding_popup'] = function (ajax, response, status) {
  response['orig_ajax'] = ajax;
  Drupal.ding_popup.open(response);
  return;
};

/**
 * Command to close a popup.
 */
Drupal.ajax.prototype.commands['ding_popup_close'] = function (ajax, response, status) {
  Drupal.ding_popup.close(response);
  return;
};


})(jQuery);
