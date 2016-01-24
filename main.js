var FIREBASE_URL = "https://shining-fire-655.firebaseio.com";

// adapted from the BackboneFire example app

var Day = Backbone.Model.extend({
    defaults: { minutes: 0 }
});

var DayCollection = Backbone.Firebase.Collection.extend({
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

$(function() {
    var collection = new DayCollection();
    var app = new MainView({ collection: collection });
});
