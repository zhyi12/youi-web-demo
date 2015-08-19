/**
 * field组件
 * Copyright (c) 2009 zhouyi
 * licenses
 * doc 
 */
(function($) {
	var _log = $.youi.log;//日记
	/**
	 * field工具
	 */
	$.youi.fieldUtils = {
		/**
		 * 从dom元素中读取field实例
		 * @param fieldElement field对应的dom元素
		 */
		getInstance:function(fieldElement){
			var element = $(fieldElement);
			if(element&&element.is('.youi-field')){
				var instance = $.data(element[0], 'youi-'+element.attr('fieldType'));
				return instance;
			}
			return null;
		},
		/**
		 * 执行field的dom元素的实例方法
		 * @param fieldElement field对应的dom元素
		 * @param methodName   方法名称
		 */
		execMethod:function(fieldElement,methodName){
			if(fieldElement===null||methodName===null||typeof methodName != 'string'){
				return;
			}
			var instance = $.youi.fieldUtils.getInstance(fieldElement);
			if(instance!==null&&instance._init&&instance[methodName]){
				var args = Array.prototype.slice.call(arguments, 2);
				instance[methodName].apply(instance,args);//执行方法
			}
		},
		/**
		 * 根据property和prefix查找field的dom元素
		 * @param property field组件的标识
		 * @param prefix   field组件前缀
		 */
		getElementByProperty:function(property,prefix){
			var id = $.youi.fieldUtils.getFieldId(property,prefix);
			return $.youi.fieldUtils.getElementById(id);
		},
		
		getRelElementByProperty:function(relFieldId,property,prefix){
			//P_970300_field_nodeInputs
			var prefixIndex = relFieldId.indexOf(prefix);
			if(prefixIndex>0){
				return $.youi.fieldUtils.getElementByProperty(property,relFieldId.split(prefix)[0]+prefix);
			}else{
				return $.youi.fieldUtils.getElementByProperty(property,prefix);
			}
		},
		
		getElementById:function(id){
			return $(document.getElementById(id));
		},
		/**
		 * 得到field的id
		 */
		getFieldId:function(property,prefix){
			if(!property)return null;
			prefix = prefix?prefix:'field';
			var id = prefix+'_'+property.replace(/\./g,'_');
			return id;
		}
	};
	
	/*********************************Field公共方法*********************************************/
	$.extend(jQuery.fn, {
		fieldValue:function(value,text){
			var instance = $.youi.fieldUtils.getInstance(this);
			if(instance){
				if(arguments.length==0){
					return instance.getValue();
				}else{
					instance.setValue(value,text);
				}
			}
			return null;
		},
		
		fieldDefaultValue:function(value){
			var instance = $.youi.fieldUtils.getInstance(this);
			if(instance&&value){
				instance.options.defaultValue = value;
			}
		},
		
		fieldShow:function(){
			var instance = $.youi.fieldUtils.getInstance(this);
			if(instance){
				return instance.getText()||instance.getValue();
			}
			return null;
		},
		
		fieldReset:function(escapeEnable){
			this.each(function(){
				var instance = $.youi.fieldUtils.getInstance(this);
				if(instance){
					if(escapeEnable==true&&instance.options.escapeReset==true){
						return;
					}
					instance.reset&&instance.reset();
				}
			});
		},
		
		fieldFocus:function(){
			var instance = $.youi.fieldUtils.getInstance(this);
			if(instance){
				instance.focus();
			}
		},
		
		fieldValidate:function(){
			this.each(function(){
				var instance = $.youi.fieldUtils.getInstance(this);
				instance&&instance.validate&&instance.validate();
			});
		},
		
		fieldClear:function(){
			this.each(function(){
				var instance = $.youi.fieldUtils.getInstance(this);
				instance&&instance.clear();
			});
		},
		
		fieldWidth:function(width){
			var instance = $.youi.fieldUtils.getInstance(this);
			if(instance){
				if(arguments.length==0){
					return instance.getWidth();
				}else{
					instance.setWidth(width);
				}
			}
			return null;
		},
		
		fieldDisabled:function(){
			this.each(function(){
				var instance = $.youi.fieldUtils.getInstance(this);
				instance&&instance.disabled();
			});
		},
		
		fieldEnable:function(){
			this.each(function(){
				var instance = $.youi.fieldUtils.getInstance(this);
				instance&&instance.enable();
			});
		},
		
		fieldNotNull:function(isNotNull){
			this.each(function(){
				var instance = $.youi.fieldUtils.getInstance(this);
				instance&&instance.setNotNull(isNotNull);
			});
		}
	});
	/**
	 * @abstract class
	 * 通用field组件的抽象类
	 * 	1、公共方法：内部子类通用的方法
	 * 		[]
	 *  2、接口方法：外部调用的方法
	 * 		[getValue,setVlaue(value),getText,setText(text),focus,validate,clear,reset]
	 */
	$.youi.field = {
		/**
		 * JQUERY UI组件初始化：field组件的统一初始化入口
		 */
		_create:function(){
			//id处理
			this.options.id = this.options.id||$.youi.fieldUtils.getFieldId(this.options.property,this.options.prefix);
			//设置特殊的记录通用信息的属性
			this.element.attr('fieldType',this.widgetName)
						.attr('property',this.options.property);
			
			if(this.options.defaultValue){
				this.options.defaultValue = decodeURIComponent(this.options.defaultValue);
			}
			
			this._defaultHtmls();//
			this._initField();//
			this._initAction();//
			this.reset();
		},
		/**
		 * 生成静态的html内容
		 * 遵循YOUI组件的通用约定，使用initHtmls判断是否有由js生成dom元素html内容
		 */
		_defaultHtmls:function(){
			if(this.options.initHtml!==false){
				var htmls = this._fieldHtmls(),
					styles = ['youi-field',this.widgetName];
				if(this.options.notNull==true){
					styles.push('notNull');
				}
				this.element
						.attr('id',this.options.id)
						.addClass(styles.join(' '))
						.append(htmls);
			}
		},
		
		/**
		 * 覆盖方法：当前组件的html内容
		 */
		_fieldHtmls:function(){
			return '';
		},
		/**
		 * 覆盖方法：field组件的各自的特殊性初始化
		 */
		_initField:function(){
			
		},
		/**
		 * 覆盖方法：当前组件的动作处理
		 */
		_initAction:function(){
			
		},
		/****************************公用方法***************************/
		/**
		 * 非空校验
		 */
		_validateNotNull:function(){
			if(this.options.notNull==null)return true;
			var value = this.getValue();
			if(this.options.notNull==true){
				if($.isArray(value)&&value.length==0){//数组类型
					this._validateError('不能为空');
					return false;
				}
				
				if(typeof(value)=='string'&&(value==''||value==null)){
					this._validateError('不能为空');
					return false;
				}
			}
			return true;
		},
		
		/**
		 * 校验通过
		 */
		_validateSuccess:function(msg){
			this.element
				.removeClass('validate-error')
				.addClass('validate-success').removeAttr('title');
		},
		/**
		 * 校验未通过
		 */
		_validateError:function(msg){
			msg = msg||'';
			this.element
				.removeClass('validate-success')
				.addClass('validate-error').attr('title','【'+this.options.caption+'】'+msg);
		},
		
		/**
		 * 校验中
		 */
		_validating:function(msg){
			this.element
				.removeClass('validate-success').removeClass('validate-success')
				.addClass('validating').removeAttr('title');
		},
		/****************************公共接口***************************/
		/**
		 * 获得组件值
		 */
		getValue:function(){
			//abstract method
		},
		/**
		 * 设置组件值
		 */
		setValue:function(value){
			//abstract method
		},
		/**
		 * 获得文本
		 */
		getText:function(){
			//abstract method
		},
		/**
		 * 设置文本
		 */
		setText:function(text){
			//abstract method
		},
		/**
		 * 清除
		 */
		clear:function(){
			//abstract method
		},
		/**
		 * 聚焦
		 */
		focus:function(){
			//abstract method
		},
		/**
		 * 校验
		 */
		validate:function(){
			//override method
			this.element.removeClass('validate-success').removeClass('validate-error').removeAttr('title');
			this._validateNotNull();
		},
		
		reset:function(){
			this.element.removeClass('validate-success').removeClass('validate-error').removeAttr('title');
			if(this.options.defaultValue!=null){
				this.setValue(this.options.defaultValue,this.options.defaultShow);
			}else{
				this.clear();
			}
		},
		
		setWidth:function(width){
			this.element.width(width);
			this.element.find('>table').width(width);
			var inputWidth = width - 22;//validate width
			var iconElement = $('.select-down:first',this.element);
			inputWidth = inputWidth - (iconElement.length==0?6:20);
			this.element.find('.textInput,field-input,field-input-full').width(inputWidth);
		},
		
		disabled:function(){
			this.element.addClass('disabled').find('.textInput').attr('disabled','disabled');
		},
		
		enable:function(){
			this.element.removeClass('disabled').find('.textInput').removeAttr('disabled','disabled');
		},
		
		setNotNull:function(isNotNull){
			var fieldGroup = this.element.parents('.field-group:first');
			if(isNotNull==true){
				fieldGroup.addClass('notNull');
			}else{
				fieldGroup.removeClass('notNull');
			}
		},
		/**
		 * 销毁组件
		 */
		destory:function(){
			this.element.removeClass('youi-field')
				.removeAttr('fieldType').removeAttr('property');
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	};
	/**
	 * 外部读取数据,数据联动
	 */
	$.youi.fieldSource = {
		children:[],
		
		_fieldHtmls:function(){
			var iconWidth = 15;
			var fieldWidth = this.options.width-11;
			var showProperty = this.options.showProperty;
			var htmls = [];
			htmls.push("<table cellpadding=\"0\" cellspacing=\"0\" width=\""+fieldWidth+"\"><tbody><tr>");
			htmls.push(	"<td valign=\"top\" width=\""+(fieldWidth-iconWidth)+"\"><input style=\"width:"+(fieldWidth-iconWidth-4)+"px;\" type=\"text\" ");
			htmls.push(showProperty==null?"":("showProperty=\""+showProperty+"\""));
			htmls.push(" readonly=\"readonly\" class=\"textInput\"/><input name=\""+this.options.property+"\" type=\"hidden\" class=\"value\"/></td>");
			htmls.push(	"<td class=\"youi-icon select-down\"></td>");
			htmls.push("</tr></tbody></table>");
			
			this.element.html(htmls.join(''));
		},
		/**
		 * 继承了fieldSource的field组件的约定的初始化调用
		 */
		_initSource:function(){
			if(this._getPopPanel)this._getPopPanel();//
			this.children = [];//初始化子节点数组
			var parents = this.options.parents;
			if($.isArray(parents)&&parents.length>0){
				var parentElement;
				for(var i=0;i<parents.length;i++){
					parentElement = $.youi.fieldUtils.getRelElementByProperty(this.options.id,parents[i],this.options.prefix);
					if(parentElement)$.youi.fieldUtils.execMethod(parentElement,'_addChild',this.options.property);
					parentElement = null;
				}
			}
		},
		/**
		 * 添加子field
		 */
		_addChild:function(childProperty){
			this.children.push(childProperty);
		},
		/**
		 * 重置子field
		 */
		_resetChildren:function(){
			var children = this.children;
			if($.isArray(children)&&children.length>0){
				var childElement;
				for(var i=0;i<children.length;i++){
					childElement = $.youi.fieldUtils.getRelElementByProperty(this.options.id,children[i],this.options.prefix);
					if(childElement)$.youi.fieldUtils.execMethod(childElement,'_reloadByParent',this.options.property);
					childElement = null;
				}
			}
		},
		/**
		 * 联动子field
		 */
		_reloadByParent:function(){
			this.reset();
			this._disposeLoaded();
			//联动处理子节点
			this._resetChildren();
		},
		/**
		 * 获得存放数据的容器的id
		 */
		_getDatasContextId:function(){
			return this.id+'-datasContext';
		},
		
		/**
		 * 解析标识格式的json数据 [{userCode:'111',name:'zhang'},{userCode:'222',name:'zhou'}...]
		 */
		_parseRecords:function(records,open){
			var datasContextId = this._getDatasContextId();
			$('#'+datasContextId).removeClass('item-srcoll');
			var	parseOptions = {
					property:this.options.property,
					propertyDescriptor: {code:this.options.code,show:this.options.show},
					parseRecord		  : this._parseRecord,
					selectedValue	  : this.getValue(),
					selectedTexts	  : [],
					datasContextId	  : datasContextId,
					fieldId			  : this.options.id,
					mixed			  : this.options.mixed,
					parse			  : function(records,contentHtmls,options){
						if(records.length>10){
							$('#'+options.datasContextId).addClass('item-srcoll');
						}
						if(options.selectedTexts.length>0){
							$.youi.fieldUtils.execMethod($('#'+options.fieldId),'setText',options.selectedTexts.join());
						}
						return contentHtmls[0].join('');
					}
				},
				htmls = [],
				scrollStyle = '';
			if(this.options.notNull!=true)htmls.push(this._nullItemHtml());//加入空记录
			htmls.push($.youi.recordUtils.records2Htmls(records,parseOptions));
			
			var content = $('#'+datasContextId);
			content[0].innerHTML = htmls.join('');
			content.addClass('loaded '+(open?'expanded':''));
		},
		
		/**
		 * 回调函数，由子类实现,返回record解析成的html
		 */
		_parseRecord:function(index,record,options){
			//abstract method
		},
		/**
		 * 空记录的html
		 */
		_nullItemHtml:function(){
			return '';
		},
		/**
		 * 判断是否已经加载数据
		 */
		_isLoaded:function(){
			var datasContextId = this._getDatasContextId();
			return $('#'+datasContextId).hasClass('loaded');
		},
		/**
		 * 取消已加载标识
		 */
		_disposeLoaded:function(){
			$('#'+this._getDatasContextId()).removeClass('loaded');
		},
		/**
		 * 数据加载
		 */
		_datasLoader:function(open){
			if(this.options.convert){
				this._convertLoader(open);
			}else if(this.options.src){
				this._ajaxLoader(open);
			}
		},
		/**
		 * convert字典方式加载数据
		 */
		_convertLoader:function(open){
			var converts = $.youi.serverConfig.convertArray[this.options.convert];
			if(!converts)return;
			
			var records = [];
			this.options.code = 'code';
			this.options.show = 'show';
			
			for(var code in converts){
				records.push({
					'code':code,
					'show':converts[code]
				});
			}
			this._parseRecords(records);
		},
		/**
		 * ajax方式加载数据
		 */
		_ajaxLoader:function(open){
			var url = this.options.src,
				params = [];
			var parentParameters = this._getParentParameters();
			
			if(!parentParameters){
				return false;
			}
			
			params = [].concat(parentParameters);
			$.youi.ajaxUtil.ajax({
				fieldId	 : this.options.id,
				url		 : url,
				data	 : params.join('&'),
				success  : function(result){
					if(result&&$.isArray(result.records)){
						var fieldElement = $.youi.fieldUtils.getElementById(this.fieldId);//
						$.youi.fieldUtils.execMethod(fieldElement,'_parseRecords',result.records,open);
						fieldElement = null;
					}
				}
			});
		},
		
		_getParentParameters:function(){
			var parentParameters = [];
			var parents = this.options.parents;
			var parentsAlias = this.options.parentsAlias||[];
			var paramName;
			if($.isArray(parents)&&parents.length>0){
				var parentElement,parentValue;
				var messages = [];
				for(var i=0;i<parents.length;i++){
					parentElement = $.youi.fieldUtils.getRelElementByProperty(this.options.id,parents[i],this.options.prefix);
					if(parentElement&&parentElement.length){
						parentValue = parentElement.fieldValue();
						paramName = parentsAlias[i]||parents[i];
						if(!parentValue){
							var labelFor = $('label[for='+parentElement.attr('fieldtype')+'-'+parentElement.attr('id')+']');
							messages.push(labelFor.text());
						}
						parentParameters.push($.youi.parameterUtils.propertyParameter(paramName,parentValue));
					}
					parentValue = null;
					paramName = null;
					parentElement = null;
				}
				//
				if(messages.length){
					//alert();
					//throw new Exception('');
					//抛出异常
					throw '请先选择【'+messages.join().replace('：','')+'】'
					//return false;
				}
			}
			return parentParameters;
		},
		
		reset:function(){
			var parents = this.options.parents;
			if($.isArray(parents)&&parents.length>0){
				var datasContextId = this._getDatasContextId();
				$('#'+datasContextId).removeClass('loaded');
			}
			$.youi.field.reset.apply(this);
		}
	};
	
	/**
	 * 数据下拉选择
	 */
	$.youi.fieldPop = $.extend({},$.youi.fieldSource,{
		_fieldHtmls:function(){
			var htmls = [],
				iconWidth = 15,
				fieldWidth = this.options.width-11;
			//htmls.push("<table class=\"fieldPop-table\" cellpadding=\"0\" cellspacing=\"0\" width=\""+fieldWidth+"\"><tbody><tr>");
			//htmls.push(	"<td valign=\"top\" width=\""+(fieldWidth-iconWidth)+"\"><input readonly=\"readonly\" style=\"width:"+(fieldWidth-iconWidth-6)+"px;\" type=\"text\" class=\"textInput fieldPop\"></input><input  name=\""+this.options.property+"\" type=\"hidden\" class=\"value\"></input></td>");
			//htmls.push(	"<td class=\"youi-icon select-down\"></td>");
			//htmls.push("</tr></tbody></table>");
			
			htmls.push("<span ");
			htmls.push(this.options.showProperty==null?"":("showProperty=\""+this.options.showProperty+"\""));
			htmls.push("  class=\"textInput form-control\"/>");
			htmls.push("<input name=\""+this.options.property+"\" type=\"hidden\" class=\"value\"/>");
			htmls.push("<span class=\"glyphicon glyphicon-chevron-down select-down form-control-feedback\" aria-hidden=\"true\"></span>");
		
			return htmls.join('');
		},
		
		_clearLoaded:function(){
			this._getPopPanel().removeClass('loaded');
		},
		
		_initAction:function(){
			if(this.options.readonly==true)return;//
			this.element.delegate('.textInput,.select-down','click',function(event){
				var fieldElement = $(event.delegateTarget);
				
				if(fieldElement.hasClass('readonly')||fieldElement.hasClass('disabled')){
					return;
				}
				
				$.youi.fieldUtils.execMethod(event.delegateTarget,'_togglePanel');
			}).delegate('.field-invalid','dblclick',function(event){
				$.youi.fieldUtils.execMethod(event.delegateTarget,'_clearLoaded');
				$.youi.fieldUtils.execMethod(event.delegateTarget,'clear');
			});
			//绑定window document相关的动作
			if(!$('body',document).hasClass('event-fieldPop')){//防止重复绑定
				$(document).bind('mousedown',function(event){//绑定当document上
					$('.field-items-panel').removeClass('expanded');
					$.youi.popUtils.hidePopBackground();
					
					try{
						if($(event.target).is('#youi-pop-background')){
							$.youi.editorFactory&&$.youi.editorFactory.closeEditor();
						}
					}catch(err){
						//IE中flash的点击事件影响
					}
				});
				
				$(window).bind('resize',function(){//窗口resize
					$('.field-items-panel').removeClass('expanded');
					$.youi.popUtils.hidePopBackground();
					
				});
				
				$('body',document).addClass('event-fieldPop');
			}
			
			this._initPanelAction();
		},
		/**
		 * 展开或者关闭弹出面板
		 */
		_togglePanel:function(){
			if(this.options.popup==false)return;
			var panel = this._getPopPanel();
			if(panel.toggleClass('expanded').hasClass('expanded')){
				this._openPanel();
			}else{
				this._closePanel();
			}
		},
		/**
		 * 展开弹出面板
		 */
		_openPanel:function(){
			//if(!this.options.popup)return;
			var panel = this._getPopPanel();
			if(!this._isLoaded()){
				try{
					this._datasLoader(true);//加载数据
				}catch(err){
					panel.empty();
					alert(err);
					return;
				}
			}else{
				panel.find('.selected').removeClass('selected');
				//设置已经选择值
				var value = this.getValue(),
					values = [];
				if($.isArray(value)){
					values = value;
				}else{
					values = [value];
				}
				for(var i=0;i<values.length;i++){
					panel.find('.option-item[value='+values[i]+']').addClass('selected');
				}
			}
			this._setPanelPosition();
			panel.addClass('expanded');
			$.youi.popUtils.showPopBackground($(window).width()-10);
			panel = null;
		},
		/**
		 * 关闭弹出面板
		 */
		_closePanel:function(){
			if(this.options.popup==false)return;
			this._getPopPanel().removeClass('expanded');
			$.youi.popUtils.hidePopBackground();
		},
		/**
		 * 
		 */
		_getPopPanel:function(){
			var panelId = this._getPanelId(),
				panel = $('#'+panelId);
			if(panel.length==0){
				var panelWidth = this.options.width-11;
				panel = $('<div fieldId="'+this.options.id+'" style="width:'+panelWidth+'px;" id="'+panelId+'" class="field-items-panel"></div>').appendTo($('body',document));
				//
				panel.html(this._popPanelHtmls());
			}else{
				if(this.options.popup&&!panel.parent().is('body')){
					panel.appendTo($('body',document));
				}
			}
			return panel;
		},
		
		_popPanelHtmls:function(){
			return '';
		},
		/**
		 * 获得弹出面板的id
		 */
		_getPanelId:function(){
			return 'field-pop-'+this.options.id;
		},
		/**
		 * 设置pop panel的位置
		 */
		_setPanelPosition:function(){
			
			var panelTop = this.element.offset().top+this.element.innerHeight()-1;
			var popPanel = this._getPopPanel().css({
				left:this.element.offset().left+2,
				top:panelTop,
				width:this.element.width() - this.element.find('.field-invalid').width()
			});
			
			//如果弹窗口位置超出屏幕下方,调整位置显示在filed上方 
			var windowHeight = $(window).height();
			if(windowHeight-panelTop<popPanel.height()){
				//往上弹出
				popPanel.css('top',this.element.offset().top-popPanel.height()-1);
			}
		},
		/**
		 * 初始化panel的动作
		 */
		_initPanelAction:function(){
			//
		},
		/**
		 * 设置显示值
		 */
		setText:function(text){
			this.element.find('.textInput').text(text);
		},
		/**
		 * 获得显示值
		 */
		getText:function(){
			return this.element.find('.textInput').text();
		},
		
		clear:function(){
			this.element.find('input.value').val("");
			this.element.find('.textInput').text("");
		},
		
		focus:function(){
			//TODO
		},
		
		setWidth:function(width){
			this.element.find('table').attr('width',width+'px').find('td:first').attr('width',(width-15)+'px');
			this._getPopPanel().width('width',width);
			this.element.width(width).find('.textInput').width(width-15);
		},
		
		/**
		 * 销毁组件
		 */
		destroy:function(){
			this.element.removeClass('youi-field')
				.removeAttr('fieldType').removeAttr('property');
			this._getPopPanel().remove();//
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
	/**
	 * 参数默认值
	 */
	$.youi.fieldDefaults = {
		width:200//field组件宽度
	};
	
	$.youi.fieldSourceDefaults = $.extend({},$.youi.fieldDefaults,{
		show:'show',
		value:'value'
	});
	
	$.youi.fieldPopDefaults = $.extend({},$.youi.fieldSourceDefaults,{
		popup:true
	});
	
	$.widget("youi.fieldCustom",$.extend({},$.youi.field,{
		_initField:function(){
			
		},
		
		setValue:function(value){
			this.options.setValue(value);
		},
		
		getValue:function(){
			return this.options.getValue(value);
		},
		
		clear:function(){
			this.options.clear(value);
		}
	}));
})(jQuery);