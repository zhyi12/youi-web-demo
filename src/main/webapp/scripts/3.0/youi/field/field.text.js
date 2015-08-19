/**
 * field组件
 * Copyright (c) 2009 zhouyi
 * licenses
 * doc 
 */
(function($) {
	var _log = $.youi.log;
	/**
	 * fieldText组件
	 * 
	 */
	$.widget("youi.fieldText",$.extend({},$.youi.field,{
		options:{
			escapeSpecial:true,
			format:'0,0.00'
		},
		
		_initField:function(){
			
		},
		
		_fieldHtmls:function(){
			var htmls = [];
			var inputWidth = this.options.width - 6;
			htmls.push("<input type=\"text\" class=\"textInput form-control\"></input>");
			htmls.push("<input type=\"hidden\" class=\"value\"></input><div class=\"field-invalid\"></div>");
			return htmls.join('');
		},
		
		setValue:function(value){
			this.element.find('input.value').val(value);
			var text = value;
			if(this.options.dataType=='format'&&this.options.format&&value){
				text = $.youi.formatUtils.number(value,this.options.format);
			}
			this.element.find('input.textInput').val(text);
		},
		
		getValue:function(){
			var text = this.element.find('input.textInput').val();
			if(!text)return '';
			var value = text;
			if(this.options.dataType=='format'&&this.options.format&&value){
				value = value.replace(/,/g,'');
				value = isNaN(value)?'':parseFloat(value);
				this.element.find('input.value').val(value);
				this.element.find('input.textInput').val($.youi.formatUtils.number(value,this.options.format));
			}else{
				this.element.find('input.value').val(text);
			}
			return this.element.find('input.value').val();
		},
		
		setWidth:function(width){
			this.element.width(width);
			this.element.find('>table').width(width);
			var inputWidth = width;//validate width
			var iconElement = $('.select-down:first',this.element);
			inputWidth = inputWidth - (iconElement.length==0?6:20);
			this.element.find('.textInput,field-input,field-input-full').width(inputWidth);
		},
		
		//reset:function(){
		//	this.element.find('input.value').val(this.options.defaultValue||'');
		//},
		
		clear:function(){
			this.element.removeClass('validate-success').removeClass('validate-error').removeAttr('title');
			this.element.find('input').val('');
		},
		
		focus:function(){
			this.element.find('input.textInput').focus();
		},
		
		validate:function(){
			this.element.removeClass('validate-error').removeAttr('title');
			if(!this._validateNotNull()){
				return false;
			}
			
			//特殊字符过滤
			
			//validateSrc
			var regStr,
				regMessage = '';
			var fractionLength = this.options.fractionLength||0;
			if(this.options.expression){
				regStr     = this.options.expression;
				regMessage = this.options.expressionMessage;
			}else{
				switch(this.options.dataType){
					case 'integer':
						regStr = this.regexps.integer;
						regMessage = '请输入整数类型值';
						break;
					case 'number':
						regStr = this.regexps.number(fractionLength);
						regMessage = '请输入数值类型值，最大小数点位数为'+fractionLength;
						break;
					case 'text':
						regStr = this.regexps.text;
						regMessage = '请输入由数字、26个英文字母或者下划线组成的字符串';
						break;
					case 'email':
						regMessage = '请输入邮件格式串';
						regStr = this.regexps.email;
						break;
					case 'phone':
						regMessage = '请输入电话号码';
						regStr = this.regexps.phone;
						break;
					case 'url':
						regMessage = '请输入URL，以"http://"开头';
						regStr = this.regexps.url;
						break;
					default:
						
				}
			}
			var value = $.trim(this.getValue());
			
			if(!this.options.escapeSpecial&&this._exsitSpecial(value)){
				this._validateError("含有特殊字符！");
				return false;
			}
			
			if(value&&this.options.maxLength&&value.length>this.options.maxLength){
				regMessage = '最大长度不能超过'+this.options.maxLength;
				this._validateError(regMessage);
				return false;
			}
			
			if(value&&this.options.minLength&&value.length<this.options.minLength){
				regMessage = '最小长度不能小于'+this.options.minLength;
				this._validateError(regMessage);
				return false;
			}
			
			if(!regStr||!value)return true;
			var reg = new RegExp(regStr);
			if(!reg.test(value)){
				this._validateError(regMessage);
				return false;
			}else{
				this._validateSuccess();
				return true;
			}
		},
		
		_exsitSpecial:function(value){
			return !/^[^\|"'<>]*$/.test(value);
		},
		/**
		 * 后台即时校验
		 */
		ajaxValidate:function(){
			if(this.options.validateSrc){
				var value = this.getValue();
				if(value==null||value=='')return;
				this.element.addClass('validating');//标识为正在进行校验
				_log.info('validateSrc:'+this.options.validateSrc);
				var url = this.options.validateSrc;
				url+=(url.indexOf('?')==-1?'?':'&');
				url+=$.youi.parameterUtil.propertyParameter(this.options.property,value);
				$.youi.ajaxUtil.ajax({
					url:url,
					element:this.element,
					success:function(results){
						if(results.message&&results.message.passed==false){
							this.element
								.removeClass('validate-success')
								.addClass('validate-error').attr('title',results.message.info);
						}else{
							this.element.addClass('validate-success');
						}
						this.element.removeClass('validating');
					},
					error:function(results){
						_log.error('校验地址【'+this.url+'】错误:地址无法访问！');
						this.element.removeClass('validating');
					}
				});
			}
		},
		//^ $ . * + ? = ! : | \ / () [] {} 
		regexps:{
			integer :'^-?[1-9]\\d*$',//整数
			number	:function(fractionLength){
				var regStr = '^-?([1-9]\\d*\\.\\d*|0\\.\\d*[1-9]\\d*|0?\\.0+|0)$';
				if(fractionLength){
					regStr = '^-?(0|[1-9]*)+(\\.[0-9]{1,'+fractionLength+'})?$';//fractionLength为最大小数位数
				}
				return regStr;
			},//数字
			text	:'^\\w+$',//匹配由数字、26个英文字母或者下划线组成的字符串
			email	:'\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*',//email
			phone	:'\\d{3}-\\d{8}|\\d{4}-\\d{7}',//国内电话号码
			url		:'[a-zA-z]+:\/\/[^\\s]*'//完整的网址
		},
		
		_initAction:function(){
			this.element.find('input.textInput').bind('blur',function(){
				var field = $(this).parents('.fieldText:first');
				//获取值
				field.fieldValue();
				field = null;
			}).bind('keypress',function(){
				$(this).parents('.fieldText').removeClass('validate-error')
											 .removeClass('validate-success').removeAttr('title');
			}).bind('change',function(event){
				
			});
		}
	}));
	
	$.extend($.youi.fieldText,{
		defaults:$.extend({},$.youi.fieldDefaults,{
			
		})
	});
})(jQuery);