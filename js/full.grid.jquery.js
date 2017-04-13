/*
 * Documento   : full.grid.jquery.js v.04.17 
 * Creado      : abril-2017
 * Autor       : DAVID COTRINA
 * Descripcion : 
 */
(function ($) {

    "use strict";

    $.fn.extend({

        fullgrid: function (opt) {

            /*configuracion por defecto*/
            let defaults = {
                oContainer: $(this).attr('id'),
                oTable: null
            };

            let options = $.extend(defaults, opt);

            /*==========================PROPIEDADES Y METODOS PRIVADOS=======================*/
            let _private = {};
            /*css para diseño del gris*/
            _private.cssTable = 'table table-bordered table-hover';
            /*posicion de las acciones*/
            _private.positionAxion = 'first';                           
            /*icono del boton inicio*/
            _private.btnFirst = 'fa fa-fast-backward';
            /*icono del boton atras*/
            _private.btnPrev = 'fa fa-backward';
            /*icono del boton siguiente*/
            _private.btnNext = 'fa fa-forward';
            /*icono del boton final*/
            _private.btnLast = 'fa fa-fast-forward';

            _private.iniInfo = 0;

            _private.finInfo = 0;

            _private.totalInfo = 0;
            
            _private.aData = [];
            
            _private.spinner = 'img/spinner-mini.gif';
            
            /*
             * Rretorna info sobre cantidad de registros
             * @returns {String}
             */
            _private.txtInfo = function(){
                return `${_private.iniInfo} al ${_private.finInfo} de ${_private.totalInfo}`; 
            };
            
            /*
             * Serializa _private.aData
             * @returns {String}
             */
            _private.serialize = function() {
                let data = '';
                $.each(_private.aData,function(i,v) {
                    data += _private.aData[i].name + '=' + _private.aData[i].value + '&';
                });
                _private.aData = [];
                data = data.substring(0, data.length - 1);
                return data;
            };
            
            _private.addToolBar = function(oSettings,params){
                let toolbar = $('<div></div>');
                toolbar.attr('id','toolbar_cont_'+oSettings.oTable);
                //toolbar.addClass('dt-toolbar text-right');
                toolbar.css({
                   padding:'3px',
                   position: 'relative'
                });
                
                /*div group*/
                let toolbarIn = $('<div></div>');
                toolbarIn.addClass('btn-group');
                toolbarIn.attr('id','toolbar_'+oSettings.oTable);

                $(toolbar).html(toolbarIn);
                
                /*agregando toolbar a tObjectContainer*/
                $('#'+oSettings.oContainer).html(toolbar);
                
                let dataFilter = 'hs_cols';
                
                /*===========================AGREGANDO BOTONES=======================*/
                let btns = oSettings.tButtons;
                
                /*verificar si se configuro botones*/
                if(btns.length && $.isArray(btns)){
                    
                }
                /*===========================FIN AGREGANDO BOTONES=======================*/
                
            };
            /*==========================FIN PROPIEDADES Y METODOS PRIVADOS=======================*/
            
            return this.each(function(){
                let oSettings = options;
                
                /*generando id de tabla*/
                oSettings.oTable = oSettings.oContainer+'_fg';
                
                let method = {
                    
                    init: function(){
                        let params = _private.serialize();
                        
                        /*agregando botones, toolbar*/
                        _private.addToolBar(oSettings,params);
                    }
                    
                };
                
                method.init();
                
            });

        }

    });

})(jQuery);