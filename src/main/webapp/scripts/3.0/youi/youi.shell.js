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
	
	$.widget("youi.shell",$.youi.abstractWidget,$.extend({},{
		/**
		 * 默认参数
		 */
		options:{
			bindResize:true
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
			this._initToolbar();
			this.resize();
			
			this._initResourceTree();
			
			if(this.options.contentWidget&&$.youi[this.options.contentWidget]){
				this.options[this.options.contentWidget+'Options'] = this._contentOptions();
				this.editorWidget = this._initCommonWidget(this.options.contentWidget);
			}
			
			
			this._initAccordion();
			this._initPropertytable();
			
			this._initContent();
		},
		
		_contentOptions:function(){
			return {};
		},
		
		_initResourceTree:function(){
			this.leftTreeElement = this._initCommonWidget('tree');
		},
		
		_initToolbar:function(){
			this.toolbarElem = this._initCommonWidget('toolbar');
		},
		
		_initAccordion:function(){
			this.accordionElem = this._initCommonWidget('accordion');
		},
		
		_initPropertytable:function(){
			this.propertytableElem = this._initCommonWidget('propertytable');
		},
		
		_initCommonWidget:function(widgetName){
			if(this.options[widgetName+'Options']){
				var widgetElem = this.element.find('>.comp-'+widgetName);
				widgetElem[widgetName]($.extend({},this.options[widgetName+'Options'],{commandWidget:this._getWidgetCommand()}));
				return widgetElem;
			}
			return null;
		},
		
		_getWidgetCommand:function(){
			return this.widgetName+"Command";
		},
		/**
		 * 
		 */
		_createContent:function(){
			
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
		
		_dispatchCommand:function(event,options){
			if(options&&options.name){
				if($.isFunction(this[options.name])){//优先调用当前设计器方法
					this[options.name](options);
				}else{//调用主组件中的方法
					this.editorWidget[this.options.contentWidget](options.name,options);
				}
			}
		},
		
		/**
		 * 接口方法，重定位
		 */
		_resize:function(){
			var winHeight = $(window).height();
			
			var contentHeight = 0;
			
			var shellTop = this.element.offset().top;
			
			var oHeight = 0;
			this.element.find('>div:visible').not('.layout-y').each(function(){
				oHeight+=$(this).outerHeight();
			});
			
			this.element.nextAll(':visible').each(function(){
				oHeight+=$(this).outerHeight();
			});
			
			this.element.find('>.layout-y').innerHeight(winHeight - shellTop - oHeight);
			
			//
			if(this.editorWidget){
				this.editorWidget[this.options.contentWidget]('resize');
			}
		},
		/**
		 * 创建树型结构
		 */
		_createModelTree:function(treeData){
			var root = new TreeNode('root','根节点','root');
			
			root.parseTreeData(treeData);
			
			return root;
		},
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	}));
	
	/**
	 * 树模型
	 */
	var TreeNode = function(id,text,group){
		this.id = id;
		this.text = text;
		this.group = group;
		
		this.children = [];
	};
	
	$.extend(TreeNode.prototype,{
		addChild:function(child){
			child.children=[];
			this.children.push(child);
			return this;
		},
		/**
		 * 树形结构数据解析
		 */
		parseTreeData:function(treeData,idProp,textProp){
			var children = treeData.children;
			delete treeData['children'];
			
			idProp = idProp||'id';
			textProp = textProp||'text';
			
			$.extend(this,treeData);
			
			if(children){
				//
				for(var i=0;i<children.length;i++){
					var data = children[i],
						id = data[idProp],
						text = $.trim(data[textProp])||id;
					
					if(id){
						var childNode = new TreeNode(id,text);
						this.addChild(childNode);
						childNode.parseTreeData(data);
					}
				}
			}
		},
		/**
		 * 生成树html
		 */
		toTreeHtml:function(isLast){
			var htmls = [''],
				styles = [''],
				treggerHtml = '',
				childCount = this.children.length;
			
			this.group&&styles.push(this.group);
			
			if(childCount>0&&this.expand==true){
				treggerHtml = ('<div class="tree-trigger"></div>');
				styles.push('expandable expanded');
			}
			
			if(isLast){
				styles.push('last');
			}
			//
			htmls.push('<li id="'+this.id+'" class="treeNode '+styles.join(' ')+'">');
			htmls.push(treggerHtml);
			htmls.push('<span class="tree-span'+styles.join(' ')+'" title="'+this.text+'">');
			htmls.push('<a class="tree-a'+styles.join(' ')+'" href="#">'+(this.text||this.id)+'</a></span>');
			
			htmls.push('<ul>');
			if(childCount){
				for(var i=0;i<childCount;i++){
					htmls.push(this.children[i].toTreeHtml(i==childCount-1));
				}
			}
			htmls.push('</ul>');
			htmls.push('</li>');
			return htmls.join('');
		}
	});
	
	
})(jQuery);