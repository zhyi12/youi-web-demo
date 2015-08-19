/*!
 * youi JavaScript Library v3.0.0
 * 
 *
 * Copyright 2015, zhyi_12
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: 2015-2-5
 */



/**
 * 组件工厂
 */
(function ($){
	'use strict';
    
	var WidgetFactory = function(){
		this.widgets = {};//
	};
	/**
	 * widget注册
	 */
	WidgetFactory.prototype.register = function(widgetObject){
		//
		this.widgets[widgetObject.name] = widgetObject;
		
		//右键菜单集成
		if(widgetObject.contextmenus&&$.youi.contextmenuUtils){
			
			$(widgetObject.contextmenus).each(function(){
				$.youi.contextmenuUtils.addWidgetContextmenu('pageditor',[$.extend({},this,{
					name:'addFunc_'+this.name,
					value:this.name,
					caption:this.name+'{0}',
					icon:'func'
				})]);
			});
		}
		return this;
	};
	/**
	 * 设置组件属性值
	 */
	WidgetFactory.prototype.setPropertyValue = function(widgetElem,property,value){
		var widgetObject = this.widgets[widgetElem.data('widgetName')];
		var oldValue = widgetElem.data(property);
		if(widgetObject&&property&&(value||value==0)&&oldValue!=value){
			
			widgetElem.data(property,value);
			widgetElem.removeAttr('data-'+property);
			widgetElem.attr('data-'+property,value);
			//删除prefix
			var startIndex = property.indexOf('_')+1;
			
			var methodName = 'set'+property.substring(startIndex,startIndex+1).toUpperCase()+property.substring(startIndex+1);
			
			//
			if($.inArray(property,widgetObject.textProperties)!=-1){
				//设置文字编辑变量
				widgetObject.setTextValue(widgetElem,property,value);
			}else if($.isFunction(widgetObject[methodName])){
				
				widgetObject[methodName].apply(widgetObject,[widgetElem,value,oldValue]);
			}
		}else{
			widgetElem.data(property,'');
			widgetElem.removeAttr('data-'+property);
		}
	};
	/**
	 * 生成html
	 */
	WidgetFactory.prototype.buildHtml = function(widgetOptions){
		var htmls = [];
		var widgetObject = this.widgets[widgetOptions['widget-name']];
		
		if(widgetObject&&$.isFunction(widgetObject.contentHtml)){
			var styles = ['page-widget widget-'+widgetObject.name+' col-sm-12'];
			
			var widgetOptions = $.extend({},widgetObject.options,widgetOptions);
			
			var specialStyle = widgetObject.styles;
			if($.isFunction(specialStyle)){
				specialStyle = specialStyle(widgetOptions);
			}
			
			if(widgetObject.widthable==true){
				styles.push('widthable');
			}
			
			if(widgetObject.idable!=false){
				styles.push('idable');
			}
			
			styles.push(specialStyle);
			
			htmls.push('<div class="'+styles.join(' ')+'"');
			htmls.push(' title="'+widgetObject.name+'" ');
			for(var i in widgetOptions){
				htmls.push(' data-'+i+'="'+widgetOptions[i]+'"');
			}
			
			if(widgetObject.dropStyles){
				for(var i=0;i<widgetObject.dropStyles.length;i++){
					htmls.push(' data-'+widgetObject.dropStyles[i]+'="true"');
				}
			}
			
			if(widgetObject.idable!=false){
				htmls.push(' data-component_id="'+widgetOptions['widget-id']+'"');
			}
			
			htmls.push('>');
			htmls.push(		widgetObject.contentHtml(widgetOptions));
			htmls.push('</div>');
			
		}
		
		return htmls.join('');
	};
	
	WidgetFactory.prototype.doRemove = function(widgetElem){
		var widgetObject = this.widgets[widgetElem.data('widgetName')];
		if(widgetObject&&$.isFunction(widgetObject.doRemove)){
			//删除关联
			return widgetObject.doRemove.apply(widgetObject,[widgetElem]);
		}
	};
	
	if($.youi){
		$.youi.widgetFactory = new WidgetFactory();
	}
})(jQuery);

