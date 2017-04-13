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
                oTable: null,
                tToggleColumn: false
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
            _private.txtInfo = function () {
                return `${_private.iniInfo} al ${_private.finInfo} de ${_private.totalInfo}`;
            };

            /*
             * Serializa _private.aData
             * @returns {String}
             */
            _private.serialize = function () {
                let data = '';
                $.each(_private.aData, function (i, v) {
                    data += _private.aData[i].name + '=' + _private.aData[i].value + '&';
                });
                _private.aData = [];
                data = data.substring(0, data.length - 1);
                return data;
            };

            _private.addToolBar = function (oSettings, params) {
                let toolbar = $('<div></div>');
                toolbar.attr('id', 'toolbar_cont_' + oSettings.oTable);
                toolbar.addClass('dt-toolbar text-right'); 
                toolbar.css({
                    padding: '3px',
                    position: 'relative'
                });

                /*div group*/
                let toolbarIn = $('<div></div>');
                toolbarIn.addClass('btn-group');
                toolbarIn.attr('id', 'toolbar_' + oSettings.oTable);

                $(toolbar).html(toolbarIn);

                /*agregando toolbar a tObjectContainer*/
                $('#' + oSettings.oContainer).html(toolbar);

                let dataFilter = 'hs_cols';

                /*===========================AGREGANDO BOTONES=======================*/
                let btns = oSettings.tButtons;

                /*verificar si se configuro botones*/
                if (btns.length && $.isArray(btns)) {
                    $.each(btns, function (b, v) {
                        let access = (btns[b].access !== undefined) ? btns[b].access : 0;
                        let titulo = (btns[b].title !== undefined) ? btns[b].title : '';
                        let icono = (btns[b].icon !== undefined) ? btns[b].icon : '';
                        let klass = (btns[b].class !== undefined) ? btns[b].class : 'btn btn-default';
                        let ajax = (btns[b].ajax !== undefined) ? btns[b].ajax : '';
                        
                        /*si tiene permiso se agrega el boton*/
                        if(access){
                            let butt = $('<button></button>');
                            butt.attr('id','btn_tool_'+b+oSettings.oTable);
                            butt.attr('type','button');
                            butt.attr('class',klass);
                            butt.html('<i class="' + icono + '"></i> '+titulo);
                            butt.attr('onclick',ajax);
                        
                            $('#toolbar_'+oSettings.oTable).append(butt);
                        }
                    });
                }
                /*===========================FIN AGREGANDO BOTONES=======================*/
                
                /*======================AGREGAR BOTONES EXPORTAR========================*/
                let sExport = (oSettings.sExport !== undefined)?oSettings.sExport:0;
                
                /*verificar si se configuro exportaciones*/
                if(sExport !== 0){
                    /*======================AGREGAR BOTON EXPORTAR EXCEL========================*/
                    if(sExport.buttons.excel && sExport.buttons.excel !== undefined){
                        var btnExcel = $('<button></button>');
                        btnExcel.attr('type','button');
                        btnExcel.attr('id','btnEexcel_'+oSettings.oTable);
                        btnExcel.addClass('btn btn-default');
                        btnExcel.html('<i class="fa fa-file-excel-o"></i> Excel');
                        btnExcel.click(function(){alert('aqui excel')
                            //_private.ajaxExport(oSettings,params,'E',this);
                        });

                        $('#toolbar_'+oSettings.oTable).append(btnExcel);
                    }
                    /*======================FIN AGREGAR BOTON EXPORTAR EXCEL========================*/
                    
                    /*======================AGREGAR BOTON EXPORTAR PF========================*/
                    if(sExport.buttons.pdf && sExport.buttons.pdf !== undefined){
                        var btnPDF = $('<button></button>');
                        btnPDF.attr('type','button');
                        btnPDF.addClass('btn btn-default');
                        btnPDF.attr('id','btnEexcel_'+oSettings.oTable);
                        btnPDF.html('<i class="fa fa-file-pdf-o"></i> PDF');
                        btnPDF.click(function(){alert('aqui pdf')
                           // _private.ajaxExport(oSettings,params,'P',this);
                        });

                        $('#toolbar_'+oSettings.oTable).append(btnPDF);
                    }
                    /*======================FIN AGREGAR BOTON EXPORTAR PF========================*/
                }
                /*======================FIN AGREGAR BOTONES EXPORTAR========================*/
                
                /*===========================AGREGANDO BOTON VER-OCULTAR COLUMNAS==================*/
                /*varificar si se activo tShowHideColumn*/
                if(oSettings.tToggleColumn){
                    let btnSHColumn = $('<button></button>');
                    btnSHColumn.attr('type','button');
                    btnSHColumn.attr('id','btn_hidecolumn'+oSettings.oTable);
                    btnSHColumn.addClass('btn btn-default');
                    btnSHColumn.html('<i class="fa fa-random" data-filter="'+dataFilter+'"></i> Ver/Ocultar');
                    btnSHColumn.click(function(){
                        $('#contvo_'+oSettings.oTable).toggle();
                    });
                    btnSHColumn.attr('data-filter',dataFilter);
                    
                    /*agregando btnSHColumn a toolbar*/
                    $('#toolbar_'+oSettings.oTable).append(btnSHColumn);
                    
                    /*creando opciones para ver - ocultar*/
                    let ul = $('<ul></ul>');
                    ul.attr('id','contvo_'+oSettings.tObjectTable);
                    ul.addClass('ColVis_collection');
                    ul.attr('data-filter',dataFilter);
                    ul.css({
                        position: 'absolute',
                        right: '5px',
                        display: 'none',
                        top: '32px'
                    });
                    
                    /////////////
                    $.each(oSettings.tColumns,function(i,v){
                        let title = (oSettings.tColumns[i].title !== undefined)?oSettings.tColumns[i].title:'[field] no definido.';
                        let field = (oSettings.tColumns[i].field !== undefined)?oSettings.tColumns[i].field:'[field] no definido.';
                        
                        let li = $('<li></li>');
                        li.html('<label><input type="checkbox" data-field="'+field+'" checked><span>'+title+'</span></label>');
                        li.find('input').click(function(){
                            /*para ver - ocultar columnas*/
                            let dfield = $(this).data('field');
                            if($(this).is(':checked')){
                                $('.col_'+dfield).show();
                            }else{
                                $('.col_'+dfield).hide();
                            }
                        });
                        li.find('label').attr('data-filter',dataFilter);
                        li.find('input').attr('data-filter',dataFilter);
                        li.find('span').attr('data-filter',dataFilter);
                        li.attr('data-filter',dataFilter);
                        ul.append(li);
                    });
                    
                    $('#toolbar_'+oSettings.tObjectTable).append(ul);
                
                    ////////////
                    
                }
                /*===========================FIN BOTON VER-OCULTAR COLUMNAS==================*/

            };
            /*==========================FIN PROPIEDADES Y METODOS PRIVADOS=======================*/

            return this.each(function () {
                let oSettings = options;

                /*generando id de tabla*/
                oSettings.oTable = oSettings.oContainer + '_fg';

                let method = {

                    init: function () {
                        let params = _private.serialize();

                        /*agregando botones, toolbar*/
                        _private.addToolBar(oSettings, params);
                    }

                };

                method.init();

            });

        }

    });

})(jQuery);