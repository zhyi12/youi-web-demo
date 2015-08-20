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
	
	var _log = $.youi.log,
		_defaultColor = '#000000',
		_selectedColor = '#FD0C0C',
		_inStraightPointStyle ='in-straight-line',
		_startNodeStyle='startEvent',
		_endNodeStyle='endEvent',
		_pointRadius = 3,//拐点半径
		_overpanelTopHeight = 28,//浮动面板上高
		_overpanelRightWidth = 27;//浮动面板右宽
	
	/**
	 * 添加统一的右键菜单
	 */
	$.youi.contextmenuUtils&&$.youi.contextmenuUtils.addWidgetContextmenu('flow',[
	    {'name':'undo',caption:"撤销（Ctrl+Z） {1}",icon:'undo'},
	    {'name':'redo',caption:"重做（Ctrl+Y） {2}",icon:'redo'},
	    {'name':'selectAll',caption:"全选",icon:'selectAll'},
	    {'name':'addLane',caption:"增加泳道",icon:'addLane'},
	    {'name':'removeLane',caption:"删除泳道",icon:'remove'},
	    
	    {'name':'alignSelected',caption:"横向对齐",icon:'alignSelected'},
	    {'name':'valignSelected',caption:"纵向对齐",icon:'valignSelected'},
	    
	    {'name':'remove',caption:"删除{0}",icon:'remove'},
		{'name':'properties',caption:"属性{0}",icon:'properties'},
		{'name':'exportImage',caption:"导出图片",icon:'exportImage'}
	]);
	
	$.widget("youi.flow",$.youi.abstractWidget,$.extend({},$.youi.command,{
		/**
		 * 默认参数
		 */
		options:{
			readonly:false,
			delay: 100,//
			distance: 1,
			cancel: "input,textarea,button,select,option,[contenteditable=true],.content-editable"
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
			this._initCanvaContext();//绘画面板支持
			
			if(this.options.readonly!=true){
				//初始化面板
				this._initOverpanels();
				
				this._mouseInit();
				//命令模式
				this._initCommands();
				this._registerCommand();
				//右键菜单
				this._contextMenuInit(true);
			}
			//TODO 
			this._afterModelsChange(null);
			
			this._resize();
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
			
			if(this.options.readonly==true){
				return;
			}
			
			this._on({
				'mousedown':function(event){
					this._widgetFocus(event);
				},
				'mousedown #canvas_trace':function(event){
					this._clickCanvasAt(event.pageX - this.element.offset().left,event.pageY - this.element.offset().top,event);
				},
				'mousedown .node,.lane-title':function(event){
					if(event.button===2){//右键
						this._clickElement($(event.target),event);
						
						this.overpanelsElement.hide();
					}
				},
				'mousedown .over-item':function(event){
					var item = $(event.target);//浮动菜单鼠标点击
					this.execCommand($(event.target),item.data());
					
					this.overpanelsElement.hide();
				},
				'click .node,.lane-title':function(event){
					this._clickElement($(event.target),event);
				},
				'mouseenter .node':function(event){
					var nodeElement = $(event.target);
					nodeElement.attr('title',nodeElement.text());
					
					this._showOverpanels(nodeElement);
				},
				'mouseleave [contenteditable=true]':function(event){
					var nodeElement = $(event.target);
					var text = nodeElement.text();
					nodeElement.removeAttr('contenteditable');
					var oldText = nodeElement.data('text');
					if(text!=oldText){
						this.executeCommand('doSetNodeText',nodeElement,text,oldText);
					}
				},
				'dblclick .node,.content-editable':function(event){
					var nodeElement = $(event.target);
					nodeElement.attr('contenteditable',true).data('text',nodeElement.text()).focus();
				},
				'mouseleave .over-panels':function(event){
					this.overpanelsElement.hide();
				},
				'keyup':function(event){
					//快捷键定义
					if(event.ctrlKey&&event.keyCode==90){//ctrl+z
						this.undo();
					}else if(event.ctrlKey&&event.keyCode==89){//ctrl+y
						this.redo();
					}else if(event.ctrlKey&&event.keyCode==68){//ctrl+D
						this._doRemove();
					}else if(event.keyCode==$.ui.keyCode.UP){
						this._keyMove(0,-1);
					}else if(event.keyCode==$.ui.keyCode.DOWN){
						this._keyMove(0,1);
					}else if(event.keyCode==$.ui.keyCode.LEFT){
						this._keyMove(-1,0);
					}else if(event.keyCode==$.ui.keyCode.RIGHT){
						this._keyMove(1,0);
					}//DELETE
				}
			});
		},
		

		/*
		 * 根据当前单击的dom节点显示上下文菜单
		 */
		_getContextmenuGroups:function(dom,options){
			//
			var groups = ['addLane','selectAll'],
				param_caption = '',
				param_undo_steps = '',
				param_redo_steps = '';//
			
			//redo undo
			if(this.commands&&this.commands.length){
				groups.push('undo');
				param_undo_steps = ' '+this.commands.length;
			}
			
			if(this.undoCommands&&this.undoCommands.length){
				groups.push('redo');
				param_redo_steps = ' '+this.undoCommands.length;
			}
			
			var elem = $(dom),
				flowElem;
			
			if(elem.hasClass('node')){
				flowElem = elem;
			}else if(elem.is('#canvas_trace')){
				var x = options.x - this.element.offset().left+10,
					y = options.y - this.element.offset().top+10;
				
				var points = this._findLinePointsAt(x, y);
				
				if(points){
					var lineId = points[0].id;
					
					flowElem = this.element.find('.transition#'+lineId);
					
				}
			}else if(elem.is('.lane-title.ui-click')){//泳道
				groups.push('removeLane');
			}
			//流程元素
			if(flowElem&&flowElem.length){
				param_caption = flowElem.text()||flowElem.attr('id');
				
				var elemGroups = [];
				if(!flowElem.hasClass(_startNodeStyle)){
					elemGroups.push('remove');
				}
				elemGroups.push('properties');
				
				groups = groups.concat(elemGroups);
			}
			
			if(this.element.find('.ui-selected').length>1){
				groups.push('alignSelected');
				groups.push('valignSelected');
			}
			
			groups.push('exportImage');
			
			//参数
			groups.push('property:-'+param_caption);
			groups.push('property:-'+param_undo_steps+'步');
			groups.push('property:-'+param_redo_steps+'步');
			return groups;
		},
		
		
		//注册命令
		_registerCommand:function(){
			this.registerCommand('doMoveElements')
				.registerCommand('doRemoveSelected','Ctrl+D')
				.registerCommand('doSetNodeText')
				.registerCommand('doRemoveLaneSelected')
				.registerCommand('doColResize')
				.registerCommand('doRowResize')
				.registerCommand('doAddTransition')
				.registerCommand('doAddNode')
				.registerCommand('doAddLane')
				.registerCommand('doAlignElements')
				.registerCommand('doValignElements');
		},
		
		/**************************************命令开始***********************************/
		/**
		 * command - 移动流程元素命令
		 * 
		 */
		doMoveElements:function(context,dragElement,moves,xDelt,yDelt){
			this._moveElements(dragElement,moves,xDelt,yDelt,context.oldPos);
			
			var dragOffset = {
					left:dragElement[0].offsetLeft,
					top:dragElement[0].offsetTop
			};
			//记录移动后的位置
			if(!context.oldPos){
				context.oldPos = dragOffset;
			}
		},
		/**
		 * command-undo 撤销移动
		 */
		doMoveElementsUndo:function(context,dragElement,moves,xDelt,yDelt){
			
			this._moveElements(dragElement,moves,-xDelt,-yDelt,context.newPos);
			
			//记录撤销移动后的位置
			var dragOffset = {
					left:dragElement[0].offsetLeft,
					top:dragElement[0].offsetTop
			};
			
			if(!context.newPos){
				context.newPos = dragOffset;
			}
		},
		/**
		 * 删除选择元素
		 */
		doRemoveSelected:function(context,element,refTransitions){
			element.remove();
			if(refTransitions){
				refTransitions.remove();
			}
			this._refreshTransitions();
			
			this._afterModelsChange();//模型变化
		},
		
		doRemoveSelectedUndo:function(context,element,refTransitions){
			this.element.append(element);
			
			if(refTransitions){
				this.element.append(refTransitions);
			}
			
			this._refreshTransitions();
			
			this._afterModelsChange();//模型变化
		},
		
		doSetNodeText:function(context,nodeElement,text,oldText){
			nodeElement.text(text);
			
			this._afterTextChange(nodeElement,text);//文本变化
		},
		
		doSetNodeTextUndo:function(context,nodeElement,text,oldText){
			nodeElement.text(oldText);
			
			this._afterTextChange(nodeElement,oldText);//文本变化
		},
		
		/**
		 * 删除泳道命令
		 */
		doRemoveLaneSelected:function(context,laneElement){
			if(laneElement.prev().length){
				context.prevLane = laneElement.prev();
			}else if(laneElement.next().length){
				context.nextLane = laneElement.next();
			}
			laneElement.remove();
			
			this._refreshTransitions();
		},
		/**
		 * 撤销删除泳道命令
		 */
		doRemoveLaneSelectedUndo:function(context,laneElement){
			if(context.prevLane){
				context.prevLane.after(laneElement);
			}else if(context.nextLane){
				context.nextLane.before(laneElement);
			}else{
				this.element.find('.lane-layout').append(laneElement);
			}
			laneElement.removeClass('ui-click');
			this._refreshTransitions();
		},
		
		doColResize:function(context,element,newWidth){
			if(!context.oldWidth){
				context.oldWidth = element.width();
				context.oldParentWidth = element.parent().width();
			}
			
			element.width(newWidth);
			element.parent().width(context.oldParentWidth+newWidth-context.oldWidth);
			//重新设置父节点宽度
			
			this._refreshTransitions();
		},
		
		doColResizeUndo:function(context,element,newWidth){
			element.width(context.oldWidth);
			element.parent().width(context.oldParentWidth);
			this._refreshTransitions();
		},
		
		doRowResize:function(context,element,newHeight){
			if(!context.oldHeight){
				context.oldHeight = element.height();
			}
			element.height(newHeight);
			this._refreshTransitions();
		},
		
		doRowResizeUndo:function(context,element,newHeight){
			element.height(context.oldHeight);
			this._refreshTransitions();
		},
		/**
		 * 
		 */
		doAddTransition:function(context,transitionElement){
			this.element.append(transitionElement);
			this._refreshTransitions();
			
			this._afterModelsChange();//模型变化
		},
		/**
		 * 
		 */
		doAddTransitionUndo:function(context,transitionElement){
			transitionElement.remove();
			this._refreshTransitions();
			
			this._afterModelsChange();//模型变化
		},
		/**
		 * 添加节点
		 */
		doAddNode:function(context,nodeElement){
			this.element.append(nodeElement);
			
			this._afterModelsChange();//模型变化
		},
		/**
		 * 撤销添加节点
		 */
		doAddNodeUndo:function(context,nodeElement){
			nodeElement.remove();
			
			this._afterModelsChange();//模型变化
		},
		
		doAddLane:function(context,laneElement,prevLaneElement){
			if(!context.oldLaneLayoutWidth){
				context.oldLaneLayoutWidth = prevLaneElement.parent().width();
			}
			prevLaneElement.after(laneElement);
			
			prevLaneElement.parent().width(context.oldLaneLayoutWidth+laneElement.outerWidth());
			
			this._refreshTransitions();
		},
		
		doAddLaneUndo:function(context,laneElement,prevLaneElement){
			laneElement.remove();
			
			prevLaneElement.parent().width(context.oldLaneLayoutWidth);
			this._refreshTransitions();
		},
		/**
		 * 横向对齐
		 */
		doAlignElements:function(context,elements,cy){
			var oldYs = [];
			elements.each(function(){
				oldYs.push(this.offsetTop);
				$(this).css('top',cy - $(this).outerHeight()/2);
			});
			
			context.oldYs = oldYs;
			this._refreshTransitions();
		},
		
		doAlignElementsUndo:function(context,elements,cy){
			elements.each(function(index){
				$(this).css('top',context.oldYs[index]);
			});
			this._refreshTransitions();
		},
		
		/**
		 * 横向对齐
		 */
		doValignElements:function(context,elements,cx){
			var oldXs = [];
			elements.each(function(){
				oldXs.push(this.offsetLeft);
				$(this).css('left',cx - $(this).outerWidth()/2);
			});
			
			context.oldXs = oldXs;
			this._refreshTransitions();
		},
		
		doValignElementsUndo:function(context,elements,cx){
			elements.each(function(index){
				$(this).css('left',context.oldXs[index]);
			});
			this._refreshTransitions();
		},
		
		/**************************************命令结束***********************************/
		/**
		 * 全选
		 */
		selectAll:function(){
			this.element.find('.point,.node').addClass('ui-selected');
			this._refreshTransitions();
		},
		/**
		 * 右键菜单动作
		 */
		remove:function(){
			var clickElement = this.element.find('.ui-click');
			this._doRemove(clickElement);
		},
		/*右键菜单-删除泳道*/
		removeLane:function(){
			//
			var laneElement = this.element.find('.lane-title.ui-click').parent();
			//删除元素
			this.executeCommand('doRemoveLaneSelected',laneElement);
		},
		/*右键菜单-添加泳道*/
		addLane:function(){
			var laneElement = $('<div class="lane"><div class="col-resize-handler"></div><div class="lane-title content-editable"></div></div>'),
				prevLaneElement = this.element.find('.lane:last');
			if(prevLaneElement.length){
				this.executeCommand('doAddLane',laneElement,prevLaneElement);
			}
		},
		/*右键菜单-水平对齐*/
		alignSelected:function(){
			var elements = this.element.find('.ui-selected');
			this.executeCommand('doAlignElements',elements,_getElemCenterPoint(elements[0]).y);
		},
		/*右键菜单-垂直对齐*/
		valignSelected:function(){
			var elements = this.element.find('.ui-selected');
			this.executeCommand('doValignElements',elements,_getElemCenterPoint(elements[0]).x);
		},
		
		/*右键菜单-导出图片*/
		exportImage:function(){
			//导出图片
			var that = this,
				nodeBgImages = [],//背景图片
				maxExportWidth = 0,
				maxExportHeight = 0,
				laneLayoutElement = this.element.find('>.lane-layout');
			
			this.canvasContext.fillStyle="#F6F6F7";
			this.canvasContext.font=this.element.css('font');
			that.canvasContext.beginPath();
			
			var firstLaneWidth = laneLayoutElement.find('.lane:first').outerWidth(),
				lanesWidth = laneLayoutElement.width() - firstLaneWidth;
			
			that.canvasContext.rect(firstLaneWidth+2,0,lanesWidth-1,32);
			that.canvasContext.fill();
			that.canvasContext.closePath();
			
			that.canvasContext.lineJoin = 'round';
			//节点和拐点
			this.element.find('.node,.point,.lane').each(function(){
				var nodeElement = $(this),
					cx = this.offsetLeft+nodeElement.outerWidth()/2,
					cy = this.offsetTop+nodeElement.outerHeight()/2;
				
				maxExportWidth = Math.max(maxExportWidth,this.offsetLeft+nodeElement.outerWidth());
				maxExportHeight = Math.max(maxExportHeight,this.offsetTop+nodeElement.outerHeight());
				
				that.canvasContext.strokeStyle="#EFEFEF";
				that.canvasContext.fillStyle="#EDF0FF";
				
				if(nodeElement.is('.node')){
					that.canvasContext.beginPath();
					that.canvasContext.fillStyle=nodeElement.css('backgroundColor');
					
					if(nodeElement.is('.'+_endNodeStyle)){
						that.canvasContext.arc(cx,cy,nodeElement.outerWidth()/2,0,360);
					}else if(nodeElement.is('.'+_startNodeStyle)){
						that.canvasContext.arc(cx,cy,nodeElement.outerWidth()/2,0,360);
					}else{
						that.canvasContext.rect(this.offsetLeft,this.offsetTop,
								nodeElement.outerWidth(),
								nodeElement.outerHeight());
					}
					
					that.canvasContext.fill();
					that.canvasContext.closePath();
					
					var bgImageUrl = nodeElement.css('backgroundImage');
					if(bgImageUrl&&bgImageUrl.indexOf('url(')==0){
						
						nodeBgImages.push({
							url:bgImageUrl.substring(4,bgImageUrl.length-1),
							x:this.offsetLeft+parseInt(nodeElement.css('backgroundPositionX')),
							y:this.offsetTop+parseInt(nodeElement.css('backgroundPositionY'))
						});
					}
					
					that.canvasContext.stroke();
				}if(nodeElement.is('.lane')&&nodeElement.prev().length>0){
					that.canvasContext.beginPath();
					that.canvasContext.strokeStyle='#DDDDDD';
					//画右线
					_drawStraightLine(that.canvasContext, {
						x:this.offsetLeft+nodeElement.outerWidth(),
						y:0
					}, {
						x:this.offsetLeft+nodeElement.outerWidth(),
						y:32
					});
					that.canvasContext.closePath();
					that.canvasContext.stroke();
				}
				
				var text = $.trim(nodeElement.text());
				
				if(text){
					that.canvasContext.strokeStyle=_defaultColor;
					var textWidth = that.canvasContext.measureText(text).width;
					that.canvasContext.strokeText(text,cx-textWidth/2,cy+6);
				}
			});
			
			var exportDialog = $('#dialog-export-image');
			if(exportDialog.length==0){
				exportDialog = $('<div style="background:white;" id="dialog-export-image"></div>');
				
				exportDialog.dialog({
					title:'导出流程图片',
					width:1024,
					height:560
				});
			}
			
			maxExportWidth = Math.max(maxExportWidth,laneLayoutElement.outerWidth())+10;
			maxExportHeight = Math.max(maxExportHeight,laneLayoutElement.outerHeight())+10;
			
			this.element.find('canvas#canvas_exp').attr('width',maxExportWidth).attr('height',maxExportHeight);
			
			this.canvasContextExport.putImageData(this.canvasContext.getImageData(0,0,maxExportWidth,maxExportHeight),0,0);
			
			//背景图片导出
			for(var i=0;i<nodeBgImages.length;i++){
				var nodeBgImage = nodeBgImages[i];
				
				if(nodeBgImage.url.indexOf('http')!=0){
					_log.info('忽略'+nodeBgImage.url+'图片.');
					continue;
				}
				
				var image = new Image();
				image.src = nodeBgImage.url;
				
				this.canvasContextExport.drawImage(image,nodeBgImage.x,nodeBgImage.y);
			}
			
			//线条描述文本导出
			this.element.find('.point-text').each(function(){
				var textElem = $(this);
				that.canvasContextExport.strokeText($.trim(textElem.text()),
						this.offsetLeft,this.offsetTop+textElem.height()/2);
			});
			
			var imgWidth,imgHeight,rate=1;
			if(maxExportWidth>1000){
				imgWidth = 1000;
				rate = 1000/maxExportWidth;
				imgHeight = rate*maxExportHeight;
			}
			
			exportDialog.html('<img title="缩放比例'+parseInt(rate*10000)/100+'%" width="'+imgWidth+'px" height="'+imgHeight+'px" src="'+this.canvasContextExport.canvas.toDataURL("image/png")+'"></img>').dialog('open').show();
			//
			this._refreshTransitions();
		},
		
		/**浮动面板动作*/
		
		/**
		 * 启动画线
		 */
		startSequence:function(dom){
			if(this.overNodeElement){
				this.startSequenceNode = this.overNodeElement;
			}
		},
		
		/**
		 * 删除节点
		 */
		removeNode:function(){
			if(this.overNodeElement){
				this._doRemove(this.overNodeElement);
			}
		},
		
		/**
		 * 添加关联节点
		 */
		addRefNode:function(dom,options){
			//
			if(this.overNodeElement&&options.subname){
				
				var deltLeft = 100 + (Math.random()*1000)%100,
					x = this.overNodeElement[0].offsetLeft+deltLeft,
					y = this.overNodeElement[0].offsetTop;
					
				var newNodeElement = this._addNode(null, '', options.subname, x, y);
				
				this.executeCommand('doAddNode',newNodeElement);
				
				var transitionElement = this._addTransition(this.overNodeElement,newNodeElement);
				
				if(transitionElement){
					this.executeCommand('doAddTransition',transitionElement);
				}
				
				this._afterModelsChange();
			}
		},
		
		/**
		 * 完成画线
		 */
		stopSequence:function(endNode){
			if(this.startSequenceNode){
				this.canvasContextTrace.clearRect(0,0,this.canvasElement.width(),this.canvasElement.height());
			
				if(endNode.hasClass('node')&&!endNode.hasClass(_startNodeStyle)){
					//
					var transitionElement = this._addTransition(this.startSequenceNode,endNode);
					
					if(transitionElement){
						this.executeCommand('doAddTransition',transitionElement);
					}
				}
			}
			this.startSequenceNode = null;
		},
		
		/********/
		select:function(id){
			var element = this.element.find('#'+id);
			
			if(element.is('.node')||element.is('.transition')){
				this._clickElement(element, null);
			}
		},
		/**
		 * 节点属性变化
		 */
		propertyChange:function(options){
			var property = options.property,
				value = options.value,
				element = this.element.find('.ui-click');
			if(property&&element.length){
				_log.debug('set '+options.property+' = '+options.value);
				
				//_textPropertyChange
				var customfuncName = '_'+options.property+'PropertyChange';
				if($.isFunction(this[customfuncName])){
					this[customfuncName](element,options.value,options.text);
				}else{
					element.data(options.property,options.value);
				}
			}
		},
		/**
		 * 获取xml
		 */
		getXml:function(){
			var xmls = ['<?xml version="1.0" encoding="UTF-8"?>'],
				skipProps = ['id','key'];
			
			xmls.push('<flow>');
			
			this.element.find('.node').each(function(){
				var elem = $(this),
					datas = elem.data();
				xmls.push('<node id="'+elem.attr('id')+' ');
				
				for(var property in datas){
					if($.inArray(property,skipProps)!=-1){
						continue;
					}
					var propertySplit = property.split(":");
					if(propertySplit.length>1){
						xmls.push(propertySplit[1]+'="'+datas[property]+'" ');
					}else{
						xmls.push(property+'="'+datas[property]+'" ');
					}
				}
				
				xmls.push(' left="'+this.offsetLeft+'" ');
				xmls.push(' top="'+this.offsetTop+'" ');
				xmls.push(' width="'+(this.offsetWidth-2)+'" ');
				xmls.push(' height="'+(this.offsetHeight-2)+'" ');
				
				xmls.push('">');
				xmls.push(elem.text());
				xmls.push('</node>');
			});
			
			this.element.find('.transition').each(function(){
				var thisElement = $(this),
					from =thisElement.data('sourceRef'),
					to = thisElement.data('targetRef'),
					id = this.getAttribute('id');
				xmls.push('<transition id="'+id+'" ');
				xmls.push(' from="'+from+'" ');
				xmls.push(' to="'+to+'" ');
				xmls.push(' caption="'+$.trim(thisElement.text()||thisElement.attr('title')||'')+'" ');
				//xmls.push(' expression="'+(thisElement.attr('expression')||getDataProperty(thisElement,'expression')||'')+'" ');
				xmls.push('>');
				
				if(thisElement.data('expression')){
					xmls.push('<![CDATA['+(thisElement.data('expression')+']]>'));
				}
				
				//保存拐点
				$('.point',this).each(function(){
					xmls.push('<point ');
					xmls.push(' left="'+this.offsetLeft+'" ');
					xmls.push(' top="'+this.offsetTop+'" ');
					xmls.push('/>');
				});
				
				xmls.push('</transition>');
			});
			
			xmls.push('</flow>');
			
			return xmls.join('');
		},
		/**
		 * 属性变化
		 */
		_captionPropertyChange:function(element,value,text){
			if(element.is('.node')){
				this.executeCommand('doSetNodeText',element,value,element.text());
			}else if(element.is('.transition')){
				//
				var textElement = element.find('>.point-text');
				if(textElement.length==0){
					textElement = $('<div class="point-text content-editable" data-radius="0" data-degree="0"></div>').appendTo(element);
					this._refreshTransitions();
				}
				
				this.executeCommand('doSetNodeText',textElement,value,textElement.text());
			}
		},
		
//		_expressionPropertyChange:function(element,value,text){
//			
//		},
		/**
		 * 
		 */
		_showSequenceTrace:function(event){
			if(this.startSequenceNode){
				//
				this.canvasContextTrace.clearRect(0,0,this.canvasElement.width(),this.canvasElement.height());
				this.canvasContextTrace.beginPath();
				this.canvasContextTrace.lineWidth = 0.5;
				
				var pos = calculatePos(this.startSequenceNode);
				
				var cPos = getRectCenterPos(pos, this.startSequenceNode.outerWidth(), this.startSequenceNode.outerHeight());
				
				_drawStraightLine(this.canvasContextTrace, {x:cPos.left,y:cPos.top}, 
						{x:event.pageX-this.element.offset().left,y:event.pageY-this.element.offset().top});
				
				this.canvasContextTrace.closePath();
				this.canvasContextTrace.stroke();
			}
		},
		
		/**
		 * 移动流程元素
		 */
		_moveElements:function(dragElement,moves,xDelt,yDelt,overPos){
			if(!moves){
				return;
			}
			
			moves.each(function(){
				$(this).css({
					left:this.offsetLeft+xDelt,
					top:this.offsetTop+yDelt
				});
			});
			
			if(dragElement.hasClass('point')){
				//
				if(overPos){
					dragElement.css(overPos);
				}
				
				//重新计算线条
				if(this._isInStraightLine(dragElement)){
					//记录节点位置
					if(!dragElement.hasClass(_inStraightPointStyle)){
						dragElement.addClass(_inStraightPointStyle);
					}
					
					dragElement.next('.'+_inStraightPointStyle).remove();
					dragElement.prev('.'+_inStraightPointStyle).remove();
					
				}else{
					dragElement.removeClass(_inStraightPointStyle);
				}
			}
			
			//重新计算当前选择的线条的中点
			this._refreshLineCenterPoints(this.element.find('.ui-click.transition'));
			
			this._refreshTransitions();
		},
		/**
		 * 
		 */
		_fixPosition:function(){
			var maxCanvasWidth = 0,
				maxCanvasHeight = 0,
				minCanvasLeft = 0,
				minCanvasTop = 0;
			
			this.element.find('.point,.node').each(function(){
				var elem = $(this);
				maxCanvasWidth = Math.max(maxCanvasWidth,this.offsetLeft+elem.outerWidth());
				maxCanvasHeight = Math.max(maxCanvasHeight,this.offsetTop+elem.outerHeight());
				
				minCanvasLeft = Math.min(minCanvasLeft,this.offsetLeft);
				minCanvasTop = Math.min(minCanvasTop,this.offsetTop);
			});
			
			var laneLayout = this.element.find('.lane-layout');
			
			maxCanvasWidth = Math.max(maxCanvasWidth,laneLayout.outerWidth());
			maxCanvasHeight = Math.max(maxCanvasHeight,laneLayout.outerHeight());
			
			this.element.find('>canvas')
			.attr('width',maxCanvasWidth)
			.attr('height',maxCanvasHeight).css({
				width:maxCanvasWidth,
				height:maxCanvasHeight
			});
			
			if(minCanvasLeft<0||minCanvasTop){
				var xDelt = minCanvasLeft>0?0:-minCanvasLeft,
					yDelt = minCanvasTop>0?0:-minCanvasTop;
				
				this.element.find('.point,.node').each(function(){
					$(this).css({
						left:this.offsetLeft+xDelt,
						top:this.offsetTop+yDelt
					});
				});
			}
			
		},
		/**
		 * 键盘移动
		 */
		_keyMove:function(xDelt,yDelt){
			var clickElement = this.element.find('.node.ui-click');
			if(clickElement.length){
				this.executeCommand('doMoveElements',clickElement,this.element.find('.node.ui-click,.ui-selected'),xDelt,yDelt);
			}
		},
		/**
		 * 模型节点变化
		 * 1：增加，删除节点
		 * 2：增加，删除连接线
		 */
		_afterModelsChange:function(event){
			//
			this._trigger('afterModelsChange',event,this._buildTreeData());
		},
		
		_afterTextChange:function(nodeElement,text){
			var id = nodeElement.attr('id');
			
			if(nodeElement.is('.point-text')){
				id = nodeElement.parent('.transition').attr('id');
			}
			
			if(id){
				this._trigger('afterTextChange',null,{id:id,text:text});
			}
		},
		
		_buildTreeData:function(){
			return {
				id:this.options.id+'_root',
				text:'流程模型',
				group:'root',
				children:[{
					id:'nodes',
					expand:true,
					text:'流程节点',
					children:this._buildNodeModels()
				},
				{
					id:'transitions',
					expand:true,
					text:'流程连线',
					children:this._buildTransitionsModels()
				}]
			};
		},
		
		_buildNodeModels:function(){
			
			var nodes = [];
			
			this.element.find('.node').each(function(){
				nodes.push($.extend({},$(this).data(),{
					id:this.getAttribute('id'),
					text:$.trim($(this).text()),
					group:this.className
				}));
			});
			
			return nodes;
		},
		
		_buildTransitionsModels:function(){
			var transitions = [];
			
			this.element.find('.transition').each(function(){
				transitions.push($.extend({},$(this).data(),{
					id:this.getAttribute('id'),
					text:$.trim($(this).text()),
					group:this.className
				}));
			});
			
			return transitions;
		},
		/**
		 * 显示浮动面板
		 */
		_showOverpanels:function(element){
			//
			var left = element[0].offsetLeft,
				top =  element[0].offsetTop,
				paddingLeft = Math.max(element.outerWidth(),60),
				overpanels = this.options.overpanels;
			
			var elemGroups = element[0].className.split(' ');
			
			var topCount = 0,maxTopCount=3,
				centerCount = 0,maxCenterCount=2,
				bottomCount = 0,maxBottomCount=3;
			//
			this.overpanelsElement.find('.over-item').each(function(){
				var overItemElement = $(this),
					data = overItemElement.data(),
					index = data.index,
					overItem = overpanels[index];
				
				
			
				
				var show = true;
				if(overItem.excludes){	//overItem.excludes 排除的分组
					for(var i=0;i<elemGroups.length;i++){
						if($.inArray(elemGroups[i],overItem.excludes)!=-1){
							show = false;
							break;
						}
					}
				}
				
				if(show){
					for(var i=0;i<elemGroups.length;i++){
						if($.inArray(elemGroups[i],overItem.excludes)!=-1){
							show = true;
							break;
						}
					}
				}
				
				overItemElement
					.removeClass('over-top over-top-first over-top-last over-center over-bottom over-bottom-first over-bottom-last')
				if(show){
					//添加节点到位置  下，上，
					if(topCount<maxTopCount){
						topCount++;
						_addIndexElementClass(overItemElement,topCount,maxTopCount,'over-top');
					}else if(centerCount<maxCenterCount){
						centerCount++;
						_addIndexElementClass(overItemElement,centerCount,maxCenterCount,'over-center');
					}else if(bottomCount<maxBottomCount){
						bottomCount++;
						_addIndexElementClass(overItemElement,bottomCount,maxBottomCount,'over-bottom');
					}
				}
			});
			
			this.overpanelsElement.css({
				left:left,
				top:top-_overpanelTopHeight-1,
				width:paddingLeft+_overpanelRightWidth
			}).show();
			//当前悬浮对应的节点
			this.overNodeElement = element;
		},
		
		/**
		 * 初始化canva上下文
		 * this.canvaContext 主上下文
		 */
		_initCanvaContext:function(){
			var main = document.createElement('canvas');
			var trace = document.createElement('canvas');
			var exp = document.createElement('canvas');
			
			main.setAttribute('id','canvas_main');
			trace.setAttribute('id','canvas_trace');
			exp.setAttribute('id','canvas_exp');
			
			this.element.append(exp).append(main).append(trace);
			
			if(!$.support.boxModel&&G_vmlCanvasManager){
				G_vmlCanvasManager.initElement(main);
				G_vmlCanvasManager.initElement(trace);
				G_vmlCanvasManager.initElement(exp);
			}
			
			this.canvasContext = main.getContext('2d');
			this.canvasContextTrace = trace.getContext('2d');
			this.canvasContextExport = exp.getContext('2d');
			
			this.canvasElement = $(main);
			
			main = null;
			trace = null;
		},
		
		_initOverpanels:function(){
			this.overpanelsElement = this.element.find('>.over-panels');
			if(this.overpanelsElement.length==0){
				
				this.overpanelsElement = $('<div class="over-panels"></div>').appendTo(this.element);
				
				var htmls = [];
				
				if(this.options.overpanels){
					for(var i=0;i<this.options.overpanels.length;i++){
						htmls.push(this._buildOverItemHtml(this.options.overpanels[i],i));
					}
				}
				
				this.overpanelsElement.html(htmls.join(''));
			}
		},
		
		_buildOverItemHtml:function(overItem,index){
			var htmls = [],
				styles = ['over-item'],
				datas = {};
			
			if(!overItem.name){
				return '';
			}
			
			styles.push(overItem.name);
			datas.name = overItem.name;
			datas.index = index;
			
			if(overItem.subname){
				styles.push(overItem.subname);
				datas.subname = overItem.subname; 
			}
			
			htmls.push('<span title="'+(overItem.caption||'')+'" class="'+styles.join(' ')+'"');
			
			for(var i in datas){
				htmls.push(' data-'+i+'='+datas[i]+' ');
			}
			
			htmls.push('></span>');
			
			return htmls.join('');
		},
		
		_mouseStart: function(event) {
			//拖动元素
			//拖动线条
			//选择区域
			var dragElement = $(event.target);
			
			if(this.startSequenceNode){
				
			}else if(dragElement.hasClass('node')
					||dragElement.hasClass('point')){
				//拖动元素
				this.currentDrag = dragElement;
				this.helper = this._createHelper(event,this.currentDrag);
			}else if(dragElement.hasClass('point-text')){
				//拖动线条的点
				//this.currentDrag = dragElement;
			}else if(dragElement.hasClass('col-resize-handler')){
				//宽度调整
				this.resizeHelper = this.element.find('.resize-helper');
				if(this.resizeHelper.length==0){
					this.resizeHelper = $('<div class="resize-helper"></div>').appendTo(this.element);
				}
				
				this.currentDrag = dragElement.parent();
				
				this.resizeHelper.addClass('resizing').css({
					left:this.currentDrag[0].offsetLeft,
					top:this.currentDrag[0].offsetTop,
					height:this.element.height() - this.currentDrag[0].offsetTop-25
				});
				
			}else if(dragElement.hasClass('row-resize-handler')){
				this.rowResizeHelper = this.element.find('.resize-helper');
				if(this.rowResizeHelper.length==0){
					this.rowResizeHelper = $('<div class="resize-helper"></div>').appendTo(this.element);
				}
				
				this.currentDrag = dragElement.parent();
				
				this.rowResizeHelper.addClass('row-resizing').css({
					left:this.currentDrag[0].offsetLeft,
					top:this.currentDrag[0].offsetTop,
					width:this.element.width()-25
				});
				
			}else{
				this.selectionHelper = this.element.find('.selection-helper');
				
				this.selectees = $('.node,.transition,.point', this.element[0]);
				
				this.selectees.each(function() {
					var $this = $(this),
						pos = $this.offset();
					$.data(this, "selectable-item", {
						element: this,
						$element: $this,
						left: this.offsetLeft,
						top: this.offsetTop,
						right: this.offsetLeft + $this.outerWidth(),
						bottom: this.offsetTop + $this.outerHeight(),
						startselected: false,
						selected: $this.hasClass("ui-selected"),
						selecting: $this.hasClass("ui-selecting"),
						unselecting: $this.hasClass("ui-unselecting")
					});
				});
				
				this.selectees.filter(".ui-selected").each(function() {
					var selectee = $.data(this, "selectable-item");
					selectee.startselected = true;
					if (!event.metaKey && !event.ctrlKey) {
						selectee.$element.removeClass("ui-selected");
						selectee.selected = false;
						selectee.$element.addClass("ui-unselecting");
						selectee.unselecting = true;
						// selectable UNSELECTING callback
//						that._trigger("unselecting", event, {
//							unselecting: selectee.element
//						});
					}
				});
				
				if(this.selectionHelper.length==0){
					this.selectionHelper = $('<div class="selection-helper"></div>').appendTo(this.element);
				}
				
				this.selectionHelper.addClass('selecting');
				this.selectionStartPos = {left:event.pageX,top:event.pageY};
			}
			
		},
		
		_mouseDrag: function(event) {
			if(this.startSequenceNode){
				this._showSequenceTrace(event);
			}else if(this.helper){
				this.helper.css({
					left:event.pageX,
					top:event.pageY
				});
				
				//
				this.canvasContextTrace.clearRect(0,0,this.canvasElement.width(),this.canvasElement.height());
				
				this.canvasContextTrace.beginPath();
				this.canvasContextTrace.lineWidth = 0.5;
				
				var x = event.pageX-this.element.offset().left+this.element[0].scrollLeft,
					y = event.pageY-this.element.offset().top+this.element[0].scrollTop;
				
				drawDashLine(this.canvasContextTrace,x,0,x,this.canvasElement.height(),2);
				drawDashLine(this.canvasContextTrace,0,y,this.canvasElement.width(),y,2);
				this.canvasContextTrace.closePath();
				//画文本
				this.canvasContextTrace.strokeText('('+parseInt(x)+','+parseInt(y)+')',x,y);
				this.canvasContextTrace.stroke();
				
				//画线轨迹
				if(this.currentDrag.is('.point')){
					//如果拖动的是线条上的拐点
				}else if(this.currentDrag.is('.node')){
					//如果拖动的是节点
				}
				
			}else if(this.resizeHelper){
				//
				var left = this.resizeHelper[0].offsetLeft;
				var width = event.pageX-left-this.element.offset().left+this.element[0].scrollLeft;
				if(width>0){
					this.resizeHelper.width(width);
				}
			}else if(this.rowResizeHelper){
				var height = event.pageY - this.element.offset().top+this.element[0].scrollTop;
				this.rowResizeHelper.height(height);
				//
			}else if(this.selectionHelper){//区域选择
				//计算位置
				var pos = {
					left:Math.min(event.pageX,this.selectionStartPos.left) - this.element.offset().left+this.element[0].scrollLeft,
					top:Math.min(event.pageY,this.selectionStartPos.top)- this.element.offset().top+this.element[0].scrollTop,
					width:Math.abs(event.pageX-this.selectionStartPos.left),
					height:Math.abs(event.pageY-this.selectionStartPos.top)
				};
				
				this.selectionHelper.css(pos);
				
				this.selectees.each(function(){
					var selectee = $.data(this, "selectable-item"),
						hit = false;
					
					hit = (selectee.left > pos.left && selectee.right < pos.left+pos.width && selectee.top > pos.top && selectee.bottom < pos.top+pos.height);
					
					if (hit) {
						// SELECT
						if (selectee.selected) {
							selectee.$element.removeClass("ui-selected");
							selectee.selected = false;
						}
						if (selectee.unselecting) {
							selectee.$element.removeClass("ui-unselecting");
							selectee.unselecting = false;
						}
						if (!selectee.selecting) {
							selectee.$element.addClass("ui-selecting");
							selectee.selecting = true;
							// selectable SELECTING callback
//							that._trigger("selecting", event, {
//								selecting: selectee.element
//							});
						}
					} else {
						// UNSELECT
						if (selectee.selecting) {
							if ((event.metaKey || event.ctrlKey) && selectee.startselected) {
								selectee.$element.removeClass("ui-selecting");
								selectee.selecting = false;
								selectee.$element.addClass("ui-selected");
								selectee.selected = true;
							} else {
								selectee.$element.removeClass("ui-selecting");
								selectee.selecting = false;
								if (selectee.startselected) {
									selectee.$element.addClass("ui-unselecting");
									selectee.unselecting = true;
								}
								// selectable UNSELECTING callback
//								that._trigger("unselecting", event, {
//									unselecting: selectee.element
//								});
							}
						}
						if (selectee.selected) {
							if (!event.metaKey && !event.ctrlKey && !selectee.startselected) {
								selectee.$element.removeClass("ui-selected");
								selectee.selected = false;

								selectee.$element.addClass("ui-unselecting");
								selectee.unselecting = true;
								// selectable UNSELECTING callback
//								that._trigger("unselecting", event, {
//									unselecting: selectee.element
//								});
							}
						}
					}
				});
			}
			
		},
		
		_mouseStop: function(event) {
			if(this.startSequenceNode){
				this.stopSequence($(event.target));
			}else if(this.helper&&this.currentDrag){
				var xDelt = this.helper.offset().left -this.currentDrag.offset().left-this.currentDrag.width()/2-2,
					yDelt = this.helper.offset().top - this.currentDrag.offset().top-this.currentDrag.height()/2-2;
				//计算位置
				var moves = [];
				if(this.currentDrag.hasClass('ui-selected')){
					moves = this.element.find('.ui-selected');
				}else{
					moves.push(this.currentDrag[0]);
					moves = $(moves);
				}
				
				this.executeCommand('doMoveElements',this.currentDrag,moves,xDelt,yDelt);
			}else if(this.resizeHelper){
				this.resizeHelper.removeClass('resizing');
				
				this.executeCommand('doColResize',this.currentDrag,this.resizeHelper.width());
				
				this.resizeHelper = null;
			}else if(this.rowResizeHelper){
				this.rowResizeHelper.removeClass('row-resizing');
				
				this.executeCommand('doRowResize',this.currentDrag,this.rowResizeHelper.height());
				
				this.rowResizeHelper = null;
			}else if(this.selectionHelper){
				
				$(".ui-unselecting", this.element[0]).each(function() {
					var selectee = $.data(this, "selectable-item");
					selectee.$element.removeClass("ui-unselecting");
					selectee.unselecting = false;
					selectee.startselected = false;
				});
				
				$(".ui-selecting", this.element[0]).each(function() {
					var selectee = $.data(this, "selectable-item");
					selectee.$element.removeClass("ui-selecting").addClass("ui-selected");
					selectee.selecting = false;
					selectee.selected = true;
					selectee.startselected = true;
				});
				
				this._refreshTransitions();
				
				this.selectionHelper.removeClass('selecting');
				this.selectionHelper = null;
				this.selectionStartPos = null;
				this.selectees = null;
			}
			
			this.currentDrag = null;
			
			this.helper&&this.helper.remove();
			this.helper = null;
			
		},
		
		_isInStraightLine:function(pointElement){
			//pointElement
			var transitionArg =this._getTransitionArg(pointElement.parent());
			//计算point的位置
			
			var index = pointElement.prevAll('.point').not('.'+_inStraightPointStyle).length;
			
			var points = this._getLinePoints(transitionArg);
			
			var pointPos = getRectCenterPos({
				left:pointElement[0].offsetLeft,
				top:pointElement[0].offsetTop
			}, pointElement.outerWidth(), pointElement.outerHeight());
			
			var p1 = points[index],
				p2 = points[index+2];
			
			if(pointElement.hasClass(_inStraightPointStyle)){
				p2 = points[index+1];
			}
			
			return this._isStraightLinePoint(p1, p2, pointPos.left, pointPos.top, 3);
		},
		
		_createHelper:function(event,dragElement){
			var helper = $('<div class="drop-helper" id="drag_helper"></div>').append(dragElement.clone());
			this.options.container =this.options.container||$('body',document);
			
			if(!helper.parents('body').length){
				helper.appendTo(this.options.container);
			}
				
			if(helper[0] != this.element[0] && !(/(fixed|absolute)/).test(helper.css("position")))
				helper.css("position", "absolute");
			return helper;
		},
		
		/**
		 * 线条所在的canvas点击
		 */
		_clickCanvasAt:function(x,y,event){
			var points = this._findLinePointsAt(x,y);
			if(points){
				var lineId = points[0].id;
				var lineElement = this.element.find('.transition#'+lineId);
				
				this._refreshLineCenterPoints(lineElement,points);
				
				this._clickElement(lineElement,event);
			}
		},
		
		_refreshLineCenterPoints:function(lineElement,points){
			
			if(!points){
				points = this._getLinePoints(this._getTransitionArg(lineElement));
			}
			
			//显示中点
			lineElement.find('.point').not('.'+_inStraightPointStyle).each(function(index){
				var centerPointElem = $(this).prev('.'+_inStraightPointStyle);
				if(!centerPointElem.length){
					centerPointElem = $('<div class="point '+_inStraightPointStyle+'"></div>').insertBefore(this);
				}
				//最后一个节点
				if(index===points.length-3){
					var nextElem = $(this).next('.'+_inStraightPointStyle);
					if(!nextElem.length){
						$('<div class="point '+_inStraightPointStyle+'"></div>').insertAfter(this);
					}
				}
			});
			
			//
			if(lineElement.find('.'+_inStraightPointStyle).length==0){
				lineElement.append('<div class="point '+_inStraightPointStyle+'"></div>');
			}
			
			//计算位置
			lineElement.find('.'+_inStraightPointStyle).each(function(index){
				//
				var p1 = points[index],
					p2 = points[index+1],
					cx = (p1.x+p2.x)/2-_pointRadius,
					cy = (p1.y+p2.y)/2-_pointRadius;
				
				$(this).css({
					left:cx,
					top:cy
				});
				
			});
		},
		/**
		 * 单击元素（包括节点和线条）
		 */
		_clickElement:function(clickElement,event){
			this.element.find('.ui-click').not(clickElement).removeClass('ui-click');
			clickElement.addClass('ui-click');
			//触发元素点击操作
			this._trigger('elementClick',null,{target:clickElement[0]});
			
			if(!event||!event.ctrlKey){
				this.element.find('.ui-selected').not(clickElement).removeClass('ui-selected');
			}
			
			if(clickElement.hasClass('ui-selected')){
				return;
			}
			
			clickElement.addClass('ui-selected');
			
			this._trigger('elementChange');
			
			this._refreshTransitions();
		},
		
		_findLinePointsAt:function(x,y){
			for(var i=0;i< this.linePointsList.length;i++){
				var points = this.linePointsList[i];
				
				if(this._containsPoint(points,x,y)){
					return points;
				}
			}
			return null;
		},
		
		_containsPoint:function(points,x,y){
			var tolerance = 3;
			for(var i=1;i<points.length;i++){
				if(this._isStraightLinePoint(points[i-1],points[i],x,y,tolerance)){
					return true;
				}
			}
			return false;
		},
		
		_isStraightLinePoint:function(point1,point2,px,py,tolerance){
			//不在起始节点和结束节点形成的矩形区域内的，快速返回false
			if(px<Math.min(point1.x,point2.x)-tolerance
					||px>Math.max(point1.x,point2.x)+tolerance
					||py<Math.min(point1.y,point2.y)-tolerance
					||py>Math.max(point1.y,point2.y)+tolerance){
				return false;
			}
			
			//计算坐标是否在直线的可点击范围内
			var v1x = point2.x - point1.x,
				v1y = point2.y - point1.y,
				v2x = px - point1.x,
				v2y = py - point1.y,
				numerator = v2x * v1y - v1x * v2y,
				denominator = v1x * v1x + v1y * v1y,
				squareDistance = numerator * numerator / denominator;
			
			return squareDistance <= tolerance * tolerance;
		},
		
		/**
		 * 刷新流线条
		 */
		_refreshTransitions:function(){
			//调整画面大小
			this._fixPosition();
			
			var that = this,
				canvasRect = this._calCanvasRect();
			this.canvasContext.clearRect(0,0,canvasRect.width,canvasRect.height);
			
			var laneLayoutHeight = this.element.find('>.lane-layout').outerHeight();
			//画泳道线
			this.element.find('>.lane-layout>.lane').each(function(index){
				if(index>0){
					var laneElement = $(this),
					x = this.offsetLeft+1,
					y = 0,
					w = laneElement.width()+1;
				
					var points = [];
					
					if(index==1){
						points.push({x:x,y:y});
					}
					
					points = points.concat([{x:x,y:laneLayoutHeight},{x:x+w,y:laneLayoutHeight},{x:x+w,y:y}]);
					
					_drawLine(that.canvasContext,points,'#ddd');
				}
				
			});
			
			var transitionsArgs = [];
			this.element.find('.transition').each(function(){
				var transitionArg = that._getTransitionArg(this);
				transitionsArgs.push(transitionArg);
			});
			
			this.canvasContext.fillStyle = _defaultColor; 
			this.canvasContext.strokeStyle = _defaultColor;
			this._drawLines(transitionsArgs);
		},
		
		/**
		 * 线条集合
		 */
		_drawLines:function(lines){
			this.linePointsList = [];
			
			for(var i=0;i<lines.length;i++){
				this._addLine(lines[i]);
			}
		},
		/**
		 * 增加线条
		 */
		_addLine:function(line){
			var points = this._getLinePoints(line);
			
			var color = line.selected?_selectedColor:null;
			//画线
			_drawLine(this.canvasContext,points,color);
			//添加箭头
			_drawLineAnchor(this.canvasContext,points[points.length-2],points[points.length-1],line.endRect,color);
			//描述信息
			this._showLineText(line,points);
			
			this.linePointsList.push(points);
		},
		/**
		 * 显示线条上的文本
		 */
		_showLineText:function(line,points){
			var textElement = this.element.find('.transition#'+line.id+' .point-text');
			if(textElement.length&&points.length>1){
				var radius = textElement.data('radius')||30;
				var degree = textElement.data('degree')||0;
				
				var radian = Math.PI/180*degree;

			    var x = points[1].x + Math.cos(radian)*radius;
			    var y = points[1].y + Math.sin(radian)*radius;
				 
				textElement.css({
					left:x,
					top:y
				});
			}
		},
		
		/**
		 * 获取行上的点集合
		 */
		_getLinePoints:function(line){
			line = line||{};
			
			var poses = [],points = [];
			poses.push(line.startPos);
			if(line.g){
				poses = poses.concat(line.g);
			}
			poses.push(line.endPos);
			
			for(var i=0;i<poses.length;i++){
				if(poses[i]){
					points.push({x:poses[i].left,y:poses[i].top,id:line.id});
				}
			}
			
			return points;
		},
		
		/**
		 * 获取线条变量
		 */
		_getTransitionArg:function(transElement){
			if(!transElement)return null;
			transElement = $(transElement);
			
			var	id	  = transElement.attr('id'),
				fromId= transElement.data('sourceRef'),
				toId  = transElement.data('targetRef'),
				from  = $('#'+fromId,this.element),
				to 	  = $('#'+toId,this.element);

			var transitionArg = {
				id:id,
				text:id,
				fromId:fromId,
				selected:transElement.hasClass('ui-selected')||transElement.find('.point.ui-selected').length>0,
				toId:toId,
				startPos:getRectCenterPos(calculatePos(from),from.outerWidth(),from.outerHeight()),
				endPos:getRectCenterPos(calculatePos(to),to.outerWidth(),to.outerHeight()),
				endRect:{width:to.outerWidth(),height:to.outerHeight()},
				g:[]
			};
			
			//拐点
			$('.point',transElement).not('.'+_inStraightPointStyle).each(function(){
				transitionArg.g.push({
					left:this.offsetLeft+_pointRadius,
					top :this.offsetTop+_pointRadius
				});
			});
			
			return transitionArg;
		},
		
		/**
		 * 获取拐点集合
		 */
		_getWaypoints:function(transElement){
			var tranArgs = this._getTransitionArgs(transElement);
			var waypoints = [];
			waypoints.push(tranArgs.startPos);
			waypoints = waypoints.concat(tranArgs.g);
			waypoints.push(tranArgs.endPos);
			
			return waypoints;
		},
		
		/**
		 * 设置canvas的区域
		 */
		_calCanvasRect:function(){
			var domEl = this.element[0];
			var canvasRect = {
				width:domEl.scrollWidth,
				height:domEl.scrollHeight
			};
			if($.support.boxModel){
				//显示指定canvas的高和宽的属性，防止canvas缩放
				this.element.find('canvas').attr('width',canvasRect.width).attr('height',canvasRect.height);
			}
			this.element.find('canvas,.bg').css(canvasRect);
			return canvasRect;
		},
		/**
		 * 
		 */
		_addTransition:function(nodeElement1,nodeElement2){
			var nodeId1 = nodeElement1.attr('id'),
				nodeId2 = nodeElement2.attr('id'),
				lineId = nodeId1+'_'+nodeId2;
			
			if(nodeId1===nodeId2||this..finelementd('.transition[data-source-ref='+nodeId1+'][data-target-ref='+nodeId2+']').length){
				return null;
			}
			
			var transitionElement = $('<div id="'+lineId+'" class="transition" data-source-ref="'+nodeId1+'" data-target-ref="'+nodeId2+'"></div>').appendTo(this.element);
			return transitionElement;
		},
		
		/**
		 * 添加节点
		 */
		_addNode:function(id,text,type,x,y){
			var htmls = [],
				styles = ['node'];
			
			if(type){
				styles.push(type);
			}
			
			x = x||0;
			y = y||0;
			
			var nodeId = id||this._genNodeUUID();
			
			htmls.push('<div id="'+nodeId+'" class="'+styles.join(' ')+'"');
			htmls.push(' style="left:'+x+'px;top:'+y+'px;"');
			htmls.push('>');
			htmls.push($.youi.stringUtils.fixValue(text));
			htmls.push('</div>');
			
			this.element.append(htmls.join(''));
			
			return this.element.find('.node#'+nodeId);
		},
		/**
		 * 
		 */
		_genNodeUUID:function(){
			this._UUID = this._UUID||1;
			
			var nodeId = 'node'+this._UUID++;
			
			if(this.element.find('.node#'+nodeId).length==0){
				return nodeId;
			}
			
			return this._genNodeUUID();
		},
		
		/**
		 * 删除流程元素
		 */
		_doRemove:function(element){
			if(!element||element.length==0){
				element = this.element.find('.ui-click');
			}
			
			var refTransitions;
			if(element.hasClass('node')){
				var nodeId = element.attr('id');
				refTransitions = this.element.find('.transition[data-source-ref='+nodeId+'],.transition[data-target-ref='+nodeId+']');
			}
			//删除元素
			this.executeCommand('doRemoveSelected',element,refTransitions);
		},
		
		/**
		 * 接口方法，重定位
		 */
		_resize:function(){
			this.element.find('canvas').andSelf().height(this.options.height)
				.width(this.element.width());
			
			this.element.find('canvas').width(this.element.width()-20);
			
			//lane重新布局
			var laneLayout = this.element.find('>.lane-layout'),
				laneSumWidth = 0;
			
			laneLayout.find('>.lane').each(function(){
				laneSumWidth += $(this).outerWidth();
			});
			
			laneLayout.width(laneSumWidth);
			
			this._refreshTransitions();
		},
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	}));
	
	//计算定位
	function calculatePos(element){
		if(!element.length)return;
		var offsetParent = element.offsetParent(),
			pos = element.offset();
		//alert(offsetParent.attr('id'));
		return {
			left:pos.left-offsetParent.offset().left+offsetParent.scrollLeft(),
			top :pos.top-offsetParent.offset().top+offsetParent.scrollTop()
		};
	}
	
	//获得区域的中心位置
	function getRectCenterPos(pos,width,height){
		if(!pos){
			return null;
		}
		return {
			left:pos.left+width/2,
			top :pos.top+height/2
		};
	}
	
	function _getElemCenterPoint(dom){
		var element = $(dom);
		return {
			x:element[0].offsetLeft+element.outerWidth()/2,
			y:element[0].offsetTop+element.outerHeight()/2
		};
	}
	
	/**
	 * 画线
	 */
	function _drawLine(context,points,color){
		context.beginPath();
		
		context.lineJoin = 'round';
		if(color){
			context.strokeStyle = color; 
		}
		
		for(var i=1;i<points.length;i++){
			_drawStraightLine(context,points[i-1],points[i]);
		}
		
		context.closePath();
		context.stroke();
		
		context.strokeStyle = _defaultColor;
	}
	
	/*
	 * 绘制直线
	 * 起始节点
	 * 结束节点
	 */
	function _drawStraightLine(context,startPoint,endPoint){
		context.moveTo(startPoint.x,startPoint.y);
		context.lineTo(endPoint.x,endPoint.y);
	}
	/*
	 * 绘制箭头锚
	 */
	function _drawLineAnchor(context,point1,point2,endRect,color){
		var r = 5/Math.sin(30*Math.PI/180);
		//计算正切角度
		var tag = (point2.y-point1.y)/(point2.x-point1.x);
		tag = isNaN(tag)?0:tag;
		
		var o = Math.atan(tag)/(Math.PI/180)-30;//计算角度
		var rectTag = endRect.height/endRect.width;
		//计算箭头位置
		var xFlag = point1.y<point2.y?-1:1,
			yFlag = point1.x<point2.x?-1:1,
			arrowTop,
			arrowLeft;
		//按角度判断箭头位置
		if(Math.abs(tag)>rectTag&&xFlag==-1){//top边
			arrowTop  = point2.y-endRect.height/2;
			arrowLeft = point2.x+xFlag*endRect.height/2/tag;
		}else if(Math.abs(tag)>rectTag&&xFlag==1){//bottom边
			arrowTop  = point2.y+endRect.height/2;
			arrowLeft = point2.x+xFlag*endRect.height/2/tag;
		}else if(Math.abs(tag)<rectTag&&yFlag==-1){//left边
			arrowTop  = point2.y+yFlag*endRect.width/2*tag;
			arrowLeft = point2.x-endRect.width/2;
		}else if(Math.abs(tag)<rectTag&&yFlag==1){//right边
			arrowTop  = point2.y+endRect.width/2*tag;
			arrowLeft = point2.x+endRect.width/2;
		}
		
		if(arrowLeft&&arrowTop){
			//计算低位偏移
			var lowDeltX = r*Math.cos(o*Math.PI/180);
			var lowDeltY = r*Math.sin(o*Math.PI/180);
			//计算高位偏移
			var o = 90-o-60;//计算角度
			var highDeltX = r*Math.sin(o*Math.PI/180);
			var highDeltY = r*Math.cos(o*Math.PI/180);
			var flag = 1;
			if(point1.x>point2.x){
				flag = -1;
			}
			
			context.beginPath();
			
			if(color){
				context.fillStyle = color; 
				context.strokeStyle = color;
			}
			//画箭头
			context.moveTo(arrowLeft,arrowTop);
			context.lineTo(arrowLeft-lowDeltX*flag,arrowTop-lowDeltY*flag);
			context.lineTo(arrowLeft-highDeltX*flag,arrowTop-highDeltY*flag);
			context.lineTo(arrowLeft,arrowTop);
			context.closePath();
			context.fill();
			context.stroke();
			
			context.fillStyle = _defaultColor; 
			context.strokeStyle = _defaultColor;
			
		}
	}
	
	/**
	 * 绘制虚线
	 */
	function drawDashLine(ctx, x1, y1, x2, y2, dashLength) {
		var dashLen = dashLength === undefined ? 5 : dashLength, 
			xpos = x2 - x1, //得到横向的宽度;
			ypos = y2 - y1, //得到纵向的高度;
			numDashes = Math.floor(Math.sqrt(xpos * xpos + ypos * ypos) / dashLen);
		//利用正切获取斜边的长度除以虚线长度，得到要分为多少段;
		for (var i = 0; i<numDashes; i++) {
			if (i % 2 === 0) {
				ctx.moveTo(x1 + (xpos / numDashes) * i, y1 + (ypos / numDashes)
						* i);
				//有了横向宽度和多少段，得出每一段是多长，起点 + 每段长度 * i = 要绘制的起点；
			} else {
				ctx.lineTo(x1 + (xpos / numDashes) * i, y1 + (ypos / numDashes)
						* i);
			}
		}
		ctx.stroke();
	}
	
	function _addIndexElementClass(element,index,maxCount,className){
		element.addClass(className);
		
		if(index==1){
			element.addClass(className+'-first');
		}
		
		if(index==maxCount){
			element.addClass(className+'-last');
		}
	}
})(jQuery);