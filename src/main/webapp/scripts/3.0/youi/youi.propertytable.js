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
	
	$.widget("youi.propertytable",$.youi.abstractWidget,$.extend({},{
		/**
		 * 默认参数
		 */
		options:{
			bindResize:true,
			delay: 100,//
			distance: 1,
			editable:true,
			defaultGroups:[]
		},
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			this.propertyGroupDescs = this.options.propertyGroupDescs||{};
		},
		/**
		 * 接口方法，初始化widget组件
		 */
		_initWidget:function(){
			this._mouseInit();
			this._resize();
			
			if(this.options.defaultGroups!=null){
				this.active({}, this.options.defaultGroups);
			}
		},
		
		/**
		 * 接口方法，填充html元素
		 */
		_defaultHtmls:function(){
			var htmls = [];
			
			htmls.push('<div class="propertytable-header col-sm-12">');
			htmls.push(		'<div class="propertytable-name col-sm-6">属性名</div>');
			htmls.push(		'<div class="propertytable-value col-sm-6">属性值</div>');
			htmls.push('</div>');
			htmls.push('<div class="propertytable-body col-sm-12">');
			for(var groupName in this.propertyGroupDescs){
				var group = this.propertyGroupDescs[groupName];
				htmls.push('<div data-name="'+groupName+'" class="propertytable-group col-sm-12">');
				htmls.push(		'<div class="group-label col-sm-12"><div class="group-title">'+group.caption+'</div></div>');
				
				if(group.propertyDescs){//propertyDescs
					for(var j=0;j<group.propertyDescs.length;j++){
						htmls.push(this._buildRow(group.propertyDescs[j],groupName));
					}
				}
				
				htmls.push('</div>');
			}
			htmls.push('</div>');
			this.element.append(htmls.join(''));
		},
		
		_buildRow:function(item,groupName){
			var editor = item.type||'fieldText',
				htmls = [];
			htmls.push('<div class="propertytable-row '+(item.type||'')+'"');
			
			htmls.push(' data-group-name="'+groupName+'" ');
			htmls.push(' data-name="'+item.name+'" ');
			if(item.groups){
				for(var i=0;i<item.groups.length;i++){
					htmls.push(' data-'+item.groups[i]+'="true" ');
				}
			}
			htmls.push('>');
			htmls.push(		'<div class="propertytable-name col-sm-6 '+item.name+'">'+item.caption+'</div>');
			htmls.push(		'<div class="propertytable-value col-sm-6" data-'+item.name+'="" data-editor="'+editor+'"></div>');
			htmls.push('</div>');
			return htmls.join('');
		},
		
		/**
		 * 打开编辑器
		 */
		openEditor:function(options){
			var elem = $(options.editTarget),
				editorContainer = $(options.editorContainer),
				propName = elem.parent().data('name'),
				fieldType = elem.data('editor'),
				cellValue = elem.data(propName);
			
			var groupName = elem.parent().parent().data('name');
			var propertyModel = this._getPropertyModel(groupName,propName);
			
			var fieldOptions = $.extend({},propertyModel,{
				property:fieldType+(propertyModel.convert?('_'+propertyModel.convert):''),
				prefix:'youi_editor',
				initHtml:true
			});
			
			var fieldWidget =$.youi.editorUtils.buildWidget(fieldType,fieldOptions);
			if(!fieldWidget){
				return;
			}
			
			fieldWidget.fieldValue(cellValue);
			var fieldPopId = 'field-pop-'+fieldWidget.attr('id');
			var fieldPopPanel = $('#'+fieldPopId);
			//绑定关闭
			
			var _self = this;
			editorContainer.bind('editor.close',function(event){
				var value = fieldWidget.fieldValue();
				var text = fieldWidget.fieldShow();//convert
				
//				elem.data('value',value).html(text);
				_self._setPropertyValue(elem,value,text);
				//触发change事件
				_self._trigger('change',event,{property:elem.parent().data('name'),value:value,text:text});
			});
			
			editorContainer.find('>*').appendTo($('body',document)).hide();
			fieldWidget.show();
			editorContainer.empty().append(fieldWidget);
			
			if(fieldPopPanel.length){
				fieldPopPanel.width(elem.width()+4).show();
				editorContainer.append(fieldPopPanel);
			}
			//
			window.setTimeout(function(){
				editorContainer.find('.textInput:first').focus();
			});
		},
		
		_getPropertyModel:function(groupName,propName){
			var model = {};
			if(this.options.propertyConverts&&this.options.propertyConverts[propName]){
				model.convert = this.options.propertyConverts[propName];
			}
			return model;
		},
		/**
		 * 激活
		 */
		active:function(values,groups,skipProps){
			var selector = '[data-'+groups.join('],[data-')+']';
			var _self = this;
			this.element.find('.show').removeClass('show');
			
			this.element.find(selector).each(function(){
				var elem = $(this);
				var propName = elem.data('name');
				//跳过不显示的属性
				if(skipProps&&$.inArray(propName,skipProps)!=-1){
					return;
				}
				
				if(!elem.hasClass('fieldHidden')){
					elem.addClass('show');
				}
				
				var valueElem = elem.find('>.propertytable-value'),
					valueData = valueElem.data();
				
				var value = null;
				for(var i in valueData){
					if(values[i]||values[i]==0){
						//设置值
						value = values[i];
						break;
					}
				}
				_self._setPropertyValue(valueElem, value);
			});
			
			//显示group
			this.element.find('.propertytable-group').each(function(){
				if($('.show',this).length>0){
					$(this).addClass('show');
				}
			});
			
			this._log.debug(this._buildLogMsg(selector,null,'active'));
		},
		
		setPropertyValue:function(property,value){
			this._setPropertyValue(this.element.find('[data-name="'+property+'"] .propertytable-value'),value);
		},
		/**
		 * 设置属性值
		 */
		_setPropertyValue:function(valueElem,value,text){
			var propName = valueElem.parent().data('name');
			if(value||value==0){
				text =  text||this._convertValue(propName,value);
				valueElem.data(propName,value).text(text).attr('title',text);
			}else{
				valueElem.data(propName,'').text('').attr('title','');
			}
		},
		
		_convertValue:function(propName,value){
			var converts =$.youi.serverConfig.convertArray[this.options.propertyConverts[propName]];
			var text;
			if(converts&&converts[value]!=null){
				text = converts[value];
			}else{
				text = value;
			}
			return text;
		},

		/**
		 * 接口方法，初始化组件动作
		 */
		_initAction:function(){
			
		},
		/**
		 * 接口方法，重定位
		 */
		_resize:function(){
			//var layout-y
			if(!this.element.hasClass('layout-y')){
				var pHeight = this.element.offsetParent().innerHeight();
				
				this.element.height(pHeight);
			}
			
			var height = this.element.innerHeight();
			var bodyHeight = height - this.element.find('>.propertytable-header').outerHeight();
			
			this.element.find('>.propertytable-body').height(bodyHeight);
		},
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	}));
	
})(jQuery);