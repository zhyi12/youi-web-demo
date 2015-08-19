(function($) {
	var _log = $.youi.log;
	
	$.widget('youi.mousable',$.ui.mouse ,{
		_create:function(){
			this.element.disableSelection();
			this._mouseInit();
		},
		
		_mouseStart: function(event) {
			if(!this._trigger('start',event)){
				return false;
			}
		},
		_mouseDrag: function(event) {
			this._trigger('drag',event);
		},
		_mouseStop: function(event) {
			this._trigger('stop',event);
		},
		_mouseCapture: function(event) { 
			return true; 
		}
	});
	
	$.extend($.youi.mousable,{
		defaults:{
			delay: 0,//
			distance: 1
		}
	});
})(jQuery);