(function($) {
	'use strict';

	var _command = 'pageditorCommand';
	
	/**
	 * 添加右键菜单
	 */
	$.youi.contextmenuUtils&&$.youi.contextmenuUtils.addWidgetContextmenu('pageditor',[
		 {'name':'removeSelected',caption:"删除选中元素{0}",icon:'remove'},
		 {'name':'viewSource',caption:"查看源码",icon:'viewSource'}
	]);
	
	$.widget("youi.pageditor",$.youi.abstractWidget,$.extend({},$.youi.dragSupport,{
		/**
		 * 默认参数
		 */
		options:{
			distance: 1,
			delay:100,
			cancel: "input,textarea,button,select,option,[contenteditable=true]"
		},
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			this.WIDGET_UUID = this.options.startUUID||0;//
			this.options.container = this.options.container||$('body',document);
			this.codeMirrors = {};
		},
		/**
		 * 生成widget主键
		 */
		_createWidgetId:function(widgetName){
			var widgetId = widgetName+'_'+this.WIDGET_UUID++;
			while(this.element.find('.page-widget[data-widget-id="'+widgetId+'"]').length>0){
				widgetId = widgetName+'_'+this.WIDGET_UUID++;
			}
			return widgetId;
		},
		/**
		 * 接口方法，初始化widget组件
		 */
		_initWidget:function(){
			this.element
				.attr('data-widget-name','page');
			
			this.subpageContainer = this.element.find('.pageditor-subpages:first');
			this.funcContainer = this.element.find('.pageditor-funcs:first');
			
			this.element.find('.pageditor-main>.widget-subpage').appendTo(this.subpageContainer);
			this.element.find('.pageditor-main>.widget-func').appendTo(this.funcContainer);
			
			$('.selected',this.element).removeClass('selected');
			
			this._contextMenuInit(true);
			this._mouseInit();
		},
		
		
		_getContextmenuGroups:function(menuTarget){
			
			var selectedWidget = this.getSelected();
			
			var groups = [];
			
			
			if(selectedWidget.length&&this._canShowContextMenu(menuTarget,selectedWidget[0])){
				var widgetName = selectedWidget.data('widgetName');
				
				groups.push('property:'+' - '+(selectedWidget.data('caption')||selectedWidget.data('widgetId')||''));
				groups.push('removeSelected');
				
				var widgetObject = $.youi.widgetFactory.widgets[widgetName];
				if(widgetObject&&widgetObject.contextmenus){
					for(var i=0;i<widgetObject.contextmenus.length;i++){
						groups.push('addFunc_'+widgetObject.contextmenus[i].name);
					}
				}
			}else{
				groups.push('viewSource');
			}
			return groups;
		},
		
		_canShowContextMenu:function(menuTarget,selectDom){
			return menuTarget==selectDom||selectDom==$(menuTarget).parents('.page-widget:first')[0];
		},
		
		/**
		 * 弹出菜单动作分发
		 */
		contextmenuCommandDispatcher:function(options,event){
			if(options.name.indexOf('addFunc_')==0){//添加函数
				this.addFunc(options.menuTarget, options);
			}else{
				this.execCommand(options.menuTarget,options);
			}
			//
		},
		
		/**
		 * 接口方法，填充html元素
		 */
		_defaultHtmls:function(){
			//alert(1);
		},
		/**
		 * 接口方法，初始化组件动作
		 */
		_initAction:function(){
			var _widgetName = this.widgetName;
			
			this.element.bind('drop.stop',function(event,ui){
				$(event.delegateTarget)[_widgetName]('addWidget',this,ui);
				//阻止冒泡
				event.stopPropagation();
			}).bind('mousedown',function(event){
				if(!$(event.target).is('[contenteditable="true"]')){
					var focusHelper = $('a.focus-helper',event.delegateTarget);
					if(focusHelper.length==0){
						focusHelper = $('<a contenteditable="true" href="#" class="focus-helper">&nbsp;</a>').appendTo(event.delegateTarget);
					}
					focusHelper.focus();
				}
			}).bind('mouseup',function(event){
				
			});
			//pageditor
			
			this.element.delegate('.pageditor-drop','drop.stop',function(event,ui){
				$(event.delegateTarget)[_widgetName]('addWidget',this,ui);
				//阻止冒泡
				event.stopPropagation();
			}).delegate('[data-text]','blur',function(event,ui){//文本编辑
				$(event.delegateTarget)[_widgetName]('textChanged',this,event);
			}).delegate('a.field-label-editor','blur',function(event,ui){//文本编辑
				$(event.delegateTarget)[_widgetName]('lableTextChanged',this,event);
				event.stopPropagation();
			}).delegate('a.tree-a','blur',function(event,ui){//文本编辑
				$(event.delegateTarget)[_widgetName]('treeNodeTextChanged',this,event);
				event.stopPropagation();
			}).delegate('.page-widget','mouseup',function(event,ui){
				if(!$(event.target).hasClass('click-skip')){
					$(event.delegateTarget)[_widgetName]('widgetSelect',this,event);
					event.stopPropagation();
				}
			}).delegate('.page-widget','mouseover',function(event){
				$(this).addClass('movable');
				event.stopPropagation();
			}).delegate('.page-widget','mouseout',function(event){
				$(this).removeClass('movable');
				event.stopPropagation();
			}).delegate('.pageditor-main [data-toggle="tab"]','shown.bs.tab',function(event){//标签页绑定
				$(event.delegateTarget)[_widgetName]('widgetSelect',$(this.getAttribute('href')),event);
			}).delegate('[data-command="'+_command+'"]','click',function(event){//命令绑定
				$(event.delegateTarget)[_widgetName]('execCommand',this,$(this).data());
				event.stopPropagation();
			});
		},
		
		/**
		 * 鼠标拖动开始
		 */
		_mouseStart: function(event) {
			//this.element.find('[contenteditable="true"]:active').trigger('blur',event);
			var elem = $(event.target);
			if(elem.hasClass('page-widget')&&!elem.hasClass('tab-pane')){
				this.currentDrag = elem;
				this.helper = this._createHelper(event,this.currentDrag);
			}else if(elem.hasClass('col-resize-helper')){
				this.resizeWidget = elem.parent();//
				this.helper = this._createHelper(event,elem).addClass('resizing');
				
				this.helper.css({
					left:this.resizeWidget.offset().left,
					top:this.resizeWidget.offset().top,
					width:this.resizeWidget.outerWidth(),
					height:this.resizeWidget.outerHeight()
				});
			}
		},
		/**
		 * 拖动过程中
		 */
		_mouseDrag: function(event) {
			
			if(this.helper){
				if(this.currentDrag){
					//
					this.position = this._generatePosition(event,this.currentDrag||this.resizeHelper);
					this.helper.css(this.position);
				}else if(this.resizeWidget){//调整组件宽度
					this.helper.css({
						width:event.pageX - this.helper.offset().left+2
					});
				}
			}
			
			if(this.currentDrag){
				var canDrop = false;
				
				var dropStyles;
				var dragDropStyles = this.currentDrag.data('dropStyles');
				if(dragDropStyles){
					dropStyles = dragDropStyles.split(',');
				}else{
					dropStyles = ['widget'];
				}
				
				for(var i=0;i<dropStyles.length;i++){
					if(event.target.getAttribute('data-'+dropStyles[i])=='true'){
						canDrop = true;
						break;
					}
				}
				
				if(canDrop){
					this._doDrag($(event.target));
				}else{
					this._releaseDrop();
				}
			}
		},
		
		_mouseStop: function(event) {
			if(this.currentDrag&&this.currentDrop){
				//执行拖到停止操作
				var ui = $.extend({},this.currentDrag.data(),{
					dropDoc:this.currentDrop[0]
				});
				//执行移动
				this._widgetMove(this.currentDrag,this.currentDrop);
				this._dropOut();
			}else if(this.resizeWidget){
				this._widgetResizeWidth(this.resizeWidget,this.helper.outerWidth(),this.helper.outerHeight);//
				this.resizeWidget = null;
			}
			
			this.helper&&this.helper.remove();
			this.currentDrag = null;
			this.currentDrop = null;
			this.helper = null;
			this.position = null;
		},
		/**
		 * 重新设置组件宽度
		 */
		_widgetResizeWidth:function(widget,width){
			
			this.widgetSelect(widget, null);
			//设置宽度
			this.setPropertyValue('component_width', parseInt(width/widget.parent().width()*10000)/100+'%');
			//触发属性变化
			this._triggerPropertyChange('component_width',{
				value:widget.data('component_width')
			});
		},
		/**
		 * 选择组件
		 */
		widgetSelect:function(widgetDoc,event){
			var elem = $(widgetDoc),
				selectedWidget = this.element.find('.page-widget.selected');
			if(selectedWidget[0]!=widgetDoc){
				selectedWidget.length>0&&selectedWidget.removeClass('selected');
				elem.addClass('selected');
				
				var datas = elem.data();
				var ui = $.extend({widgetType:'',component_id:datas.widgetId},datas,{});
				
				if(elem.hasClass('widthable')){
					ui.widthable = true;
				}
				
				if(elem.hasClass('idable')){
					ui.idable = true;
				}
				
				this._trigger('select',event,ui);
				this._log.debug(this._buildLogMsg(ui,null,'selected'));
			}
		},
		/**
		 * 文本属性变化
		 */
		textChanged:function(dom,event){
			var elem = $(dom),
				textProperty = elem.data('text');
			
			var widgetElem = $(elem.attr('href'));
			if(!widgetElem.length){
				widgetElem = elem.parents('.page-widget:first');
			}
			
			this._widgetTextChanged(elem,widgetElem,textProperty);
		},
		/**
		 * field label文本发生变化
		 */
		lableTextChanged:function(dom,event){
			var widgetElem = $(dom).parents('.field-group:first').find('.field-content>.page-widget');
			this._widgetTextChanged($(dom),widgetElem,'caption');
		},
		/**
		 * treeNode文本发生变化
		 */
		treeNodeTextChanged:function(dom,event){
			var widgetElem = $(dom).parents('.treeNode:first');
			this._widgetTextChanged($(dom),widgetElem,'caption');
		},
		/**
		 * 
		 */
		_widgetTextChanged:function(elem,widgetElem,textProperty){
			var oldValue = widgetElem.data(textProperty),
				group = elem.data('group'),
				parent = elem.parent(),
				itemText = elem.text()||'';
			
			if(group==true&&!itemText){
				elem.prev().remove();
				elem.remove();
			}else{
				elem.text(itemText);
			}
			var newValue;
			if(group==true){
				newValue = parent.find(':visible').text();
			}else{
				newValue = itemText;
			}
			
			if(oldValue!=newValue){
				widgetElem.data(textProperty,elem.text());
				widgetElem.attr('data-'+textProperty,elem.text());
				//触发属性变化
				if(widgetElem.hasClass('selected')){
					this._triggerPropertyChange(textProperty,{
						value:newValue,
						oldValue:oldValue
					},event);
				}
				
				//监听变化
				this._trigger('changed',null,{});
			}
		},
		/**
		 * 触发属性变化
		 */
		_triggerPropertyChange:function(property,options,event){
			options = $.extend({},options,{
				property:property
			});
			
			this._trigger('propertyChanged',event,options);
			
			this._log.debug(this._buildLogMsg(options,null,'propertyChanged'));
		},
		/**
		 * 接口方法，重定位
		 */
		_resize:function(){
			
		},
		/**
		 * 添加组件
		 */
		addWidget:function(parentDoc,options,widgetOptions){
			var widgetId = options.widgetId||this._createWidgetId(options.name);
			
			var widgetOptions = $.extend({},widgetOptions,{
				'widget-name':options.name,
				'widget-id':widgetId,
				'widget-type':(options.widgetType||''),
				'drop-styles':options.dropStyles||'widget'
			});
			
			if(options.content){
				widgetOptions.content = options.content;
			}
			
			var html = $.youi.widgetFactory.buildHtml(widgetOptions);
			
			if(!html){
				return;
			}
			
			if(options.widgetType=='field'){
				this._addFieldWidget(parentDoc,options,html,widgetId);
			}else if(options.widgetType=='treeNode'){
				this._addTreeNodeWidget(parentDoc,options,html,widgetId);
			}else if(options.widgetType=='button'){
				this._addButtonWidget(parentDoc,options,html,widgetId);
			}else if(options.widgetType=='tabItem'){
				this._addTabItemWidget(parentDoc,options,html,widgetId);
			}else if(options.widgetType=='gridCol'){
				this._addGridColWidget(parentDoc,options,html,widgetId);
			}else if(options.widgetType=='option'){
				this._addOptionWidget(parentDoc,options,html,widgetId);
			}else if(options.widgetType=='subpage'){
				this._addSubpageWidget(parentDoc,options,html,widgetId);
			}else if(options.widgetType=='funcBody'){
				this._addFuncBody(parentDoc,options,html,widgetId);
			}else{
				$(options.dropDoc).append(html);
			}
			
			//选中新增的节点
			var newWidget = this.element.find('[data-widget-id="'+widgetId+'"]');
			if(newWidget.length){
				this.widgetSelect(newWidget[0]);
			}
			//监听变化
			this._trigger('changed',null,{'type':'add'});
		},
		/**
		 * 移动元素
		 */
		_widgetMove:function(movingWidget,dropContainer){
			//排除父节点移动到子节点中
			if($.inArray(movingWidget[0],dropContainer.parents())!=-1){
				return;
			}
			
			var widgetType = movingWidget.data('widgetType');
			if(widgetType=='field'){
				//交换元素
				var movingGroup = movingWidget.parents('.field-group:first');
				var tmpGroup = $('<div></div>').insertAfter(movingGroup);
				
				var dropGroup = dropContainer;
				
				dropContainer.after(movingGroup);
				
				tmpGroup.after(dropContainer);
				
				tmpGroup.remove();
				
			}else if(widgetType=='treeNode'){
				//树节点移动
				var treeNodeElem = dropContainer.parents('li:first');
				var ul = treeNodeElem.find('>ul');
				if(ul.length==0){
					ul = $('<ul></ul>').appendTo(treeNodeElem);
				}else{
					ul.find('>li:last').removeClass('last');
				}
				ul.append(movingWidget);
			}else{
				dropContainer.append(movingWidget);
			}
			//监听变化
			this._trigger('changed',null,{type:'move'});
		},
		/**
		 * 添加表单域
		 */
		_addFieldWidget:function(parentDoc,options,html,id){
			var fieldParent = $(options.dropDoc);
			
			if(fieldParent.next().length==0){
				var newContainer = fieldParent.clone();
				newContainer.removeClass('droping');
				fieldParent.after(newContainer);
			}
			
			$('>.field-label',fieldParent).empty().append(_buildFieldLabel((options.caption||id.replace('field','')||'')));
			$('>.field-content',fieldParent).html(html);
		},
		/**
		 * 添加树节点
		 */
		_addTreeNodeWidget:function(parentDoc,options,html,id){
			var treeNode = $(options.dropDoc).parents('.treeNode:first');
			//
			if(treeNode.length){
				var ul = treeNode.find('>ul');
				if(ul.length==0){
					ul = $('<ul></ul>').appendTo(treeNode);
				}else{
					ul.find('>li:last').removeClass('last');
				}
				var widgetElem = $(html);
				
				ul.append(widgetElem.html());
			}
		},
		
		/**
		 * 标签项
		 */
		_addTabItemWidget:function(parentDoc,options,html,widgetId){
			var tabUl = $(options.dropDoc);
			var widgetElem = $(html);
			//
			var tabContent = tabUl.next();
			tabUl.append(widgetElem.html());
			
			tabContent.append(_buildTabPane({
				tabId:widgetId
			}));
			
			tabUl.find('[data-toggle="tab"]:last').tab('show');
		},
		/**
		 * 添加列表列
		 */
		_addGridColWidget:function(parentDoc,options,html,widgetId){
			var gridContent = $(options.dropDoc);//
			
			var tmpElem = $(html);//options.width
			gridContent.append(tmpElem.html());
			//刷新列宽度
			_refreshColsWidth(gridContent);
		},
		/**
		 * 添加按钮
		 */
		_addButtonWidget:function(parentDoc,options,html,id){
			var buttonContainer = $(options.dropDoc);
			var buttonWidget = $(html);
			buttonWidget.removeClass('col-sm-12');
			buttonWidget.attr('data-caption',buttonWidget.text());
			buttonContainer.append(buttonWidget);
		},
		/**
		 * 添加选择项
		 */
		_addOptionWidget:function(parentDoc,options,html,widgetId){
			var optionContainer = $(options.dropDoc);
			var optionWidget = $(html);
			optionContainer.append(optionWidget.html());
		},
		/**
		 * 添加子页面
		 */
		_addSubpageWidget:function(parentDoc,options,html,widgetId){
			//
			this.subpageContainer.append(html);
		},
		
		_addFuncBody:function(parentDoc,options,html,widgetId){
			var funcBodyElem = $(html);
			
			var funcWidget = $(options.dropDoc).parents('.widget-func:first');
			if(funcWidget.length){
				var widgetId = funcWidget.data('widgetId');
				var codeMirror = this.codeMirrors[widgetId];
				if(codeMirror){
					var line = codeMirror.doc.replaceSelection(funcBodyElem.text());
				}
			} 
			//
			//alert(funcWidget.html());
		},
		/**
		 * 
		 */
		setPropertyValue:function(property,value){
			var selectedWidget = this.getSelected();
			if(selectedWidget.length){
				$.youi.widgetFactory.setPropertyValue(selectedWidget,property,value);
			}
		},
		/**
		 * 
		 */
		removeSelected:function(){
			var selectedWidget = this.getSelected();
			if(selectedWidget.length){
				this._removeWidget(selectedWidget);
				//监听变化
				this._trigger('changed',null,{type:'remove'});
			}
		},
		
		_removeWidget:function(widgetElem){
			var nextWidget = $.youi.widgetFactory.doRemove(widgetElem);
			//删除绑定的widget
			var _self = this;
			this.element.find('[data-bind-widget-id="'+widgetElem.data('widgetId')+'"]').each(function(){
				_self._removeWidget($(this));
			});
			//删除物理元素
			widgetElem.remove();
			if(nextWidget){
				nextWidget.addClass('selected');
			}
		},
		
		getSelected:function(){
			return this.element.find('.page-widget.selected');
		},
		
		toTree:function(){
			var allWidgets = {},
				rootModel = new TreeNode(this.options.id,'页面结构','root'),
				_element = this.element,
				_codeMirrors = this.codeMirrors;
			
			rootModel.datas = {widgetName:'page',widgetId:this.options.id};
			
			this.element.find('.page-widget').each(function(index){
				var elem = $(this),
					datas = elem.data(),
					parentWidget = elem.parents('.page-widget:first',_element),
					parentModel;
				if(parentWidget.length){
					parentModel = allWidgets[parentWidget.data('widget-id')];
				}else{
					parentModel = rootModel;
				}
				
				var node = new TreeNode(datas.widgetId,datas.caption||datas['component_name']||datas.widgetId||datas.property,datas.widgetName);
				if(elem.hasClass('widget-content')){
					var editorElem = elem.find('.func-content [data-name="editFunc"]');
					var nextElem = editorElem.next();
					if(editorElem.length==0){
						node.content = elem.text();
					}else if(nextElem.is('.CodeMirror')&&_codeMirrors&&_codeMirrors[elem.data('widgetId')]){
						node.content = _codeMirrors[elem.data('widgetId')].getValue();
					}else{
						node.content = editorElem.text();
					}
				}
				node.datas = datas;
				allWidgets[datas.widgetId] = node;
				
				parentModel.addChild(node);
			});
			return rootModel;
		},
		/**
		 * 生成XML
		 */
		buildXml:function(){
			var _log = this._log;
			var xmls = ['<?xml version="1.0" encoding="UTF-8"?>'];
			xmls.push(this.toTree().toXml());
			return xmls.join('');
		},
		
		buildHtml:function(){
			var htmls = [];
			htmls.push(this.element.find('.pageditor-main:first').html());
			htmls.push(this.subpageContainer.html());
			//函数
			var _codeMirrors = this.codeMirrors;
			
			var tmpFuncContainer = this.funcContainer.clone();
			tmpFuncContainer.find('.widget-func').each(function(){
				var elem = $(this);
				
				var editorElem = elem.find('.func-content [data-name="editFunc"]');
				var nextElem = editorElem.next();
				if(nextElem.is('.CodeMirror')&&_codeMirrors&&_codeMirrors[elem.data('widgetId')]){
					editorElem.text(_codeMirrors[elem.data('widgetId')].getValue());
					nextElem.remove();
					
					editorElem.show();
				}
				
			});
			
			htmls.push(tmpFuncContainer.html());
			tmpFuncContainer = null;
			return htmls.join('');
		},
		/**
		 * 动作函数
		 */
		toggleFunc:function(dom,ui){
			//expanded
			$(dom).parents('.page-widget:first').toggleClass('expanded');
		},
		/**
		 * 添加函数参数
		 */
		addFuncParam:function(dom,ui){
			var elem = $(dom);
			elem.before('<span>,</span>');
			//}
			elem.before(_buildEditableText('param','component_params',true));
			
			var params = $(':visible',dom.parentNode).text();
			
			//触发属性变化
			this._triggerPropertyChange('component_params',{
				value:params
			});
		},
		/**
		 * 
		 */
		addFunc:function(dom,ui){
			var selectedWidget = this.getSelected();
			if(selectedWidget.length){
				var datas = selectedWidget.data();
				
				var funcId = (datas['component_id']||datas.widgetId)+'_'+ui.value;
				//显示func面板
				this.element.find('#pageditor_funcs>a').tab('show');
				
				
				//如果不存在
				var funcWidget = this.element.find('[data-widget-id="'+funcId+'"]');
				if(funcWidget.length){
					this.widgetSelect(funcWidget);
					return;
				}
				
				this.addWidget(this.funcContainer, {
					dropDoc:this.funcContainer[0],
					widgetId:funcId,
					name:'func'
				},{
					component_name:funcId,
					'bind-value':ui.value,
					'bind-widget-id':datas.widgetId
				});
			}
			
		},
		/**
		 * 编辑函数
		 */
		editFunc:function(dom,ui){
			this._initCodeMirror(dom);
		},
		
		refPropertyChange:function(widgetId,propName,value){
			this.element.find('.page-widget[data-bind-widget-id="'+widgetId+'"]').each(function(){
				var widgetElem = $(this);
				$.youi.widgetFactory.setPropertyValue(widgetElem,propName,value+'_'+widgetElem.data('bind-value'));
			});
		},
		
		_initCodeMirror:function(codeDoc){
			var editorElem = $(codeDoc);
			if(!editorElem.next().is('.CodeMirror')){
				var editor = CodeMirror.fromTextArea(editorElem[0], {
			        lineNumbers: true,
			        matchBrackets: true,
			        continueComments: "Enter",
			        extraKeys: {"Ctrl-Q": "toggleComment"},
			        change:function(){
			        	alert('c');
			        }
			      });
				
				
				editorElem.next().find('.CodeMirror-scroll').attr('data-func-body',true);
				
				this.codeMirrors[editorElem.parents('.page-widget:first').data('widgetId')] = editor;
			}
		},
		
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	}));
	
	var TreeNode = function(id,text,group){
		this.children = [];
		this.id = id;
		this.text =text;
		this.group = group;
		
		this.content = null;
		
		this.datas = null;
	};
	
	$.extend(TreeNode.prototype,{
		addChild:function(child){
			child.children=[];
			this.children.push(child);
			return this;
		},
		
		toXml:function(){
			var xmls = [];
			var childCount = this.children.length;
			
			var datas = this.datas;
			var tagName = datas.widgetName;
			xmls.push('<'+tagName);
			//属性设置
			for(var i in datas){
				xmls.push(' '+i+'="'+datas[i]+'"');
			}
			xmls.push('>');
			
			//children
			if(childCount>0){
				for(var i=0;i<childCount;i++){
					xmls.push(this.children[i].toXml());
				}
			}else if(this.content){
				xmls.push('<![CDATA['+this.content+']]>');
			}
			
			xmls.push('</'+tagName+'>\n');
			return xmls.join('');
		},
		
		toHtml:function(last,editor){
			var htmls = [];
			var childCount = this.children.length;
			
			var styles = [];
			
			if(last)styles.push('last');
			
			if(childCount>0){
				styles.push('expandable expanded');
			}
			
			styles.push(this.group);
			
			htmls.push('<li ');
			if(editor){
				htmls.push('data-widget-name="treeNode" data-drop-styles="tree-node" data-caption="'+this.text+'" data-widget-type="treeNode" data-widget-id="'+this.id+'" ');
			}
			htmls.push(' class="treeNode '+(editor==true?'page-widget ':'')+styles.join(' ')+'"');
			htmls.push(' id="'+this.id+'" ');
			htmls.push('>');
			
			if(!editor&&childCount>0){
				htmls.push('<div class="tree-trigger"></div>');
			}
			
			htmls.push('<span class="tree-span '+styles.join(' ')+'" >');
			htmls.push('<a ');
			if(editor){
				htmls.push('data-tree-node="true" contenteditable="true" ');
			}
			htmls.push(' class="tree-a '+styles.join(' ')+'" href="#" >');
			htmls.push(this.text);
			htmls.push('</a></span>');
			if(childCount>0){
				htmls.push('<ul>');
				for(var i=0;i<childCount;i++){
					htmls.push(this.children[i].toHtml(childCount==i+1,editor));
				}
				htmls.push('</ul>');
			}
			htmls.push('</li>');
			return htmls.join('');
		}
	});
	/**
	 * 抽象组件对象
	 */
	var _widgetObject = {
		textProperties:'caption'.split(' '),
		setTextValue:function(widgetElem,property,value){
			_setTextValue(widgetElem,property,value);
		},
		setHeight:function(widgetElem,height){
			widgetElem.height(height);
		},
		setId:function(widgetElem,value){
			widgetElem.parents('.youi-pageditor').pageditor('refPropertyChange',widgetElem.data('widgetId'),'component_name',value);
		},
		doRemove:function(widgetElem){
			var next = widgetElem.next(),nextWidget;
			if(next.length==0){
				nextWidget = widgetElem.prev();
			}else{
				nextWidget = next;
			}
			
			if(nextWidget.length==0){
				nextWidget = widgetElem.parents('.page-widget:first');
			}
			
			return nextWidget;
		}
	};
	
	/**
	 * 表单域组件对象
	 */
	var _fieldWidgetObject = $.extend({},_widgetObject,{
		textProperties:null,
		idable:false,
		contentHtml:function(widgetOptions){
			return '<div class="form-control"></div>';
		},
		setProperty:function(widgetElem,value){
			
		},
		setCaption:function(widgetElem,value){
			widgetElem.parents('.field-group:first').find('a.field-label-editor').text(value);
		},setColumn:function(widgetElem,value,oldValue){
			
			var fieldLayoutElem =  widgetElem.parents('[data-widget-name="fieldLayout"]:first');
			if(fieldLayoutElem.length){
				var columns = parseInt(fieldLayoutElem.data('component_columns')||2);
				
				var oldSmCol = Math.min(12/columns*(oldValue||1),12),
					newSmCol = Math.min(12/columns*(value||1),12);
				
				var fieldContent = widgetElem.parents('.field-group:first');
				//fieldContent.removeClass('col-sm-'+oldSmCol).addClass('col-sm-'+newSmCol);
				
				_addSmColStyles(fieldContent,newSmCol);
			}
		},
		doRemove:function(widgetElem){
			var fieldGroup = widgetElem.parents('.field-group:first');
			var nextWidget = fieldGroup.next().find('.page-widget');
			if(nextWidget.length==0){
				nextWidget = fieldGroup.prev().find('.page-widget');
			}
			if(nextWidget.length==0){
				nextWidget = widgetElem.parents('.page-widget:first');
			}
			
			fieldGroup.find('.field-label').empty();
			return nextWidget;
		}
	});

	$.youi.widgetFactory.register($.extend({},_widgetObject,{//div组件注册
		name:'div',
		contentHtml:function(widgetOptions){
			var htmls = [];
			htmls.push('<div data-widget="true" class="pageditor-drop widget-drop col-sm-12"></div>');
			return htmls.join('');
		},
		setColumn:function(widgetElem,value){
			if(isNaN(value)){
				return;
			}
			var column = parseInt(value);
			
			if(column<0||column>12){
				column = 12;
			}
			
			for(var i=1;i<=12;i++){
				widgetElem.removeClass('col-sm-'+i);
			}
			widgetElem.addClass('col-sm-'+column);
		}
	})).register($.extend({},_widgetObject,{//span文本
		name:'span',
		styles:'widget-content',
		contentHtml:function(widgetOptions){
			return _buildEditableText('文本','content');
		}
	})).register($.extend({},_widgetObject,{//panel 组件注册
		name:'panel',
		contentHtml:function(widgetOptions){
			var htmls = [];
			htmls.push(_buildPanelPrefix(widgetOptions.caption,true));
			htmls.push(_buildPanelPostfix());
			return htmls.join('');
		}
	})).register($.extend({},_widgetObject,{//span文本
		name:'dialog',
		contentHtml:function(widgetOptions){
			var htmls = [];
			htmls.push(_buildPanelPrefix(widgetOptions.caption,true));
			htmls.push(_buildPanelPostfix());
			return htmls.join('');
		}
	})).register($.extend({},_widgetObject,{//子页面
		name:'subpage',
		idable:false,
		contentHtml:function(widgetOptions){
			var htmls = [];
			htmls.push(_buildEditableText(widgetOptions.caption||'页面名称'));
			htmls.push(_buildEditableText('/subpage.html','component_src'));
			htmls.push('<span title="打开子页面" data-command="pageditor" data-name="openSubpage" class="youi-icon glyphicon glyphicon-edit" aria-hidden="true"></span>');
			return htmls.join('');
		}
	})).register($.extend({},_widgetObject,{//子页面
		name:'func',
		idable:false,
		styles:'widget-content',
		options:{
			'component_name':'funcName'
		},
		contentHtml:function(widgetOptions){
			var htmls = [];
			htmls.push('<div class="func-comment">/**');
			htmls.push('<span class="func-comment-text" contenteditable="true"></span>');
			htmls.push('*/</div>');
			htmls.push('<div class="func-start col-sm-12"><span title="展开" href="#" data-command="'+_command+'" data-name="toggleFunc" class="youi-icon glyphicon glyphicon-triangle-right" aria-hidden="true"></span>function ');
			htmls.push(_buildEditableText(widgetOptions['component_name']||'funcName','component_name'));
			htmls.push('(');
			htmls.push('<b><span title="添加参数" href="#" data-command="'+_command+'" data-name="addFuncParam" class="youi-icon glyphicon glyphicon-plus" aria-hidden="true"></span>');
			htmls.push('</b>){ &nbsp;</div>');
			
			htmls.push('<div class="func-content col-sm-12"><textarea data-command="'+_command+'" data-name="editFunc" class="col-sm-12"></textarea></div>');
			htmls.push('<div class="func-end col-sm-12">}</div>');
			return htmls.join('');
		},
		
		setParams:function(widgetDoc,value){
			//alert(value);
		},
		
		setName:function(widgetDoc,value){
			$('[data-text="component_name"]',widgetDoc).text(value);
		}
	})).register($.extend({},_widgetObject,{//buttons 组件注册
		name:'buttons',
		styles:'btn-group btn-group-sm',
		contentHtml:function(widgetOptions){
			
			var buttons = [];
			
			for(var i=0;i<3;i++){
				buttons.push({
					widgetId:widgetOptions['widget-id']+'_btn_'+i,
					caption:'按钮'+i
				});
			}
			
			return _buildButtonContainer('',buttons);
		}
	})).register($.extend({},_widgetObject,{//button 组件注册
		name:'button',
		idable:false,
		styles:'btn-group btn-group-sm nopadding',
		contentHtml:function(widgetOptions){
			return _buildButton(widgetOptions);
		}
	})).register($.extend({},_widgetObject,{//form 组件注册
		name:'form',
		contextmenus:[{name:'beforeSubmit',caption:'beforeSubmit'},
		              {name:'afterSubmit',caption:'afterSubmit'}],
		contentHtml:function(widgetOptions){
			var htmls = [];
			htmls.push(_buildPanelPrefix(widgetOptions.caption||'表单标题',true));
			htmls.push(_buildPanelPostfix());
			return htmls.join('');
		}
	})).register($.extend({},_widgetObject,{//tree 组件注册
		name:'tree',
		contentHtml:function(widgetOptions){
			var htmls = [];
			var root = new TreeNode('tree_root',widgetOptions.caption||'根节点','root');
				
			root.addChild(new TreeNode('node_1','节点1'))
			  .addChild(new TreeNode('node_2','节点2'));
			
			return '<div class="youi-tree"><ul>'+root.toHtml(true,true)+'</ul></div>';
			
			return htmls.join('');
		}
	})).register($.extend({},_widgetObject,{//treeNode 组件注册
		name:'treeNode',
		contentHtml:function(widgetOptions){
			return new TreeNode(widgetOptions['widget-id'],'节点').toHtml(true,true);
		}
	})).register($.extend({},_widgetObject,{//tabs 组件注册
		name:'tabs',
		contentHtml:function(widgetOptions){
			var navHtmls = [];
			var contentHtmls = [];
			var widgetId = widgetOptions['widget-id'];
			navHtmls.push('<ul data-tab-item="true" id="'+widgetId+'" class="nav nav-tabs youi-tabs youi-bg ">');
			contentHtmls.push('<div class="tab-content">');
			
			for(var i=0;i<3;i++){
				var tabId = widgetId+'_tabItem'+i;
				navHtmls.push(_buildTabItem({name:tabId,caption:'标签'+i},i==0));
				contentHtmls.push(_buildTabPane({
					tabId:tabId
				},i==0));
			}
			
			navHtmls.push('</ul>');
			contentHtmls.push('</div>');
			
			return navHtmls.join('')+contentHtmls.join('');
		}
	})).register($.extend({},_widgetObject,{//tabItem 组件注册
		name:'tabItem',
		contentHtml:function(widgetOptions){
			return _buildTabItem({name:widgetOptions['widget-id'],caption:widgetOptions.caption});
		},
		doRemove:function(widgetElem){
			var widgetId = widgetElem.data('widgetId');
			
			var tabHeader = widgetElem.parent().prev().find('#'+widgetId);
			
			var nextHeader = tabHeader.next();
			if(!nextHeader.length){
				nextHeader = tabHeader.prev();
			}
			
			if(nextHeader.length){
				nextHeader.find('>a').tab('show');
			}
			
			tabHeader.remove();
		}
	})).register($.extend({},_widgetObject,{
		name:'grid',
		contextmenus:[{name:'beforeSubmit',caption:'beforeSubmit'},
		              {name:'afterParse',caption:'afterParse'}],
		textProperties:'caption component_submit component_reset component_add component_edit component_remove'.split(' '),
		setTextValue:function(widgetElem,property,value){
			_setTextValue(widgetElem,property,value);
		},
		setPanel:function(widgetElem,value){
			if(value=='true'){
				widgetElem.find('.panel-heading:first').removeClass('hide');
			}else{
				widgetElem.find('.panel-heading:first').addClass('hide');
			}
		},
		contentHtml:function(widgetOptions){
			var htmls = [];
			
			if(widgetOptions.panel!=false){
				htmls.push(_buildPanelPrefix(widgetOptions.caption||'列表标题'));
			}
			
			htmls.push(_buildInnerFieldLayout(widgetOptions));
			
			htmls.push('<div class="grid-toolbar col-sm-12">');
			//查询按钮组
			htmls.push(_buildButtons([{name:'submit',caption:'查询',textProperty:'component_submit'},{name:'reset',caption:'重置',textProperty:'component_reset'}],'left'));
			//功能按钮组
			//var gridButtons = [];
			
			htmls.push(_buildButtonContainer('right'));
			if(widgetOptions.remove!='NOT'){
				htmls.push(_buildButtons([{name:'remove',caption:'删除',textProperty:'component_remove'}],'right'));
				htmls.push(_buildButtonContainer('right'));
			}

			if(widgetOptions.edit!='NOT'){
				htmls.push(_buildButtons([{name:'edit',caption:'修改',textProperty:'component_edit'}],'right'));
				htmls.push(_buildButtonContainer('right'));
			}
			
			if(widgetOptions.add!='NOT'){
				htmls.push(_buildButtons([{name:'add',caption:'新增',textProperty:'component_add'}],'right'));
				htmls.push(_buildButtonContainer('right'));
			}
			
			htmls.push('</div>');
			
			//列
			htmls.push('<div data-grid-col="true" class="grid-content col-sm-12 pageditor-drop">');
			var cols = 4,colWidth = 100/cols+'%';
			for(var i=0;i<cols;i++){
				htmls.push(_buildGridCol({
					width:colWidth,
					id:widgetOptions['widget-id']+'_col_'+i,
					caption:'列'+(i+1)
				}));
			}
			
			if(widgetOptions.panel!=false){
				htmls.push(_buildPanelPostfix());
			}
			htmls.push('</div>');
			
			
			return htmls.join('');
		}
	})).register($.extend({},_widgetObject,{
		name:'gridCol',
		widthable:true,
		idable:false,
		contentHtml:function(widgetOptions){
			return _buildGridCol({
				id:widgetOptions['widget-id'],
				caption:'列',
				width:'20%'
			});
		},
		setProperty:function(widgetElem,value){
			widgetElem.attr('title',value);
		},
		
		setWidth:function(widgetElem,value){
			var width,
				gridContent = widgetElem.parent(),
				contentWidth = gridContent.width();
			
			if((value+'').indexOf('%')!=-1){
				width = parseInt(value)/100*contentWidth;
			}else{
				width = parseInt(value);
			}
			
//			var orgWidth = widgetElem.width();
//			var deltWidth = width - orgWidth;
			
			var percent = Math.floor(width/contentWidth*10000)/100;
			widgetElem.attr('style','width:'+percent+'%');
			
//			if(deltWidth>0){
			//重新计算所有宽度
			_refreshColsWidth(gridContent);
//			}
		}
	})).register($.extend({},_widgetObject,{
		name:'fieldLayout',
		styles:'youi-fieldLayout',
		contentHtml:function(widgetOptions){
			var htmls = [];
			//
			htmls.push(_buildFieldLayoutContent(2,widgetOptions.fields,widgetOptions.prefix));
			return htmls.join('');
		},
		setColumns:function(widgetElem,value){//设置布局列数  支持1,2,3,4,6
			var columns = parseInt(value);
			var itemColumn = 12/value;//每一个field占位元素
			$('>.field-group',widgetElem).each(function(index){
				var fieldWidget = $('.page-widget:first',this);
				var colspan = 1;
				if(fieldWidget.length){
					colspan = fieldWidget.data('field_column')||1;
				}
				var itemCols = itemColumn*parseInt(colspan);
				_addSmColStyles(this,itemCols);
			});
		}
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldText'
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldSelect',
		contentHtml:function(widgetOptions){
			return '<div class="form-control"><span class="glyphicon glyphicon-chevron-down select-down form-control-feedback" aria-hidden="true"></span></div>';
		}
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldCalendar',
		contentHtml:function(widgetOptions){
			return '<div class="form-control"><span class="glyphicon glyphicon-calendar select-calendar form-control-feedback" aria-hidden="true"></span></div>';
		}
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldLabel'
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldArea',
		setHeight:function(widgetElem,height){
			widgetElem.find('>.form-control').height(height);
		}
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldPassword'
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldRadioGroup',
		dropStyles:['option'],
		contentHtml:function(widgetOptions){
			var htmls = [];
			//选项一
			for(var i=0;i<3;i++){
				htmls.push(_buildOption({
					fieldId:widgetOptions['widget-id'],
					widgetId:widgetOptions['widget-id']+'_item_'+i,
					caption:'选项'+i
				}));
			}
			return htmls.join('');
		}
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldCheckboxGroup',
		dropStyles:['option'],
		contentHtml:function(widgetOptions){
			var htmls = [];
			//选项一
			for(var i=0;i<3;i++){
				htmls.push(_buildOption({
					widgetId:widgetOptions['widget-id']+'_item_'+i,
					caption:'选项'+i
				}));
			}
			return htmls.join('');
		}
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldSwfupload'
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldGrid'
	})).register($.extend({},_fieldWidgetObject,{
		name:'fieldTree',
		contentHtml:function(widgetOptions){
			return '<div class="form-control" title="下拉树"><span class="glyphicon glyphicon-chevron-down select-down form-control-feedback" aria-hidden="true"></span></div>';
		}
	})).register($.extend({},_widgetObject,{
		name:'fieldOption',
		contentHtml:function(widgetOptions){
			return _buildOption({
				widgetId:widgetOptions['widget-id'],
				caption:'选项'
			});
		}
	})).register($.extend({},_widgetObject,{
		name:'varPageId',
		contentHtml:function(widgetOptions){
			return 'pageId';
		}
	})).register($.extend({},_widgetObject,{
		name:'varI18ns',
		contentHtml:function(widgetOptions){
			return "i18ns['']";
		}
	})).register($.extend({},_widgetObject,{
		name:'funcElem',
		contentHtml:function(widgetOptions){
			return "var element = $elem('#id',pageId);";
		}
	})).register($.extend({},_widgetObject,{
		name:'funcBody',
		contentHtml:function(widgetOptions){
			return widgetOptions.content||'';
		}
	}));
	
	//
	function _buildOption(options){
		var htmls = [];
		htmls.push('<div data-drop-styles="option" ');
		htmls.push(_buildWidgetCommonData($.extend({},options,{widgetName:'fieldOption'})));
		htmls.push(' class="option-item page-widget pull-left"><span class="glyphicon youi-icon option-icon"></span>');
		htmls.push(_buildEditableText(options.caption));
		htmls.push('</div>');
		return htmls.join('');
	}
	
	function _buildWidgetCommonData(options){
		var htmls = [];
		htmls.push(' data-widget-id="'+options.widgetId+'"');
		htmls.push(' data-widget-name="'+options.widgetName+'"');
		htmls.push(' data-caption="'+options.caption+'" ');
		return htmls.join('');
	}
	
	function _addSmColStyles(smDoc,smCols){
		var elem = $(smDoc);
		smCols = Math.min(12,smCols);
		for(var i=1;i<=12;i++){
			elem.removeClass('col-sm-'+i);
		}
		elem.addClass('col-sm-'+smCols);
	}
	/**
	 * 
	 */
	function _setTextValue(widgetElem,property,value){
		widgetElem.find('a[data-text="'+property+'"]:first').text(value);
	}
	/**
	 * 创建按钮接收容器
	 * @param align
	 * @returns {String}
	 */
	function _buildButtonContainer(align,buttons){
		var htmls = [];
		htmls.push('<div data-button="true" title="此处可放置按钮" class="pageditor-drop button-drop pull-'+align+'">');
		
		if($.isArray(buttons)){
			for(var i=0;i<buttons.length;i++){
				htmls.push(_buildWidgetButton(buttons[i]));
			}
		}
		htmls.push('</div>');
		return htmls.join('');
	}
	/**
	 * 
	 */
	function  _buildButtons(buttons,align){
		var htmls = [],
			align = align||'';
		
		htmls.push('<div class="btn-group btn-group-sm pull-'+align+'">');
		for(var i=0;i<buttons.length;i++){
			htmls.push(_buildButton(buttons[i]));
		}
		htmls.push('</div>');
		
		return htmls.join('');
	}
	
	/**
	 * 生成按钮HTML
	 */
	function _buildButton(button){
		var htmls = [];
		htmls.push('<button class="btn btn-default">');
		htmls.push(_buildEditableText((button.caption||'按钮'),button.textProperty));
		htmls.push('</button>');
		return htmls.join('');
	}
	
	function _buildWidgetButton(button){
		var htmls = [];
		
		htmls.push('<div class="page-widget widget-button btn-group btn-group-sm nopadding" title="button" ');
		htmls.push(_buildWidgetCommonData($.extend({},button,{widgetName:'button'})));
		htmls.push(' data-drop-styles="button" data-caption="按钮">');
		htmls.push(_buildButton(button));
		htmls.push('</div>');
		
		return htmls.join('');
	}
	/**
	 * 生成标签头
	 */
	function _buildTabItem(options,active){
		var htmls = [];
		//click-skip
		htmls.push('<li id="'+options.name+'" class="nopadding'+(active==true?' active':''));
		htmls.push('" ><a contenteditable="true" data-text="caption" aria-expanded="'+(active==true)+'" ');
		htmls.push(' href="#'+options.name+'_panel" data-toggle="tab" class="click-skip text-editor">'+(options.caption||'标签')+'</a></li>');
		
		return htmls.join('');
	}
	/**
	 * 生成标签内容页
	 */
	function _buildTabPane(options,active){
		return '<div data-widget-name="tabItem" data-widget-id="'+options.tabId+'" data-widget="true" id="'+options.tabId+'_panel" class="tab-pane page-widget col-sm-12 pageditor-drop'+(active==true?' active':'')+'"></div>'
	}
	
	/**
	 * 生成列表列HTML
	 */
	function _buildGridCol(col){
		var htmls = [];
		htmls.push('<div style="width:'+col.width+';" data-drop-styles="grid-col" class="page-widget grid-col widthable col-sm-1" ');
		
		htmls.push(' data-component_width="'+col.width+'" data-widget-id="'+col.id+'" data-widget-name="gridCol" ');
		htmls.push(' data-caption="'+col.caption+'" ');
		
		htmls.push('>');
		htmls.push(_buildEditableText(col.caption));
		
		htmls.push('<div class="col-resize-helper pull-right"></div>');
		htmls.push('</div>');
		return htmls.join('');
	}
	/**
	 * 
	 */
	function _buildEditableText(caption,property,group){
		property = property||'caption';
		return '<a class="text-editor" data-group="'+(group==true?true:false)+'" data-text="'+property+'" contenteditable="true" href="#">'+_fixText(caption,'标题')+'</a>';
	}
	
	//_buildFieldLabel+"："
	
	function _buildFieldLabel(caption){
		return '<a class="field-label-editor" contenteditable="true" href="#">'+_fixText(caption,'')+'</a>：';
	}
	/**
	 * 文本显示修正
	 */
	function _fixText(value,defaultValue){
		return value||defaultValue||'';
	}
	/**
	 * 
	 */
	function _buildPanelPrefix(caption,canDrop){
		var htmls = [];
		htmls.push('<div class="youi-panel panel panel-default"><div class="panel-heading">');
		htmls.push(	'<h4 class="panel-title">');
		htmls.push(		_buildEditableText(caption));
		htmls.push(	'</h4>');
		htmls.push('</div>');
		htmls.push('<div '+(canDrop==true?' data-widget="true" ':'')+' class="panel-body'+(canDrop==true?' pageditor-drop':'')+'">');
		
		return htmls.join('');
	}
	/**
	 * 
	 */
	function _buildPanelPostfix(){
		return '</div></div>';
	}
	/**
	 * 
	 */
	function _buildInnerFieldLayout(options){
		var htmls = [];
		//添加fieldLayout
		var fieldLayoutId = 'fieldLayout_'+options['widget-id'];
		htmls.push('<div title="此处可以放置fieldLayout组件" data-field-layout="true" class="pageditor-drop fieldLayout-drop col-sm-12">'),
		htmls.push('<div data-drop-styles="widget,field-layout" data-widget-id="'+fieldLayoutId+'" data-widget-name="fieldLayout" title="'+fieldLayoutId+'" id="'+fieldLayoutId+'" class="page-widget youi-fieldLayout col-sm-12">');
		htmls.push(_buildFieldLayoutContent(2,options.fields,options.prefix));
		htmls.push('</div></div>');
		return htmls.join('');
	}
	/**
	 * 
	 */
	function _buildFieldLayoutContent(columns,fields,prefix){
		var htmls = [];
		
		//
		var smCol = 12/parseInt(columns);//columns 允许为 1,2,3,4,6
		
		for(var i=0;i<columns;i++){
			htmls.push('<div data-field="true" class="field-group pageditor-drop col-sm-'+smCol+' label-100">');
			htmls.push(		'<div class="field-label"> </div>');
			htmls.push(		'<div class="field-content col-sm-12"> </div>');
			htmls.push('</div>');
		}
		
		return htmls.join('');
	}
	
	function _refreshColsWidth(gridContent){
		var width = gridContent.innerWidth();
		//
		var sumColWidth = 0;
		var colWidths = [];
		gridContent.find('>.grid-col').each(function(index){
			colWidths[index] = $(this).outerWidth();
			sumColWidth += colWidths[index];
		});
		
		if(sumColWidth>width){
			gridContent.find('>.grid-col').each(function(index){
				var precent = parseInt(colWidths[index]/sumColWidth*10000)/100+'%';
				$(this).data('component_width',precent).attr('style','width:'+precent+';');
				
			});
		}
	}

})(jQuery);