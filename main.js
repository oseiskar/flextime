var FIREBASE_URL = "https://shining-fire-655.firebaseio.com";
var DAYS_ROOT = FIREBASE_URL + '/days';

// ------ models

/*
 * Two different models because "A Backbone.Firebase.Model should not be
 * used with a Backbone.Firebase.Collection.". Not sure why...
 */

var Day = Backbone.Model.extend({
  yankeeDay: function() {
      return moment(this.id).format('MM/DD/YYYY');
  }
});

var EditableDay = Backbone.Firebase.Model.extend({
    urlRoot: DAYS_ROOT
});

var DayCollection = Backbone.Firebase.Collection.extend({
  model: Day,
  url: DAYS_ROOT,

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
    },
    initialize: function() {
        this.input = this.$("#minute-input");
        this.listenTo(this.model, 'change', this.render);
        this.render();
    },
    render: function() {
        this.input.val(this.model.get('minutes'));
        return this;
    },
    saveDay: function() {
        this.model.set({minutes: this.input.val()});
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
        if (this.day_view !== null) this.day_view.remove();
        this.$el.html('');

        var new_el = $('<div/>');
        this.$el.append(new_el);
        new_el.html(this.template);

        var model = this.collection.get(iso_date);

        this.day_view = new DayEditView({
            el: new_el,
            model: new EditableDay({id: iso_date})
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
        this.$el.html(''+total);
    }
});

var DayView = Backbone.View.extend({
    render: function() {
        this.$el.html(this.model.minutes);
        return this;
    },
});

var MainView = Backbone.View.extend({
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
        el.attr('style', 'font-weight: bold; color: #008000');
    }
});

$(function() {
    var collection = new DayCollection();
    var app = new MainView({ collection: collection });
});
