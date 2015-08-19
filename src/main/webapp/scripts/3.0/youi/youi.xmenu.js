/*!
 * youi JavaScript Library v3.0.0
 * 
 *
 * Copyright 2015, zhyi_12
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: 2015-1-26
 */

(function($) {
	'use strict';
	
	$.widget("youi.xmenu",$.youi.abstractWidget,$.extend({},{
		/**
		 * 默认参数
		 */
		options:{
			
		},
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			
		},
		/**
		 * 接口方法，初始化widget组件
		 */
		_initWidget:function(){
			this.element.addClass('dropdown-menu');
			this.element.attr('data-contextmenu','xmenu');
			this.element.attr('data-contextmenureturn','true');
		},
		
		/**
		 * 接口方法，填充html元素
		 */
		_defaultHtmls:function(){
			var htmls = [],
				menus = this.options.menus;
			if($.isArray(menus)){
				for(var i=0;i<menus.length;i++){
					htmls.push('<li data-name="'+menus[i].name+'" class="xmenu-item '+menus[i].name+' ');
					if(menus[i].widgets){
						htmls.push(menus[i].widgets.join(' '));
					}
					
					htmls.push('"><a data-command="menuCommand" '+(menus[i].value?' data-value="'+menus[i].value+'" ':'')+' href="#">');
					if(menus[i].icon){
						htmls.push('<span class="glyphicon fontawesome-'+menus[i].icon+'"/>');
					}else{
						htmls.push('<span class="glyphicon fontawesome-empty"/>');
					}
					
					htmls.push(menus[i].caption.replace(/{[0-9]}/g,function(text){
						return '<span class="value" data-value="'+(text.substring(1,text.length-1))+'"></span>';
					}));
					htmls.push('</a></li>');
				}
			}
			this.element.html(htmls.join(''));
		},
		/**
		 * 接口方法，初始化组件动作
		 */
		_initAction:function(){
			this.element.bind('mouseleave',function(event){
				$(this).hide();
			});
			this.element.delegate('[data-command="menuCommand"]','click',function(event){
				$(event.delegateTarget).xmenu('execCommand',event,$.extend({},$(this).data(),{
					name:$(this.parentNode).data('name')
				}));
			});
		},
		
		execCommand:function(event,options){
			if(this.bindOptions){
				var widgetName = this.element.data('bindWidget');
				$(this.bindOptions.bindWidget).trigger(widgetName+'.contextmenu',$.extend({},this.bindOptions,options));
				
				this.element.hide();
			}
		},
		
		open:function(options,groups){
			var widgetName = this.element.data('bindWidget');
			this.bindOptions = options;
			
			var properties = [];
			
			var propertyPrefix = 'property:';
			
			for(var i=0;i<groups.length;i++){
				if(groups[i].indexOf(propertyPrefix)==0){
					properties.push(groups[i].substring(propertyPrefix.length,groups[i].length));
				}
			}
			
			this.element.find('.xmenu-item.show').removeClass('show');
			//显示groups中设置的菜单
			this.element.find('.xmenu-item.'+widgetName).each(function(){
				var elem = $(this);
					name = elem.data('name');
				if($.inArray(name,groups)!=-1){
					elem.addClass('show');
					if(properties&&properties.length){
						$('.value',this).each(function(){
							var vIndex = parseInt($(this).data('value'));
							var text = properties[vIndex]||'';
							$(this).text(text);
						});
					}
				}
			});
			
			if(this.element.find('.xmenu-item.show').length==0){
				return;
			}
			
			this.element.css({
				left:options.left,
				top:options.top
			}).show();
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