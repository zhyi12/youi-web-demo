/**
 * field组件
 * Copyright (c) 2009 zhouyi
 * licenses
 * doc 
 */
(function($) {
	var _log = $.youi.log;
	/**
	 * fieldLabel组件
	 * 
	 */
	$.widget("youi.fieldLabel",$.extend({},$.youi.field,{
		_initField:function(){
			
		},
		
		_fieldHtmls:function(){
			var htmls = [],
				href = this.options.href||'#';
			htmls.push('<a href="'+href+'" target="'+this.options.target+'" class="textShow"></a>');
			htmls.push('<input name="'+this.options.property+'" type="hidden" class="value"></input>');
			return htmls.join('');
		},
		
		_initAction:function(){
			this.element.find('a.textShow').click(function(){
				$(this.parentNode).fieldLabel('goHref');
				// Prevent IE from keeping other link focussed when using the back button
				// and remove dotted border from clicked link. This is controlled via CSS
				// in modern browsers; blur() removes focus from address bar in Firefox
				if ($.support.boxModel) {
					this.blur();
				}
			});
		},
		/**
		 * 转到链接
		 */
		goHref:function(){
			var href = this.element.find('a.textShow').attr('href');
			//_log.info(href);
			//this.href = 
			var params = this.options.params;
			if($.isArray(params)&&params.length>0){
				var queryParams = [],
					property,value;
				for(var i=0;i<params.length;i++){
					property = params[i];
					value = $.youi.fieldUtil.getElementByProperty(property,this.options.prefix).fieldValue();
					//_log.info('property:'+property+'='+value);
					if(value!=null){
						queryParams.push($.youi.parameterUtil.propertyParameter(property,value));
					}
				}
				
				href += href.indexOf('?')==-1?'?':'&';
				href += queryParams.join('&');
			}
			this.element.find('a.textShow')[0].href = href;
		},
		
		setValue:function(value){
			//return;
			var show = value;
			if(this.options.convert&&$.youi.serverConfig.convertArray[this.options.convert]){
				show = $.youi.serverConfig.convertArray[this.options.convert][value];
				if(this.options.mixed){
					show = value+' - '+show;
				}
			}
			this.element.find('.textShow').text(show||value);
			this.element.find('input.value').val(value);
		},
		
		getValue:function(){
			return this.element.find('input.value').val();
		},
		
		clear:function(){
			this.element.find('.textShow').text('');
			this.element.find('input.value').val('');
		}
	}));
	
	$.extend($.youi.fieldLabel,{
		defaults:$.extend({},$.youi.fieldDefaults,{
			target:'_self'
		})
	});
})(jQuery);