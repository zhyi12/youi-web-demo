/*!
 * youi JavaScript Library v3.0.0
 * 
 *
 * Copyright 2015, zhyi_12
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: 2015-2-4
 */

(function($) {
	'use strict';
	
	$.widget("youi.toolbar",$.youi.abstractWidget,$.extend({},{
		/**
		 * 默认参数
		 */
		options:{
			commandWidget:'toolbar'
		},
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			this.items = this.options.items||[];
		},
		/**
		 * 接口方法，初始化widget组件
		 */
		_initWidget:function(){
			
		},
		
		/**
		 * 接口方法，填充html元素
		 */
		_defaultHtmls:function(){
			var htmls = [];
			
			var buttons = [];
			for(var i=0;i<this.items.length;i++){
				htmls.push('');
				if(this.items[i].type=='split'){
					htmls.push($.youi.buttonUtils.createButtons(buttons));
					buttons = [];
				}else{
					buttons.push($.extend({},this.items[i],
							{
								command:this.options.commandWidget,
								tooltips:this.items[i].caption,
								icon:this.items[i].icon||this.items[i].name
							}));
				}
			}
			htmls.push($.youi.buttonUtils.createButtons(buttons));
			this.element.append(htmls.join(''));
		},
		/**
		 * 接口方法，初始化组件动作
		 */
		_initAction:function(){
			this._on({
				'click .youi-button':function(event){
					var options = $(event.currentTarget).data();
					if(options.name){
						this._trigger('action',event,options);
					}
				}
			});
		},
		/**
		 * 接口方法，重定位
		 */
		_resize:function(){
			
		},
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	}));
	
})(jQuery);