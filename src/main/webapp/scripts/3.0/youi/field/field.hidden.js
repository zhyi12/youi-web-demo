/**
 * field组件
 * Copyright (c) 2009 zhouyi
 * licenses
 * doc 
 */
(function($) {
	var _log = $.youi.log;
	/**
	 * fieldHidden组件
	 * 
	 */
	$.widget("youi.fieldHidden",$.extend({},$.youi.field,{
		_initField:function(){
			
		},
		
		_fieldHtmls:function(){
			var htmls = [];
			htmls.push('<input name="'+this.options.property+'" type="hidden" class="value"></input>');
			return htmls.join('');
		},
		
		setValue:function(value){
			this.element.find('input.value').val(value);
		},
		
		getValue:function(){
			
			return this.element.find('input.value').val();
		},
		
		clear:function(){
			if(this.getValue()===this.options.defaultValue)return;
			this.element.find('input.value').val('');
		}
	}));
	
	$.extend($.youi.fieldLabel,{
		defaults:$.extend({},$.youi.fieldDefaults,{
			
		})
	});
})(jQuery);