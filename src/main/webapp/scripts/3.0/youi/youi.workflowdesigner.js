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
	
	
	$.widget("youi.workflowdesigner",$.youi.shell,$.extend({},{
		/**
		 * 默认参数
		 */
		options:{
			contentWidget:'flow'
		},
		
		
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			
			var that = this;
			this.options.treeOptions = {
				select:function(){
					that.editorWidget.flow('select',this.getAttribute('id'));
				}
			};
			
			this.options.toolbarOptions = {
				items:[{name:'save',caption:'保存'},{name:'exportImage',caption:'导出图片',icon:'image'}],
				action:function(event,ui){
					var actionName = ui.name;
					that._dispatchCommand(event,ui);
				}
			};
			
			this.options.propertytableOptions = {
				propertyConverts:{},
				change:function(event,ui){
					that._propertyChange(event,ui);
				},
				propertyGroupDescs:{
					'base':{
						caption:'基本属性',
						propertyDescs:[
						     {name:'id',caption:'id',type:'fieldHidden',groups:['base']},
						     {name:'caption',caption:'名称',groups:['base']}
						]
					},'node':{
						caption:'节点属性',
						propertyDescs:[
						     {name:'service',caption:'后台服务',groups:['serviceTask']},
						     {name:'form',caption:'关联表单',groups:['start','userTask']}
						]
					},'transition':{
						caption:'表达式',
						propertyDescs:[
						     {name:'expression',caption:'条件表达式',groups:['transition']}
						]
					}
				}
			};
		},
		/**
		 * 刷新左边树
		 */
		_refreshModelTree:function(treeData){
			var treeNode = this._createModelTree(treeData);
			
			if(this.leftTreeElement){
				this.leftTreeElement.find('>ul').html(treeNode.toTreeHtml(true));
			}
		},
		/**
		 * 执行模型文本变化关联动作
		 */
		_updateByModelText:function(id,text){
			this.leftTreeElement.find('li#'+id+' >span>a').text(text);
			//
			this.editorWidget[this.options.contentWidget]('select',id);
		},
		/**
		 * 属性变化
		 */
		_propertyChange:function(event,options){
			this.editorWidget[this.options.contentWidget]('propertyChange',options);
		},
		/**
		 * 
		 */
		_selectModel:function(id,values,groups){
			//树选择显示
			var liElement = this.leftTreeElement.find('li#'+id);
			
			this.leftTreeElement.find('.selected').removeClass('selected');
			
			if(liElement.length){
				liElement
					.addClass('selected')
					.find('>span,>span>a').addClass('selected');
			}
			//active:function(values,groups,skipProps)
			//property显示
			this.propertytableElem.propertytable('active',values,['base'].concat(groups));
		},
		
		/**
		 * 中间组件的初始化参数
		 */
		_contentOptions:function(){
			
			var that = this;
			return {
				initHtml:this.options.initHtml,
				bindResize:true,
				afterTextChange:function(event,ui){//设置节点文本
					that._updateByModelText(ui.id,ui.text);
				},
				afterModelsChange:function(event,treeData){//设置节点文本
					that._refreshModelTree(treeData);
				},
				
				elementClick:function(event,ui){
					var id = ui.target.getAttribute('id');
					if(!id)return;
					//选择模型
					that._selectModel(id,$.extend({},$(ui.target).data(),{
						id:id,
						caption:$.trim($(ui.target).text())
					}),ui.target.className.split(' '));
				},
				overpanels:[
					{name:'addRefNode',subname:'endEvent',groups:['node'],excludes:['startEvent','endEvent'],caption:'添加End节点'},
					{name:'addRefNode',subname:'serviceTask',groups:['node'],excludes:['endEvent'],caption:'添加服务节点'},
					{name:'addRefNode',subname:'userTask',groups:['node'],excludes:['endEvent'],caption:'添加UserTask节点'},
					
					{name:'addRefNode',subname:'exclusiveGateway',groups:['node'],excludes:['endEvent'],caption:'增加分支节点'},
					{name:'addRefNode',subname:'parallelGateway',groups:['node'],excludes:['endEvent'],caption:'增加合并节点'},

					{name:'removeNode',groups:['node'],excludes:['startEvent'],caption:'删除'},
					{name:'startSequence',groups:['node'],excludes:['endEvent'],caption:'添加End节点'}
				]
			};
		},
		/**
		 * 
		 */
		_initContent:function(){
			
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
			
		},
		/**
		 * 保存工作流
		 */
		save:function(){
			var xml = this.editorWidget[this.options.contentWidget]('getXml');
			
			alert(xml);
		},
		
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	}));
	
})(jQuery);