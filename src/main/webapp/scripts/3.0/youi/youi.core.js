/*!
 * youi JavaScript Library v3.0.0
 * 
 *
 * Copyright 2015, zhyi_12
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: 2015-01-20
 */
(function( $, undefined ) {
	'use strict';
	$.youi = $.youi||{};//初始化组件空间
	
	/**
	 * 组件扩展机制
	 * 实现组件的自由扩展功能，热插拔组件的一些功能。
	 * 比如grid组件的编辑功能，排序功能，拖动等功能。
	 */
	$.youi.extensions = {};
	
	/**
	 * 组件扩展抽象接口
	 */
	$.youi.abstractExtension = {
		/**
		 * 
		 */
		order:0,//扩展执行顺序
		/**
		 * 组件创建前
		 */
		beforeCreate:function(){
			
		},
		/**
		 * 组件创建后
		 */
		afterCreate:function(){
			
		},
		/**
		 * 事件代理
		 */
		actionDelegate:function(){
			
		}
	};
	
	/**
	 * $.youi.getMessage(source,params)
	 * 国际化配置信息解析工具类
	 */
	$.youi.getMessage = function(source, params) {
		if ( arguments.length == 1 ) 
			return function() {
				var args = $.makeArray(arguments);
				args.unshift(source);
				return $.youi.getMessage.apply( this, args );
			};
		if ( arguments.length > 2 && params.constructor != Array  ) {
			params = $.makeArray(arguments).slice(1);
		}
		if ( params.constructor != Array ) {
			params = [ params ];
		}
		$.each(params, function(i, n) {
			source = source.replace(new RegExp("\\{" + i + "\\}", "g"), ''+n);
		});
		return source;
	}
	//resize动作集成
	$(window).bind('resize',function(event){
		window.setTimeout(function(){
			$.youi.log.debug('window resize ');
			$.youi.widgetUtils.triggerResize(null,true);
		});
	});
	
	$.extend($.youi,{
		version:'3.0.0',
		
		/**
		 * 服务配置
		 */
		serverConfig:{
			contextPath:'',//web上下文路径
			convertArray:[],//服务字典
			pageUrls:{}
		},
		//上下文菜单
		contextmenus:[
		    {'name':'add',caption:"新增",icon:'add',widgets:['grid']},
		    {'name':'edit',caption:"修改",icon:'edit',widgets:['grid']},
		    {'name':'remove',caption:"删除",icon:'remove',widgets:['grid']},
		    {'name':'copy',caption:"复制数据",icon:'copy',widgets:['grid']}
		],
		
		contextmenuUtils:{
			addWidgetContextmenu:function(widgetName,menus){
				if(!$.youi.contextmenuNames){
					$.youi.contextmenuNames = {};
					$($.youi.contextmenus).each(function(){
						$.youi.contextmenuNames[this.name] = true;
					});
				}
				if($.isArray(menus)){
					$(menus).each(function(){
						var funcKey = widgetName+':'+this.name;
						if(!$.youi.contextmenuNames[funcKey]){
							$.youi.contextmenus.push($.extend({},this,{
								widgets:[widgetName]
							}));
							$.youi.contextmenuNames[funcKey] = true;
						}else{
							$.youi.log.warn('['+funcKey+']已经存在.');
						}
					});
				}
			}
		},
		
		/**
		 * 用户配置
		 */
		userConfig:{
			sWidth:$(window).width(),
			sHeight:$(window).height()
		},
		/*日记*/
		/**
		 * 1 输出错误级别的日记
		 * 2 输出警告以上级别的日记
		 * 3 输出调试以上级别的日记
		 * 4 输出所有类型的日记
		 */
		logLevel:0,
		log:{//日记工具
			info:function(message){//输出信息
				if($.youi.logLevel>3){
					_writeMessage(message,{
						type:'info'
					});
				}
			},
			debug:function(message){//输出调试级别信息
				if($.youi.logLevel>2){
					_writeMessage(message,{
						type:'debug'
					});
				}
			},
			warn:function(message){//输出警告级别信息
				if($.youi.logLevel>1){
					_writeMessage(message,{
						type:'warn'
					});
				}
			},
			error:function(message){//输出错误级别信息
				if($.youi.logLevel>0){
					_writeMessage(message,{
						type:'error'
					});
				}
			}
		},
		
		resource:{
			
		},
		/**
		 * 文本信息资源工具
		 */
		resourceUtils:{
			get:function(key){
				var value = $.youi.resource[key];
				if(!value)return '';
				if($.isFunction(value)){
					return value(Array.prototype.slice.call( arguments, 1 ));
				}
				return value;
			}
		},
		/**
		 * 事件工具类
		 */
		eventUtils:{
			bodyClick:function(){
				$('body',document).trigger('body.click');
			}
		},
		/**
		 * 组件工具
		 */
		widgetUtils:{
			/**
			 * 执行组件回调函数
			 */
			funcApply:function(widgetDom,funcName){
				var widgetId = widgetDom.getAttribute('id');
				if($.isFunction(window[widgetId+'_'+funcName])){
					var params = [];
					if ( arguments.length > 2){
						params = $.makeArray(arguments).slice(2);
					}
					return window[widgetId+'_'+funcName].apply(widgetDom,params);
				}
			},
			/**
			 * 为组件绑定位置计算方法
			 */
			bindResize:function(widgetElement,widgetName){
				widgetElement.attr('data-resize',true).bind('widget.resize',function(event,ui){
					if(widgetElement.is(':hidden'))return;
					var oldResizekey = widgetElement.data('resizekey');
					
					var resizekey = [widgetElement.height(),widgetElement.width()].join('|');
					
					if(ui&&ui.forceResize==true){
						//强制重新计算位置
						$.youi.log.debug('force resize '+widgetName);
					}
					
					if($.isFunction(widgetElement['resize'])){
						widgetElement[widgetName]('resize');
						widgetElement.data('resizekey',[widgetElement.height(),widgetElement.width()].join('|'));
					}
					//阻止冒泡
					event.stopPropagation();
				});
			},
			/**
			 * 触发位置计算
			 */
			triggerResize:function(container,forceResize){
				if(container&&container.length){
					
				}else{
					var bodyElem = $('body',document);
					if(bodyElem.is('[data-resize="true"]')){
						bodyElem.trigger('widget.resize');
					}
					container = bodyElem;
				}
				container.find(':visible[data-resize="true"]').trigger('widget.resize',{forceResize:forceResize});
			}
		},
		
		/**
		 * 样式工具类
		 */
		classUtils:{
			hasClass:function(dom,styleClass){
				if(!dom)return false;
				var domClass =' '+ dom.className+' ';
				return domClass.indexOf(' '+styleClass+' ')!=-1;
			},
			
			getEventClass:function(event){
				if(!event)return;
				var eventClass = event.target.className;
				eventClass&&(eventClass=eventClass.split(' ')[0]);
				return eventClass;
			},
			
			getNextClass:function(dom,className){
				if(!dom||!className) return null;
				var domClass = dom.className;
				if(domClass){
					var classArr = domClass.split(' ');
					var index = $.inArray(className,classArr);
					if(index!=-1){
						return classArr[index+1];
					}
				}
			}
		},
		/**
		 *字符处理工具 
		 */
		stringUtils:{
			
			isEmpty:function(value){
				return !$.youi.stringUtils.notEmpty(value);
			},
			
			notEmpty:function(value){
				if(value){
					return true;
				}else if(value===0){
					return true;
				}
				return false;
			},
			
			fixValue:function(value,defaultValue){
				var result = value;
				if($.youi.stringUtils.isEmpty(value)){
					if($.youi.stringUtils.isEmpty(defaultValue)){
						defaultValue = '';
					}
					result = defaultValue;
				}
				
				return result;
			}
		},
		/**
		 * $.youi.htmlUtils.buildIconHtml(name);
		 */
		htmlUtils:{
			buildIconHtml:function(name,command){
				var htmls  = [];
				htmls.push('<span ');
				if(command){
					htmls.push('data-command="'+command+'" ');
					htmls.push('data-name="'+name+'" ');
				}
				htmls.push('class="youi-icon glyphicon '+name+'"></span>');
				return  htmls.join('');;
			}
		},
		
		formatUtils:{
			
			from: function(value, defaultValue) {
		        if (isFinite(value)) {
		            value = parseFloat(value);
		        }

		        return !isNaN(value) ? value : defaultValue;
		    },
			usMoney : function(v) {
	            return $.youi.formatUtils.currency(v, '$', 2);
	        },
			cnMoney : function(v) {
	            return $.youi.formatUtils.currency(v, '￥', 2);
	        },	        
	        currency: function(v, currencySign, decimals) {
	            var negativeSign = '',
	                format = ",0",
	                i = 0;
	            v = v - 0;
	            if (v < 0) {
	                v = -v;
	                negativeSign = '-';
	            }
	            decimals = decimals || 2;
	            format += format + (decimals > 0 ? '.' : '');
	            for (var i=0; i < decimals; i++) {
	                format += '0';
	            } 
	            v = $.youi.formatUtils.number(v, format);  
	            return negativeSign + (currencySign || '￥') + v; 
	        },
	        /** 
	         * 格式化数字，例如：在formatString中填写
	         * 0 - (123456)
	         * 0.00 - (123456.78)
	         * 0.0000 - (123456.7890)
	         * 0,000 - (123,456)
	         * 0,000.00 - (123,456.78) 
	         * 0,0.00 - (123,456.78) 
	         * @param {Number} 需要格式化数字.
	         * @param {String} 格式化字符.
	         * @return {String} 格式化后的数字.
	         */
	        number: function(v, formatString) {
	        	var I18NFormatCleanRe,
	        	formatCleanRe  = /[^\d\.]/g;
	            if (!formatString) {
	                return v;
	            }
	            v = $.youi.formatUtils.from(v, NaN);
	            if (isNaN(v)) {
	                return '';
	            }
	            var comma = ',',
	                dec   = '.',
	                i18n  = false,
	                neg   = v < 0,
	                hasComma,
	                psplit;

	            v = Math.abs(v);

	            // The "/i" suffix allows caller to use a locale-specific formatting string.
	            // Clean the format string by removing all but numerals and the decimal separator.
	            // Then split the format string into pre and post decimal segments according to *what* the
	            // decimal separator is. If they are specifying "/i", they are using the local convention in the format string.
	            if (formatString.substr(formatString.length - 2) == '/i') {
	                if (!I18NFormatCleanRe) {
	                    I18NFormatCleanRe = new RegExp('[^\\d\\' + dec + ']','g');
	                }
	                formatString = formatString.substr(0, formatString.length - 2);
	                i18n   = true;
	                hasComma = formatString.indexOf(comma) != -1;
	                psplit = formatString.replace(I18NFormatCleanRe, '').split(dec);
	            } else {
	                hasComma = formatString.indexOf(',') != -1;
	                psplit = formatString.replace(formatCleanRe, '').split('.');
	            }

	            if (1 < psplit.length) {
	                v = v.toFixed(psplit[1].length);
	            } else if(2 < psplit.length) {
	                //<debug>
	            	alert("Invalid number format, should have no more than 1 decimal");
	                //</debug>
	            } else {
	                v = v.toFixed(0);
	            }

	            var fnum = v.toString();

	            psplit = fnum.split('.');

	            if (hasComma) {
	                var cnum = psplit[0],
	                    parr = [],
	                    j    = cnum.length,
	                    m    = Math.floor(j / 3),
	                    n    = cnum.length % 3 || 3,
	                    i;

	                for (i = 0; i < j; i += n) {
	                    if (i !== 0) {
	                        n = 3;
	                    }

	                    parr[parr.length] = cnum.substr(i, n);
	                    m -= 1;
	                }
	                fnum = parr.join(comma);
	                if (psplit[1]) {
	                    fnum += dec + psplit[1];
	                }
	            } else {
	                if (psplit[1]) {
	                    fnum = psplit[0] + dec + psplit[1];
	                }
	            }

	            if (neg) {
	                /*
	                 * Edge case. If we have a very small negative number it will get rounded to 0,
	                 * however the initial check at the top will still report as negative. Replace
	                 * everything but 1-9 and check if the string is empty to determine a 0 value.
	                 */
	                neg = fnum.replace(/[^1-9]/g, '') !== '';
	            }

	            return (neg ? '-' : '') + formatString.replace(/[\d,?\.?]+/, fnum);
	        }
			
		},
		
		/**
		 * 获取YOUI组件
		 */
		getWidget:function(widgetElem,widgetName){
			var _widgetFullName = 'youi-'+widgetName;
			return $.data(widgetElem,_widgetFullName);
		},
		/**
		 * $.youi.pageUtils.loadPage(container,pageUrl);
		 * $.youi.pageUtils.element(elemId,pageId);
		 * $.youi.pageUtils.goPage(url,record,options);
		 */
		pageUtils:{
			/**
			 * 页面加载 
			 */
			loadPage:function(container,pageUrl,after,params){
				_showLoading('页面加载中，请稍后...');
				
				window.setTimeout(function(){
					pageUrl = connectUrlWithContext(pageUrl);
					//如果是IE，则增加时间戳
					if(/msie/.test(navigator.userAgent.toLowerCase())){
						pageUrl = $.youi.parameterUtils.connectParameter(pageUrl,'timeStamp_',new Date().getTime());
					}
					container.load(pageUrl,params||{},function(responseText, status, jqXHR){
						//返回登录
						var isLoginPage = jqXHR.getResponseHeader('LOGIN');
						if(isLoginPage=='true'){
							//刷新页面
							$(this).hide();
							window.location.href = window.location.href;
						}
						
						_hideLoading();
						
						if('error'==status){
							$(this).html(responseText);
						}
						
						var pageId = $('.youi-page:first',this).attr('id');
						if(pageId&&pageId.length>2){
							$.youi.pageUtils.loadPageScript(pageId.substring(2),function(){
								if($.isFunction(after)){
									after.apply(container[0]);
								}
							});
						}
						
						
					});
				});
			},
			/**
			 * 根据元素ID和页面ID查找页面元素
			 */
			element:function(elemId,pageId){
				var id = elemId;
				if(pageId){
					id ='P_'+ pageId+'_'+elemId;
				}
				return $('#'+id);
			},
			
			/**
			 * 跳转到页面
			 *	1：交易页面打开
			 *	2：子页面跳转
			 *	3：弹出页面（dialog）
			 */
			goPage:function(url,record,options){
				options = options||{};
				switch(options.type){
					case 'dialog':
						_openSubPage(options.pageId,url,options.pageTitle,record);
						break;
					case 'iframe':
						_openPage(url,record,options.frameName);
						break;
					default:
						_openWindowPage(url,record);	
				}
				
			},
			
			/**
			 * 执行页面函数 P_010104_init_page
			 */
			doPageFunc : function(funcName,pageId,pageDoc){
				var fullFuncName = 'P_'+pageId+'_'+funcName;
				if($.isFunction(window[fullFuncName])){
					return window[fullFuncName].apply(pageDoc);
				}
			},
			/**
			 * 加载script文件
			 */
			loadUiScript:function(uiName,scriptUrl,after){
				if($.youi[uiName])return;
				$.ajax({
					url:scriptUrl,
					dataType:'script',
					success:function(){
						after();
					},
					error:function(e,a,msg){
						$.youi.messageUtils.showError(scriptUrl+":"+msg);
					}
				});
			},
			/**
			 * 加载页面脚本
			 */
			loadPageScript : function(pageId,after,pageDoc){
				if(pageId){
					var scriptUrl = $.youi.serverConfig.contextPath+'scripts/page/'+pageId+'.html';
					//firefox模式
					if(/Firefox/.test(navigator.userAgent.toLowerCase())){
						var scriptId = 'script_'+pageId;
						
						$('script#'+scriptId).remove();
						
						var scriptDoc = document.createElement('script');
						scriptDoc.setAttribute('id','script_'+pageId);
						scriptDoc.setAttribute('type','text/javascript');
						scriptDoc.setAttribute('src',scriptUrl);
						var bodyDoc = $('body',document)[0];
						bodyDoc.parentNode.appendChild(scriptDoc);
						
						$(scriptDoc).bind('load',function(){
							if(!this.hasLoaded){
								this.hasLoaded = true;
								if($.isFunction(after)){
									after(pageDoc);
								}
							}
						});
					}else{
						//IE,chrome下使用ajax模式
//						$.getScript(scriptUrl,function(s){
//							after(pageDoc);
//						});
						$.ajax({
							url:scriptUrl,
							dataType:'script',
							success:function(){
								after(pageDoc);
							},
							error:function(e,a,msg){
								$.youi.messageUtils.showError(scriptUrl+":"+msg);
							}
						});
						//jQuery.get( scriptUrl,null, function(){after(pageDoc);}, "script" );
					}
				}
			},
			getFuncUrls:function(pageId,urls){
				var funcUrls = {};
				
				if(urls&&$.youi.serverConfig.urls){
					var urlArr = urls.split(',');
					for(var i=0;i<urlArr.length;i++){
						if(urlArr[i]){
							var key = "P_"+pageId+"_"+urlArr[i];
							if($.youi.serverConfig.urls[key]){
								funcUrls[urlArr[i]] = $.youi.serverConfig.urls[key];
							}
						}
					}
				}
				return funcUrls;
			}
		},
		
		/**
		 * 按钮工具
		 * $.youi.buttonUtils.addButtonActionListener(element,actions)
		 * $.youi.buttonUtils.createButton(button)
		 * $.youi.buttonUtils.createButtons(buttons)
		 */
		buttonUtils:{
			/**
			 * 添加按钮动作监听
			 */
			addButtonActionListener:function(element,actions){
				var btnSelector = '.btn';
				var btnActiveStyle = 'active';
				element.delegate(btnSelector,'click',function(event){
					var name = $(this).data('name');
					
					if('closeDialog'==name){
						$(this).parents('.youi-dialog-container:first').find('.youi-dialog:first').dialog('close');
						//popover
					}else if(name){
						//根据约定的规则截取当前区块下按钮唯一性标识
						//参数中获取按钮动作函数
						var action = actions[name];
						
						//如果获取的动作为string类型，使用window全局函数
						if(typeof(action)=='string'){
							action = window[action];
						}
						//如果action不存在，使用约定规则的全局函数
						if(!action&&$.isFunction(window['func_button_'+name])){
							action = window['func_button_'+name];
						}
						
						if($.isFunction(action)){
							//$(btnSelector,event.delegateTarget).not(this).removeClass(btnActiveStyle);
							//$(this).addClass(btnActiveStyle);
							action.apply(this,[event.delegateTarget]);
						}
					}
				});
			},
			/**
			 * 创建按钮
			 * options{
			 * 	id:按钮标识
			 * 	text:按钮显示文本
			 * 	icon:按钮图标样式，需要自定义相应的样式背景
			 *  buttonStyles
			 *  tooltip 提示信息
			 * 	action 按钮动作
			 *  disabled 
			 * }
			 */
			createButton:function(options){
				var htmls = [];
				var activeStyle = options.active?'active-'+options.active:'active-0';
				var styles = ['youi-button btn btn-default',(options.disabled?'disabled':''),options.name].concat(options.buttonStyles);
				
				htmls.push('<button type="button" ');
				//if(options.action){
				htmls.push( 'data-name="'+options.name+'" ');
				if(options.command){
					htmls.push( 'data-command="'+options.command+'" ');
				}
				
				if(options.tooltips){
					htmls.push( ' title="'+options.tooltips+'" ');
				}
				//}
				htmls.push(' class="'+styles.join(' ')+'">');
				if(options.icon){
					htmls.push('<span class="youi-icon glyphicon glyphicon-'+options.icon+' '+options.icon+'"></span> ');
				}
				if(!options.tooltips){
					htmls.push(options.caption);
				}
				htmls.push('</button>');
				return htmls.join('');
			},
			
			createButtons:function(buttons,align,groupStyle){
				var htmls = [];
				var groupStyle ='btn-group '+ (groupStyle||'btn-group-sm');
				if($.isArray(buttons)){
					htmls.push('<div class="'+groupStyle+' pull-'+(align?align:'')+'">');
					for(var i=0;i<buttons.length;i++){
						htmls.push($.youi.buttonUtils.createButton(buttons[i]));
					}
					htmls.push('</div>');
				}
				return htmls.join('');
			},
			
			dialogExec:function(btnDom,action){
				var dialogElem = $(btnDom).parents('.youi-dialog-container:first').find('.youi-dialog:first');
				if(dialogElem.length&&$.isFunction(action)){
					action.apply(dialogElem[0]);
				}
			}
		},
		
		/**
		 * 弹出的div的辅助工具
		 */
		popUtils:{
			showPopBackground:function(zIndex){
				var popBackgroundElem = $('#youi-pop-background');
				if(popBackgroundElem.length==0){
					popBackgroundElem = $('<div id="youi-pop-background"></div>').appendTo($('body',document));
					popBackgroundElem.disableSelection();
				}
				var height = Math.max($(window).height(),$('body',document).height());
				popBackgroundElem.show().css('height',height);
			},
			hidePopBackground:function(){
				if($('#youi-pop-background').length){
					$('#youi-pop-background').hide();
				}
			}
		},
		
		
		/**
		 * 数据集工具
		 */
		recordUtils:{
			/**
			 * $.youi.recordUtils.records2Htmls
			 * 解析标准json格式的records [{userId:'1',userName:'zhang'},{userId:'2',userName:'you'}]
			 * options{
			 * 	propertyDescriptor:{},//数据属性描述对象
			 * 	parseRecord:function(i,dataRecord,options){return '';},//数据对象解析的回调函数
			 * 	parse:function(dataRecords,itemsHtmls,options){return ''},//解析数据返回解析结果的回调函数
			 * }
			 */
			records2Htmls:function(records,options){
				if(!$.isArray(records)||records.length==0)return '';
				var record,dataRecord;
				var dataRecords = [];//处理后的数据集
				var propertyDescriptor = options.propertyDescriptor;
				if(!propertyDescriptor)dataRecords = records;//当没有propertyDescriptor时，直接使用原始数据集
				
				var itemHtmlArray = [];
				
				for(var i=0;i<records.length;i++){
					record = records[i];
					if(!record)continue;
					if(propertyDescriptor){
						dataRecord = {};
						for(var property in propertyDescriptor){
							dataRecord[property] = record[propertyDescriptor[property]];
						}
						dataRecords.push(dataRecord);
					}else{
						dataRecord = record;
					}
					//解析单条数据
					if($.isFunction(options.parseRecord)){
						var result = options.parseRecord(i,dataRecord,options)||'';
						var resultArray = [];
						if($.isArray(result)){
							resultArray = result;
						}else{
							resultArray = [result];
						}
						
						for(var j=0;j<resultArray.length;j++){
							itemHtmlArray[j] = (!itemHtmlArray[j])?[]:itemHtmlArray[j];
							itemHtmlArray[j].push(resultArray[j]||'');
						}
					}
					record = null;
					dataRecord = null;
				}
				if($.isFunction(options.parse)){//返回解析结果
					return options.parse(dataRecords,itemHtmlArray,options);
				}
				return [];
			},
			
			getPropertyValue:function(record,property){
				if(!property)return;
				var value;
				var properties = property.split('.');
				//alert(properties);
				if(properties.length>1){//处理多级属性
					value = record;
					for(var i=0;i<properties.length;i++){
						value = value[properties[i]];
						if($.youi.stringUtils.isEmpty(value))return;
					}
				}else{
					value = record[property];
				}
				return value;
			},
			
			setPropertyValue:function(record,property,value){
				if(!property)return;
				var properties = property.split('.');
				if(properties.length>1){//处理多级属性
					
					var vObject = record[properties[0]]||{};
					record[properties[0]] = vObject;
					for(var i=1;i<properties.length;i++){
						if(i==properties.length-1){
							vObject[properties[i]] = value;
						}else{
							vObject = vObject[properties[i]] || {};
						}
					}
				}else{
					record[property] = value;
				}
			},
			/**
			 * record 对象转换为参数
			 */
			recordToParameters:function(record){
				var fieldValues = [];
				if(record){
					//隐藏域
					for(var property in record){
						var value = record[property];
						if(value){
							if(typeof(value)=='string'){
								fieldValues.push({
									property:property,
									value:value
								});//{}
							}else if(value&&$.isArray(value)){
								if(typeof(value[0])=='object'){//集合对象类型
									$(value).each(function(index){
										var valueRecord = this;
										for(var p in valueRecord){
											fieldValues.push({
												property:property+'['+index+'].'+p,
												value:valueRecord[p]
											});
										}
									});
								}else{
									$(value).each(function(index){
										fieldValues.push({
											property:property+'['+index+']',
											value:this
										});
									});
								}
							}
						}
						value = null;
					}
				}
				
				return fieldValues;
			}
		},
		
		/**
		 * 参数工具
		 * $.youi.parameterUtils.propertyParameter(property,value)
		   $.youi.parameterUtils.connectParameter(src,property,value)
		 */
		parameterUtils:{
			propertyParameter:function(property,value){
				var pamameters = [];
				if($.isArray(value)){
					$(value).each(function(){
						if(this!=null)pamameters.push(''+property+'='+encodeURIComponent(this));
					});
				}else{
					if($.youi.stringUtils.notEmpty(value))pamameters.push(''+property+'='+encodeURIComponent(value));
				}
				return pamameters.join('&');
			},
			connectParameter:function(src,property,value){
				return src+(src.indexOf('?')==-1?'?':'&')+$.youi.parameterUtils.propertyParameter(property,value);
			}
		},
		/**
		 * 高宽辅助工具
		 * $.youi.dimensionUtil.parseWidth(element,width)
		 */
		dimensionUtil:{
			/**
			 * 得到元素宽度
			 */
			parseWidth:function(element,width){
				if(typeof(width)=='string'&&width.indexOf('%')!=-1){
					return element.parent().width()*parseInt(width)/100;
				}
				return width;
			}
		},
		
		/**
		 * 消息工具
		 * $.youi.messageUtils.showMessage();
		 */
		messageUtils:{
			showMessage:function(message){
				showMsgDialog(message,'提示信息','message');
			},
			
			showError:function(message){
				showMsgDialog(message,'异常信息','error');
			},
			
			widgetConfirm:function(message,confirmFunc,widgetInstance){
				if(message&&arguments.length > 2){
					var params = $.makeArray(arguments).slice(3);
					_showConfirm(message,confirmFunc,params,widgetInstance);
				}
			},
			
			confirm:function(message,confirmFunc){
				if(message&&arguments.length > 1){
					var params = $.makeArray(arguments).slice(2);
					_showConfirm(message,confirmFunc,params);
				}
			}
		},
		/**
		 * ajax工具
		 * $.youi.ajaxUtil.ajax
		 */
		ajaxUtil:{
			ajax:function(ajaxOptions,isTimeStamp){
				if(!ajaxOptions.url){
					$.youi.messageUtils.showError('没有ajax url参数！');
					return;
				}
				if(ajaxOptions.notShowLoading!=true){
					_showLoading(ajaxOptions.wait);//
				}
				
				isTimeStamp = false;//(isTimeStamp||$.browser.msie)?true:false;
				if(isTimeStamp&&ajaxOptions.data){
					ajaxOptions.data+=('&youi-timeStamp='+new Date().getTime());
				}
				if($.youi.serverConfig.contextPath&&ajaxOptions.url.substring(0,1)=='/'
						&&ajaxOptions.url.indexOf($.youi.serverConfig.contextPath)==-1){
					ajaxOptions.url = $.youi.serverConfig.contextPath+ajaxOptions.url.substring(1);
				}
				
				var options = $.extend({},{
					dataType:'json',
					type:'POST',
					contentType:'application/x-www-form-urlencoded;charset=UTF-8',//配置提交的contentType
					error:function(errMsg){
						//alert(errMsg);
					}
				},ajaxOptions);
				
				var oldSuccess = options.success || function(){};
				var oldError =  options.error || function(){};
				var domainValidator = options.domainValidator||function(){};
				
				options.complete = function(jqXHR, statusText, responseText){
					if(statusText=='error'){
						var errorMessage = $.youi.resourceUtils.get('urlNotFound',this.url);
						$.youi.messageUtils.showError(errorMessage);
						this.error.apply(options,[errorMessage]);
					}
					_hideLoading();//关闭进度显示
				}
				
				options.success = function(results){
					//关闭进度显示
					_hideLoading();
					//通用信息处理
					//
					$.youi.ajaxUtil.resultsCheck(results,{
						error:oldError,
						domainValidator:domainValidator
					})&&oldSuccess.apply(options,[results]);
				};
				
				$.ajax(options);
			},
			/**
			 * 通用结果集检查
			 */
			resultsCheck:function(results,options){
				if(results==null)return false;
				if(results.hasError){
					$.youi.messageUtils.showError(results.errorMsg);
					options.error.apply(options,[results.errorMsg]);
					return false;
				}
				//sdc平台提示信息规则
				if(results.result&&results.result.message){
					$.youi.messageUtils.showMessage(results.result.message);
				}
				
				var message = results.message;
				var checkFlag = true;
				if(message&&message.code){
					var code = message.code;
					switch(code){
						case '000000'://成功访问
							if(message.passed==null){
								$.youi.messageUtils.showMessage(message.info);
							}
							break;
						case '111111'://登录过期
							//$.youi.messageUtils.showMessage(code+':'+message.info);
							checkFlag = false;
							window.location.href = $.youi.serverConfig.contextPath;//刷新页面
							return;
						case '111112'://对象属性校验不通过
							options.domainValidator.apply(options,[results]);
							checkFlag = false;
							return;
						default:
							$.youi.messageUtils.showError(message.info);
							options.error.apply(options,[message.info]);
							checkFlag = false;
							return;
					}
				}
				return checkFlag;
			},
			
			ajaxRemove:function(removeSrc,id,confirmMsg,after){
				$.youi.messageUtils.confirm(confirmMsg,function(id){
					if(removeSrc){
						//执行删除操作
						$.youi.ajaxUtil.ajax({
							url:removeSrc,
							success:function(){
								if($.isFunction(after)){
									after(id);
								}
							}
						});
					}
				},id);
			}
		},
		/* 命令模式抽象类 */
		command:{
			_initCommands:function(){
				this.commands = [];//执行过的的命令数组，供撤销使用
				this.undoCommands = [];//撤销过的命令数组,供重做使用
				this.registedCommands = [];//初始化注册数组
			},
			
			/* 系统执行命令相关函数 **/
			executeCommand:function(command){
				
				var params = Array.prototype.slice.call( arguments, 1 );
				
				if(command=='redo'||command=='undo'){
					this[command]();
					if($.isFunction(this.options.afterCommand)){
						this.options.afterCommand.apply(this.element[0],[this.commands,this.undoCommands]);
					}
					return;
				}
				if(typeof(command)=='string'&&this.registedCommands[command]){
					//options = $.extend({editorId:this.options.id},command.defaults);
					command = $.extend({params:params,context:{}},this.registedCommands[command]);
					//alert('editorId:'+command.options.editorId);
					this.commands.push(command);
					var exec = this.exec();
					if(exec!==null&&exec===false){//无效的命令
						this.commands.pop();//直接移出
					}else{
						$.youi.log.info('执行动作：'+command.getTitle.apply(command.options));
						//销毁context里面的内容
						for(var i=0;i<this.undoCommands.length;i++){
							if(this.undoCommands[i].context){
								for(var param in this.undoCommands[i].context){
									this.undoCommands[i].context[param] = null;
								}
							}
						}
						
						this.undoCommands = [];//清空重做项
						if($.isFunction(this.options.afterCommand)){
							this.options.afterCommand.apply(this.element[0],[this.commands,this.undoCommands]);
						}
					}
				}
			},
			/**
			 * 执行命令
			 */
			exec:function(isRedo){
				if(this.commands.length>0){
					var command = this.commands[this.commands.length-1];
					
					command.context.isRedo = isRedo;
					return command.exec.apply(this,[command.context].concat(command.params));
				}
			},
			/**
			 * 撤销
			 */
			undo:function(){
				if(this.commands.length>0){
					var undoCommand = this.commands.pop();
					if($.isFunction(undoCommand.undo)){
						undoCommand.undo.apply(this,[undoCommand.context].concat(undoCommand.params));
						this.undoCommands.push(undoCommand);
						$.youi.log.info('撤销动作：'+undoCommand.getTitle.apply(this,undoCommand.params));
					}
				}
			},
			/**
			 * 重做
			 */
			redo:function(){
				if(this.undoCommands.length>0){
					var redoCommand = this.undoCommands.pop();
					this.commands.push(redoCommand);
					this.exec(true);
					$.youi.log.info('重做动作：'+redoCommand.getTitle.apply(redoCommand.options));
				}
			},
			/**
			 * 注册命令
			 * 返回name
			 */
			registerCommand:function(name,command,shortcutKey){
				
				if(typeof(command)=='string'){
					shortcutKey = command;
					command = null;
				}
				
				if(!command&&$.isFunction(this[name])){
					command = $.extend({},{
						shortcutKey:shortcutKey,//快捷键
						getTitle:function(){
							return name;
						},
						exec:this[name],
						undo:this[name+'Undo']
					});
				}
				
				if(command){
					this.registedCommands[name] = command;
				}
				
				return this;
			},
			/**
			 * 获得执行过的命令集合
			 */
			getCommands:function(){
				return [].concat(this.commands);
			},
			/**
			 * 获得撤销过的命令集合
			 */
			getUndoCommands:function(){
				return [].concat(this.undoCommands);
			}
		},
		/**
		 * 拖动支持抽象类
		 */
		dragSupport:{
			_doDrag:function(dropElem){
				if(dropElem[0]!=this.currentDrag[0]){//移入节点
					//对上一个drop节点执行dropOut动作
					if(this.currentDrop&&this.currentDrop[0]!=dropElem[0]){
						this._dropOut();//
					}
					//对进入接受节点时执行dropOver动作
					if(!this.currentDrop||this.currentDrop[0]!=dropElem[0]){
						this.currentDrop = dropElem;
						this._dropOver();//
					}	
				}
			},
			/**
			 * 释放接受对象
			 */
			_releaseDrop:function(){
				if(this.currentDrop){
					this._dropOut();//
				}
				this.currentDrop = null;
			},
			/**
			 * 移动到可接受节点上的动作
			 */
			_dropOver:function(after){
				this.helper&&this.helper.addClass('drop-yes');
				this.currentDrop&&this.currentDrop.addClass('droping');
			},
			/**
			 * 移出可接受节点上的动作
			 */
			_dropOut:function(after){
				this.helper&&this.helper.removeClass('drop-yes');
				this.currentDrop&&this.currentDrop.removeClass('droping');
			},
			
			_createHelper:function(event,dragElement){
				var helper = $('<div class="drop-helper" id="drag_helper"><span class="youi-icon glyphicon drop pull-left"></span></div>').append(dragElement.clone());
				
				if(!helper.parents('body').length)
					helper.appendTo(this.options.container?this.options.container:this.currentDrag);
		
				if(helper[0] != this.element[0] && !(/(fixed|absolute)/).test(helper.css("position")))
					helper.css("position", "absolute");
				return helper;
			},
			
			_generatePosition: function(event,dragElem) {
				var pageX = event.pageX,pageY = event.pageY;
				var offset = this.options.container?this.options.container.offset():this.element.offset();
				offset = offset?offset:{top:0,left:0};
				
				var dragOffset = {left:0,top:0};
				
				return {
					top:pageY+10-offset.top-dragOffset.top,
					left:pageX+5-offset.left-dragOffset.left
				};
			}
		},
		
		treeUtils:{
			addNode:function(targetTree,record,idAttr,textAttr,pidAttr){
				var relTreeNode;
		
				if(!record[pidAttr]){
					relTreeNode = targetTree.find('li.treeNode:first');
				}else{
					relTreeNode = targetTree.find('li.treeNode#'+record[pidAttr]);
				}
				if(relTreeNode.attr('src')&&!relTreeNode.hasClass('loaded')){
					targetTree.tree('triggerNode',relTreeNode);
				}else{
					if(record[textAttr]&&record[idAttr]){
						targetTree.tree('addNode',relTreeNode,record[idAttr],record[textAttr]);
						return true;
					}
				}
				return false;
			}
		},
		
		editorUtils:{
			buildWidget:function(fieldType,fieldOptions){
				var widgetId = $.youi.fieldUtils.getFieldId(fieldOptions.property,fieldOptions.prefix);
				var fieldWidget = $('#'+widgetId);
				if(!fieldWidget.length){
					fieldWidget = $('<div></div>')[fieldType](fieldOptions);
				}
				return fieldWidget;
			}
		}
	});
	
	/*
	 * 抽象类
	 */
	$.widget("youi.abstractWidget",$.ui.mouse, {
		_log:$.youi.log,
		
		options:{
			bindResize:false
		},
		
		_create:function(){
			var startTime = this._getTime();
			this.element.addClass("youi-"+this.widgetName);
			//设置id
			this.options.id = this.element.attr('id')||(this.widgetName+'_'+this.uuid);
			
			if(!this.element.attr('id')){
				this.element.attr('id',this.options.id);
			}
			
			this._initModel();
			
			if(this.options.initHtml!=false){
				this._defaultHtmls();
			}
			
			this._initAction();
			
			if(this.options.editable){
				this._bindEditable();
			}
			
			if(this.options.bindResize){
				$.youi.widgetUtils.bindResize(this.element,this.widgetName);
			}
			
			this._initWidget();
			this._log.debug(this._buildLogMsg('create complete.',startTime));
		},
		
		_bindEditable:function(){
			var widgetName = this.widgetName;
			this.element.addClass('youi-editor').attr('data-editor',true);
			this.element.bind('editor.open',function(event,ui){
				$(event.delegateTarget)[widgetName]('openEditor',ui);
				
				event.stopPropagation();
			});
		},
		
		_buildLogMsg:function(msgInfo,startTime,prefix){
			var msgOut = [];
			var time = this._getTime();
			msgOut.push(time);
			msgOut.push(this.widgetFullName+'#'+this.options.id);
			
			if(prefix){
				msgOut.push(prefix);
			}
			
			if(typeof(msgInfo)=='string'){
				msgOut.push(msgInfo);
			}else if(typeof(msgInfo)=='object'){
				for(var i in msgInfo){
					msgOut.push(i+'='+msgInfo[i]);
				}
			}
			
			if(startTime){
				msgOut.push('耗时'+(time-startTime)+'毫秒.');
			}
			
			return msgOut.join(' ');
		},
		
		_getTime:function(){
			return new Date().getTime();
		},
		
		_initModel:function(){
			
		},
		
		_initWidget:function(){
			
		},
		/**
		 * 组件聚焦
		 */
		_widgetFocus:function(event){
			var focusHelper = this.element.find('a.youi-widget-focus');
			if(focusHelper.length===0){
				focusHelper = $('<a href="###" contenteditable="true" class="youi-widget-focus" tabIndex="-1"></a>').appendTo(this.element);
			
				focusHelper.bind('click mousedown keydown focus',function(event){
					return false;
				});
			}
			
			//设置位置,防止画面跳动
			focusHelper.css({
				'left':this.element.scrollLeft(),
				'top':this.element.scrollTop()
			});
			
			focusHelper.focus();
		},
		
		_getI18n:function(key){
			var i18nKey = this.widgetName+'.'+key;
			var value = $.youi.resource[i18nKey];
			if(!value)return '';
			if($.isFunction(value)){
				return value(Array.prototype.slice.call( arguments, 1 ));
			}
			return value;
		},
		
		resize:function(){
			if(this.options.bindResize){
				var startTime = this._getTime();
				this._resize();
				this.element.addClass('resized');
				this._log.debug(this._buildLogMsg('resize complete.',startTime));
			}
		},
		
		destroy:function(){
			this._destroy();
			this.element.removeClass('youi-'+this.widgetName);
			$.Widget.prototype.destroy.apply(this, arguments);
			
			this._log.debug(this._buildLogMsg('destroy complete.'));
		},
		
		/**
		 * 执行组件中的动作
		 */
		execCommand:function(dom,commandObj){
			if(commandObj.name){
				var commandFunc = commandObj.name+'Command';
				if($.isFunction(this[commandFunc])){
					this[commandFunc](dom,commandObj);
				}else if($.isFunction(this[commandObj.name])){
					this[commandObj.name](dom,commandObj);
				}else if(this.options.buttonActions&&this.options.buttonActions[commandObj.name]){
					var action = this.options.buttonActions[commandObj.name];
					
					if(typeof(action)=='string'){
						action = window[action];
					}
					
					if($.isFunction(action)){
						action.apply(this.element[0],[dom,commandObj]);
					}
				}else{
					this._callGloablFunc(commandObj.name,dom,commandObj);
				}
			}
		},
		/**
		 * 调用全局函数
		 */
		_callGloablFunc:function(funcName){
			var gloablFuncName = this.options.id+'_'+funcName.replace(/\./g,'_');
			
			this._log.debug(this._buildLogMsg('调用全局函数 '+gloablFuncName+'.'));
			
			if($.isFunction(window[gloablFuncName])){
				var args = Array.prototype.slice.call( arguments, 1 );
				try{
					return window[gloablFuncName].apply(this.element[0],args);
				}catch(err){
					
				}
			}
			
			return true;
		},
		/**
		 * 上下文菜单集成
		 */
		_contextMenuInit:function(isReturn){
			var widgetName = this.widgetName;
			this.element.attr('data-contextmenu',widgetName);
			if(isReturn){
				this.element.attr('data-contextmenureturn',"true");
			}
			this.element.bind('widget.contextmenu',this._contextmenu());
			
			this.element.bind(this.widgetName+'.contextmenu',function(event,ui){
				$(this)[widgetName]('contextmenuCommandDispatcher',ui);
			});
		},
		
		/**
		 * 弹出菜单动作分发
		 */
		contextmenuCommandDispatcher:function(options){
			this.execCommand(options.menuTarget,options);
		},
		
		_contextmenu:function(){
			var widgetName = this.widgetName; 
			var element = this.element;
			var _self = this;
			return function(event,ui){
				var groups = _self._getContextmenuGroups(ui.menuTarget,{
					x:ui.left,
					y:ui.top
				});
				if(groups){
					_showContextmenu(ui,widgetName,groups);
				}
			};
		},
		
		_getContextmenuGroups:function(dom,options){
			
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
		 * 接口方法，重定位
		 */
		_resize:function(){
			
		},
		/**
		 * 接口方法，销毁组件
		 */
		_destroy:function(){
			
		}
	});
	
	$(function(){
		$('body',document).bind('contextmenu',function(event){
			//
			var elem = $(event.target);
			var widgetElem = $(event.target).closest('[data-contextmenu]');
			if(widgetElem.length){
				widgetElem.trigger('widget.contextmenu',{
					menuTarget:event.target,
					left:event.clientX-10,
					top:event.clientY-10,
					bindWidget:widgetElem[0]
				});
				if(widgetElem.data('contextmenureturn')==true){
					return false;
				}
			}
		}).delegate('[data-editor]','mousedown',function(event){
			//通用的editor
			var elem = $(event.target),
				pOffset = elem.offsetParent().offset();
			
			var editor = elem.data('editor');
			if(!editor||editor=='fieldLabel'){
				return;
			}
			//打开editor
			var editorElem = elem.parents('.youi-editor:first');
			if(editorElem.length){
				elem.addClass('editing');
				//
				var editorPanelId = 'youi_editor_container_globle';
				var editorContainer = $('#'+editorPanelId);
				
				if(!editorContainer.length){
					editorContainer = $('<div id="'+editorPanelId+'" class="youi-editor-container col-sm-12 youi-bgcolor"></div>').appendTo(event.delegateTarget);
					editorContainer.disableSelection();
					editorContainer.bind('mouseleave',function(event){
						_triggerEditorClose($(this));
					});
					
					editorContainer.delegate('.option-item','dblclick',function(event){
						_triggerEditorClose($(event.delegateTarget));
					});
				}
				
				var ui = {'editTarget':event.target,'editorContainer':editorContainer};
				editorElem.trigger('editor.open',ui);
				
				editorContainer.css({
					left:elem.offset().left-1,
					top:elem.offset().top-1,
					width:elem.outerWidth()+2,
					height:elem.outerHeight()+2
				}).show();
				
				event.stopPropagation();
			}
			
		});
	});
	
	function _triggerEditorClose(editorElem){
		editorElem.hide();
		editorElem.trigger('editor.close');
		editorElem.unbind('editor.close');
	}
	/**
	 * ajax loading 显示
	 */
	function _showLoading(title){
		var id = 'youi_loading';
		var loading = $('#'+id);
		if(!loading.length){
			loading = $('<div class="youi-loading" id="'+id+'"/>').appendTo($('body',document));
		}
		title = title||$.youi.resourceUtils.get('loading');
		$('body',document).addClass('show-loading');
		loading.show().text(title).css({
			height:Math.max($(window).height(),$('body',document).height())
		});
	}
	/**
	 * ajax loading 隐藏
	 */
	function _hideLoading(){
		var id = 'youi_loading';
		$('#'+id).hide();//'slow'
		$('body',document).removeClass('show-loading');
	}
	
	function _frameDialogOpen(){
		var dialodId = 'youi_dialog_frame';
		var dialogElement = $('#'+dialodId);
		if(dialogElement.length==0){
			dialogElement = $('<div id="'+dialogId+'"><iframe></iframe></div>').appendTo($('body',document));
		}
		
		dialogElement.dialog({
			autoOpen: false,
			width:(this.options.width||600)+28,
			title:'i',
			modal: true, 
			minHeight:500,
			overlay: { opacity: 0.2, background: "#A8A8A8" },
			zIndex:1002
		}).show().dialog('open',title);
		
	}
	
	/**
	 * 输出日记信息
	 */
	function _writeMessage(text,options){
		if(console){
			var type = options.type?options.type:'log';
			if(console[options.type]){
				console[options.type](text);
			}
		}else{
			var logPanelId = 'youi_log';
			var logPanel = $('#'+logPanelId);
			if(logPanel.length==0){
				logPanel = $('<div class="youi-log" id="'+logPanelId+'"></div>').appendTo($('body',document));
			}
			logPanel.prepend('<div class="'+(options.type||'')+'">'+logPanel.find('div').length+':'+text+'</div>');
			
			logPanel.dialog({
				autoOpen: false,
				width:500,
				title:'日记',
				minHeight:500,
				zIndex:1002
			}).dialog('open').show();
		}
	}
	
	function _showConfirm(message,confirmFunc,params,widgetInstance){
		if(message){
			var dialogId = 'youi-dialog-confirm';
			var messageDialog = $('#'+dialogId);
			if(!messageDialog.length){
				messageDialog = $('<div id="'+dialogId+'"></div>');
			}
			
			messageDialog.html(message).dialog({
				autoOpen: false,
				modal:true,
				width:600,
				position:['center',100],
				title:'确认提示',
				minHeight:300,
				zIndex:9999,
				buttons:[
				     {name:'confirm',caption:'确认',icon:'submit'},
				     {name:'close',caption:'取消',icon:'close'}
				],
				buttonActions:{
					'close':function(){$('#'+dialogId).dialog('close');},
					'confirm':function(){
						$('#'+dialogId).dialog('confirmCallback');
					}
				}
			}).dialog('confirmOpen',{widgetInstance:widgetInstance,confirmFunc:confirmFunc,params:params}).show();
		}
	}
	
	function showMsgDialog(message,title,type){
		if(message){
			var dialogId = 'youi-dialog-'+type;
			var messageDialog = $('#'+dialogId);
			if(!messageDialog.length){
				messageDialog = $('<div id="'+dialogId+'"></div>');
			}
			message = message.replace(/\n/g,'<br/>');
			messageDialog.html(message).dialog({
				autoOpen: false,
				modal:true,
				width:600,
				title:title,
				minHeight:300,
				position:['center',100],
				zIndex:9999,
				buttons:[
				     {name:'close',caption:'关闭',icon:'close'}
				],
				buttonActions:{
					'close':function(){$('#'+dialogId).dialog('close');}
				}
			}).dialog('open','',9999).show();
		}
	}
	/**
	 * 
	 */
	function connectUrlWithContext(pageUrl){
		if($.youi.serverConfig.contextPath&&pageUrl.substring(0,1)=='/'
			&&pageUrl.indexOf($.youi.serverConfig.contextPath)==-1){
			pageUrl = $.youi.serverConfig.contextPath+pageUrl.substring(1);
		}
		return pageUrl;
	}
	/**
	 * 打开子页面
	 */
	function _openSubPage(pageId,pageUrl,pageTitle,record){
		var subPageContanier = $('#subpage_'+pageId);
		if(subPageContanier.length==0){
			subPageContanier = $('<div id="subpage_'+pageId+'"><div class="subpage-content"></div></div>').appendTo($('body',document));
			
			subPageContanier.subpage({
				subpageId:pageId,
				type:'dialog',
				height:'500',
				src:pageUrl
			});
		}
		subPageContanier.subpage('open',record,pageTitle,record);
		return subPageContanier;
	}
	/**
	 * 打开新窗口
	 */
	function _openWindowPage(url,record){
		_openPage(url,record,'_blank');
	}
	
	function _openPage(url,record,target){
		var formAction = connectUrlWithContext(url);
		var form = $('<form action="'+formAction+'" method="post" target="'+(target?target:'_blank')+'"></form>');
		var params = $.youi.recordUtils.recordToParameters(record);
		
		var htmls = [];
		
		for(var i=0;i<params.length;i++){
			var input = $('<input name="'+params[i].property+'" type="hidden"/>');
			input.val(params[i].value);
			form.append(input);
			//htmls.push('<input type="hidden" name="'+params[i].property+'" value="'+params[i].value+'"/>');
		}
		
		$('body',document).append(form);
		window.setTimeout(function(){
			form[0].submit();
			form.remove();
		});
	}
	
	function _showContextmenu(ui,widgetName,groups){
		if($.youi.xmenu){
			var widgetContextmenuId = 'contextmenu_widget_golabl';
			var contextmenu = $('ul#'+widgetContextmenuId);
			if(!contextmenu.length){
				contextmenu = $('<ul id="'+widgetContextmenuId+'"></ul>').appendTo('body',document);
				contextmenu.xmenu({
					menus:$.youi.contextmenus
				});
			}
			
			$.youi.log.debug(widgetName+':'+groups);
			contextmenu.data('bindWidget',widgetName).xmenu('open',ui,groups);
		}
	}
})(jQuery);