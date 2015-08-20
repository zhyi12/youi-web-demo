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
	
	$.widget("youi.accordion",$.youi.abstractWidget,$.extend({},$.youi.dragSupport,{
		/**
		 * 默认参数
		 */
		options:{
			bindResize:true,
			distance: 1,
			delay:100,
			dropStyle:'widget'
		},
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			this.groups = this.options.groups||[];
		},
		/**
		 * 接口方法，初始化widget组件
		 */
		_initWidget:function(){
			this.element.addClass('panel-group').attr('role','tablist').attr('aria-multiselectable',true);
			this.options.container = this.options.container||$('body',document);
			//
			this.element.find('.'+this.widgetName+'-tree').tree({
				
			});
			
			this.resize();
			
			this._mouseInit();
		},
		
		/**
		 * 接口方法，填充html元素
		 */
		_defaultHtmls:function(){
			var htmls = [];
			
			for(var i=0;i<this.groups.length;i++){
				var group = this.groups[i];
				var groupId = this.options.id+'_'+group.name;
				var groupPanelId = this.options.id+'_panel_'+group.name;
				htmls.push('<div class="panel panel-default">');
				htmls.push(	'<div class="panel-heading" role="tab" id="'+groupId+'">');
				htmls.push(		'<h4 class="panel-title">');
				htmls.push(			'<a data-toggle="collapse" data-parent="#'+this.options.id+'" href="#'+groupPanelId+'" aria-expanded="true" aria-controls="collapseOne">');
				htmls.push(				group.caption);
				htmls.push(			'</a>');
				htmls.push(		'</h4>');
				htmls.push(	'</div>');
				htmls.push(	'<div id="'+groupPanelId+'" class="collapse '+(i==0?' in':'')+'" role="tabpanel" aria-labelledby="'+groupId+'">');
				htmls.push(		'<div class="panel-body">');
				
				if($.isArray(group.items)){
					for(var j=0;j<group.items.length;j++){
						htmls.push(this._buildItemHtml(group.items[j]));
					}
				}else if($.isFunction(group.contentHtml)){
					htmls.push(group.contentHtml(groupId));
				}
				
				if(group.tree){
					htmls.push(this._buildTreeHtml(group.tree));
				}
				
				htmls.push(		'</div>');
				htmls.push(	'</div>');
				htmls.push('</div>');
				
				group = null;
			}
			
			this.element.append(htmls.join(''));
		},
		
		_buildItemHtml:function(item){
			var  htmls = [];
			htmls.push('<div data-name="'+item.name+'" class="accordion-item col-sm-6"');
			if($.isArray(item.dropStyles)){
				htmls.push(' data-drop-styles='+item.dropStyles+' ');
			}
			if(item.widgetType){
				htmls.push(' data-widget-type='+item.widgetType+' ');
			}
			htmls.push(	'><span class="youi-icon '+item.name+'"></span>');
			htmls.push(item.caption);
			htmls.push('</div>');
			return htmls.join('');
		},
		/**
		 * 
		 */
		_buildTreeHtml:function(tree){
			var htmls = [];
			
			htmls.push('<div class="'+this.widgetName+'-tree col-sm-12"><ul>');
			
			var root = new AcdTreeNode(tree.name,tree.caption,'root');
			
			this._addTreeNodeChild(root,tree.children);
			
			htmls.push(root.toHtml(true));
			htmls.push('</ul></div>');
			
			return htmls.join('');
		},
		/**
		 * 
		 */
		_addTreeNodeChild:function(acdTreeNode,children){
			if(children.length){
				for(var i=0;i<children.length;i++){
					var item = children[i];
					var itemTreeNode = new AcdTreeNode(item.name,item.caption||item.name);
					if(item.content){
						itemTreeNode.group = 'func';
						itemTreeNode.content = item.content;
						itemTreeNode.tooltips = item.tooltips;
					}
					acdTreeNode.addChild(itemTreeNode);
					if($.isArray(item.children)){
						this._addTreeNodeChild(itemTreeNode,item.children);
					}
				}
			}
		},
		/**
		 * 接口方法，初始化组件动作
		 */
		_initAction:function(){
			this.element.delegate('>.panel>.collapse','show.bs.collapse',function(event){
				$(event.delegateTarget).accordion('fixBodyHeight',this);
				event.stopPropagation();
			});
			
			this.element.delegate('>.panel>.collapse','shown.bs.collapse',function(event){
				$('[data-accordion-api="true"]',this).trigger('accordion.panel.shown',event,{panelDoc:this});
				event.stopPropagation();
			});
		},
		
		fixBodyHeight:function(pDom){
			$('>.panel-body',pDom).height(this._computeBodyHeight());
		},
		
		_computeBodyHeight:function(){
			var pHeight = this.element.offsetParent().innerHeight();
			var margin = 30;
			var oHeight = 0;
			this.element.find('>.panel>.panel-heading').each(function(){
				oHeight+=($(this).outerHeight()+10);
			});
			return pHeight - oHeight - margin;//margin
		},
		
		/**
		 * 鼠标拖动开始
		 */
		_mouseStart: function(event) {
			//span-item 元素可以拖动
			var elem = $(event.target);
			if(elem.hasClass('accordion-item')){
				//拖动开始
				this.currentDrag = elem;
				this.helper = this._createHelper(event,this.currentDrag);
			}
		},
		
		/**
		 * 鼠标拖动过程
		 */
		_mouseDrag: function(event) {
			if(this.currentDrag){
				if(this.helper){
					this.position = this._generatePosition(event,this.currentDrag);
					this.helper.css(this.position);
				}
				
				var dropStyles = [];
				
				//从拖动的元素上取接收的样式
				var dragDropStyles = this.currentDrag.data('dropStyles');
				if(dragDropStyles){
					dropStyles = dragDropStyles.split(',');
				}else{
					var dropStyle;
					if($.isFunction(this.options.dropStyle)){
						dropStyle = this.options.dropStyle(this.currentDrag);
					}else{
						dropStyle = this.options.dropStyle;
					}
					dropStyles.push(dropStyle);
				}
				
				var canDrop = false;
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
				this.currentDrop.trigger('drop.stop',ui);
				this._dropOut();
			}
			this.helper&&this.helper.remove();
			this.currentDrag = null;
			this.currentDrop = null;
			this.helper = null;
			this.position = null;
		},
		/**
		 * 接口方法，重定位
		 */
		_resize:function(){
			this.element.find('>.panel>.collapse.in>.panel-body').height(this._computeBodyHeight());
		},
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			this.groups = null;
		}
	}));
	
	
	var AcdTreeNode = function(id,text,group){
		this.children = [];
		this.id = id;
		this.text =text;
		this.content = null;
		this.tooltips = null;
		this.group = group;
	};
	
	$.extend(AcdTreeNode.prototype,{
		addChild:function(child){
			child.children=[];
			this.children.push(child);
			return this;
		},
		toHtml:function(last){
			var htmls = [];
			var childCount = this.children.length;
			
			var styles = [];
			
			if(last)styles.push('last');
			
			if(childCount>0){
				styles.push('expandable');
			}
			
			styles.push(this.group);
			
			htmls.push('<li ');
			htmls.push(' class="treeNode '+styles.join(' ')+'"');
			htmls.push(' id="'+this.id+'" ');
			htmls.push('>');
			
			if(childCount>0){
				htmls.push('<div class="tree-trigger"></div>');
			}
			
			htmls.push('<span class="tree-span '+styles.join(' ')+'" >');
			
			htmls.push('<a title="'+(this.tooltips||this.text)+'" ');
			
			if(this.group=='func'){
				htmls.push('data-drop-styles="func-body" ');
				htmls.push('data-widget-type="funcBody" ');
				htmls.push('data-content="'+this.content+'" ');
				htmls.push('data-name="funcBody" ');
				
				styles.push('accordion-item');
			}
			
			htmls.push(' class="tree-a '+styles.join(' ')+'" href="#" >');
			htmls.push(this.text);
			htmls.push('</a></span>');
			if(childCount>0){
				htmls.push('<ul style="display:none;">');
				for(var i=0;i<childCount;i++){
					htmls.push(this.children[i].toHtml(childCount==i+1));
				}
				htmls.push('</ul>');
			}
			htmls.push('</li>');
			return htmls.join('');
		}
	});
})(jQuery);