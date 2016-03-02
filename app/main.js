
// Global variables ar handy for backbone models with user-dependent REST paths
// and handling authentication. There is also ENV which is defined in config.js
var backend = null;
var current_user = null;

function CURRENT_USER_DAYS_ROOT() {
    if (!current_user) throw("not logged in");
    return backend.child('users/' + current_user.uid + '/days');
}

// ------ models

/*
 * Two different models because "A Backbone.Firebase.Model should not be
 * used with a Backbone.Firebase.Collection.". Not sure why...
 */

 var EditableDay = Backbone.Firebase.Model.extend({
     url: function() {
         return CURRENT_USER_DAYS_ROOT().child(this.id);
     },
 });

var Day = Backbone.Model.extend({
  yankeeDay: function() {
      return moment(this.id).format('MM/DD/YYYY');
  }
});

var DayCollection = Backbone.Firebase.Collection.extend({
  model: Day,
  url: CURRENT_USER_DAYS_ROOT,

  totalMinutes: function() {
      var sum = 0;
      this.each(function (day) {
          sum += parseInt(day.attributes.minutes);
      });
      return sum;
  }
});

// ------ views

var DayEditView = Backbone.View.extend({
    events: {
        "click #save-day" : "saveDay",
        "blur input" : "saveDay",
        "keypress" : "keypress"
    },
    initialize: function() {
        this.input = this.$("#minute-input");
        this.listenTo(this.model, 'change', this.render);
        this.render();
        this.input.focus();
    },
    render: function() {
        this.input.val(this.model.get('minutes'));
        return this;
    },
    keypress: function(ev) {
        // listen to Enter key
        if (ev.which == 13) this.saveDay();
    },
    saveDay: function() {
        var value = this.input.val();
        if (value && value !== '0') this.model.set({minutes: parseInt(value)});
        else this.model.destroy();
    }
});

var EditorView = Backbone.View.extend({
    initialize: function() {
        // save initial contents of the element as a template
        this.template = this.$el.html();
        this.day_view = null;
    },
    changeDate: function(iso_date) {
        // create a new Backbone view object and DOM elements
        // each time time the date is changed
        if (this.day_view) {
            this.day_view.saveDay();
            this.day_view.remove();
        }
        this.$el.html('');

        this.selected_date = iso_date;

        var new_el = $('<div/>');
        this.$el.append(new_el);
        new_el.html(this.template);

        var model = this.collection.get(this.selected_date);

        this.day_view = new DayEditView({
            el: new_el,
            model: new EditableDay({id: this.selected_date})
        });
    }
});

var TotalView = Backbone.View.extend({
    initialize: function() {
        var that = this;
        this.collection.on('all', function() {
            that.render();
        });
        this.render();
    },
    render: function() {
        var total = this.collection.totalMinutes();
        var abs_total = Math.abs(total);
        var hours = Math.floor(abs_total / 60);
        var minutes = abs_total % 60;

        var str = '';
        if (total < 0) str += '- ';
        if (hours > 0) str += hours + " h ";
        str += minutes + ' min';

        this.$el.text(str);
        this.$el.toggleClass('negative', total < 0);
        this.$el.toggleClass('positive', total > 0);
    }
});

var AppView = Backbone.View.extend({
    el: $('#app-container'),
    initialize: function() {
        this.calendar = this.$("#datetimepicker");

        var dp = this.calendar.datetimepicker({
            inline: true,
            format: 'YYYY-MM-DD'
        });

        var ISO_FORMAT = 'YYYY-MM-DD';

        this.editor = new EditorView({
            el: this.$('#date-edit'),
            collection: this.collection
        });
        this.editor.changeDate(dp.data("DateTimePicker").date().format(ISO_FORMAT));

        var that = this;

        this.collection.on('sync', function() {
            that.renderAll();
            that.listenTo(that.collection, 'all', that.renderAll);

            that.total_view = new TotalView({
                el: that.$('#total'),
                collection: that.collection
            });

            dp.on('dp.change', function(e) {
                var iso_date = e.date.format(ISO_FORMAT);
                that.editor.changeDate(iso_date);
                that.renderAll();
            });

            dp.on('dp.update', function() { that.renderAll(); });

            $('#loader').hide();
            that.$el.removeClass('hidden');
        });
    },
    renderAll: function() {
        this.$el.find('.day').attr('style','');
        var that = this;
    	this.collection.each(function(day){
            that.renderOne(day);
    	});
    },
    renderOne: function(day) {
        var el = this.calendar.find('[data-day="'+day.yankeeDay()+'"]');
        if (day.id === this.editor.selected_date) return;
        var color = 'white';
        var minutes = day.get('minutes');
        if (minutes > 0) color = '#ccffcc';
        if (minutes < 0) color = '#ffcccc';
        el.attr('style', 'background-color: '+color);
    }
});

var LoginButtonView = Backbone.View.extend({
    el: $('#login-button-container'),
    events: {
        "click #login-button" : "login",
    },

    initialize: function() {

        this.provider = ENV.login_provider;
        _.bindAll(this, 'authHandler');

        if (ENV.auto_login) return this.login();

        this.setButtonText();
        $('#loader').hide();
        this.$el.removeClass('hidden');
    },

    login: function() {
        if (this.provider == 'anonymous') {
            backend.authAnonymously(this.authHandler);
        } else {
            backend.authWithOAuthRedirect(this.provider, this.authHandler);
            //backend.authWithOAuthPopup(this.provider, this.authHandler);
        }
    },

    authHandler: function(error) {
        if (error) {
            console.log('login failed with error '+error);
        }
    },

    setButtonText: function() {
        if (this.provider !== 'anonymous')
            $('#login-button').text('Log in / Sign up with ' +
                this.providerName());
    },

    providerName: function() {
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        return capitalize(this.provider);
    }
});

var MainLoginView = Backbone.View.extend({
    el: $('#navbar'),
    events: {
        "click #log-out" : "logout",
    },
    initialize: function() {
        this.login_name = this.$('#login-name');
        this.message = $('#message');

        _.bindAll(this, 'onAuth');
        backend.onAuth(this.onAuth);
    },
    onAuth: function(authData) {
        if (authData) this.login(authData);
        else {
            current_user = null;
            if (this.app) this.app.remove();
            if (!this.logged_out) this.showLoginButton();
        }
    },
    login: function(authData) {
        current_user = authData;
        if (this.login_button) this.login_button.remove();
        this.$el.removeClass('hidden');

        this.setNavbarText(authData);
        this.app = new AppView({ collection: new DayCollection() });
    },
    logout: function() {
        this.logged_out = true;

        // only called when the logout button is clicked
        backend.unauth();

        this.message.text('Bye!');
        this.message.hide().fadeIn(500);
        this.$el.fadeOut(500);
    },
    showLoginButton: function () {
        this.login_button = new LoginButtonView();
        this.$el.addClass('hidden');
    },
    setNavbarText: function(auth) {
        if (auth.provider && auth[auth.provider].displayName) {
            this.login_name.text(auth[auth.provider].displayName);
            $('#auth-provider-logo').addClass('fa-'+auth.provider);
        }
        else {
            this.login_name.text(auth.uid);
        }
    }
});

$(function() {
    backend = new Firebase(ENV.firebase);
    var app = new MainLoginView();
});
