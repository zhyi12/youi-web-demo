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
	
	var _WIDGET_TYPE_FIELD = 'field',
		_WIDGET_TYPE_TREENODE = 'treeNode',
		_WIDGET_TYPE_BUTTON = 'button',
		_WIDGET_TYPE_TABITEM = 'tabItem',
		_WIDGET_TYPE_GRIDCOL='gridCol',
		_WIDGET_TYPE_OPTION= 'option',
		_WIDGET_TYPE_SUBPAGE='subpage',
		_WIDGET_TYPE_FUNC='func',
		_WIDGET_TYPE_FUNC_BODY='funcBody';
	
	$.widget("youi.pagedesigner",$.youi.shell,$.extend({},{
		/**
		 * 默认参数
		 */
		options:{
			contentWidget:'pageditor'
		},
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			var _widgetName = this.widgetName;
			if(this.options.propertytableOptions){
				$.extend(this.options.propertytableOptions,{
					defaultGroups:['widget'],
					change:function(event,ui){
						$(this).parents('.youi-'+_widgetName+':first')[_widgetName]('propertytableValueChanged',ui);
					}
				}); 
			}
			//工具栏
			this.options.toolbarOptions = $.extend({},this.options.toolbarOptions,{
				items:[{name:'save',caption:'保存'},
				       {name:'open',caption:'打开'},
				       {name:'remove',caption:'删除'},
				       {name:'viewSource',caption:'源码'},
				       {name:'run',caption:'运行'}]
			}); 
			//左边面板栏
			this.options.accordionOptions = $.extend({},this.options.accordionOptions,{
				groups:[{
					name:'componentWidget',
					caption:'页面组件',
					items:[{name:'grid',caption:'列表'},
					       {name:'gridCol',caption:'列表列',widgetType:_WIDGET_TYPE_GRIDCOL,dropStyles:['grid-col']},
					       
					       {name:'form',caption:'表单'},
					       {name:'subpage',caption:'子页面',widgetType:_WIDGET_TYPE_SUBPAGE,dropStyles:['subpage']},
					       
					       {name:'tree',caption:'树组件'},
					       {name:'treeNode',caption:'树节点',widgetType:_WIDGET_TYPE_TREENODE,dropStyles:['tree-node']},
					       {name:'buttons',caption:'按钮组'},
					       {name:'button',caption:'按钮',widgetType:_WIDGET_TYPE_BUTTON,dropStyles:['button']},
					       {name:'tabs',caption:'标签页'},
					       {name:'tabItem',caption:'标签项',widgetType:_WIDGET_TYPE_TABITEM,dropStyles:['tab-item']},
					       {name:'dialog',caption:'弹出框'}
					       
					]
				},{
					name:'formWidget',
					caption:'表单组件',
					items:[
					       {name:'fieldLayout',caption:'表单布局',dropStyles:['widget','field-layout']},
					       {name:'fieldText',caption:'文本框',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldSelect',caption:'下拉框',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldCalendar',caption:'日历框',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldLabel',caption:'显示框',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldPassword',caption:'密码框',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldArea',caption:'文本域',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldHidden',caption:'隐藏域',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldCheckboxGroup',caption:'复选组',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldRadioGroup',caption:'单选组',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldOption',caption:'选项',widgetType:_WIDGET_TYPE_OPTION,dropStyles:['option']},
					       {name:'fieldGrid',caption:'列表选择',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldTree',caption:'树选择',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldMultiupload',caption:'上传框',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldSwfupload',caption:'Swfupload',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']},
					       {name:'fieldForm',caption:'弹出表单',widgetType:_WIDGET_TYPE_FIELD,dropStyles:['field']}
					]
				},{
					name:'layoutWidget',caption:'布局组件',items:[{name:'div',caption:'栅格'},{name:'panel',caption:'panel'}]
				},{
					name:'funcWidget',caption:'页面函数',
					items:[
					    {name:'func',caption:'函数',widgetType:_WIDGET_TYPE_FUNC,dropStyles:['func']},
					    {name:'varPageId',caption:'pageId变量',widgetType:_WIDGET_TYPE_FUNC_BODY,dropStyles:['func-body']},
					    {name:'varI18ns',caption:'i18n变量',widgetType:_WIDGET_TYPE_FUNC_BODY,dropStyles:['func-body']},
					    {name:'funcElem',caption:'元素函数',widgetType:_WIDGET_TYPE_FUNC_BODY,dropStyles:['func-body']}
					],
					tree:{
						name:'pubFuncs',
						caption:'函数',
						children:[
						    {
						    	name:'stringFuncs',
						    	caption:'字符函数',
						    	children:[
						    	     {name:'trim',tooltips:'去空格',content:"$.trim(str)"},
						    	     {name:'indexOf',tooltips:'字符位置',content:"str.indexOf(searchValue,fromIndex)"},
						    	     {name:'lastIndexOf',tooltips:'取最后出现的字符位置',content:"str.lastIndexOf(searchValue,fromIndex)"},
						    	     {name:'substring',tooltips:'按开始结束截取字符',content:"str.substr(start,end)"},
						    	     {name:'substr',tooltips:'按长度截取字符',content:"str.substring(start,len)"},
						    	     {name:'slice',tooltips:'根据偏移量截取字符，offset为负数表示往前截取 ',content:"str.slice(start,offset)"}
						    	]
						    },
						    {
						    	name:'gridFuncs',
						    	caption:'列表组件函数',
						    	children:[
						    	     {name:'refresh',tooltips:'刷新列表',content:"gridElem.grid('refresh')"},
						    	     {name:'getSelectedRecord',tooltips:'获取选择记录',content:"gridElem.grid('getSelectedRecord')"}
						    	    
						    	]
						    },
						    {
						    	name:'treeFuncs',
						    	caption:'树组件函数',
						    	children:[
						    	     {name:'getSelected',tooltips:'获取选择节点',content:"treeElem.grid('getSelected')"}
						    	]
						    },
						    {
						    	name:'widgetFuncs',
						    	caption:'组件辅助函数',
						    	children:[
						    	     {name:'messageUtils.showMessage',tooltips:'消息框',content:"$.youi.messageUtils.showMessage(message)"},
						    	     {name:'messageUtils.showError',tooltips:'错误框',content:"$.youi.messageUtils.showError(errMsg)"},
						    	     {name:'messageUtils.confirm',tooltips:'确认框',content:"$.youi.messageUtils.confirm(message,confirmFunc)"},
						    	     {name:'ajaxUtil.ajax',tooltips:'ajax调用',content:"$.youi.ajaxUtil.ajax({\n    url:'',\n    success:function(result){\n}})"},
						    	     {name:'widgetUtils.funcApply',tooltips:'组件全局回调函数',content:"$.youi.widgetUtils.funcApply(widgetDom,funcName)"},
						    	     {name:'widgetUtils.triggerResize',tooltips:'触发组件resize函数',content:"$.youi.widgetUtils.triggerResize(container,forceResize)"},
						    	     {name:'htmlUtils.buildIconHtml',tooltips:'生成icon格式HTML字符',content:"$.youi.htmlUtils.buildIconHtml(name,command)"},
						    	     {name:'formatUtils.from',tooltips:'格式化',content:"$.youi.formatUtils.from(value, defaultValue)"},
						    	     {name:'formatUtils.usMoney',tooltips:'美元格式',content:"$.youi.formatUtils.usMoney(value)"},
						    	     {name:'formatUtils.cnMoney',tooltips:'人民币格式',content:"$.youi.formatUtils.cnMoney(value)"},
						    	     {name:'formatUtils.number',tooltips:'格式化数字',content:"$.youi.formatUtils.number(v, formatString)"},
						    	     {name:'pageUtils.loadPage',tooltips:'加载页面',content:"$.youi.pageUtils.loadPage(container,pageUrl,after,params)"},
						    	     {name:'pageUtils.goPage',tooltips:'页面跳转,options.type为dialog时打开subpage，为window打开新窗口',content:"$.youi.pageUtils.goPage(container,pageUrl,after,params)"},
						    	     {name:'pageUtils.doPageFunc',tooltips:'调用全局函数',content:"$.youi.pageUtils.doPageFunc(funcName,pageId,pageDoc)"},
						    	     {name:'buttonUtils.createButton',tooltips:'生成按钮HTML',content:"$.youi.buttonUtils.createButton(button)"},
						    	     {name:'buttonUtils.createButtons',tooltips:'生成按钮组HTML',content:"$.youi.buttonUtils.createButtons(buttons,align,groupStyle)"},
						    	     {name:'popUtils.showPopBackground',tooltips:'显示弹出覆盖背景',content:"$.youi.popUtils.showPopBackground()"},
						    	     {name:'popUtils.hidePopBackground',tooltips:'隐藏弹出覆盖背景',content:"$.youi.popUtils.hidePopBackground()"}
						    	     
						    	]
						    }
						]
					}
				},{
					name:'htmlWidget',
					caption:'其他组件',
					items:[
					       {name:'menu',caption:'菜单'},
					       {name:'span',caption:'文本'}
					      
					]
				},{
					name:'pageTree',caption:'页面结构',contentHtml:function(groupId){
						//
						var htmls = [];
						htmls.push('<div data-accordion-api="true" class="pagedesigner-widget-tree changed" ><ul>');
						
						htmls.push('</div></ul>');
						return htmls.join('');
					}
				}]
			});
		},
		/**
		 * 中间组件的初始化参数
		 */
		_contentOptions:function(){
			var _widgetName = this.widgetName;
			return {
				initHtml:this.options.initHtml,
				select:function(event,ui){
					$(this).parents('.youi-'+_widgetName+':first')[_widgetName]('widgetSelectd',ui);
				},
				propertyChanged:function(event,ui){//属性值发生变化
					$(this).parents('.youi-'+_widgetName+':first')[_widgetName]('propertyChanged',ui);
				},
				changed:function(event,ui){//组件内容变化
					$(this).parents('.youi-'+_widgetName+':first')[_widgetName]('contentChanged',ui);
				}
			};
		},
		
		_initContent:function(){
			var _widgetName = this.widgetName;
			
			this.widgetTreeElem = this.element.find('.pagedesigner-widget-tree').tree({
				select:function(event,ui){
					$(this).parents('.youi-'+_widgetName+':first')[_widgetName]('pageTreeSelected',{
						id:this.getAttribute('id')
					});
				}
			});
			
			this._trigger('loadContent',null,{});
		},
		
		/**
		 * 接口方法，填充html元素
		 */
		_defaultHtmls:function(){
			
		},
		/**
		 * 接口方法，初始化组件动作
		 */
		_initAction:function(){
			this.element.delegate('[data-command="'+this._getWidgetCommand()+'"]','click',function(event){
				var datas = $.extend({},$(this).data(),{'ctrlKey':event.ctrlKey});
				//行内按钮执行
				var widgetElem = $(event.delegateTarget);
				widgetElem.pagedesigner('execCommand',this,datas);
				event.stopPropagation();
			});
			
			this.element.delegate('.pagedesigner-widget-tree','accordion.panel.shown',function(event,ui){
				_refreshPageTree($(event.delegateTarget),$(this));
				event.stopPropagation();
			});
		},
		/**
		 * 组件选择后动作
		 */
		widgetSelectd:function(widgetOptions){
			this._acvitePropertytable(widgetOptions);
			this._activePageTreeSelect(widgetOptions);
		},
		/**
		 * 树节点选择后操作
		 */
		pageTreeSelected:function(options){
			var widgetElem = $('[data-widget-id="'+options.id+'"]',this.editorWidget);
			if(widgetElem.length){
				this.editorWidget[this.options.contentWidget]('widgetSelect',widgetElem[0]);
			}
		},
		/**
		 * 显示属性表格
		 */
		_acvitePropertytable:function(widgetOptions){
			var activeGroups = ['widget','component'];
			if(widgetOptions.widgetType){
				activeGroups.push(widgetOptions.widgetType);
			}
			activeGroups.push(widgetOptions['widgetName']);
			
			var skipProps = [];
			if(widgetOptions.widthable!=true){
				skipProps.push('component_width');
			}
			//id
			if(widgetOptions.idable!=true){
				skipProps.push('component_id');
			}
			
			this.propertytableElem.propertytable('active',widgetOptions,activeGroups,skipProps);
		},
		/**
		 * 显示树选择
		 */
		_activePageTreeSelect:function(widgetOptions){
			if(this.widgetTreeElem.is(':visible')){
				 _selectedTreeNode(this.widgetTreeElem,widgetOptions.widgetId);
			}
		},
		
		_showDirty:function(){
			//显示变动
			this.toolbarElem.addClass('dirty');
		},
		/**
		 * 编辑器内组件属性变化同步显示到属性表格
		 */
		propertyChanged:function(ui){
			//TODO command
			this.propertytableElem.propertytable('setPropertyValue',ui.property,ui.value);
			//显示变动
			this._showDirty();
		},
		/**
		 * 编辑器内容发生了变化
		 */
		contentChanged:function(ui){
			this.widgetTreeElem.addClass('changed');
			//刷新树
			if(this.widgetTreeElem.is(':visible')){
				//重新加载树
				_refreshPageTree(this.element,this.widgetTreeElem);
			}
			this._showDirty();
		},
		
		/**
		 * 属性表格属性变化引起编辑器内变化
		 */
		propertytableValueChanged:function(ui){
			this.editorWidget[this.options.contentWidget]('setPropertyValue',ui.property,ui.value);
			
			//显示变动
			this._showDirty();
		},
		
		doSave:function(){
			//保存完成后调用
			this.toolbarElem.removeClass('dirty');
		},
		
		open:function(dom,ui){
			alert('open');
		},
		
		getEditorRecord:function(){
			return {
				content:this.editorWidget[this.options.contentWidget]('buildXml'),
				contentHtml:this.editorWidget[this.options.contentWidget]('buildHtml')	
			};
		},
		
		getWidgetTree:function(){
			return this.editorWidget[this.options.contentWidget]('toTree');
		},
		
		removeCommand:function(dom,ui){
			this.editorWidget[this.options.contentWidget]('removeSelected');
		},
		
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	}));
	
	function _refreshPageTree(pagedesignerElem,pageTreeElem){
		var widgetTree = pagedesignerElem.pagedesigner('getWidgetTree');
		
		if(pageTreeElem.hasClass('changed')){
			$('>ul',pageTreeElem).html(widgetTree.toHtml(true));
			pageTreeElem.removeClass('changed');
		}
		
		//选择树
		var widgetId = $('.page-widget.selected',pagedesignerElem).data('widgetId');
		if(widgetId){
			_selectedTreeNode(pageTreeElem,widgetId);
		}
	}
	
	function _selectedTreeNode(treeElem,treeNodeId){
		treeElem.find('.selected').removeClass('selected');
		var treeNode = treeElem.find('li.treeNode#'+treeNodeId);
		if(treeNode.length){
			treeNode.addClass('selected').find('>span>a').addClass('selected');
		}
	}
})(jQuery);