(function($) {
	var _log = $.youi.log;
	/**
	 *  reportviewer 组件
	 * @author  zhouyi
	 * @version 1.0.0
	 * @date 2011-03-18
	 */
	
	var _QUOTE = "_QUOTE_";
	
	$.widget("youi.reportviewer", $.extend({
		_create:function(){
			this.element.addClass('youi-reportviewer');
			this._initAction();
			
		},
		
		_initAction:function(){
			//绑定回车动作提交查询
			this._on('.youi-fieldLayout',{
				'keydown':function(event){
					if(event.keyCode=='13'){
						this.submit();
					}
				}
			});
			
			$.youi.buttonUtils.addButtonActionListener(
				this.element.find('.reportviewer-buttons:first'),
				{
					'submit':function(){$(this).parents('.youi-reportviewer:first').reportviewer('submit');},//查询按钮
					'exportXls':function(){$(this).parents('.youi-reportviewer:first').reportviewer('exportReport','xls');},
					'exportPdf':function(){$(this).parents('.youi-reportviewer:first').reportviewer('exportReport','pdf');}
				}
			);
		},
		
		submit:function(){
			
			if(!this.validate()){
				
				var errorMessage = [];
				this.element.find('.youi-field.validating,.youi-field.validate-error,.edited.validate-error').each(function(){
					if(this.title)errorMessage.push(this.title);
				});
				$.youi.messageUtils.showError(errorMessage.join('\n'));
				
				return;
			}
			
			var params = [];
			params = params.concat(this._getQueryParams());
			
			var reportviewerContent = this.element.find('.reportviewer-content:first');
			reportviewerContent.empty();
			
			var reportName = this.element.find('.youi-fieldLayout').fieldLayout('getRecord').reportName||this.options.reportName;
			var baseUrl = "report";
			
			var loading = this.element.find('.report-loading');
			if(!loading.length){
				loading = $('<div class="report-loading">报表数据加载中，请稍后...</div>').appendTo($(this.element));
			}
			loading.show();
			reportviewerContent.load(baseUrl+'/'+reportName+'.rpt?'+params.join('&'),function(){
				//
				
				var reportTable = $('table:first table:first',this);
				var container = reportTable.parent();
				container.css('overflow','auto');
				//var parentWidth = $(this).offsetParent().width();
				//reportTable.removeAttr('width').css('width','auto');
				//计算宽度
				var frozenCell = $('div[title="frozenCell"]',this);
				if(frozenCell.length>2){
					//frozenCell.html('------');
//					reportTable.clone();
					var left = container[0].offsetLeft,
						top = container[0].offsetTop,
						width = frozenCell.offset().left - $(this).offset().left;
					var scrollHelper = $('<div style="background:white;overflow:hidden;position:absolute;left:'+left+'px;top:'+top+'px;width:'+width+'px"></div>');
					scrollHelper.append(reportTable.clone());
					container.append(scrollHelper);
				}
				
				loading.hide();
			});
		},
		
		validate:function(){
			this.element.find('.youi-field').fieldValidate();
			if(this.element.find('.youi-field.validating,.youi-field.validate-error,.edited.validate-error').length==0){
				return true;
			}
			return false;
		},
		
		exportReport:function(exportFormat){
			var params = [];
			params = params.concat(this._getQueryParams());
			params.push('ReportFormat='+exportFormat);
			var reportviewerContent = this.element.find('.reportviewer-content:first');
			
			var reportName = this.element.find('.youi-fieldLayout').fieldLayout('getRecord').reportName||this.options.reportName;
			var baseUrl = "report";
			
			var downloadIFrame = $('iframe[name=download]');
			if(downloadIFrame.length==0){
				$('<iframe src="about:blank" style="display:none;" name="download"></iframe>').appendTo($('body',document));
			}
			
			window.open(baseUrl+'/'+reportName+'.rpt?'+params.join('&'),'download');
		},
		
		/**
		 * 获取查询参数
		 */
		_getQueryParams:function(){
			var params = [];
			if(this.element.find('.youi-fieldLayout').length==0)return params;
			var fieldValues = [];
			
			this.element.find('.youi-fieldLayout').each(function(){
				var values = $(this).fieldLayout('getFieldValues');
				if($.isArray(values)){
					fieldValues = fieldValues.concat(values);
				}
				
				$(this).find('.youi-field').each(function(index){
					var operator = this.getAttribute('operator');
					var property = this.getAttribute('property');
					if(operator){
						params.push('operator:'+property+"="+operator);
					}
				});
			});
			if(fieldValues){
				$(fieldValues).each(function(){
					if(this.value){
						params.push($.youi.parameterUtils.propertyParameter(this.property,this.value));
						
					}
				});
			}
			return params;
		},
		
		destroy:function(){
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	}));
	
	$.extend($.youi.reportviewer,{
		version: "1.0.0",
		defaults:{
			
		}
	});
})(jQuery);