$(function(){

  var Tally = Backbone.Model.extend({

    defaults: function() {
      return {
        title: "empty tally...",
        order: Tallys.nextOrder(),
        count: 0
      };
    },

    initialize: function() {
      if (!this.get("title")) {
        this.set({"title": this.defaults.title});
      }
    },

    increment: function() {
      this.set({"count": Number(this.get("count"))+1});
      this.save();
    },

    decrement: function() {
      var cur_count = this.get("count");  
      if (cur_count > 0) {
        this.set({"count": cur_count-1});
      }
      this.save();
    },

    clear: function() {
      this.destroy();
    }

  });

  var TallyList = Backbone.Collection.extend({
  
    model: Tally,

    localStorage: new Store("tallys-backbone"),

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order');
    },

    comparator: function(tally) {
      return tally.get('order');
    }

  });

  var Tallys = new TallyList;

  var TallyView = Backbone.View.extend({
    
    tagName:  "tr",
    
    className: "entry",
    
    template: _.template($('#item-template').html()),

    events: {
      "click .inc"        : "inc",
      "click .dec"        : "dec",
      "dblclick .title"   : "edit_title",
      "dblclick .counter" : "edit_count",
      "click a.destroy"   : "clear",
      "keypress .title .edit"    : "updateOnEnter",
      "keypress .counter .edit"    : "updateOnEnterc",
      "blur .title .edit" : "close_title",
      "blur .counter .edit" : "close_count"    },

    initialize: function() {
      this.model.on('change', this.render, this);
      this.model.on('destroy', this.remove, this);
  },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$('.crement').hover( function() {$(this).css(
                                            {'cursor': 'pointer',
                                           'text-decoration': 'underline'});},
                                function() {$(this).css(
                                            {'cursor': 'none',
                                             'text-decoration': 'none'});});
      return this;
    },

    inc: function() {
      this.model.increment();
    },

    dec: function() {
      this.model.decrement();
    },

    edit_title: function() {
      var target = this.$('.title');
      target.addClass("editing");
      target.find('.edit').focus();
    },
    
    edit_count: function() {
      var target = this.$('.counter');
      target.addClass("editing");
      target.find('.edit').focus();
    },

    close_title: function() {
      var target = this.$('.title');
      target.removeClass("editing");
      var value = target.find('.edit').val();
      if (!value) this.clear();
      this.model.save({title: value});   
    },
    
    close_count: function() {
      var target = this.$('.counter');
      target.removeClass("editing");
      var value = target.find('.edit').val();
      this.model.save({count: value});
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close_title();
    },
    
    updateOnEnterc : function(e) {
      if (e.keyCode == 13) this.close_count();
    },

    clear: function() {
      this.model.clear();
    },

  });


  var AppView = Backbone.View.extend({
    
    el: $("#tallyapp"),

    numsortplus: 1,
    alphasortplus: 1,

    events: {
      "keypress #new-tally": "createOnEnter",
      "click #counts": "resortnum",
      "click #titles": "resorttitl"
    },

    initialize: function() {
      
      this.input = this.$("#new-tally");
      
      Tallys.on('add', this.addOne, this);
      Tallys.on('reset', this.addAll, this);
      Tallys.on('all', this.render, this);

      this.main = $('#tallys');
      this.$('.header').hover( function() {$(this).css(
                                            {'cursor': 'pointer',
                                           'text-decoration': 'underline'});},
                                function() {$(this).css(
                                            {'cursor': 'none',
                                             'text-decoration': 'none'});});

      Tallys.fetch();
    },

    render: function() {
      if (Tallys.length) {
        this.main.show();
        var titles = Tallys.pluck("title");
        var counts = Tallys.pluck("count");
        var autosource = new Array(titles.length);
        for (var i=0; i<titles.length; i++) {
          autosource[i] = { label: titles[i] + " " + counts[i], value: titles[i] };
        }
        $("#new-tally").autocomplete({
          source: autosource,
          minLength: 1,
          /*  select: function(event, ui) {
            var selectModel = Tallys.where({title: ui.item.value})[0];
            console.log(selectModel);
            selectModel.increment(); 
          } */
        });
      } else {
        this.main.hide();
      }
    },

    resortnum: function() {
      var numsortval = this.numsortplus;
      Tallys.comparator = function(tally) {
        resort = function(tallyin) {
          return numsortval*tallyin.get('count'); 
        }
        return resort.call(this, tally);
      };
      this.numsortplus *= -1;
      this.$(".entry").remove();
      Tallys.sort();
    },

    resorttitl: function() {
      var alphasortval = this.alphasortplus;
      Tallys.comparator = function(tally1, tally2) {
        resort = function(tallyin1, tallyin2) {
          return alphasortval*(tallyin1.get('title')).localeCompare(tallyin2.get('title'));
        }
        return resort.call(this, tally1, tally2);
      };
      this.alphasortplus *= -1;
      this.$(".entry").remove();
      Tallys.sort();
    },

    addOne: function(tally) {
      var view = new TallyView({model: tally});
      this.$("#tally-list").append(view.render().el);
    },

    addAll: function() {
      Tallys.each(this.addOne);
    },

    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      var selectModel = Tallys.where({title: this.input.val()})[0];
      if (!selectModel) {
        Tallys.create({title: this.input.val()});
        this.input.val('');
        return;
      } else {
        selectModel.increment();
        this.input.val('');
      }
    }

  });

  var App = new AppView;

});
