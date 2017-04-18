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
                oContainer: $(this).attr('id'),                     /*Contenedor principal de datagrid*/
                oTable: null,                                       /*id de datagrid*/
                tToggleColumn: false,                               /*activa boton hide/show columnas*/
                tColumns: [],                                       /*almacena columnas de datagrid*/
                tNumbers: true,
                tWidthFormat: 'px',
                sAxions: [],
                tLabelAxion: 'Acciones',
                tMsnNoData: 'No se encontraron registros.',
                tRegsLength: [10, 25, 50, 100],
                sAjaxSource: null,                                  /*url para la data via ajax*/
                pPaginate: true,
                pDisplayStart: 1,
                pDisplayLength: 50,
                pItemPaginas: 5,
                tViewInfo: true,
                pOrderField: ''
            };

            let options = $.extend(defaults, opt);

            /*==========================PROPIEDADES Y METODOS PRIVADOS=======================*/
            let _private = {};
            /*css para diseño del gris*/
            _private.cssTable = 'table table-bordered table-hover fullgrid';
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
            /*contador del colspan para texto NO REGISTROS*/
            _private.colspanRecords = 0;
            
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

            /*
             * Crea el toolbar del grid
             * @param {type} oSettings
             * @param {type} params
             * @returns {undefined}
             */
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
                    ul.attr('id','contvo_'+oSettings.oTable);
                    ul.addClass('ColVis_collection');
                    ul.attr('data-filter',dataFilter);
                    ul.css({
                        position: 'absolute',
                        right: '5px',
                        display: 'none',
                        top: '32px'
                    });
                    
                    $.each(oSettings.tColumns,function(i,v){
                        let title = (oSettings.tColumns[i].title !== undefined)?oSettings.tColumns[i].title:'[field] no definido.';
                        let field = (oSettings.tColumns[i].field !== undefined)?oSettings.tColumns[i].field:'[field] no definido.';
                        
                        let li = $('<li></li>');
                        li.html('<label><input type="checkbox" data-field="'+field+'" checked><span>'+title+'</span></label>');
                        li.find('input').click(function(){
                            /*para ver - ocultar columnas*/
                            let dfield = $(this).data('field');
                            if($(this).is(':checked')){
                                $('.col_'+dfield+oSettings.oTable).show();
                            }else{
                                $('.col_'+dfield+oSettings.oTable).hide();
                            }
                        });
                        li.find('label').attr('data-filter',dataFilter);
                        li.find('input').attr('data-filter',dataFilter);
                        li.find('span').attr('data-filter',dataFilter);
                        li.attr('data-filter',dataFilter);
                        ul.append(li);
                    });
                    
                    $('#toolbar_'+oSettings.oTable).append(ul);
                }
                /*===========================FIN BOTON VER-OCULTAR COLUMNAS==================*/

            };
            
            /*
             * Crea la tabla del grid
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.table = function(oSettings){
                let tb = $('<table></table>');
                tb.attr('id',oSettings.oTable);
                tb.attr('class',_private.cssTable);
                
                /*agregando tabla a div*/
                $('#'+oSettings.oContainer).append(tb);
            };
            
            /*
             * Crea columna con el texto axion en el head
             * @param {type} oSettings
             * @returns {$}
             */
            _private.headAxion = function(oSettings) {
                let g = (oSettings.sAxions.group !== undefined)?oSettings.sAxions.group:[];
                let b = (oSettings.sAxions.buttons !== undefined)?oSettings.sAxions.buttons:[];
                let x = (oSettings.sAxions.width !== undefined)?oSettings.sAxions.width:'150';
                
                if (g.length || b.length) {
                    let txtax = $('<th class="center"></th>');
                    txtax.css({width: x+oSettings.tWidthFormat});
                    txtax.attr('id',oSettings.oTable+'_axions');
                    txtax.html(oSettings.tLabelAxion);
                    txtax.css({'vertical-align': 'middle'});
                    return txtax;
                }
            };
            
            /*
             * Crea el checkbox en el head de la tabla
             * @param {type} oSettings
             * @returns {$}
             */
            _private.headCheckbox = function(oSettings){
                _private.colspanRecords++;
                var td = $('<th></th>');
                td.attr('class', 'text-center');
                td.attr('id', oSettings.oTable + '_chkall_0');
                td.css({'width': '42px'});
                
                var chk = $('<input></input>');
                chk.attr('type','checkbox');
                chk.css({
                    'margin-left': '5px'
                });
                chk.attr('onclick','alert(this,\'#'+ oSettings.oTable+'\')');
                
                td.append(chk);
                return td;
            };
            
            /*
             * Crea <tr> para busqueda por columnas
             * @param {type} oSettings
             * @returns {$}
             */
            _private.addTrSearchCols = function(oSettings){
                let tr = $('<tr></tr>'),
                    chkExist = 0;
            
                let gBtn = (oSettings.sAxions.group !== undefined)?oSettings.sAxions.group:[];
                let bBtn = (oSettings.sAxions.buttons !== undefined)?oSettings.sAxions.buttons:[];
            
                /*agregando <th> por numeracion*/
                if(oSettings.tNumbers){
                    let th = $('<th></th>');         
                    tr.append(th);                              /*se agrega al <tr>*/
                }
                
                /*agregando <th> por txt de accion al inicio de cabecera*/
                if (_private.positionAxion.toLowerCase() === 'first' && (gBtn.length > 0 || bBtn.length > 0)) {
                    let th = $('<th></th>');         
                    tr.append(th);                              /*se agrega al <tr>*/
                }
                
                /*agregando <th> por el checkbox al inicio*/
                if(oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object){
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'first';
                    if(pos.toLowerCase() === 'first'){                        
                        let th = $('<th></th>');                            
                        tr.append(th);                          /*se agrega al <tr>*/                       
                        chkExist = 1;
                    }
                }
                
                /*recorrido de columnas, creando <tr> para filtros*/
                $.each(oSettings.tColumns,function(c,v) {
                    let kfield = (oSettings.tColumns[c].field !== undefined) ? oSettings.tColumns[c].field : '';
                    let search = (oSettings.tColumns[c].filter !== undefined) ? oSettings.tColumns[c].filter : false;   /*para activar busqueda de columnas*/
                    let field   = (search.compare !== undefined) ? search.compare : kfield;            /*el campo q se buscara, en caso oSettings.tColumns[c].campo no sea util*/
                    let idTH    = 'th_cont_search_'+oSettings.oTable+'_'+field;

                    let th = $('<th></th>');                    /*se crea la columna*/
                    th.attr('id',idTH);
                    th.css({position: 'relative'});
                    th.addClass('hasinput');
                    th.addClass('col_'+field+oSettings.oTable);
                    
                    let divg = $('<div></div>');
                    divg.attr('class','input-group input-group-md');                    
                    
                    th.html(divg);
                    tr.append(th);                              /*se agrega al <tr>*/ 
                });
                
                /*agregando <th> por el checkbox al final*/
                if(oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object && chkExist === 0){
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'last';
                    if(pos.toLowerCase() === 'last'){                        
                        let th = $('<th></th>');         
                        tr.append(th);                          /*se agrega al <tr>*/
                    }
                }
                
                /*agregando <th> por txt de accion al final de cabecera*/
                if (_private.positionAxion.toLowerCase() === 'last' && (gBtn.length > 0 || bBtn.length > 0)) {
                    let th = $('<th></th>');         
                    tr.append(th);                              /*se agrega al <tr>*/
                }
                
                return tr;
                
            };
            
            /*
             * Crea la cabecera de la tabla
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.theader = function(oSettings){
                let h  = $('<thead></thead>'),
                    tr = $('<tr></tr>'),
                    chkExist = 0;
            
                /*agregando numeracion*/
                if(oSettings.tNumbers){
                    let th = $('<th>Nro.</th>');         /*se crea la columna*/
                    th.attr('class', 'center');
                    th.css('width', '1%');
                    tr.append(th);                       /*se agrega al <tr>*/
                }
                
                /*agregando accion al inicio de cabecera*/
                if (_private.positionAxion.toLowerCase() === 'first') {
                    _private.colspanRecords++;
                    tr.append(_private.headAxion(oSettings));
                }
                
                /*agregando checkbox al inicio*/
                if(oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object){
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'first';
                    if(pos.toLowerCase() === 'first'){                        
                        tr.append(_private.headCheckbox(oSettings));                      /*se agrega al <tr>*/
                        chkExist = 1;
                    }
                }   
                
                /*recorrido de columnas*/
                $.each(oSettings.tColumns,function(c,v) {
                    let th = $('<th></th>');         /*se crea la columna*/

                    let title   = (oSettings.tColumns[c].title !== undefined) ? oSettings.tColumns[c].title : '';
                    let field   = (oSettings.tColumns[c].field !== undefined) ? oSettings.tColumns[c].field : '';
                    let sortable= (oSettings.tColumns[c].sortable !== undefined && oSettings.tColumns[c].sortable) ? ' sorting' : '';
                    let width   = (oSettings.tColumns[c].width !== undefined) ? oSettings.tColumns[c].width + oSettings.tWidthFormat : '';
                    let search  = (oSettings.tColumns[c].filter !== undefined) ? oSettings.tColumns[c].filter : false;   /*para activar busqueda de columnas*/
                   
                    th.attr('id', oSettings.oTable + '_head_th_' + c);
                    th.attr('class', 'center');        /*agregado class css*/
                    th.css({width: width, 'vertical-align': 'middle'});                                          /*agregando width de columna*/
                    th.append(title);                                                 /*se agrega el titulo*/
                    th.attr('data-order',field);
                    th.addClass('col_'+field+oSettings.oTable);                                      /*para tShowHideColumn*/
                   
                    /*agregando css para sortable*/
                    if(sortable !== ''){
                        th.addClass(sortable);
                        
                        th.click(function(){alert('sortable')
                            //_private.executeSorting(this,oSettings);
                        });
                    }
                    /*verificar si se inicio ordenamiento y agegar class a th*/
                    var cad = oSettings.pOrderField.split(' ');
                    
                    if (cad[0] === field) {
                        th.removeClass(sortable);
                        th.addClass('sorting_' + cad[1].toLowerCase());
                    }
                    
                    if(search instanceof Object){    /*se verifica si existe busquedas por columnas*/
                        _private.ifSearch = true;
                    }
                    
                    tr.append(th);                                                  /*se agrega al <tr>*/
                    _private.colspanRecords++;
                });
                
                /*agregando checkbox al final*/
                if(oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object && chkExist === 0){
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'last';
                    if(pos.toLowerCase() === 'last'){                        
                        tr.append(_private.headCheckbox(oSettings));                      /*se agrega al <tr>*/
                    }
                }
                
                /*agregando accion al final de cabecera*/
                if (_private.positionAxion.toLowerCase() === 'last') {
                    _private.colspanRecords++;
                    tr.append(_private.headAxion(oSettings));
                }
                
                h.html(tr);                                         /*se agrega <tr> de cabeceras al <thead>*/
              
                /*agregando controles para busqueda por columna*/ 
                if(_private.ifSearch){
                    h.append(_private.addTrSearchCols(oSettings));      /*se agrega <tr> de busquedas al <thead>*/ 
                }
                
                $('#' + oSettings.oTable).append(h);          /*se agrega <thead> al <table>*/
                
                /*agregando filtros a <tr>*/
                if(_private.ifSearch){alert('agegar busqueda')
                    //_private.addSearchCols(oSettings);      /*se agrega elementos de busquedas al <tr>*/ 
                }
                
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
                        
                        /*la tabla*/
                        _private.table(oSettings);
                        
                        /*la cabecera*/
                        _private.theader(oSettings);
                    }

                };

                method.init();

            });

        }

    });

})(jQuery);