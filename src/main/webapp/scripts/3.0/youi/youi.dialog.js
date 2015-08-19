(function($) {
	var _log = $.youi.log;
	/**
	 *  dialog组件
	 * @author  zhouyi
	 * @version 1.0.0
	 * @date 2009-06-03
	 */
	if($.ui.dialog){
		return;
	}
	
	$.widget("youi.dialog", $.extend({}, $.ui.mouse, {
		options:{
			position: 'center',
			width:800,
			zIndex:1000
		},
		
		_create: function() {
			this.element.addClass('youi-dialog');
			//this.element.css('zIndex',this.options.zIndex);
			this.originalTitle = this.element.attr('title');
			this.dialogId = $.youi.dialog.getId(this.element);
			this.origContainter = this.element.parent();//原来的位置
			
			if(this.options.zIndex<1000){
				this.options.zIndex = 1000;
			}
			
			this._createDialogContianer();//html生成
			
			var self = this,
				options = this.options,
				uiDialogContent =  this.uiDailogContianer.find('.youi-dialog-content:first');
			//
			uiDialogContent.append(this.element);
			
			this._initAction();
			
			$('#'+this.dialogId).width(this.options.width);
		},
		/**
		 * 
		 */
		_defaultHtmls:function(){
			
		},
		
		_createDialogContianer:function(){
			this.uiDailogContianer = $('<div id="'+this.dialogId+'" style="z-index:'+this.options.zIndex+'" class="youi-dialog-container popover"/>');
			
			var htmls = [],
			title = this.options.title || this.originalTitle || '&nbsp;';
			
			htmls.push(		'<div class="youi-dialog-titlebar popover-title">');
			htmls.push(		'	<div><div>');
			if(this.options.showIcon!=false){
				htmls.push('<span class="glyphicon glyphicon-th-large"></span>');
			}
			htmls.push('<a></a><a>'+title+'</a></div></div>');
			if(this.options.hideCloseIcon!=true){
				htmls.push(		'	<a title="关闭" class="youi-dialog-titlebar-close youi-icon glyphicon close pull-right"></a>');
			}
			htmls.push(		'</div>');
			htmls.push(		'<div class="youi-dialog-ml youi-bgcolor"><div class="youi-dialog-mr"><div class="youi-dialog-content"');
			if(this.options.height){
				htmls.push(' style="height:'+this.options.height+'px;"');
			}
			htmls.push('></div></div></div>');
			htmls.push(		'<div class="youi-dialog-buttonpane');
			if(this.options.buttons&&this.options.buttons.length>0){
				htmls.push(' buttons">');
				htmls.push(this._buttonsHtml());
			}else{
				htmls.push('">');
			}
			htmls.push('</div>');
			
			htmls.push(		'<div class="dragging-dialog-helper"></div>');
			
			this.uiDailogContianer.html(htmls.join(''));
			
			//绑定到page对象,在page对象destroy的时候执行删除操作
			var pageElement = this.element.parents('.youi-page:first');
			if(pageElement.length){
				try{
					pageElement.page('addDialog',this.uiDailogContianer);
				}catch(err){
					
				}
			}
			$('body',document).append(this.uiDailogContianer);
		},
		
		_buttonsHtml:function(){
			return this.options.buttons?$.youi.buttonUtils.createButtons(this.options.buttons,'right'):'';
		},
		
		_initAction:function(){
			var self = this;
			//alert($('#'+this.dialogId+' .youi-dialog-titlebar').length);
			$('#'+this.dialogId+' .youi-dialog-titlebar').mousable({
				delay:100,
				start:function(event){
					$('.dragging-dialog-helper',this.parentNode)
						.addClass('youi-dragging')
						.css({
							width:this.parentNode.offsetWidth,
							height:this.parentNode.offsetHeight,
							left:0,
							top:0
						});
					//记录鼠标按下坐标点的左、上边距
					self.originalOffsetLeft = event.pageX-this.parentNode.offsetLeft;
					self.originalOffsetTop  = event.pageY-this.parentNode.offsetTop;
					$(this.parentNode).disableSelection();
					return true;
				},
				drag:function(event){
					var left = event.pageX-this.parentNode.offsetLeft-self.originalOffsetLeft,
						top  = event.pageY-this.parentNode.offsetTop-self.originalOffsetTop;
					$('.dragging-dialog-helper',this.parentNode).css({
						left:left,
						top:top
					});
				},
				stop:function(event){
					var helper = $('.dragging-dialog-helper',this.parentNode);
					var pos = helper.offset();
					if(pos.top<0)pos.top=0;
					$(this.parentNode).css(pos);
					helper.removeClass('youi-dragging');
					self.originalOffsetLeft = null;
					self.originalOffsetTop = null;
					$(this.parentNode).enableSelection();
					
					$('.youi-dialog:first',this.parentNode).trigger('dialog.stop');
				}
			});
			
			$('#'+this.dialogId+' .youi-dialog-titlebar-close').bind('mouseover',function(){
				$(this).addClass('over');
			}).bind('mouseout',function(){
				$(this).removeClass('over');
			}).bind('click',function(){
				self.close();
			});
			
			$.youi.buttonUtils.addButtonActionListener($('#'+this.dialogId+' .youi-dialog-buttonpane'),
					this.options.buttonActions);
		},
		
		_execButton:function(id){
			var buttons = this.options.buttons;
			if(buttons&&buttons.length){
				for(var i=0;i<buttons.length;i++){
					if(buttons[i].name==id){
						buttons[i].action();
						break;
					}
				}
			}
		},
		
		confirmOpen:function(openOptions){
			this.openOptions = openOptions;
			this.open('',9999);
		},
		
		confirmCallback:function(){
			if(this.openOptions&&$.isFunction(this.openOptions.confirmFunc)){
				this.openOptions.confirmFunc.apply(this.openOptions.widgetInstance,this.openOptions.params);
			}
			this.openOptions = null;
			this.close();
		},
		
		open:function(title,zIndex){
			var options = this.options,
				uiDialog = this.uiDailogContianer;
			
			if(uiDialog.is(':visible')){
				return;
			}
				
			if(uiDialog&&!uiDialog.parent().is('body')){
				$('body',document).append(uiDialog);
			}
			
			this.overlay = options.modal ? new $.youi.dialog.overlay(this) : null;
			
			if(title){
				$('.youi-dialog-titlebar a:first',uiDialog).text(title);
			}
			//
			//$('.youi-dialog-container').not(uiDialog).css('zIndex','999');
			
			var ozIndex = 0;
			if(!zIndex){
				$('.youi-dialog-container:visible').each(function(){
					ozIndex = Math.max($(this).css('zIndex'),ozIndex);
				});
				//
				if(ozIndex){
					zIndex = parseInt(ozIndex)+2;
				}else{
					zIndex = 1000;
				}
			}
			
			if(zIndex){
				uiDialog.css('zIndex',zIndex);
				this.overlay&&this.overlay.$el.css('zIndex',zIndex-1);
			}
			
			//if(!$.ui.hasScroll($('body',document))){
				$('body',document).addClass('dialog-open');
			//}
			uiDialog.show();
			this._position(this.options.position);
			//bind
			this.element.find('.dialog-open-handle').trigger('dialog.open');
			// 
			$.youi.widgetUtils.triggerResize(this.element,true);
		},
		/**
		 * 定位
		 */
		_position:function(pos){
			var uiDialog = this.uiDailogContianer,
				wnd = $(window), doc = $(document),
				pTop = doc.scrollTop(), pLeft = doc.scrollLeft(),
				minTop = pTop;
	
			if ($.inArray(pos, ['center','top','right','bottom','left']) >= 0) {
				pos = [
					pos == 'right' || pos == 'left' ? pos : 'center',
					pos == 'top' || pos == 'bottom' ? pos : 'middle'
				];
			}
			if (pos.constructor != Array) {
				pos = ['center', 'middle'];
			}
			if (pos[0].constructor == Number) {
				pLeft += pos[0];
			} else {
				switch (pos[0]) {
					case 'left':
						pLeft += 0;
						break;
					case 'right':
						pLeft += wnd.width() - uiDialog.outerWidth();
						break;
					default:
					case 'center':
						pLeft += (wnd.width() - uiDialog.outerWidth()) / 2;
				}
			}
			if (pos[1].constructor == Number) {
				pTop += pos[1];
			} else {
				switch (pos[1]) {
					case 'top':
						pTop += 0;
						break;
					case 'bottom':
						pTop += wnd.height() - uiDialog.outerHeight();
						break;
					default:
					case 'middle':
						pTop += (wnd.height() - uiDialog.outerHeight()) / 2;
				}
			}
	
			// prevent the dialog from being too high (make sure the titlebar
			// is accessible)
			pTop = Math.max(pTop, minTop);
			uiDialog.css({top: pTop, left: pLeft});
		},
		
		close:function(){
			
			$.youi.editorFactory&&$.youi.editorFactory.closeEditor();
			
			if($.isFunction(this.options.close)){
				if(!this.options.close.apply(this.element[0])){
					return;
				}
			}
			this.closeOverlay();//关闭辅助层
			var uiDialog =this.uiDailogContianer;
			uiDialog.hide();
			
			//this.origContainter.append(uiDialog);
			$('body',document).removeClass('dialog-open');
		},
		
		closeOverlay:function(){
			this.overlay && this.overlay.destroy();
		},
		
		resize:function(){
			$.youi.dialog.overlay.resize();
		},
		/**
		 * 销毁组件
		 */
		destroy:function(){
			(this.overlay && this.overlay.destroy());
			var uiDialog = this.uiDailogContianer;
			this.element
				.unbind('.dialog')
				.removeData('dialog')
				.removeClass('youi-dialog-content').hide();
			this.origContainter.append(this.element);
			(this.originalTitle && this.element.attr('title', this.originalTitle));
			uiDialog.remove();
			this.origContainter = null;
			this.uiDailogContianer = null;
		}
	}));
	
	$.extend($.youi.dialog,{
		version: "1.0.0",
		
		uuid: 0,
		getId: function($el) {
			return 'youi-dialog-' + ($el.attr('id') || ++this.uuid);
		},
		
		overlay: function(dialog) {
			this.$el = $.youi.dialog.overlay.create(dialog);
		}
	});
	
	$.extend($.youi.dialog.overlay, {
		instances: [],
		maxZ: 0,
		create: function(dialog) {
			var $el = $('<div></div>').appendTo(document.body)
				.addClass('ui-widget-overlay').css({
					width: this.width(),
					height: this.height()
				}).css('zIndex',Math.min(dialog.options.zIndex,1000)-1);
			
			(dialog.options.bgiframe && $.fn.bgiframe && $el.bgiframe());
	
			this.instances.push($el);
			return $el;
		},
	
		destroy: function($el) {
			this.instances.splice($.inArray(this.instances, $el), 1);
	
			$el.remove();
			
			// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
			var maxZ = 0;
			$.each(this.instances, function() {
				maxZ = Math.max(maxZ, this.css('z-index'));
			});
			this.maxZ = maxZ;
		},
	
		height: function() {
			// handle IE 6
			if (!$.support.boxModel) {//非盒模型
				var scrollHeight = Math.max(
					document.documentElement.scrollHeight,
					document.body.scrollHeight
				);
				var offsetHeight = Math.max(
					document.documentElement.offsetHeight,
					document.body.offsetHeight
				);
	
				if (scrollHeight < offsetHeight) {
					return $(window).height() + 'px';
				} else {
					return scrollHeight + 'px';
				}
			// handle "good" browsers
			} else {
				return $(window).height() + 'px';
			}
		},
	
		width: function() {
			// handle IE 6
			if (!$.support.boxModel) {//非盒模型
				var scrollWidth = Math.max(
					document.documentElement.scrollWidth,
					document.body.scrollWidth
				);
				var offsetWidth = Math.max(
					document.documentElement.offsetWidth,
					document.body.offsetWidth
				);
	
				if (scrollWidth < offsetWidth) {
					return $(window).width() + 'px';
				} else {
					return scrollWidth + 'px';
				}
			// handle "good" browsers
			} else {
				return $(document).width() + 'px';
			}
		},
		
		resize: function() {
			/* If the dialog is draggable and the user drags it past the
			 * right edge of the window, the document becomes wider so we
			 * need to stretch the overlay. If the user then drags the
			 * dialog back to the left, the document will become narrower,
			 * so we need to shrink the overlay to the appropriate size.
			 * This is handled by shrinking the overlay before setting it
			 * to the full document size.
			 */
			var $overlays = $([]);
			$.each($.youi.dialog.overlay.instances, function() {
				$overlays = $overlays.add(this);
			});
	
			$overlays.css({
				width: 0,
				height: 0
			}).css({
				width: $.youi.dialog.overlay.width(),
				height: $.youi.dialog.overlay.height()
			});
		}
	});
	
	$.extend($.youi.dialog.overlay.prototype, {
		destroy: function() {
			$.youi.dialog.overlay.destroy(this.$el);
		}
	});
	
	$.extend($.youi.msgbox,{
		version: "1.0.0",
		defaults:{
			title:'消息提示框',
			confirmable:false,
			submitArgs:['arg1'],
			submit:function(arg1){
				alert('确定'+arg1);
			}
		}
	});
})(jQuery);