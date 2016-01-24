var FIREBASE_URL = "https://shining-fire-655.firebaseio.com";
var DAYS_ROOT = FIREBASE_URL + '/days';

var Day = Backbone.Firebase.Model.extend({
  urlRoot: DAYS_ROOT,
  yankeeDay: function() {
      return moment(this.id).format('MM/DD/YYYY');
  }
});

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
        this.input.val(this.model.toJSON().minutes);
        return this;
    },
    saveDay: function() {
        this.model.set({minutes: this.input.val()});
    }
});

var EditorView = Backbone.View.extend({
    initialize: function() {
        this.template = this.$el.html();
        this.day_view = null;
    },
    changeDate: function(iso_date) {
        if (this.day_view !== null) this.day_view.remove();
        this.$el.html('');
        var new_el = $('<div/>');
        this.$el.append(new_el);
        new_el.html(this.template);
        this.day_view = new DayEditView({
            el: new_el,
            model: new Day({id: iso_date})
        });
    }
});

var TotalView = Backbone.View.extend({
    initialize: function() {
        var that = this;
        this.collection.on('all', function() {
            that.render();
        });
    },
    render: function() {
        var total = this.collection.totalMinutes();
        this.$el.html(''+total);
    }
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

var DayView = Backbone.View.extend({
    tagName:  "li",
    initialize: function() {
        this.listenTo(this.model, "change", this.render);
    },
    render: function() {
        this.$el.html(this.model.minutes);
        return this;
    },
});

var MainView = Backbone.View.extend({
    el: $('#app-container'),
    initialize: function() {
        this.calendar = this.$("#datetimepicker");
        this.listenTo(this.collection, 'add', this.renderOne);

        var dp = this.calendar.datetimepicker({
            inline: true,
            format: 'YYYY-MM-DD'
        });

        var ISO_FORMAT = 'YYYY-MM-DD';

        this.editor = new EditorView({el: this.$('#date-edit')});
        this.editor.changeDate(dp.data("DateTimePicker").date().format(ISO_FORMAT));

        this.total_view = new TotalView({
            el: this.$('#total'),
            collection: this.collection
        });
        var that = this;

        dp.on('dp.change', function(e) {
            var iso_date = e.date.format(ISO_FORMAT);
            that.editor.changeDate(iso_date);
            that.renderAll();
        });

        dp.on('dp.update', function() { that.renderAll(); });
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
