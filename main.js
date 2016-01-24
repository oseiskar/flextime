var FIREBASE_URL = "https://shining-fire-655.firebaseio.com";

// adapted from the BackboneFire example app

/*var Day = Backbone.Model.extend({
    defaults: { minutes: 0 }
});*/

var Day = Backbone.Firebase.Model.extend({
  urlRoot: FIREBASE_URL + '/days'
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

/*var DayCollection = Backbone.Firebase.Collection.extend({
  model: Day,
  url: FIREBASE_URL
});

var DayView = Backbone.View.extend({
    tagName:  "li",
    initialize: function() {
        this.listenTo(this.model, "change", this.render);
    },
    render: function() {
        this.$el.html(this.model.toJSON().minutes);
        return this;
    },
});

var MainView = Backbone.View.extend({
    el: $('#app-container'),
    events: {
        "click #save-day" : "saveDay",
    },
    initialize: function() {
        this.list = this.$("#day-list");
        this.input = this.$("#minute-input");
        this.listenTo(this.collection, 'add', this.addOne);
    },
    addOne: function(day) {
        var view = new DayView({model: day});
        this.list.append(view.render().el);
    },
    saveDay: function(e) {
        if (!this.input.val()) { return; }
        this.collection.create({minutes: this.input.val()});
        this.input.val('');
    }
});
*/

$(function() {
    //var collection = new DayCollection();
    //var app = new MainView({ collection: collection });

    var dp = $('#datetimepicker').datetimepicker({
        inline: true,
        format: 'YYYY-MM-DD'
    });

    var editor_container = $('#date-edit');
    var editor_template = editor_container.html();
    var editor_view = null;

    dp.on('dp.change', function (e) {
        var iso_date = e.date.format('YYYY-MM-DD');

        if (editor_view !== null) editor_view.remove();
        editor_container.html('');
        var el = $('<div/>');
        editor_container.append(el);
        el.html(editor_template);

        editor_view = new DayEditView({
            el: el,
            model: new Day({id: iso_date})
        });
    });
});
