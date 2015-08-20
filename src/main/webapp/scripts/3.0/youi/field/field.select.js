/**
 * field组件
 * Copyright (c) 2009 zhouyi
 * licenses
 * doc 
 */
(function($) {
	var _log = $.youi.log;
	/**
	 * fieldSelect组件
	 * 
	 */
	$.widget("youi.fieldSelect",$.extend({},
		$.youi.field,//field
		$.youi.fieldPop,{//fieldPop继承了fieldSource
		/**
		 * fieldSelect的个性初始化
		 * 1、调用约定的fieldSource组件的初始化方法_initSource
		 */
		_initField:function(){
			this._initSource();
		},
		
		/**
		 * 回调函数，返回record解析成的html
		 */
		_parseRecord:function(index,record,options){
			var htmls = [],
				codeValue = record.code,
				showValue = options.mixed?(record.show+'('+codeValue+')'):record.show,
				itemClasses = ['option-item'];
		
			var selectedValue = options.selectedValue;
			if(selectedValue!=null){//已选值处理
				var values= [];
				if($.isArray(selectedValue)){
					values = selectedValue;
				}else{
					values = [selectedValue];
				}
				for(var i=0;i<values.length;i++){
					if(codeValue==values[i]){
						itemClasses.push('selected');
						options.selectedTexts.push(showValue);//选值对应的文本加入约定的参数selectedTexts中
						break;
					}
				}
			}
			htmls.push('<div value="'+codeValue+'" class="'+itemClasses.join(' ')+'">'+showValue+'</div>');
			return htmls.join('');
		},
		/**
		 * 空记录的html
		 */
		_nullItemHtml:function(){
			return '<div class="option-item"></div>';
		},
		/**
		 * 获得存放数据的容器的id
		 */
		_getDatasContextId:function(){
			return this._getPanelId();//fieldSelect组件的数据panel和popPanel一致
		},
		
		/**
		 * 初始化panel的动作
		 */
		_initPanelAction:function(){
			this._getPopPanel()
				.mousedown(function(event){event.stopPropagation();})//阻止冒泡
				.bind('click',function(event){
					var eventClass = $.youi.classUtils.getEventClass(event);//option-item;
					if(eventClass=='option-item'){
						var fieldId = this.getAttribute('fieldId');
						var value = event.target.getAttribute('value')||'';
						$.youi.fieldUtils.execMethod($('#'+fieldId),'setValue',value);
						$.youi.fieldUtils.execMethod($('#'+fieldId),'_closePanel');
					}
				}
			);
		},
		/**
		 * 设置值
		 */
		setValue:function(value){
			var oldValue = this.getValue();
			this.element.find('input.value').val(value);
			//设置文本
			if(!this._isLoaded()){//如果没有加载数据
				this._datasLoader();//加载数据
			}else{//已经加载了数据
				var text = this._getPopPanel().find('.option-item[value='+value+']').text();
				this.setText(text);
				this._resetChildren();
			}
			
			this._valueChange(oldValue,value);
		},
		
		/**
		 * 选择值发生变化
		 */
		_valueChange:function(oldValue,value){
			if(oldValue!=value){//change
				if($.isFunction(window[this.options.id+'_change'])){
					window[this.options.id+'_change'].apply(this.element[0],[value,oldValue]);
				}
				
				if($.isFunction(this.options.change)){
					this.options.change.apply(this.element[0],[value,oldValue]);
				}
			}
			if($.isFunction(this.options.afterSetValue)){
				this.options.afterSetValue(value);
			}
		},
		
		setWidth:function(width){
			width+=5;
			this.element.find('table').attr('width',width+'px').find('td:first').attr('width',(width-21)+'px');
			this._getPopPanel().width(width-1);
			this.element.width(width).find('.textInput').width(width-21);
		},
		/**
		 * 获得值
		 */
		getValue:function(){
			return this.element.find('input.value').val();
		},
		
		/**
		 * 获得显示值
		 */
		getText:function(){
			return this.element.find('.textInput').text();
		},
		
		setText:function(text){
			this.element.find('.textInput').text(text);
		},
		
		focus:function(){
			this._openPanel();
			this.element.find('input.textInput').focus();
		}
	}));
	
	$.extend($.youi.fieldSelect,{
		defaults:$.extend({},$.youi.fieldPopDefaults,{
			
		})
	});
})(jQuery);