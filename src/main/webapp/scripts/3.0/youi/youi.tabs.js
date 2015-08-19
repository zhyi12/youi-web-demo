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
	
	$.widget("youi.tabs",$.youi.abstractWidget,$.extend({},{
		/**
		 * 默认参数
		 */
		options:{
			
		},
		/**
		 * 接口方法，初始化变量模型
		 */
		_initModel:function(){
			this.tabs = {};
		},
		/**
		 * 接口方法，初始化widget组件
		 */
		_initWidget:function(){
			var prev = this.element.prev();
			if(prev.hasClass('tab-content')){
				prev.insertAfter(this.element);
			}
			this.tabsContent = this.element.next();
			if(this.options.itemHeight){
				this.tabsContent.height(this.options.itemHeight);
			}
			
			var firstTab = this.element.find('.tabs-item:first');
			if(firstTab.length){
				this.selectTab(firstTab.attr('id'));
				
				this.triggerResize($('a',firstTab).attr('href'));
			}
			
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
			this.element.delegate('span.tab-close','click',function(event){
				$(event.delegateTarget).tabs('closeTab',this.parentNode.parentNode.getAttribute('id'));
				return false;
			});
			
			//
			this.element.delegate('>li>a','show.bs.tab',function(event){
				$(event.delegateTarget).tabs('afterShowTab',$(this).parent());
			});
			
		},
		
		fixShowTab:function(tabId){
			var oldActiveItem = this.element.find('>li.active:first');
			if(oldActiveItem.length==0){
				oldActiveItem = this.element.find('>li:first');
			}
			
			var tabItem = this.selectTab(tabId);
			//调整位置
			if(oldActiveItem.length){
				oldActiveItem.before(tabItem);
			}
		},
		
		afterShowTab:function(item){
			var href = item.find('>a').attr('href'),
				panel = this.tabsContent.find(href),
				tabId = item.attr('id');
			
			if(!panel.hasClass('resized')){
				panel.addClass('active');
				$.youi.widgetUtils.triggerResize(panel);
				panel.addClass('resized');
			}
			
			if(!panel.hasClass('loaded')){
				var itemSrc = item.data('src');
				if(!itemSrc){
					itemSrc = this.options.itemSrc;
				}
				
				if(itemSrc){
					var src = $.youi.parameterUtils.connectParameter(itemSrc.replace('###',''),'id',tabId);//
					src = $.youi.parameterUtils.connectParameter(src,'page:pageId',tabId);//
					//var orgId = tabPanelElement.attr('orgId')||tabId;
					//src = src.replace(new RegExp("\\{id\\}", "g"), orgId);
					
					$.youi.pageUtils.loadPage(panel,src,function(){
						$(this).addClass('loaded');
					});
				}
			}
		},
		
		triggerResize:function(href){
			var panel = this.tabsContent.find(href);
			panel.addClass('active');
			
			$.youi.widgetUtils.triggerResize(panel);
		},
		
		closeTab:function(tabId){
			var tabPanelId = this.tabs[tabId];
			
			var tabItem = this.element.find('>li#'+tabId);
			//
			var prevItem = tabItem.prev();
			var selectedTabId;
			if(prevItem.length){
				selectedTabId = prevItem.attr('id');
			}else{
				var nextItem = tabItem.next();
				selectedTabId = nextItem.attr('id');
			}
			
			if(selectedTabId){
				this.selectTab(selectedTabId);
			}
			
			tabItem.remove();
			this.tabsContent.find('>#'+tabPanelId).remove();
			this.dropdownElem.find('li#'+tabId).remove();
			
			delete this.tabs[tabId];
		},
		
		/**
		 * 
		 */
		loadPage:function(id,pageUrl,pageTitle,after){
			var tabId = 'tab_'+id;
			var tabPanelId;
			if(this.tabs[tabId]){//已经存在
				tabPanelId = this.tabs[tabId];
			}else{
				tabPanelId = tabId+'_panel';
				this.addTab(tabId, pageTitle, function(tabPanel){
					//
					$.youi.pageUtils.loadPage(tabPanel,pageUrl,after);
					tabPanel.addClass('loaded');
				});
				this.tabs[tabId] = tabPanelId;
			}
			//使得当前选中
			this.selectTab(tabId);
		},
		/**
		 * 
		 */
		addTab:function(tabId,pageTitle,after){
			var tabPanelId = tabId+'_panel';
			
			var tabHtmls = [];
			
			tabHtmls.push('<li id="'+tabId+'"><a href="#'+tabPanelId+'" data-toggle="tab">');
			tabHtmls.push(pageTitle);
			
			if(this.options.showClose&&tabId!='tab_000000'){
				tabHtmls.push('<span class="youi-icon tab-close glyphicon glyphicon-remove"></span>');
			}
			
			tabHtmls.push('</a></li>');
			
			this.element.append(tabHtmls.join(''));
			
			var tabPanel = $('<div id="'+tabPanelId+'" class="tab-pane"></div>');
			
			this.tabsContent.append(tabPanel);
			this._initDropdown();
			
			this.dropdownElem.find('>.dropdown-menu').append('<li id="'+tabId+'"><a data-tabid="'+tabId+'" href="#">'+pageTitle+'</a></li>');
			
			if($.isFunction(after)){
				after.apply(this.element[0],[tabPanel]);
			}
		},
		/**
		 * 初始化下拉
		 */
		_initDropdown:function(){
			if(this.dropdownElem==null){
				var dropdownHtmls = [];
				var dropdownId = this.options.id+'_dropdown';
				dropdownHtmls.push('<div class="tabs-dropdown pull-right"><button class="btn btn-default dropdown-toggle" type="button" id="'+dropdownId+'" data-toggle="dropdown">');
				dropdownHtmls.push('<span class="caret"></span></button>');
				dropdownHtmls.push('<ul class="dropdown-menu" role="menu" aria-labelledby="'+dropdownId+'"></ul></div>');
				
				this.dropdownElem = $(dropdownHtmls.join(''));
				this.dropdownElem.bind('show.bs.dropdown',function(event){
					$('.dropdown-menu',this).css('top',this.offsetTop+16);
				}).delegate('>.dropdown-menu>li>a','click',function(event){
					var tabId = $(this).data('tabid');
					$(event.delegateTarget).prev().tabs('fixShowTab',tabId);
				});
				this.element.after(this.dropdownElem);
			}
		},
		/**
		 * 
		 */
		selectTab:function(tabId){
			var tabPanelId = tabId+'_panel';
			
			var tabPanel = this.tabsContent.find('#'+tabPanelId);
			var item = this.element.find('#'+tabId);
			
			this.tabsContent.find('.tab-pane.active').not(tabPanel).removeClass('active');
			
			if(!tabPanel.hasClass('active')){
				tabPanel.addClass('active');
				this.element.find('.active').removeClass('active');
				item.addClass('active');
				this.afterShowTab(item);
			}
			return item;
		},
		
		/**
		 * 接口方法，重定位
		 */
		_resize:function(){
			
		},
		
		removeAll:function(){
			this.element.empty();
			this.tabsContent.empty();
		},
		
		selectIndex:function(index){
			var tabItem = this.element.find('>li');
			var tabId = tabItem.attr('id');
			this.selectTab(tabId);
			this.afterShowTab(tabItem);
		},
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			this.tabsContent = null;
		}
	}));
	
})(jQuery);