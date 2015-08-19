/**
 * @file sdc.ui.tree.js
 */
(function($) {
	//var _log = $.youi.log;
	
	$.widget("youi.tree", $.ui.mouse, $.extend({}, {
		options: {
			serverPath:'',//服务器路径
			srcDataType:'json',//树节点数据类型
			dataParse:function(results,treeOptions){//默认的子节点数据解析器
				//this.treeOptions 树的参数
				//this.treeNodeElement 当前树节点元素
				var treeOptions = $.extend({},treeOptions,treeNodeElementOptions(this.treeNodeElement)),
					nodeOptions = treeNodeElementOptions(this.treeNodeElement);
				if(treeOptions.srcDataType=='xml'){//解析xml
					parseXml(this.treeNodeElement,treeOptions,nodeOptions,results);
				}else if(treeOptions.srcDataType=='json'){//解析json
					parseJson(this.treeNodeElement,treeOptions,nodeOptions,results);
				}
				return '';
			},
			root:'根节点',
			idAttr:'value',
			textAttr:'show',
			autoLoad:true,//自动加载第一层数据
			//triggerEvent:'click',
			checkedChildren:true,
			checkedParents:true,
			dragDrop:false,
			delay: 0,//
			distance: 1,
			mixed:false
		},
		/**
		 * 
		 */
		_create: function(){
			this.element.addClass('youi-tree').disableSelection();
			this._initAction();
			if(this.options.iteratorSrc&&this.options.autoLoad==true){
				//配置了迭代类型数据，开启自动加载
				this.loadIteratorRoot();
			}else{
				if(this.options.hideRoot==true){
					this.element.find('.root>span').hide();
				}
				//展开第一个树节点
				this._expandNode(this.element.find('li.treeNode:first'),this.options.after);
			}
			//节点拖放支持
			if(this.options.dragable===true){
				this._dragDropSupport();
			}
			this._bindDataFrom();
			//计算高度
			if(this.element.hasClass('overflow-auto')){
				var offsetHeight = this.element.offsetParent().innerHeight()-43;
				this.element.height(offsetHeight);
			}
		},
		
		loadIteratorRoot:function(){
			if(!this.options.iteratorSrc)return;
			if(this.element.find('li.root').length==0){
				var o = this.options;
				var rootSrc = this.options.iteratorSrc;
				rootSrc = rootSrc+(rootSrc.indexOf("?")==-1?'?':'&')+this.options.iteratorParentAttr+'=';
				this.element.html('')
					.append('<ul><li class="treeNode root" src="'+rootSrc+'" code="'+o.idAttr+'" show="'+o.textAttr+'"><span class="root"><a class="tree-a">'+o.root+'</a></span></li></ul>');
				var rootElement = this.element.find('li:first');
				this._loadSrc(rootElement,this.options.after);
			}
		},
		/**
		 *拖放支持
		 */
		_dragDropSupport:function(){
			this.options.container = this.options.container||$('body',document);
			this.element.prepend('<div id="tree-drop-marker" class="tree-drop-marker"></div>');
			this._mouseInit();
		},
		/***************************begin 鼠标拖放相关操作**********************************/
		_mouseStart: function(event) {
			var dragElement = $(event.srcElement||event.target);
			if(dragElement.is('li>span>a')){
				this.currentDrag = dragElement.parent().parent();//记录当前的拖动节点
				this.helper = this._createHelper(event,dragElement);
				this.dropMarker = this.element.find('#tree-drop-marker');
			}
			return true;
		},
		_mouseDrag: function(event) {
			var overElement = $(event.srcElement||event.target);
			if(this.helper){
				this.position = this._generatePosition(event);
				this.helper.css(this.position);
				
				if(overElement.is('li>span>a')&&this.options.dropable){
					this.currentDrop = overElement.parent().parent();//当前接收节点
					dropMarker = this.dropMarker;
					//接收节点和拖到节点不能相同、
					// 接收节点不能是拖到节点的上级节点
					// 接收节点不能是拖到节点的子树节点
					if(this.currentDrop[0]==this.currentDrag[0]
						||this.currentDrop[0]==this.currentDrag[0].parentNode.parentNode
						||$.ui.contains(this.currentDrag[0],this.currentDrop[0])){
						this.helper.addClass('drop-no');
						dropMarker.removeClass();
						return false;
					}else{
						this.helper.removeClass('drop-no');
					}
					//设置接收显示标识
					var deltPos = event.pageY-overElement.offset().top-8;
					var markerPos = {left:overElement.offset().left-dropMarker.parent().offset().left-10};
					if(deltPos<-3){
						markerPos.top = overElement.offset().top-dropMarker.parent().offset().top-4;
						dropMarker[0].className = 'tree-drop-marker marker-top';
					}else if(deltPos>2){
						markerPos.top = overElement.offset().top+12-dropMarker.parent().offset().top;
						dropMarker[0].className = 'tree-drop-marker marker-bottom';
					}else{
						markerPos.top = overElement.offset().top+4-dropMarker.parent().offset().top;
						dropMarker[0].className = 'tree-drop-marker marker-middle';
					}
					if($.support.boxModel){
						markerPos.top-=1;
					}
					dropMarker.css(markerPos);
					//使helper可见
					//var offsetParent = this.helper.offsetParent(),
					//	oScrollTop   = offsetParent.scrollTop();
					//	tScrollTop   = this.helper[0].offsetTop-offsetParent.innerHeight();
					//if(oScrollTop<tScrollTop){
					//	offsetParent.scrollTop(tScrollTop);
					//}else if(this.helper[0].offsetTop<oScrollTop+30){
					//	offsetParent.scrollTop(oScrollTop-20);
					//}
				}else if(overElement.hasClass(this.options.dropStyle)){
					//对上一个drop节点执行dropOut动作
					if(this.currentDrop&&this.currentDrop[0]!=overElement[0]){
						this._dropOut();
					}
					//
					if(!this.currentDrop||this.currentDrop[0]!=overElement[0]){
						this.currentDrop = overElement;
						this._dropOver(overElement);
					}
				}else{
					if(this.currentDrop){
						this._dropOut();
					}
					this.currentDrop = null;
				}
			}
		},
		_mouseStop: function(event) {
			if(this.helper){
				if(this.currentDrop&&this.currentDrag&&!this.helper.is('.drop-no')){
					this.options.stop = $.isFunction(this.options.stop)
											?this.options.stop
											:function(event,ui){//默认的drop节点调用
												$(this).tree('dropNode');
											};
					//执行拖到停止操作
					this._trigger('stop', event, {
						dragNode:this.currentDrag,
						dropNode:this.currentDrop,
						dragParent:this._getDragParent()
					});
					//
					this._dropOut();
				}else{
					//执行拖动停止操作
					this._trigger('stop', event, {
						dragNode:this.currentDrag
					});
				}
				
				this.currentDrag = null;  
				this.currentDrop = null;
				
				this.helper.remove();
				this.dropMarker.removeClass();
				this.dropMarker = null;
				this.helper = null;
				this.position = null;
			}
			return false;
		},
		
		_mouseCapture: function(event) { 
			return true; 
		},
		
		_createHelper:function(event,dragElement){
			var helper = $('<span class="drop-yes" id="tree-drop-helper"></span>').append(dragElement.clone());
			
			if(!helper.parents('body').length)
				helper.appendTo(this.options.container?this.options.container:this.currentDrag);
	
			if(helper[0] != this.element[0] && !(/(fixed|absolute)/).test(helper.css("position")))
				helper.css("position", "absolute");
			
			helper.css('zIndex','9999');
			return helper;
		},
		
		_dropOver:function(overElement){
			overElement.addClass('droping');
			var overFunc = 'func_'+this.options.id+'_dropOver';
			if($.isFunction(window[overFunc])){
				if(window[overFunc](overElement)==false){
					this.currentDrop = null;
				}
			}
		},
		
		_dropOut:function(){
			var outFunc = 'func_'+this.options.id+'_dropOut';
			this.currentDrop&&this.currentDrop.removeClass('droping');
			if(this.currentDrop&&$.isFunction(window[outFunc])){
				window[outFunc](this.currentDrop);
			}
		},
		
		_generatePosition: function(event) {
			//TODO 计算位置需要考虑多中情况 
			// 来源自jquery ui的draggable 考虑的特殊情况
			// This is another very weird special case that only happens for relative elements:
			// 1. If the css position is relative
			// 2. and the scroll parent is the document or similar to the offset parent
			// we have to refresh the relative offset during the scroll so there are no jumps
			var pageX = event.pageX,pageY = event.pageY;
			var offset = this.options.container?this.options.container.offset():this.element.offset();
			return {
				top:pageY+10-offset.top,
				left:pageX+5-offset.left
			};
		},
		/**
		 * 拖到后的节点的父节点
		 */
		_getDragParent:function(){
			var dragParent, 
				dropMarker = this.dropMarker;
			if(dropMarker.is('.marker-middle')){
				dragParent = this.currentDrop;
			}else {
				dragParent = this.currentDrop.parent().parent();
			}
			return dragParent;
		},
		//callback for onDrop
		dropNode:function(){
			if(this.currentDrag&&this.currentDrop)this._dropNode();
		},
		
		_dropNode:function(){
			var dropMarker = this.dropMarker;
			var _widgetFullName = this.widgetFullName;
			//处理拖到节点移动后的相关节点样式
			//移动节点
			if(dropMarker.is('.marker-top')&&!this.currentDrop.is('.root')){
				this._doSelfDrop('before');
			}else if(dropMarker.is('.marker-middle')){
				if(this.currentDrop.hasClass('expanded')){
					this._doSelfDrop();
				}else{
					this._expandNode(this.currentDrop,function(){
						//self._doSelfDrop();
						$.data($(this).parents('.youi-tree:first')[0],_widgetFullName)._doSelfDrop();
					});
				}
			}else if(dropMarker.is('.marker-bottom')&&!this.currentDrop.is('.root')){
				this._doSelfDrop('after');
			}
		},
		
		_doSelfDrop:function(type){
			this.moveTreeNode(this.currentDrag,this.currentDrop,type);
			this.currentDrop = null;
			this.currentDrag = null;
		},
		
		moveTreeNode:function(treeNode,moveToTreeNode,type){
			this._relativeNodeByRemove(treeNode);//改变相关节点的样式
			switch(type){
				case 'before':
					this._addBefore(moveToTreeNode,treeNode);
					break;
				case 'after':
					this._addAfter(moveToTreeNode,treeNode);
					break;
				default:
					this._addChild(moveToTreeNode,treeNode);
			}
			this.selectedNode(null,treeNode);
			
			this.currentDrop = null;
			this.currentDrag = null;
		},
		/****************************end 鼠标拖放相关操作*********************************/
		/**
		 * 动作处理
		 */
		_initAction:function(){
			this.element.bind('click',function(event){
				var target = event.target,
					eventClass = $.youi.classUtils.getEventClass(event),
					treeNodeElement;
				switch(eventClass){
					case 'tree-trigger':
						$(this).tree('triggerNode',$(target.parentNode));
						break;
					case 'tree-span':
						treeNodeElement = $(target.parentNode);
						break;
					case 'tree-a':
						treeNodeElement = $(target.parentNode.parentNode);
						break;
					default:
						;
				}
				
				if(treeNodeElement){
					if(treeNodeElement.hasClass('check')){
						$(this).tree('checkNode',event,treeNodeElement);
					}
					$(this).tree('selectedNode',event,treeNodeElement);
				}
				
				return false;
			}).bind('dblclick',function(event){
				var dblclickElement = $(event.srcElement||event.target),
					treeNodeElement;
				
				
				if(dblclickElement.is('li.treeNode>span>a')){
					treeNodeElement = dblclickElement.parent().parent();
				}
				
				if(treeNodeElement&&!treeNodeElement.hasClass('root')){
					if(treeNodeElement.hasClass('expandable')){
						$(this).tree('triggerNode',treeNodeElement);
					}
					
					$(this).tree('dblclickNode',treeNodeElement);
				}
				return false;
			}).bind('mousedown',function(event){
				if(event.button==2){//右键事件
					var target = event.target,
						eventClass = $.youi.classUtils.getEventClass(event);
					if(eventClass=='tree-a'){
						var rightClickFun = this.getAttribute('id')+'_rightClick';
						if($.isFunction(window[rightClickFun])){
							var treeNode = $(target.parentNode.parentNode);
							$('.tree-a.right-click',event.delegateTarget).removeClass('right-click');
							$(target).addClass('right-click');
							window[rightClickFun](event,$(target.parentNode.parentNode));
						}
						return false;
					}
				}
			});
			
//			$('body',document).bind('contextmenu',function(event){
//				if($(event.target).closest('.youi-tree').length>0
//						||$(event.target).closest('.ui-menu').length>0){
//					return false;
//				}else{
//					$('.youi-tree .right-click').removeClass('right-click');
//				}
//			});
		},
		/**
		 * 双击节点
		 */
		dblclickNode:function(treeNodeElement){
			if($.isFunction(this.options.dblclick)){
				this.options.dblclick.apply(treeNodeElement[0]);
			}
			return;
		},
		/**
		 * 选中节点
		 */
		selectedNode:function(event,treeNodeElement){
			if(!treeNodeElement)return;
			var oldSelected = this.element.find('.selected');
			if(oldSelected[0]!=treeNodeElement[0]){
				treeNodeElement.addClass('selected');
				treeNodeElement.find('a:first').addClass('selected');
				oldSelected.removeClass('selected');
				oldSelected.find('a:first').removeClass('selected');
				
				this._dataFormChange(treeNodeElement[0]);
				//alert(treeNodeElement.hasClass('root'));
				//if(!treeNodeElement.hasClass('root')){
					if($.isFunction(this.options.select)){
						this.options.select.apply(treeNodeElement[0],[this.element[0]]);
					}
					if($.isFunction(window[this.options.id+'_change'])){
						window[this.options.id+'_change'].apply(treeNodeElement[0],[this.element[0],treeNodeElement.attr('id')]);
					}
				//}
			}
		},
		/**
		 * 绑定数据表单
		 */
		_bindDataFrom:function(){
			if(!this.options.dataFormId)return;
			var formElement = $('#'+this.options.dataFormId);
			var treeElement = this.element;
			if(formElement.length){
				//form_agency_afterSubmit
				var idAttr = this.options.idAttr,
					textAttr = this.options.textAttr,
					pidAttr = this.options.pidAttr;
				
				window[this.options.dataFormId+'_afterSubmit'] = function(results){
					//
					if(!results.record[idAttr]){
						return;
					}
					//
					formElement.form('fieldValue',idAttr,results.record[idAttr]);
					var formRecord = formElement.form('getFormRecord');
					//根据树的绑定参数面板可见性判断是新增或者修改，可见时：新增；否则：修改。
					var treeBinder = formElement.find('.youi-fieldLayout.tree-binder');
					//
					treeElement.find('li.treeNode#'+formRecord[idAttr]+'>span>a').text(formRecord[textAttr]);
					//
					setFormTitle(formElement,formRecord[textAttr]);
				};
				//
				window[this.options.dataFormId+'_afterRemove'] = function(){
					var formRecord = formElement.form('getFormRecord');
					if(formRecord[idAttr]){
						treeElement.tree('removeNode',formRecord[idAttr]);
					}
				};
				//增加按钮动作绑定
				formElement.delegate('#button_add','click',function(){
					var formRecord = formElement.form('getFormRecord');
					//如果已经执行新增
					if(!formRecord[idAttr]){
						return;
					}
					//show addType
					formElement.find('.youi-fieldLayout.tree-binder').show();
					
					//clear
					formElement.form('clear').form('fieldReset');
					/*
					 * fillRecord
					 */
					var parentTextTrace = formRecord[textAttr];
					if(formRecord.parentTextTrace){
						parentTextTrace = formRecord.parentTextTrace +' -> '+parentTextTrace;
					}
					formElement.form('fillRecord',{
						addType:'1',
						parentTextTrace:parentTextTrace
					});
					//约定使用field-parent的元素作为父节点元素
					formElement.find('.youi-field.field-parent').fieldValue(formRecord[idAttr]);
					
					setFormTitle(formElement,'新增');
				});
				
				//
				var addTypeElem = formElement.find('.youi-field[property=\'addType\']');
				addTypeElem.fieldRadioGroup('option','change',function(value){
					//treeElement
					var selectedNode = treeElement.tree('getSelected');
					if(selectedNode){
						var parentId,
							parentTextTrace,
							parentNode;
						if(value=='1'){//子级
							parentNode = selectedNode;
						}else{//平级
							parentNode = selectedNode.parent().parent();
						}
						
						parentId = parentNode.attr('id');
						parentTextTrace = treeElement.tree('getParentTextTrace',parentNode.attr('id'));
						
						parentTextTrace = parentTextTrace +' -> '+parentNode.find('>span').text();
						
						if(parentNode.hasClass('root')){//根节点
							parentId = '';
						}
						
						formElement.form('fieldValue',pidAttr,parentId);
						formElement.form('fieldValue','parentTextTrace',parentTextTrace);
					}
				});
			}
		},
		/**
		 * 
		 */
		_dataFormChange:function(nodeDoc){
			if(!this.options.dataFormId)return;
			if($(nodeDoc).hasClass('root'))return;
			var formElement = $('#'+this.options.dataFormId);
			if(formElement.length&&formElement.form){
				var idAttr = this.options.idAttr;
				var textAttr = this.options.textAttr;
				
				var fieldLayoutElement =  formElement.find('.youi-fieldLayout.tree-binder'),
					id = nodeDoc.getAttribute('id'),
					parentTextTrace = this.getParentTextTrace(id);
				//
				formElement.form('fieldValue',idAttr,id);
				//
				formElement.form('loadRecord',function(record){
					fieldLayoutElement.hide();
					setFormTitle(formElement,record[textAttr]);
				},{parentTextTrace:parentTextTrace});
				
				
			}
		},
		/**
		 * check node
		 */
		checkNode:function(event,treeNodeElement){
			//alert('check:'+treeNodeElement.attr('id'));
			treeNodeElement.toggleClass('checked').removeClass('partchecked');
			treeNodeElement.children('span').toggleClass('checked').removeClass('partchecked');
			if(!event.ctrlKey&&this.options.checkedChildren){
				if(treeNodeElement.hasClass('checked')){
					treeNodeElement.find('>ul').find('.check').not('.hide').removeClass('partchecked').addClass('checked');
				}else{
					treeNodeElement.find('>ul').find('.check').not('.hide').removeClass('checked').removeClass('partchecked');
				}
			}
			if(!event.ctrlKey&&this.options.checkedParents){
				this._checkParentNode(treeNodeElement);
			}
			
			if($.isFunction(this.options.select)){
				this.options.select.apply(treeNodeElement[0],[this.element[0]]);
			}
			
			if($.isFunction(window[this.options.id+'_change'])){
				window[this.options.id+'_change'].apply(treeNodeElement[0],[this.element[0]]);
			}
			//if($.isFunction(this.options.check)){
			//	this.options.check.apply(this.element[0],[event,{
			//		checkNodeElement:treeNodeElement
			//	}]);
			//}
		},
		/**
		 * 树节点的父节点的check的相关变化
		 */
		_checkParentNode:function(treeNodeElement){
			var checkCount   = treeNodeElement.siblings('.check').length,
				checkedCount = treeNodeElement.siblings('.checked').length,
				parentTreeNode = treeNodeElement.parent().parent('.check');
			
			if(parentTreeNode.length===0){return;}
			
			var partchecked = true;
			if(treeNodeElement.hasClass('checked')){
				if(checkCount==checkedCount){//父节点为checked状态
					this._addCheckedClass(parentTreeNode);
					partchecked = false;
				}
			}else if(treeNodeElement.hasClass('partchecked')){
				//do nothing
			}else{
				if(checkedCount===0){
					this._removeCheckedClass(parentTreeNode);
					partchecked = false;
				}
			}
			
			if(partchecked){
				this._addPartcheckedClass(parentTreeNode);
			}
			this._checkParentNode(parentTreeNode);//迭代执行上级节点的选中操作
		},
		
		_addCheckedClass:function(treeNodeElement){
			if(treeNodeElement.length>0){
				treeNodeElement.addClass('checked').removeClass('partchecked')
					.children('span').addClass('checked').removeClass('partchecked');
			}
		},
		
		_addPartcheckedClass:function(treeNodeElement){
			if(treeNodeElement.length>0){
				treeNodeElement.addClass('partchecked').removeClass('checked')
					.children('span').addClass('partchecked').removeClass('checked');
			}
		},
		
		_removeCheckedClass:function(treeNodeElement){
			if(treeNodeElement.length>0){
				treeNodeElement.removeClass('checked').removeClass('partchecked')
					.children('span').removeClass('checked').removeClass('partchecked');
			}
		},
		
		unCheckedNode:function(id){
			var treeNodeElement = this.element.find('#'+id);
			this._removeCheckedClass(treeNodeElement);
		},
		/**
		 * 打开/关闭树节点
		 */
		triggerNode:function(treeNodeElement){
			if(treeNodeElement.hasClass('expanded')){
				this._collapseNode(treeNodeElement);
			}else{
				this._expandNode(treeNodeElement);
			}
		},
		/**
		 * 供展开后或者关闭后调用
		 */
		_triggerClass:function(treeNodeElement){
			if(!treeNodeElement.hasClass('expandable'))return;
			treeNodeElement.toggleClass('expanded');
			treeNodeElement.children('span').toggleClass('expanded');
			//ie
			if(!$.support.boxModel){
				if(treeNodeElement.is('.last.expanded')){
					treeNodeElement.addClass('lastExpanded').removeClass('lastExpandable');
				}else if(treeNodeElement.is('.lastExpanded')){
					treeNodeElement.addClass('lastExpandable').removeClass('lastExpanded');
				}
			}
		},
		/**
		 * 展开树节点
		 */
		_expandNode:function(treeNodeElement,data,afterExpand){
			var o   = this.options,
				src = treeNodeElement.attr('src');
			//回调的参数处理
			afterExpand=afterExpand||data;
			data = afterExpand&&data;
			if(!treeNodeElement.hasClass('expanded')){
				this._triggerClass(treeNodeElement);//切换样式
			}
			
			treeNodeElement.find('ul:first').show();
			//alert(treeNodeElement.attr('id')+':'+treeNodeElement[0].className);
			
			if(src&&!treeNodeElement.hasClass('loaded')){
				this._loadSrc(treeNodeElement,data,afterExpand);
			}else{
				if($.isFunction(afterExpand)){
					afterExpand.apply(treeNodeElement[0],[data]);
				}
			}
			//
			if(!$.support.boxModel){
				this.element.find('>tree-trigger').css({'position':'absolute'});
			}
			this.element.scrollTop(0);
		},
		
		_loadSrc:function(treeNodeElement,data,afterExpand){
			var o   = this.options,
				src = treeNodeElement.attr('src');
			afterExpand=afterExpand||data;
			data = afterExpand&&data;
			treeNodeElement.find('span:first').addClass('loading');
			$.youi.ajaxUtil.ajax({
				url:src,
				//type:this.options.methodType||'GET',
				dataType:o.srcDataType,
				contentType:'application/x-www-form-urlencoded;charset=UTF-8',
				dataParse:o.dataParse,
				element:this.element,
				treeNodeElement:treeNodeElement,//传入当前展开的节点
				afterExpand:afterExpand,
				afterExpandData:data,//附加参数：展开函数的参数
				success:function(results){//成功读取数据
					this.dataParse.apply(this,[results,o]);//执行数据解析器
					this.treeNodeElement.addClass('loaded').find('span:first').removeClass('loading');//
					var lastNode = this.treeNodeElement.find('>ul>li:last');
					lastNode.addClass('last');
					
					this.treeNodeElement.find('ul:first').show();
					if(lastNode.hasClass('expandable')){
						lastNode.addClass('lastExpandable');
					}
					if($.isFunction(this.afterExpand)){
						this.afterExpand.apply(this.treeNodeElement[0],[this.afterExpandData]);
					}
					this.dataParse = null;
					this.treeNodeElement = null;
					this.element = null;
					this.afterExpand = null;
				},error:function(errorMessage){
					//alert(errorMessage);
				}
			});
		},
		/**********************************增加、删除操作****************************************/
		/**
		 * @param nodeElement  增加的节点的目标节点元素
		 * @param childElement 增加的节点元素
		 */
		_addChild:function(nodeElement,childElement){
			var ul = nodeElement.find('>ul');
			if(ul.length==0){
				ul = $('<ul></ul>').appendTo(nodeElement);
			}else{
				//移除原始末尾节点的末样式
				removeLastStyleClass(ul.find('>li:last'));
			}
			//处理目标节点的样式
			if(ul.children().length==0){//目标节点没有子节点的情况
				nodeElement.addClass('expandable expanded').children('span:first').addClass('expandable expanded');
				//如果当前目标节点为末节点，则增加展开状态的末节点样式
				if(nodeElement.hasClass('last')){
					nodeElement.addClass('lastExpanded');
				}
				nodeElement.prepend('<div class="tree-trigger"></div>');
			}
			lastStyleClass(childElement);//设置增加的节点为末样式
			ul.append(childElement);
		},
		_addBefore:function(nodeElement,childElement){
			nodeElement.before(childElement);
		},
		_addAfter:function(nodeElement,childElement){
			nodeElement.after(childElement);
			if(nodeElement.is('.last')){
				nodeElement.removeClass('last').removeClass('lastExpandable').removeClass('lastExpanded');
				childElement.addClass('last');
			}
		},
		/**
		 * 移除树节点
		 */
		_removeNode:function(treeNodeElement){
			if(treeNodeElement.length==0||treeNodeElement.hasClass('root'))return;
			//var parentNodeElement = treeNodeElement.parent().parent();
			this._relativeNodeByRemove(treeNodeElement);
			this.selectedNode(null,this._nextNode(treeNodeElement));
			treeNodeElement.remove();
		},
		
		_nextNode:function(treeNodeElement){
			var nextNode = treeNodeElement.next();
			if(nextNode.length==0){
				nextNode = treeNodeElement.parent().parent();
			}
			if(nextNode.hasClass('root')){
				nextNode = nextNode.find('li.treeNode:first');
			}
			return nextNode;
		},
		/**
		 * 处理移除节点的相关节点的样式
		 */
		_relativeNodeByRemove:function(treeNodeElement){
			if(treeNodeElement.is('.last')){//处理拖动节点的原始父节点样式
				var prev = treeNodeElement.prev(),//记录拖动节点的拖动前的前一个树节点
					parentElement = treeNodeElement.parent().parent();//记录拖动节点的拖动前的父节点
				if(prev.length>0){
					lastStyleClass(prev);//设置前一个节点为末节点
				}else{//没有兄弟节点处理
					parentElement.removeClass('expandable').removeClass('expanded');
					parentElement.children('span:first').removeClass('expandable').removeClass('expanded');
					
					parentElement.removeClass('lastExpanded').removeClass('lastExpandable');
						
					if(!$.support.boxModel){
						parentElement.find('>ul').hide();
					}
				}
				treeNodeElement.removeClass('last');
			}
		},
		/**
		 * 关闭树节点
		 */
		_collapseNode:function(treeNodeElement){
			this._triggerClass(treeNodeElement);
			treeNodeElement.find('ul:first').hide();//.css("display","none");
		},
		/**
		 * 获得选择节点
		 */
		getSelected:function(){
			var selectedNode = this.element.find('li.treeNode.selected');
			return selectedNode.length==0?null:selectedNode;
		},
		/*****************************************外部调用函数******************************************/
		/**
		 * 定位路径节点
		 * @nodePath 节点轨迹路径 
		 * @example treeElement.tree('openPath','12/1203/120301000000')
		 */
		openPath:function(nodePath){
			if(!nodePath)return;
			var self  = this,
				paths = nodePath.split('/'),
				nodeId = paths.shift(),
				treeNodeElement = this.element.find('li#'+nodeId);
			if(treeNodeElement.length==0)return;//如果没有找到树节点，返回
			
			if(paths.length==0){
				this.selectedNode(null,treeNodeElement);//选中节点
				//定位节点
				treeNodeElement.find('a:first').focus();
			}else{//展开节点
				this._expandNode(treeNodeElement,{treeElement:this.element[0],subPath:paths.join('/')},function(data){
					$(data.treeElement).tree('openPath',data.subPath);
				});
			}
		},
		
		/**
		 * 增加节点
		 */
		addNode:function(relativeNode,id,text,attributes,data,afterAdd,type){
			var addNodeHtml = treeNodeHtml(id,text,attributes,data),
				treeNode = relativeNode||this.getSelected()||this.element.find('li:first');
			var execAfterAdd = true;
			if(!treeNode||treeNode.length==0)return;
			switch(type){
				case 'before':
					this._addBefore(treeNode,$(addNodeHtml));
					break;
				case 'after':
					this._addAfter(treeNode,$(addNodeHtml));
					break;
				default:
					if(!treeNode.hasClass('expandable')||treeNode.hasClass('expanded')){
						this._addChild(treeNode,$(addNodeHtml));
					}else{//未展开状态先展开树节点
						execAfterAdd = false;
						var data = {tree:this,treeNode:treeNode,addNodeHtml:addNodeHtml,afterAdd:afterAdd};
						this._expandNode(treeNode,data,function(data){
							if(!this.getAttribute('src')||$(this).hasClass('loaded')){//
								data.tree._addChild($(this),$(data.addNodeHtml));
							}
							if($.isFunction(data.afterAdd)){
								data.afterAdd.apply(this,[id]);
							}
							data = null;
						});
						data = null;
					}
			}
			//
			if(execAfterAdd&&$.isFunction(afterAdd)){
				afterAdd.apply(treeNode[0],[id]);
			}
		},
		/**
		 * 移除树节点
		 * @param id 树节点的唯一标识，id为空时，删除选中的节点
		 */
		removeNode:function(id){
			var treeNode = this.element.find('li.treeNode#'+id);
			if(treeNode.length==0){
				treeNode = this.getSelected();
			}
			this._removeNode(treeNode);
		},
		/**
		 * ajax 删除节点
		 */
		ajaxRemoveNode:function(src,idAttr,id,message){
			if(!src)return;
			var treeId = this.element.attr('id');
			if(window.confirm(message||'确认删除？')){
				$.youi.ajaxUtil.ajax({
					url:src,
					type:'GET',
					data:$.youi.parameterUtils.propertyParameter(idAttr,id),
					success:function(result){
						$('#'+treeId).tree('removeNode',id);
					}
				});
			}
		},
		/**
		 * 设置checked节点
		 */
		checkedTreeNodes:function(checkedIds,notFilter){
			this.clearCheckedTreeNodes();
			if($.isArray(checkedIds)){
				this.expandAll(null,function(){
					var element = $(this);
					
					$('li.treeNode',this).each(function(){
						var nodeId = this.getAttribute('id');
						
						if($.inArray(nodeId,checkedIds)!=-1){
							$(this).addClass('checked').find('>span:first').addClass('checked');
						}
					});
				},notFilter?false:checkedIds);
			}
		},
		/**
		 * 选择已经在树中的节点
		 */
		checkedTreeNode:function(checkedId){
			var treeNode = this.element.find('li#'+checkedId);
			if(treeNode.length>0){
				var nodePaths = [];
				treeNode.parents('li.treeNode',this.element).each(function(){
					nodePaths.push(this.getAttribute('id'));
				});
				nodePaths.push(checkedId);
				this.clearCheckedTreeNodes();
				this.openPath(nodePaths.join('/'));
				treeNode.addClass('checked').find('>span:first').addClass('checked');
			}
		},
		/**
		 * 
		 */
		getCurrentCheckedIds:function(){
			var checkedIds = [];
			this.element.find('li.checked,li.partchecked').not('.root').each(function(){
				checkedIds.push(this.getAttribute('id'));
			});
			return checkedIds;
		},
		/**
		 * 
		 */
		clearCheckedTreeNodes:function(){
			this.element.find('.checked').removeClass('checked');
			this.element.find('.partchecked').removeClass('partchecked');
		},
		
		expandAll:function(nodeElement,after,limits){
			if(!nodeElement)nodeElement = this.element.find('li:first');
			//if(limits&&$.inArray(nodeElement.attr('id'),limits)==-1){
			//	return;//
			//}
			this._expandNode(nodeElement,{treeElement:this.element},function(data){
				var treeElement = data.treeElement;
				$('>ul>li',this).each(function(){
					treeElement.tree('expandAll',$(this),after,limits);//
				});
					
				if($.isFunction(after)){
					after.apply(this);
				}
			});
		},
		/**
		 * 关闭全部子节点
		 */
		closeAll:function(nodeElement){
			if(!nodeElement)nodeElement = this.element.find('li:first');
			nodeElement.removeClass('expanded');
			nodeElement.find('.expanded').removeClass('expanded');
			nodeElement.find('ul').hide();
		},
		/**
		 * 
		 */
		getTreeNodePath:function(treeNodeId,treeNodeCode,joinStr){
			joinStr = joinStr||'/';
			var paths = [];
			var treeNodeLi = this.element.find('li.treeNode#'+treeNodeId);
			if(treeNodeLi.length){
				treeNodeLi.parents('li.treeNode').not('.root').each(function(){
					paths.push(treeNodeCode?this.getAttribute('code'):this.getAttribute('id'));
				});
				paths = paths.reverse();
				paths.push(treeNodeCode?treeNodeCode:treeNodeId);
			}
			return paths.join(joinStr);
		},
		/**
		 * 
		 */
		getParentTextTrace:function(treeNodeId,joinStr){
			joinStr = joinStr||' -> ';
			var paths = [];
			var treeNodeLi = this.element.find('li.treeNode#'+treeNodeId);
			if(!treeNodeLi.length){
				treeNodeLi = this.getSelected();
			}
			if(treeNodeLi&&treeNodeLi.length){
				treeNodeLi.parents('li.treeNode').not('.root').each(function(){
					paths.push($('>span>a',this).text());
				});
				paths = paths.reverse();
			}
			return paths.join(joinStr);
		},
		
		destroy:function(){
			this.element.removeData(this.widgetName)
						.removeClass('youi-tree')
						.unbind();
		}
	}));
	
	$.extend($.youi.tree, {
		defaults:{
			
		},
		getter:['getCurrentCheckedIds','getSelected','getTreeNodePath'],
		
		treeNodeHtml:function(id,text,attributes,data){
			return treeNodeHtml(id,text,attributes,data);
		}
	});
	/***********************************内部函数***************************************/
	/**
	 * 设置节点样式为未节点样式
	 */
	function lastStyleClass(nodeElement){
		if(!nodeElement||nodeElement.length==0)return;
		nodeElement.addClass('last');
		if(!$.support.boxModel&&nodeElement.hasClass('expandable')){//可展开的节点
			if(nodeElement.hasClass('expanded')){
				nodeElement.addClass('lastExpanded');
			}else{
				nodeElement.addClass('lastExpandable');
			}
		}
	}
	/**
	 * 移除节点的未节点样式
	 */
	function removeLastStyleClass(nodeElement){
		if(!nodeElement||nodeElement.length==0)return;
		nodeElement.removeClass('last').removeClass('lastExpanded').removeClass('lastExpandable');
	}
	/**
	 * 解析xml格式数据
	 * @param treeNodeElement 	加载数据的树节点
	 * @param treeOptions     	树参数
	 * @param treeOptions     	节点参数
	 * @param results		  	树节点src访问返回的数据
	 */
	function parseXml(treeNodeElement,treeOptions,nodeOptions,results){
		var recordPath = treeOptions.recordPath||'record',
			htmls	   = ['<ul>'],
			iteratorSrc= (nodeOptions.leaf)?null:treeOptions.iteratorSrc,
			iteratorParentAttr = treeOptions.iteratorParentAttr,
			idAttr	   = nodeOptions.idAttr||treeOptions.idAttr,
			textAttr   = nodeOptions.textAttr||treeOptions.textAttr;
		$(recordPath,results).each(function(){
			var id = $(idAttr,this).text(),
				text = $(textAttr,this).text(),
				attributes = {//写入dom节点的属性
					src:$('src',this).text(),
					idAttr:$('idAttr',this).text()||idAttr,
					textAttr:$('textAttr',this).text()||textAttr
				},
				data = {//参数
					leaf:$('leaf',this).text(),
					check:$('check',this).text()||treeOptions.check
				};
			
			htmls.push(treeNodeHtml(id,text,attributes,data));
			attributes = null;
			data = null;
		});
		htmls.push('</ul>');
		treeNodeElement.append(htmls.join(''));
	}
	/**
	 * 解析json格式数据
	 * @param treeNodeElement 	加载数据的树节点
	 * @param treeOptions     	树参数
	 * @param treeOptions     	节点参数
	 * @param results		  	树节点src访问返回的数据
	 */
	function parseJson(treeNodeElement,treeOptions,nodeOptions,results){
		var records = results.records,
			htmls	   = ['<ul>'],
			iteratorSrc= (nodeOptions.leaf)?null:treeOptions.iteratorSrc,
			iteratorParentAttr = treeOptions.iteratorParentAttr,
			idAttr	   = nodeOptions.idAttr||treeOptions.idAttr,
			textAttr   = nodeOptions.textAttr||treeOptions.textAttr;
			textAttrs   = textAttr.split('.');
		
		if(!records||records.length==0){
			treeNodeElement.removeClass('expandable').removeClass('expanded').removeClass('lastExpandable')
				.find('>span').removeClass('expandable').removeClass('expanded');
			return;
		}
		$(records).each(function(){
			var text;
			if(textAttrs.length>1){
				text = this[textAttrs[0]][textAttrs[1]];
			}else{
				text = this[textAttr];
			}
			var id = this[idAttr],
				src  = this.src||(!iteratorSrc?null:$.youi.parameterUtils.connectParameter(iteratorSrc,iteratorParentAttr,id)),
				attributes = {//写入dom节点的属性
					
				},
				data = {//参数
					leaf:this['leaf'],
					check:this['check']||treeOptions.check,
					group:this.group
				};
				if(src){
					attributes = {
						src:this['src']||src,
						idAttr:this['idAttr']||idAttr,
						textAttr:this['textAttr']||textAttr
					}
				}
			if(id&&text){
				var treeText =treeOptions.mixed==true?("("+id+")"+text):text;
				htmls.push(treeNodeHtml(id,treeText,attributes,data));
			}
			attributes = null;
			data = null;
		});
		htmls.push('</ul>');
		treeNodeElement.append(htmls.join(''));
	}
	/**
	 * 从树dom节点上返回与展开相关的参数
	 */
	function treeNodeElementOptions(treeNodeElement){
		var nodeOptions = {
			src:treeNodeElement.attr('src'),
			idAttr:treeNodeElement.attr('idAttr'),
			textAttr:treeNodeElement.attr('textAttr')
			//leaf:treeNodeElement.attr('leaf')
		};
		return nodeOptions;
	}
	/**
	 * 生成单个树节点的html
	 * @param id   树节点id
	 * @param text 树节点文本
	 * @param data 树节点的参数
	 */
	function treeNodeHtml(id,text,attributes,data){
		data = data||{};
		var htmls = ['<li id="'+id+'"'],
			classNames = ['treeNode'],
			spanClassNames = ['tree-span'],//ie6
			expandable = false,
			treeTriggerHtml = '';//trigger辅助
		
		//如果存在src属性，并且标识为非叶子节点  leaf=true leaf=1
		var isLeaf = (data.leaf==true||data.leaf=='1')?true:false;//data.leaf
		
		if(!isLeaf&&attributes&&attributes.src){
			classNames.push('expandable');
			spanClassNames.push('expandable');
			treeTriggerHtml = '<div class="tree-trigger"></div>';
		}
		if(data.check){
			classNames.push('check');
			spanClassNames.push('check');
			if(data.check!=true){
				classNames.push(data.check);
				spanClassNames.push(data.check);
			}
		}
		
		if(data.group){
			classNames.push(data.group);
			spanClassNames.push(data.group);
		}
		
		htmls.push(' class="'+classNames.join(' ')+'" ');
		if(attributes){
			for(var attribute in attributes){
				if(attributes[attribute]){
					htmls.push(attribute);
					htmls.push('="');
					htmls.push(attributes[attribute]+'" ');
				}
			}
		}
		htmls.push('>');
		htmls.push(treeTriggerHtml);
		htmls.push('<span title="'+text+'" '+(spanClassNames?'class="'+spanClassNames.join(' ')+'"':'')+'><a class="tree-a" href="#">');
		htmls.push(text);
		htmls.push('</a></span></li>');
		return htmls.join('');
	}
	
	function setFormTitle(formElement,title){
		var titleContainer = formElement.parent().prev().find('>div');
		titleContainer.find('>span').remove();
		titleContainer.append('<span>&nbsp;['+title+'] </span>');
	}
	
})(jQuery);