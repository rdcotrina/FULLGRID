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
                oContainer: $(this).attr('id'), /*Contenedor principal de datagrid*/
                oTable: null, /*id de datagrid*/
                tToggleColumn: false, /*activa boton hide/show columnas*/
                tColumns: [], /*almacena columnas de datagrid*/
                tNumbers: true,
                tWidthFormat: 'px',
                sAxions: [],
                tLabelAxion: 'Acciones',
                tMsnNoData: 'No se encontraron registros.',
                tRegsLength: [10, 25, 50, 100],
                sAjaxSource: null, /*url para la data via ajax*/
                pPaginate: true,
                pDisplayStart: 0,   //para mysql = 0, para sql = 1
                pDisplayLength: 50,
                pItemPaginas: 5, /*determina cuantos numeros se mostraran en los items de paginacion*/
                tViewInfo: true,
                pOrderField: '',
                tChangeLength: true,
                tButtons: []
            };

            let options = $.extend(defaults, opt);

            /*==========================PROPIEDADES Y METODOS PRIVADOS=======================*/
            let _private = {};
            /*css para diseño del gris*/
            _private.cssTable = 'table table-striped table-hover table-condensed table-bordered fullgrid';
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

            /*almacena el boton actualizar por cada grid*/
            _private.htmlBtn = '';
            /*determina que base de datos se esta usando*/
            _private.sgbd = 'mysql';
            
            _private.totalizerColumn = [];                  /*para totalizadores de columnas*/
            
            _private.isTotalizer    = false;                /*activa si grid tiene totalozador o no*/
            //pra manejo de los css de sortable
            _private.thTMP = null;
            /*almacena los campos, para ocultar los filtros de cada columna*/
            _private.fieldsHide = [];
            /*almacena los datos de un <select> via ajax o cliente*/
            _private.dataSelect = [];


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
                    data += v.name + '=' + v.value + '&';
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
                        let access = (v.access !== undefined) ? v.access : 0;
                        let titulo = (v.title !== undefined) ? v.title : '';
                        let icono = (v.icon !== undefined) ? v.icon : '';
                        let klass = (v.class !== undefined) ? v.class : 'btn btn-default';
                        let ajax = (v.ajax !== undefined) ? v.ajax : '';

                        /*si tiene permiso se agrega el boton*/
                        if (access) {
                            let butt = $('<button></button>');
                            butt.attr('id', 'btn_tool_' + b + oSettings.oTable);
                            butt.attr('type', 'button');
                            butt.attr('class', klass);
                            butt.html('<i class="' + icono + '"></i> ' + titulo);
                            butt.attr('onclick', ajax);

                            $('#toolbar_' + oSettings.oTable).append(butt);
                        }
                    });
                }
                /*===========================FIN AGREGANDO BOTONES=======================*/

                /*======================AGREGAR BOTONES EXPORTAR========================*/
                let sExport = (oSettings.sExport !== undefined) ? oSettings.sExport : 0;

                /*verificar si se configuro exportaciones*/
                if (sExport !== 0) {
                    /*======================AGREGAR BOTON EXPORTAR EXCEL========================*/
                    if (sExport.buttons.excel && sExport.buttons.excel !== undefined) {
                        let btnExcel = $('<button></button>');
                        btnExcel.attr('type', 'button');
                        btnExcel.attr('id', 'btnEexcel_' + oSettings.oTable);
                        btnExcel.addClass('btn btn-default');
                        btnExcel.html('<i class="fa fa-file-excel-o"></i> Excel');
                        btnExcel.click(function () {
                            alert('aqui excel')
                            //_private.ajaxExport(oSettings,params,'E',this);
                        });

                        $('#toolbar_' + oSettings.oTable).append(btnExcel);
                    }
                    /*======================FIN AGREGAR BOTON EXPORTAR EXCEL========================*/

                    /*======================AGREGAR BOTON EXPORTAR PF========================*/
                    if (sExport.buttons.pdf && sExport.buttons.pdf !== undefined) {
                        let btnPDF = $('<button></button>');
                        btnPDF.attr('type', 'button');
                        btnPDF.addClass('btn btn-default');
                        btnPDF.attr('id', 'btnPDF_' + oSettings.oTable);
                        btnPDF.html('<i class="fa fa-file-pdf-o"></i> PDF');
                        btnPDF.click(function () {
                            alert('aqui pdf')
                            // _private.ajaxExport(oSettings,params,'P',this);
                        });

                        $('#toolbar_' + oSettings.oTable).append(btnPDF);
                    }
                    /*======================FIN AGREGAR BOTON EXPORTAR PF========================*/
                }
                /*======================FIN AGREGAR BOTONES EXPORTAR========================*/

                /*===========================AGREGANDO BOTON VER-OCULTAR COLUMNAS==================*/
                /*varificar si se activo tShowHideColumn*/
                if (oSettings.tToggleColumn) {
                    let btnSHColumn = $('<button></button>');
                    btnSHColumn.attr('type', 'button');
                    btnSHColumn.attr('id', 'btn_hidecolumn' + oSettings.oTable);
                    btnSHColumn.addClass('btn btn-default');
                    btnSHColumn.html('<i class="fa fa-random" data-filter="' + dataFilter + '"></i> Ver/Ocultar');
                    btnSHColumn.click(function () {
                        $('#contvo_' + oSettings.oTable).toggle();
                    });
                    btnSHColumn.attr('data-filter', dataFilter);

                    /*agregando btnSHColumn a toolbar*/
                    $('#toolbar_' + oSettings.oTable).append(btnSHColumn);

                    /*creando opciones para ver - ocultar*/
                    let ul = $('<ul></ul>');
                    ul.attr('id', 'contvo_' + oSettings.oTable);
                    ul.addClass('ColVis_collection');
                    ul.attr('data-filter', dataFilter);
                    ul.css({
                        position: 'absolute',
                        right: '5px',
                        display: 'none',
                        top: '32px'
                    });

                    $.each(oSettings.tColumns, function (i, v) {
                        let title = (v.title !== undefined) ? v.title : '[field] no definido.';
                        let field = (v.field !== undefined) ? v.field : '[field] no definido.';

                        let li = $('<li></li>');
                        li.html('<label><input type="checkbox" data-field="' + field + '" checked><span>' + title + '</span></label>');
                        li.find('input').click(function () {
                            /*para ver - ocultar columnas*/
                            let dfield = $(this).data('field');
                            if ($(this).is(':checked')) {
                                $(`.col_${dfield}${oSettings.oTable}`).show();
                            } else {
                                $(`.col_${dfield}${oSettings.oTable}`).hide();
                            }
                        });
                        li.find('label').attr('data-filter', dataFilter);
                        li.find('input').attr('data-filter', dataFilter);
                        li.find('span').attr('data-filter', dataFilter);
                        li.attr('data-filter', dataFilter);
                        ul.append(li);
                    });

                    $('#toolbar_' + oSettings.oTable).append(ul);
                }
                /*===========================FIN BOTON VER-OCULTAR COLUMNAS==================*/

            };

            /*
             * Crea la tabla del grid
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.table = function (oSettings) {
                let tb = $('<table></table>');
                tb.attr('id', oSettings.oTable);
                tb.attr('class', _private.cssTable);

                /*agregando tabla a div*/
                $('#' + oSettings.oContainer).append(tb);
            };

            /*
             * Crea columna con el texto axion en el head
             * @param {type} oSettings
             * @returns {$}
             */
            _private.headAxion = function (oSettings) {
                let g = (oSettings.sAxions.group !== undefined) ? oSettings.sAxions.group : [];
                let b = (oSettings.sAxions.buttons !== undefined) ? oSettings.sAxions.buttons : [];
                let x = (oSettings.sAxions.width !== undefined) ? oSettings.sAxions.width : '150';

                if (g.length || b.length) {
                    let txtax = $('<th></th>');
                    txtax.addClass("text-center");
                    txtax.css({width: x + oSettings.tWidthFormat});
                    txtax.attr('id', oSettings.oTable + '_axions');
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
            _private.headCheckbox = function (oSettings) {
                _private.colspanRecords++;
                let td = $('<th></th>');
                td.attr('class', 'text-center');
                td.attr('id', oSettings.oTable + '_chkall_0');
                td.css({'width': '42px'});

                let chk = $('<input></input>');
                chk.attr('type', 'checkbox');
                chk.css({
                    'margin-left': '5px'
                });
                chk.attr('onclick', 'alert(this,\'#' + oSettings.oTable + '\')');

                td.append(chk);
                return td;
            };

            /*
             * Crea <tr> para busqueda por columnas
             * @param {type} oSettings
             * @returns {$}
             */
            _private.addTrSearchCols = function (oSettings) {
                let tr = $('<tr></tr>'),
                        chkExist = 0;

                let gBtn = (oSettings.sAxions.group !== undefined) ? oSettings.sAxions.group : [];
                let bBtn = (oSettings.sAxions.buttons !== undefined) ? oSettings.sAxions.buttons : [];

                /*agregando <th> por numeracion*/
                if (oSettings.tNumbers) {
                    let th = $('<th></th>');
                    tr.append(th);                              /*se agrega al <tr>*/
                }

                /*agregando <th> por txt de accion al inicio de cabecera*/
                if (_private.positionAxion.toLowerCase() === 'first' && (gBtn.length > 0 || bBtn.length > 0)) {
                    let th = $('<th></th>');
                    tr.append(th);                              /*se agrega al <tr>*/
                }

                /*agregando <th> por el checkbox al inicio*/
                if (oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object) {
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'first';
                    if (pos.toLowerCase() === 'first') {
                        let th = $('<th></th>');
                        tr.append(th);                          /*se agrega al <tr>*/
                        chkExist = 1;
                    }
                }

                /*recorrido de columnas, creando <tr> para filtros*/
                $.each(oSettings.tColumns, function (c, v) {
                    let kfield = (v.field !== undefined) ? v.field : '';
                    let search = (v.filter !== undefined) ? v.filter : false;   /*para activar busqueda de columnas*/
                    let field = (search.compare !== undefined) ? search.compare : kfield;            /*el campo q se buscara, en caso oSettings.tColumns[c].campo no sea util*/
                    let idTH = 'th_cont_search_' + oSettings.oTable + '_' + field;

                    let th = $('<th></th>');                    /*se crea la columna*/
                    th.attr('id', idTH);
                    th.css({position: 'relative'});
                    th.addClass('hasinput');
                    th.addClass('col_' + field + oSettings.oTable);

                    let divg = $('<div></div>');
                    divg.attr('class', 'input-group input-group-md');

                    th.html(divg);
                    tr.append(th);                              /*se agrega al <tr>*/
                });

                /*agregando <th> por el checkbox al final*/
                if (oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object && chkExist === 0) {
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'last';
                    if (pos.toLowerCase() === 'last') {
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
             * Retorna operador para el query   
             * @param {type} o
             * @returns {fullgrid.jqueryL#7.fullgrid.jqueryAnonym$0.fullgrid._private.operator.fullgrid.jqueryAnonym$8}
             */
            _private.operator = function(o) {
                var com1 = '', com2 = '', op = o;
                /*si operator es LIKE se agrea comodin % */
                if (o.toLowerCase() === 'like') {
                    com1 = '*';  /*este sera el comodin*/
                    com2 = '*';  /*este sera el comodin*/
                } else if (o.toLowerCase() === 'c') {/*compienza por*/
                    op = 'LIKE';
                    com2 = '*';  /*este sera el comodin*/
                } else if (o.toLowerCase() === 't') {/*termina por*/
                    op = 'LIKE';
                    com1 = '*';  /*este sera el comodin*/
                }
                return {a: com1, b: com2, c: op};
            };
            
            /*
             * Prepara linea para el query
             * @param {type} oSettings
             * @returns {String}
             */
            _private.prepareFilters = function(oSettings){
                let searchTxt = '';
                $('#' + oSettings.oTable).find('thead').find('tr:eq(1)').find('th').each(function() {
                    let filter1 = $(this).find('div:eq(0)').find('input, select');
                    let field = filter1.attr('field');
                    
                    if(field !== undefined){
                        let div2 = $(this).find(`#cont_filter_${oSettings.oTable}_${field}`);
                        
                        let operator1 = div2.find('.operador1').val();
                        let operator2 = div2.find('.operador2').val();
                        let operator3 = div2.find('.operador3').val();
                        let filter2   = div2.find('.filter2').val();
                        let campo = field;
                       
                        /* = <> > >= < <= C T LIKE */
                        /*valor de primer filtro tiene contenido*/
                        if (filter1.val() !== '') {
                            let oA = _private.operator(operator1);
                            /*verificar si hay AND o OR*/
                            if (filter2 !== '') {
                                let oB = _private.operator(operator3);

                                searchTxt += ` AND (${campo} ${oA.c} "${oA.a} ${filter1.val()} ${oA.b}" ${operator2} ${campo} ${oB.c} "${oB.a} ${filter2} ${oB.b}")`;
                            } else {
                                searchTxt += ` AND ${campo} ${oA.c} "${oA.a} ${filter1.val()} ${oA.b} "`;
                            }
                        }
                    }
                    $(this).find('.main-filter').css({display: 'none'});
                });
                return searchTxt;
            };
            
            /*
             * Ejecuta la ordenacion por columnas
             * @param {type} tthis
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.executeSorting = function(t,oSettings){
                let thId = $(t).attr('id'),
                    orienta,
                    pag;
                oSettings.pOrderField = $(t).data('order');
            
                if(_private.thTMP != thId){
                    /*a todos los <th> del primer <tr> que tengan los css .sorting_asc y .sorting_desc les agreso el css .sorting*/
                    $('#' + oSettings.oTable).find('thead').find('tr:nth-child(1)').find('.sorting_asc').addClass('sorting');
                    $('#' + oSettings.oTable).find('thead').find('tr:nth-child(1)').find('.sorting_desc').addClass('sorting');

                    /*a todos los <th> del primer <tr> les remuevo los css .sorting_asc y .sorting_desc*/
                    $('#' + oSettings.oTable).find('thead').find('tr:nth-child(1)').find('th').removeClass('sorting_asc');
                    $('#' + oSettings.oTable).find('thead').find('tr:nth-child(1)').find('th').removeClass('sorting_desc');
                }    
        
                if ($(t).hasClass('sorting')) {                /*ordenacion ascendente*/
                    $(t).removeClass('sorting');
                    $(t).addClass('sorting_asc');
                    orienta = ' ASC';
                }else if ($(t).hasClass('sorting_asc')) {      /*ordenacion ascendente*/
                    $(t).removeClass('sorting_asc');
                    $(t).addClass('sorting_desc');
                    orienta = ' DESC';
                }else if ($(t).hasClass('sorting_desc')) {     /*sin ordenacion*/
                    $(t).removeClass('sorting_desc');
                    $(t).addClass('sorting');
                    orienta = ' ';
                    oSettings.pOrderField = '';
                } 
                
                _private.thTMP = thId;
                
                pag = parseInt($('#paginate_' + oSettings.oTable).find('ul.pagination').find('li.activerd').find('a').html());
                oSettings.pOrderField += orienta;
                oSettings.pDisplayLength = $('#' + oSettings.oTable + '_cbLength').val();  /*tomo el valor del combo para los registros a mostrar*/
                oSettings.pDisplayStart =  (_private.sgbd == 'sql')?pag:pag-1;
                oSettings.pDisplayStart = (isNaN(oSettings.pDisplayStart))?(_private.sgbd == 'sql')?1:0 :oSettings.pDisplayStart;
                oSettings.pFilterCols = _private.prepareFilters(oSettings);
                
                _private.sendAjax(oSettings);
            };
            
            /*
             * Ejecuta la busqueda mediante los filtros
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.executeFilter = function(oSettings){
                oSettings.pFilterCols = _private.prepareFilters(oSettings);
                oSettings.pDisplayStart = 1;//cuando esta en l pagina 2 no funciona la busqueda, pagina debe estar en la 1
                _private.sendAjax(oSettings);
            };
            
            /*
             * Limpia la busqueda, reset
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.clearFilter = function(oSettings,idCont){
                $('#'+idCont).parent('th').find('input:text, select').val('');
                oSettings.pFilterCols = _private.prepareFilters(oSettings);
                oSettings.pDisplayStart = (_private.sgbd == 'sql')?1:0;
                _private.sendAjax(oSettings);
            };
            
            /*
             * Crea los filtros y condiciones q se visualizaran al pulsar el icono: FILTRO
             * @param {type} field
             * @param {type} oSettings
             * @param {type} tipo
             * @returns {undefined}
             */
            _private.addFilters = function(field,oSettings,tipo,operator){
                let idCont = `cont_filter_${oSettings.oTable}_${field}`;
                let divF = $('<div></div>');
                divF.attr('data-filter',field);
                divF.attr('class','well well-sm main-filter');
                divF.css({
                    'display': 'none',
                    'position': 'absolute',
                    'right': '6px',
                    'z-index':5
                });
                divF.attr('id',idCont);
                
                /*agregar texto 1*/
                let txt1 = $('<p></p>');
                txt1.attr('data-filter',field);
                txt1.html('Mostrar&nbsp;registros&nbsp;que&nbsp;sean:');
                
                divF.append(txt1);
                
                /*agregar primer <select> de operadores 1*/
                let operator1 = $('<select></select>');
                operator1.attr('id',`op1_${oSettings.oTable}_${field}`);
                operator1.attr('data-filter',field);
                operator1.attr('class','form-control operador1');
                operator1.html('<option value="LIKE" '+((operator == 'LIKE')?'selected="selected"':'')+'>Contiene</option><option value="=" '+((operator == '=')?'selected="selected"':'')+'>Igual</option><option value="!=" '+((operator == '!=')?'selected="selected"':'')+'>Diferente</option><option value=">" '+((operator == '>')?'selected="selected"':'')+'>Mayor</option><option value=">=" '+((operator == '>=')?'selected="selected"':'')+'>Mayor o igual</option><option value="<" '+((operator == '<')?'selected="selected"':'')+'>Menor</option><option value="<=" '+((operator == '<=')?'selected="selected"':'')+'>Menor o igual</option><option value="C" '+((operator == 'C')?'selected="selected"':'')+'>Comienza</option><option value="T" '+((operator == 'T')?'selected="selected"':'')+'>Termina</option>');
                operator1.find('option').attr('data-filter',field);
                divF.append(operator1);
                
                /*combo con operadores 2 AND, OR*/
                let operator2 = $('<select></select>');
                operator2.attr('id',`op2_${oSettings.oTable}_${field}`);
                operator2.attr('data-filter',field);
                operator2.attr('class', 'form-control operador2');
                operator2.css({'margin-top': '5px', 'margin-bottom': '5px', width: '80px'});
                operator2.html('<option value="AND">AND</option><option value="OR">OR</option>');
                operator2.find('option').attr('data-filter',field);
                divF.append(operator2);
                
                /*agregar primer <select> de operadores 3*/
                let operator3 = $('<select></select>');
                operator3.attr('id',`op3_${oSettings.oTable}_${field}`);
                operator3.attr('data-filter',field);
                operator3.attr('class','form-control operador3');
                operator3.css({'margin-bottom':'5px'});
                operator3.html('<option value="LIKE" '+((operator == 'LIKE')?'selected="selected"':'')+'>Contiene</option><option value="=" '+((operator == '=')?'selected="selected"':'')+'>Igual</option><option value="!=" '+((operator == '!=')?'selected="selected"':'')+'>Diferente</option><option value=">" '+((operator == '>')?'selected="selected"':'')+'>Mayor</option><option value=">=" '+((operator == '>=')?'selected="selected"':'')+'>Mayor o igual</option><option value="<" '+((operator == '<')?'selected="selected"':'')+'>Menor</option><option value="<=" '+((operator == '<=')?'selected="selected"':'')+'>Menor o igual</option><option value="C" '+((operator == 'C')?'selected="selected"':'')+'>Comienza</option><option value="T" '+((operator == 'T')?'selected="selected"':'')+'>Termina</option>');
                operator3.find('option').attr('data-filter',field);
                divF.append(operator3);
                
                /*agregando filtro dos*/
                let filter2 = null, cont, icon; 
                
                switch (tipo.toLowerCase()) {
                    case 'text':                            /*se crea input:text*/
                        filter2 = $('<input></input>');
                        filter2.attr('type','text');
                        filter2.addClass('form-control filter2');

                        break;
                    case 'date':                            /*se crea input:text, con datepicker*/
                        filter2 = $('<input></input>');
                        filter2.addClass('datepickerGrid');
                        filter2.attr('type','text');
                        filter2.addClass('form-control filter2');

                        icon = $('<label></label>');
                        icon.attr('for',field);
                        icon.attr('data-filter',field);
                        icon.attr('class','glyphicon glyphicon-calendar');

                        cont = $('<div></div>');
                        cont.addClass('icon-addon addon-md');                      /*para los iconos*/
                        cont.attr('data-filter',field);
                        cont.html(filter2);
                        cont.append(icon);

                        filter2 = cont;
                        break;
                    case 'time':                        /*se crea input:text, con clockpicker*/
                        filter2 = $('<input></input>');
                        filter2.addClass('timepickerGrid');
                        filter2.attr('data-filter',field);
                        filter2.attr('type','text');
                        filter2.addClass('form-control filter2');

                        icon = $('<label></label>');
                        icon.attr('for',field);
                        icon.attr('data-filter',field);
                        icon.attr('class','glyphicon glyphicon-time');

                        cont = $('<div></div>');
                        cont.addClass('icon-addon addon-md');                      /*para los iconos*/
                        cont.attr('data-filter',field);
                        cont.html(filter2);
                        cont.append(icon);

                        filter2 = cont;
                        break;
                    case 'select': 
                        filter2 = $('<select></select>');

                        /*options*/
                        var opt = $('<option></option>');
                        opt.attr('value', '');
                        opt.html('-Seleccionar-');

                        filter2.append(opt);
                        filter2.addClass('form-control filter2');

                        let dataClient = '';
                        $.each(_private.dataSelect,function(t,v){
                            $.each(_private.dataSelect[t],function(g,vv){
                                if(oSettings.oTable+'_'+field === g){
                                    dataClient = _private.dataSelect[t][g];
                                }
                            });
                        });

                        filter2.append(dataClient);
                        break;
                }
                filter2.attr('id',`f2_${oSettings.tObjectTable}_${field}`);
                filter2.attr('data-filter',field);
                
                divF.append(filter2);
                
                /*botones filtrar y cerrar*/
                let cntBtn = $('<div></div>');
                cntBtn.attr('data-filter',field);
                cntBtn.css({'margin-top': '5px'});
                
                let btnFilter = $('<button></button>');
                btnFilter.attr('type','button');
                btnFilter.attr('class','btn btn-default');
                btnFilter.attr('data-filter',field);
                btnFilter.css({float: 'left'});
                btnFilter.html('<i class="fa fa-search"></i> Filtrar');
                btnFilter.click(function(){
                    _private.executeFilter(oSettings);
                });
                
                cntBtn.append(btnFilter);
                
                let btnClose = $('<button></button>');
                btnClose.attr('type','button');
                btnClose.attr('class','btn btn-default');
                btnClose.attr('data-filter',field);
                btnClose.css({float: 'right'});
                btnClose.html('<i class="fa fa-trash-o"></i> Limpiar');
                btnClose.click(function(){
                    $("#"+idCont).css({display:"none"});
                    _private.clearFilter(oSettings,idCont);
                });
                
                cntBtn.append(btnClose);
                
                divF.append(cntBtn);
                
                $(`#th_cont_search_${oSettings.oTable}_${field}`).append(divF);
            };
            
            /*
             * Crea icono filtro en cada <th>
             * @param {type} idTH   --  id del <th> de cada filtro en el <thead>
             * @returns {undefined}
             */
            _private.addIconFilter = function(field,oSettings,tipo,operator){
                var sp = $('<span></span>');
                sp.attr('class','input-group-addon');
                sp.attr('data-filter',field);
                sp.attr('onclick',`$("#cont_filter_${oSettings.oTable}_${field}").toggle();`);
                
                var ii = $('<i></i>');
                ii.attr('data-filter',field);
                ii.css({cursor: 'pointer'});
                ii.attr('class','glyphicon glyphicon-filter');
                
                sp.html(ii);
                $(`#th_cont_search_${oSettings.oTable}_${field}`).find('div:eq(0)').append(sp);
                
                /*insertar capa con condicionales*/
                _private.addFilters(field,oSettings,tipo,operator);
            };
            
            /*
             * Crea los elementos para los filtros
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.addSearchCols = function(oSettings){
                /*recorrido de columnas, creando los filtros*/
                $.each(oSettings.tColumns,function(c,v) {
                    let elementSearch = null;                          /*el filtro*/
                    let cont,idTH;
                    let kfield = (v.field !== undefined) ? v.field : '';
                    let search = (v.filter !== undefined) ? v.filter : false;   /*para activar busqueda de columnas*/
                    
                    /*verificar si se configuro la busqueda*/
                    if (search instanceof Object && search !== false) {
                        let tipo    = (search.type !== undefined) ? search.type : 'text';                  /*tipo de elemento*/
                        let field   = (search.compare !== undefined) ? search.compare : kfield;            /*el campo q se buscara, en caso oSettings.tColumns[c].campo no sea util*/
                        let idField = `input_search_${oSettings.oTable}_${field}`;
                        let operator= (search.operator !== undefined) ? search.operator : 'LIKE';
                        let icon    = null;           /*para el icono del field*/
                        
                        _private.fieldsHide.push(field);                          /*para ocultar filtros al dar click en document*/
                        
                        /*id del <th>*/
                        idTH    = `th_cont_search_${oSettings.oTable}_${field}`;
                        
                        /*switch segun type de objeto*/
                        switch (tipo.toLowerCase()) {
                            case 'text':                            /*se crea input:text*/
                                elementSearch = $('<input></input>');
                                elementSearch.attr('type','text');
                                elementSearch.attr('id',`f1_${oSettings.oTable}_${field}`);
                                elementSearch.addClass('form-control filter1');
                                elementSearch.attr('field',field);
                                elementSearch.keypress(function(tecla) {
                                    if (tecla.keyCode === 13) {
                                        _private.executeFilter(oSettings);
                                    }
                                });

                                cont = $('<label></label>');
                                cont.css({display: 'block'});       /*para que ocupe todo el <th>*/
                                cont.html(elementSearch);
                                
                                
                                $('#'+idTH).find('div').html(cont);
                                
                                /*agregando el operador*/
                                _private.addIconFilter(field,oSettings,tipo,operator);
                                break;
                            case 'date':                            /*se crea input:text, con datepicker*/
                                _private.ifDatePicker = true;

                                elementSearch = $('<input></input>');
                                elementSearch.addClass('datepickerGrid');
                                elementSearch.attr('type','text');
                                elementSearch.attr('id',`f1_${oSettings.oTable}_${field}`);
                                elementSearch.addClass('form-control filter1');
                                elementSearch.attr('field',field);
                                elementSearch.keypress(function(tecla) {
                                    if (tecla.keyCode === 13) {
                                        _private.executeFilter(oSettings);
                                    }
                                });
                                elementSearch.change(function() {
                                    _private.executeFilter(oSettings);
                                });
                                
                                icon = $('<label></label>');
                                icon.attr('for',idField);
                                icon.attr('class','glyphicon glyphicon-calendar');

                                cont = $('<div></div>');
                                cont.addClass('icon-addon addon-md');                      /*para los iconos*/
                                cont.html(elementSearch);
                                cont.append(icon);
                                
                                $('#'+idTH).find('div').html(cont);
                                
                                /*agregando el operador*/
                                _private.addIconFilter(field,oSettings,tipo,operator);
                                break;
                            case 'time':                        /*se crea input:text, con clockpicker*/
                                _private.ifTimePicker = true;

                                elementSearch = $('<input></input>');
                                elementSearch.addClass('timepickerGrid');
                                elementSearch.attr('type','text');
                                elementSearch.attr('id',`f1_${oSettings.oTable}_${field}`);
                                elementSearch.addClass('form-control filter1');
                                elementSearch.attr('field',field);
                                elementSearch.keypress(function(tecla) {
                                    if (tecla.keyCode === 13) {
                                        _private.executeFilter(oSettings);
                                    }
                                });
                                elementSearch.change(function() {
                                    _private.executeFilter(oSettings);
                                });
                                
                                icon = $('<label></label>');
                                icon.attr('for',idField);
                                icon.attr('class','glyphicon glyphicon-time');

                                cont = $('<div></div>');
                                cont.addClass('icon-addon addon-md');                      /*para los iconos*/
                                cont.html(elementSearch);
                                cont.append(icon);
                                
                                $('#'+idTH).find('div').html(cont);
                                
                                /*agregando el operador*/
                                _private.addIconFilter(field,oSettings,tipo,operator);
                                break;
                            case 'select':                      /*se crea <select>*/
                                var url         = (search.ajaxData !== undefined) ? search.ajaxData : null; /*para data de combo*/
                                var options     = (search.options !== undefined) ? search.options : [];          /*campos para select*/
                                var dataClient  = (search.dataClient !== undefined) ? search.dataClient : [];          /*data desde el cliente*/
                                var flag        = (search.flag !== undefined) ? search.flag : '';

                                if(options.length === 0){
                                    alert('[options] No definido, defina [options].');
                                }
                                
                                if(url !== null){                    /*datos desde el servidor*/
                                    var data_s;
                                    var promise = $.ajax({
                                                    type: "POST",
                                                    url: url,
                                                    dataType: 'json',
                                                    data:{_flag: flag, _field: field, _options: options},       /*se envia configuracion de <select> porq la llamada es multiple*/
                                                    success: function(resp) {
                                                        data_s = resp;
                                                    }
                                                });
                                    /*promesa se ejecuta a la respuesta del server*/
                                    promise.done(function(){
                                        elementSearch = $('<select></select>');
                                        elementSearch.attr('id',`f1_${oSettings.oTable}_${data_s.field}`);
                                        elementSearch.addClass('form-control filter1');
                                        elementSearch.attr('field',data_s.field);
                                        elementSearch.change(function() {
                                            _private.executeFilter(oSettings);
                                        });
                                
                                        /*options*/
                                        var opt = $('<option></option>');
                                        opt.attr('value', '');
                                        opt.html('-Todos-');

                                        elementSearch.append(opt);
                                        
                                        var oopp = '';
                                        $.each(data_s.dataServer,function(x,v) {
                                            oopp += `<option value="${v[data_s.opt.value]}">${v[data_s.opt.label]}</option>`;
                                        });
                                        
                                        elementSearch.append(oopp);
                                        
                                        cont = $('<label></label>');
                                        cont.css({display: 'block'});       /*para que ocupe todo el <th>*/
                                        cont.html(elementSearch);

                                        /*data retorna del server, se debe insertar en <th> con html()*/
                                        $(`#th_cont_search_${oSettings.oTable}_${data_s.field}`).find('div').html(cont);
                                        
                                        /*guardando data para el filtro 2*/
                                        var indice = oSettings.oTable+'_'+data_s.field;
                                        eval(`_private.dataSelect.push({${indice}: '${oopp}'});`);
                                        
                                        /*agregando el operador*/
                                        _private.addIconFilter(data_s.field,oSettings,'select',operator);
                                    });
                                }else if(dataClient.length > 0 && dataClient instanceof Object){    /*datos desde el cliente*/
                                    cont = $('<label></label>');
                                    cont.css({display: 'block'});       /*para que ocupe todo el <th>*/

                                    elementSearch = $('<select></select>');

                                    /*options*/
                                    var opt = $('<option></option>');
                                    opt.attr('value', '');
                                    opt.html('-Todos-');

                                    elementSearch.append(opt);
                                    elementSearch.attr('id',`f1_${oSettings.oTable}_${field}`);
                                    elementSearch.addClass('form-control filter1');
                                    elementSearch.attr('field',field);
                                    elementSearch.change(function() {
                                        _private.executeFilter(oSettings);
                                    });
                                        
                                    var oopp = '';
                                    $.each(dataClient,function(x,v) {
                                        oopp += `<option value="${v.value}">${v.etiqueta}</option>`;
                                    });
                                    elementSearch.append(oopp);

                                    cont.html(elementSearch);
                                    $('#'+idTH).find('div').html(cont);
                                  
                                    /*guardando data para el filtro 2*/
                                    var indice = oSettings.oTable+'_'+field;
                                    eval(`_private.dataSelect.push({${indice}: '${oopp}'});`);
                                        
                                    /*agregando el operador*/
                                    _private.addIconFilter(field,oSettings,tipo,operator);
                                }
                                break;
                        }
                    }
                });
                
                /*verificar si se aplica datepicker*/
                if(_private.ifDatePicker){
                    $('.datepickerGrid').datepicker({
                        prevText: '<i class="fa fa-chevron-left"></i>',
                        nextText: '<i class="fa fa-chevron-right"></i>',
                        changeMonth: true,
                        changeYear: true,
                        dateFormat: 'dd-mm-yy'
                    });
                    $('.datepickerGrid').mask('99-99-9999');
                }

                /*verificar si se aplica clockpicker*/
                if(_private.ifTimePicker){
                    $('.timepickerGrid').clockpicker({
                        autoclose: true
                    });
                    $('.timepickerGrid').mask('99:99');
                }
            };
            
            /*
             * Crea la cabecera de la tabla
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.theader = function (oSettings) {
                let h = $('<thead></thead>'),
                        tr = $('<tr></tr>'),
                        chkExist = 0;

                let gBtn = (oSettings.sAxions.group !== undefined) ? oSettings.sAxions.group : [];
                let bBtn = (oSettings.sAxions.buttons !== undefined) ? oSettings.sAxions.buttons : [];

                /*agregando numeracion*/
                if (oSettings.tNumbers) {
                    let th = $('<th>Nro.</th>');         /*se crea la columna*/
                    th.addClass('text-center');
                    th.css({
                        'width': '1%',
                        'vertical-align': 'middle'
                    });
                    tr.append(th);                       /*se agrega al <tr>*/
                }

                /*agregando accion al inicio de cabecera*/
                if (_private.positionAxion.toLowerCase() === 'first' && (gBtn.length > 0 || bBtn.length > 0)) {
                    _private.colspanRecords++;
                    tr.append(_private.headAxion(oSettings));
                }

                /*agregando checkbox al inicio*/
                if (oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object) {
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'first';
                    if (pos.toLowerCase() === 'first') {
                        tr.append(_private.headCheckbox(oSettings));                      /*se agrega al <tr>*/
                        chkExist = 1;
                    }
                }

                /*recorrido de columnas*/
                $.each(oSettings.tColumns, function (c, v) {
                    let th = $('<th></th>');         /*se crea la columna*/

                    let title = (v.title !== undefined) ? v.title : '';
                    let field = (v.field !== undefined) ? v.field : '';
                    let sortable = (v.sortable !== undefined && v.sortable) ? ' sorting' : '';
                    let width = (v.width !== undefined) ? v.width + oSettings.tWidthFormat : '';
                    let search = (v.filter !== undefined) ? v.filter : false;   /*para activar busqueda de columnas*/

                    th.attr('id', `${oSettings.oTable}_head_th_${c}`);
                    th.attr('class', 'text-center');        /*agregado class css*/
                    th.css({width: width, 'vertical-align': 'middle'});                                          /*agregando width de columna*/
                    th.append(title);                                                 /*se agrega el titulo*/
                    th.attr('data-order', field);
                    th.addClass(`col_${field}${oSettings.oTable}`);                                      /*para tShowHideColumn*/

                    /*agregando css para sortable*/
                    if (sortable !== '') {
                        th.addClass(sortable);

                        th.click(function () {
                            _private.executeSorting(this,oSettings);
                        });
                    }
                    /*verificar si se inicio ordenamiento y agegar class a th*/
                    let cad = oSettings.pOrderField.split(' ');

                    if (cad[0] === field) {
                        th.removeClass(sortable);
                        th.addClass('sorting_' + cad[1].toLowerCase());
                        _private.thTMP = $(th).attr('id');  //se carga tmp para manejo de css sortable
                    }

                    if (search instanceof Object) {    /*se verifica si existe busquedas por columnas*/
                        _private.ifSearch = true;
                    }

                    tr.append(th);                                                  /*se agrega al <tr>*/
                    _private.colspanRecords++;
                });

                /*agregando checkbox al final*/
                if (oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object && chkExist === 0) {
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'last';
                    if (pos.toLowerCase() === 'last') {
                        tr.append(_private.headCheckbox(oSettings));                      /*se agrega al <tr>*/
                    }
                }

                /*agregando accion al final de cabecera*/
                if (_private.positionAxion.toLowerCase() === 'last' && (gBtn.length > 0 || bBtn.length > 0)) {
                    _private.colspanRecords++;
                    tr.append(_private.headAxion(oSettings));
                }

                h.html(tr);                                         /*se agrega <tr> de cabeceras al <thead>*/

                /*agregando controles para busqueda por columna*/
                if (_private.ifSearch) {
                    h.append(_private.addTrSearchCols(oSettings));      /*se agrega <tr> de busquedas al <thead>*/
                }

                $('#' + oSettings.oTable).append(h);          /*se agrega <thead> al <table>*/

                /*agregando filtros a <tr>*/
                if (_private.ifSearch) {
                    _private.addSearchCols(oSettings);      /*se agrega elementos de busquedas al <tr>*/ 
                }

            };

            /*
             * Crea el tbody de la tabla
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.tbody = function (oSettings) {
                let tbody = $('<tbody></tbody>');
                tbody.attr('id', 'tbody_' + oSettings.oTable);

                $('#' + oSettings.oTable).append(tbody);          /*se agrega <tbody> al <table>*/
            };

            _private.selectChange = function (oSettings) {
                oSettings.pDisplayStart = 1;
                oSettings.pDisplayLength = $(`#${oSettings.oTable}_cbLength`).val();
                oSettings.pFilterCols = _private.prepareFilters(oSettings); 
                _private.sendAjax(oSettings);
            };

            /*
             * Crea el combo para cambiar el total de registros a visualizar or pagina
             * @param {type} oSettings
             * @returns {String|$}
             */
            _private.selectLength = function (oSettings) {
                let cbCl = '';
                if (oSettings.tChangeLength) {
                    cbCl = $('<div></div>');
                    cbCl.attr('id', 'contCbLength_' + oSettings.oTable);
                    cbCl.attr('class', 'pull-left');
                    cbCl.css({
                        'margin-left': '5px'
                    });

                    let span = $('<span></span>');

                    let label = $('<label></label>');
                    label.css({width: '60px'});

                    let select = $('<select></select>');
                    select.attr('id', oSettings.oTable + '_cbLength');
                    select.attr('name', oSettings.oTable + '_cbLength');
                    select.addClass('form-control');
                    select.css({width: '73px'});
                    select.change(function () {
                        _private.selectChange(oSettings);
                    });
                    let op = '', lb = oSettings.tRegsLength.length, cc = 0;
                    $.each(oSettings.tRegsLength, function (l, v) {
                        cc++;
                        if (cc <= lb) {
                            let sel = '';
                            if (parseInt(oSettings.pDisplayLength) === parseInt(v)) {
                                sel = 'selected="selected"';
                            }
                            op += `<option value="${v}" ${sel}>${v}</option>`;
                        }
                    });
                    select.html(op);

                    label.html(select);            /*se agrega select a label*/
                    span.html(label);            /*se agrega label a span*/
                    cbCl.html(span);            /*se agrega span a cbCl*/
                }
                return cbCl;
            };

            /*
             * Crea el foot de la tabla
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.tfoot = function (oSettings) {
                let df = $('<div></div>');
                df.attr('id', 'foot_' + oSettings.oTable);
                df.attr('class', 'dt-toolbar-footer');

                /*===================INI IZQUIERDO===========================*/
                let dcontlf = $('<div></div>');
                dcontlf.attr('id', 'info_' + oSettings.oTable);
                dcontlf.attr('class', 'col-sm-6 col-xs-12 hidden-xs');

                let dtxt = $('<div></div>');
                dtxt.attr('class', 'fullgrid_info pull-left');
                if (oSettings.tViewInfo) {
                    dtxt.html(_private.txtInfo);        /*info inicial*/

                    dcontlf.html(dtxt);

                    /*combo change length*/
                    dcontlf.append(_private.selectLength(oSettings));

                    /*boton refresh*/
                    let btnRefresh = $('<button></button>');
                    btnRefresh.attr('id', 'btnRefresh_' + oSettings.oTable);
                    btnRefresh.attr('type', 'button');
                    btnRefresh.attr('class', 'btn btn-primary');
                    btnRefresh.attr('title', 'Actualizar');
                    btnRefresh.html('<i class="fa fa-refresh"></i>');
                    btnRefresh.css({
                        'margin-left': '18px'
                    });
                    dcontlf.append(btnRefresh);

                    df.append(dcontlf);
                }
                /*=========================FIN IZQUIERDO====================*/

                /*===================INI DERECHO===========================*/
                let dcontrh = $('<div></div>');
                dcontrh.attr('id', 'paginate_' + oSettings.oTable);
                dcontrh.attr('class', 'col-sm-6 col-xs-12');

                let dcontpag = $('<div></div>');
                dcontpag.attr('class', 'fullgrid_paginate paging_simple_numbers');

                /*ul para paginacion*/
                let ulp = $('<ul></ul>');
                ulp.attr('class', 'pagination pagination-sm');
                ulp.attr('id', 'ul_pagin_' + oSettings.oTable);

                dcontpag.html(ulp);

                dcontrh.html(dcontpag);

                df.append(dcontrh);
                /*===================FIN DERECHO===========================*/

                /*agregando div a container*/
                $('#' + oSettings.oContainer).append(df);
            };

            /*
             * Inicia efecto loading en boton ACTUALIZAR
             * @param {type} oSettings
             * @param {type} btn
             * @returns {undefined}
             */
            _private.iniLoading = function (oSettings, btn) {
                if (btn !== undefined) {
                    _private.htmlBtn = $(btn).html();
                    $(btn).html('<i class="fa fa-spinner fa-spin">').attr('disabled', true);
                } else {
                    $(`#btnRefresh_${oSettings.oTable}`).html('<i class="fa fa-spinner fa-spin">').attr('disabled', true);
                }
            };

            /*
             * Finaliza efecto loading en boton ACTUALIZAR
             * @param {type} oSettings
             * @param {type} btn
             * @returns {undefined}
             */
            _private.endLoading = function (oSettings, btn) {
                if (btn !== undefined) {
                    $(btn).html(_private.htmlBtn).attr('disabled', false);
                } else {
                    $('#btnRefresh_' + oSettings.oTable).html('<i class="fa fa-refresh"></i>').attr('disabled', false);
                }
            };

            /*
             * Define el limit inferior para paginacion, segun el SGBD
             * @param {type} oSettings
             * @returns {oSettings.pDisplayStart|oSettings.pDisplayLength}
             */
            _private.limitInferior = function (oSettings) {
                let limit0 = oSettings.pDisplayStart;

                if (_private.sgbd == 'mysql') {
                    if (oSettings.pDisplayStart > 0) {
                        limit0 = oSettings.pDisplayLength * limit0;
                    }
                }
                return limit0;
            };

            /*
             * Retorna numero de inicio para la numeracion - Nro.
             * @param {type} oSettings
             * @returns {Number}
             */
            _private.numeracion = function (oSettings) {
                if (oSettings.tNumbers) {
                    let n = 1;
                    _private.colspanRecords++; /*colspan para msn: no se encontraron registros*/

                    if ((oSettings.pDisplayStart > 1 && _private.sgbd == 'sql')) {
                        n = (oSettings.pDisplayStart * oSettings.pDisplayLength) - (oSettings.pDisplayLength - 1);
                    }
              
                    if ((oSettings.pDisplayStart > 0 && _private.sgbd == 'mysql')) {
                        n = ((oSettings.pDisplayStart + 1) * oSettings.pDisplayLength) - (oSettings.pDisplayLength - 1);
                    }

                    return n;
                }
            };

            /*
             * Setea desde el servidor
             * @param {type} params
             * @param {type} data
             * @returns {String}
             */
            _private.paramServer = function (params, data) {
                let result = ``;
                /*validar si tiene parametros de servidor*/
                if (params) {
                    /*validar si es array*/
                    if (params instanceof Object && $.isArray(params)) {
                        /*se agrega paramtros desde array*/
                        $.each(params, function (x, v) {
                            result += `'${data[v]}',`;
                        });
                    } else {
                        /*se agrega parametros directos*/
                        result += `'${data[params]}',`;
                    }
                }
                return result;
            };

            /*
             * Setea parametros desde el cliente
             * @param {type} params
             * @returns {String}
             */
            _private.paramClient = function (params) {
                let result = ``;
                /*validar si tiene parametros de cliente*/
                if (params) {
                    /*validar si es array*/
                    if (params instanceof Object && $.isArray(params)) {
                        /*se agrega paramtros desde array*/
                        $.each(params, function (x, v) {
                            result += `'${v}',`;
                        });
                    } else {
                        /*se agrega parametros directos*/
                        result += `'${params}',`;
                    }
                }
                return result;
            };

            /*
             * Crea <button> o <li> para las acciones
             * @param {type} obj.o      ... objeto grid
             * @param {type} obj.b      ... array de bototnes
             * @param {type} obj.tdul   ... td o ul que se esta creando
             * @param {type} obj.t      ... si se crea <button> o <li>
             * @param {type} obj.d      ... datos del servidor
             * @param {type} obj.iax    ... numero de registro creado
             * @param {type} obj.ib     ... numero de button creado
             * @returns {undefined}
             */
            _private.createButtons = function (obj) {
                //{o:oSettings, b:buttong, tdul:ulb, t:'li', d:data, iax:index, ib:i}
                $.each(obj.b, function (i, v) {
                    let access = (v.access !== undefined) ? v.access : 0;
                    let titulo = (v.title !== undefined) ? v.title : '';
                    let icono = (v.icon !== undefined) ? v.icon : '';
                    let klass = (v.class !== undefined) ? v.class : '';
                    let fnReplace = (v.fnReplace !== undefined) ? v.fnReplace : '';

                    /*parametros para ajax*/
                    let ajax = (v.ajax !== undefined) ? v.ajax : '';       /*ajax para <td>*/
                    let fn = ``;
                    let flag = '';
                    let clientParams = '';
                    let serverParams = '';
                    let btn = null;

                    /*verificar si tiene permiso asignado*/
                    if (access) {
                        if (ajax instanceof Object) {
                            fn = (ajax.fn !== undefined) ? ajax.fn : '';                                /*funcion ajax*/
                            flag = (ajax.flag !== undefined) ? ajax.flag : '';                          /*flag de la funcion*/
                            clientParams = (ajax.clientParams !== undefined) ? ajax.clientParams : '';  /*parametros desde el cliente*/
                            serverParams = (ajax.serverParams !== undefined) ? ajax.serverParams : '';  /*parametros desde el servidor*/

                            /*configurando ajax*/
                            if (fn) {
                                let xparams = '';

                                /*validar flag para agregar como parametro*/
                                if (flag) {
                                    xparams = flag + ',';
                                }
                                /*parametros de servidor*/
                                xparams += _private.paramServer(serverParams, obj.d[obj.iax]);

                                /*parametros de cliente*/
                                xparams += _private.paramClient(clientParams);

                                xparams = xparams.substring(0, xparams.length - 1);

                                fn += `(this,${xparams})`;
                            }

                            switch (obj.t) {
                                case 'btn': /*<button>*/
                                    btn = $('<button></button>');
                                    btn.attr('type', 'button');
                                    btn.attr('id', 'btn_axion_' + obj.o.oTable + '_' + obj.iax);
                                    btn.attr('title', titulo);
                                    if (icono !== '') {
                                        btn.html('<i class="' + icono + '"></i>');
                                    }
                                    /*agregando ajax*/
                                    if (fn) {
                                        btn.attr('onclick', fn);
                                    }
                                    if (klass !== '') {
                                        btn.attr('class', klass);
                                    }
                                    break;
                                case 'li': /*<li>*/
                                    btn = $('<li></li>');
                                    var a = $('<a></a>');
                                    a.attr('id', 'btn_axion_' + obj.o.oTable + '_' + obj.iax + '_' + obj.ib + '_' + i);
                                    a.attr('href', 'javascript:;');
                                    a.html('<i class="' + icono + '"></i> ' + titulo);
                                    /*agregando ajax*/
                                    if (fn) {
                                        a.attr('onclick', fn);
                                    }

                                    btn.html(a);
                                    break;
                            }

                            /*verificar si tiene fnReplace configurado*/
                            if (fnReplace !== undefined && fnReplace instanceof Object) {
                                //                      indice -- data
                                var call = fnReplace(obj.iax, obj.d[obj.iax]);       /*se ejecuta fnReplace*/
                                if (!call) {
                                    //call es false, <td> sigue con su contenido original
                                } else {
                                    switch (obj.t) {
                                        case 'btn':
                                            btn = call;  /*se carga return de call*/
                                            break;
                                        case 'li':
                                            btn = '<li><a id="btn_axion_' + obj.o.oTable + '_' + obj.iax + '_' + obj.ib + '_' + i + '" href="javascript:;" onclick="' + fn + '">' + call + '</a></li>';  /*se carga return de call*/
                                            break;
                                    }

                                }
                            }

                            obj.tdul.append(btn);
                        } else {
                            alert('[ajax] no definido.');
                        }
                    }
                });
            };

            /*
             * Genera los botones para las acciones
             * @param {type} index                  ...indice del boton
             * @param {type} data
             * @param {type} oSettings
             * @returns {td}
             * 
             * USO:
             * 
             * sAxions: {
                width: '80',
                group: [{
                    class: "btn btn-primary",
                    buttons: [{
                            access: 1,
                            icono: 'da fa-save',
                            title: 'Grabar',
                            class: 'btn btn-warning',
                            ajax: {
                                fn: "alerta",
                                serverParams: ["nombrecompleto", "persona"]
                            }
                        },{
                            access: 1,
                            icono: 'da fa-edit',
                            title: 'Editar',
                            class: 'btn btn-default',
                            ajax: {
                                fn: "alerta",
                                serverParams: ["nombrecompleto", "persona"]
                            }
                    }]
                }]
             }
             */
            _private.axionButtons = function (index, data, oSettings) {
                let buttons = (oSettings.sAxions.buttons !== undefined) ? oSettings.sAxions.buttons : [];
                let group = (oSettings.sAxions.group !== undefined) ? oSettings.sAxions.group : '';

                /*verificar si axiones sera grupal*/
                if (group instanceof Object && group !== '') {
                    let td = $('<td></td>');
                    td.attr('class', 'text-center');
                    td.css({
                        'vertical-align': 'middle'
                    });

                    /*recorrido de acciones*/
                    $.each(group, function (i, v) {
                        let titulo = (v.titulo !== undefined) ? v.title : '<i class=\"fa fa-gear fa-lg\"></i>';  // default fa-gear
                        let tooltip = (v.tooltip !== undefined) ? v.tooltip : oSettings.tLabelAxion;
                        let klass = (v.class !== undefined) ? v.class : '';
                        let buttong = (v.buttons !== undefined) ? v.buttons : [];

                        /*div group*/
                        let divg = $('<div></div>');
                        divg.attr('class', 'btn-group');

                        /*boton para group*/
                        let btng = $('<button></button>');
                        btng.attr('class', klass + ' dropdown-toggle');
                        btng.attr('data-toggle', 'dropdown');
                        btng.attr('title', tooltip);
                        btng.html(titulo);
                        btng.append(' <span class="caret"></span>');

                        divg.append(btng);      /*se agrega <button> a <div>*/

                        /*ul para botones-opcioens*/
                        let ulb = $('<ul></ul>');
                        ulb.attr('class', 'dropdown-menu');

                        /*crea el boton*/
                        _private.createButtons({o: oSettings, b: buttong, tdul: ulb, t: 'li', d: data, iax: index, ib: i});

                        divg.append(ulb);      /*se agrega <ul> a <div>*/

                        td.append(divg);            /*se agrega <div> a <td>*/

                    });

                    return td;
                } else {
                    if (buttons.length) {
                        let td = $('<td></td>');
                        td.attr('class', 'text-center');
                        td.css({
                            'vertical-align': 'middle'
                        });
                        
                        let dbtn = $('<div/>');
                        dbtn.addClass('btn-group');

                        _private.createButtons({o: oSettings, b: buttons, tdul: dbtn, t: 'btn', d: data, iax: index, ib: null});
                        
                        td.append(dbtn);

                        return td;
                    }
                }
            };

            /*
             * Setea values del checkbox provenientes del cliente
             * @param {type} params
             * @returns {String}
             */
            _private.valuesClient = function(params) {
                let result = '';
                /*validar si tiene parametros de cliente*/
                if (params) {
                    /*validar si es array*/
                    if (params instanceof Object && $.isArray(params)) {
                        /*se agrega paramtros desde array*/
                        $.each(params,function(x,v) {
                            result += v + "*";
                        });
                    } else {
                        /*se agrega parametros directos*/
                        result += params + "*";
                    }
                }
                return result;
            };
            
            /*
             * Setea values del checkbox provenientes del servidor
             * @param {type} params
             * @param {type} data
             * @returns {String}
             */
            _private.valuesServer = function(params, data) {
                let result = '';
                /*validar si tiene parametros de servidor*/
                if (params) {
                    /*validar si es array*/
                    if (params instanceof Object && $.isArray(params)) {
                        /*se agrega paramtros desde array*/
                        $.each(params,function(x,v) {
                            result += data[v] + "*";
                        });
                    } else {
                        /*se agrega parametros directos*/
                        result += data[params] + "*";
                    }
                }
                return result;
            };
            
            /*
             * Setea values del checkbox, asignadole como atributos data-
             * @param {type} params
             * @param {type} data
             * @returns {String}
             */
            _private.attrValuesServer = function(params, data) {
                let result = ``;
                /*validar si tiene parametros de servidor*/
                if (params) {
                    /*validar si es array*/
                    if (params instanceof Object && $.isArray(params)) {
                        /*se agrega paramtros desde array*/
                            $.each(params,function(y,z) {
                                if(data[z] !== undefined){
                                    result += ` data-${z}="${data[z]}" `;
                                }else{
                                    console.log(`Field [${z}] no definido en _private.attrValuesServer().`);
                                }
                            });
                    } else {
                        /*se agrega parametros directos*/
                        result += ` data-${params}="${data[params]}" `; 
                    }
                }
                return result;
            };
            
            /*
             * Crea los checkbox de la tabla
             * @param {type} oSettings
             * @param {type} data
             * @param {type} r
             * @returns {$}
             * sCheckbox: {
                    serverValues: ['sexo','persona'],
                    clientValues: ['qwerty',123],
                    attrServerValues: ['sexso','persona'],
                    fnReplace::function(){} 
                },
             */
            _private.createCheckbox = function(oSettings, data, r) {
                let clientValues = (oSettings.sCheckbox.clientValues !== undefined) ? oSettings.sCheckbox.clientValues : '';    /*parametros del cliente*/
                let serverValues = (oSettings.sCheckbox.serverValues !== undefined) ? oSettings.sCheckbox.serverValues : '';    /*parametros del servidor*/
                let attrServerValues = (oSettings.sCheckbox.attrServerValues !== undefined) ? oSettings.sCheckbox.attrServerValues : '';    /*parametros del servidor como atributos*/
                let fnReplace = (oSettings.sCheckbox.fnReplace !== undefined) ? oSettings.sCheckbox.fnReplace : '';
                let xvalues = '', attrValues = '';

                if (serverValues !== '') {
                    /*parametros de servidor*/
                    xvalues += _private.valuesServer(serverValues, data[r]);
                }
                if (clientValues !== '') {
                    /*parametros de cliente*/
                    xvalues += _private.valuesClient(clientValues, data[r]);
                }
                xvalues = xvalues.substring(0, xvalues.length - 1);

                if (attrServerValues !== '') {
                    /*parametros de servidor como atributos*/
                    attrValues = _private.attrValuesServer(attrServerValues, data[r]);
                }
                
                let td = $('<td></td>');
                td.attr('class', 'text-center');
                
                if(fnReplace === ''){
                    td.html(`<input id="${oSettings.oTable}_chk_${r}" name="${oSettings.oTable}_chk[]" type="checkbox" value="${xvalues}" ${attrValues} class="chkG">`);
                }else{
                    /*verificar si tiene fnReplace configurado*/
                    if(fnReplace !== undefined && fnReplace instanceof Object){
                        let call = fnReplace(r,data[r]);       /*se ejecuta fnReplace*/
                        if(!call){
                            //call es false, <td> sigue con su contenido original
                        }else{
                            td.html(call);  /*se carga return de call*/
                        }
                    }
                }
                return td;
            };
            
            /*
             * Cebra de columna al ordenar
             * @param {type} r
             * @param {type} pOrderField
             * @param {type} campo
             * @returns {String}
             */
            _private.cebraCol = function(c, oSettings, campo, r) {
                let m, classort;
                m = oSettings.pOrderField.split(' ');
                classort = '';
                
                /*verfificar si cplumna esta ordenada*/
                let cssTh1 = $('#'+oSettings.oTable+'_head_th_'+c).is('.sorting_asc');
                let cssTh2 = $('#'+oSettings.oTable+'_head_th_'+c).is('.sorting_desc');
                
                if(cssTh1 || cssTh2){
                    if (campo === m[0]) {
                        classort = ' sorting_1';
                        if (r % 2) {
                            classort = ' sorting_2';
                        }
                    }
                }
                
                return classort;
            };
            
            /*
             * Suma cantidades por columna
             * @param {type} oSettings
             * @returns {undefined}
             * FALTA VER COMO QUEDA CUANDO LAS ACCIONES SE MUEVAN AL FINAL
             */
            _private.exeTotalizer = function(oSettings){
                let colspanTT = 0;
                /*verificar si tiene acciones*/
                let gBtn = (oSettings.sAxions.group !== undefined) ? oSettings.sAxions.group : [];
                let bBtn = (oSettings.sAxions.buttons !== undefined) ? oSettings.sAxions.buttons : [];
                
                /*agregando numeracion*/
                if(oSettings.tNumbers){
                    colspanTT++;
                }

                /*agregando acciones al inicio*/
                if (_private.positionAxion.toLowerCase() === 'first' && (gBtn.length > 0 || bBtn.length > 0)) {
                    colspanTT++;
                }

                /*agregando checkbox al inicio*/
                if(oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object){
                    let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'first';
                    if(pos.toLowerCase() === 'first'){    
                        colspanTT++;
                    }
                }
                
                $(`#totalizer_tab_${oSettings.oTable}`).remove();        /*remover <table> para nueva data*/
                
                /*creando tfoot para totalizadores*/
                let tf = $('<tfoot></tfoot>');
                tf.attr('id',`totalizer_tab_${oSettings.oTable}`);
                
                /*<tr>*/
                let trz = $('<tr></tr>');
                
                /*<td> para TOTAL*/
                let tdz = $('<td></td>');
                tdz.attr({
                    colspan: colspanTT,
                    class: 'text-right'
                });
                tdz.html('<b>Total:</b>');
                
                trz.append(tdz);
                
                /*agregar columnas dinamicas*/
                let data = oSettings.sData;
               
                /*verificar q tenga data*/
                if(data.length){
                        /*recorrido de columnas configuradas en js*/
                        $.each(oSettings.tColumns,function(c,v) {
                            let td          = $('<td></td>');         /*se crea la columna*/
                            let klass       = (v.class !== undefined) ? v.class : '';     /*clase css para <td>*/
                            let kfield      = (v.field !== undefined) ? v.field : '[field] no definido.';
                            let totalizer   = (v.totalizer !== undefined && v.totalizer) ? v.totalizer : false;

                            
                            
                            if(totalizer){
                                td.html(`<b>${_private.totalizerColumn[kfield]}</b>`);
                            }else{
                                td.html('&nbsp;');
                            }
                            
                            td.addClass(klass);                /*agregado class css*/
                            
                            td.addClass(`col_${kfield}${oSettings.oTable}`); /*agregado class css*/

                            trz.append(td);
                        });
                }
                
                tf.append(trz);
                /*agregando div a container*/
                $('#'+oSettings.oTable).append(tf);
                
            };
            
            /*
             * Crea los registros del grid
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.records = function (oSettings) {
                let data = oSettings.sData,
                        chkExist = 0;

                let num = _private.numeracion(oSettings);

                /*verificar si tiene acciones*/
                let gBtn = (oSettings.sAxions.group !== undefined) ? oSettings.sAxions.group : [];
                let bBtn = (oSettings.sAxions.buttons !== undefined) ? oSettings.sAxions.buttons : [];

                $('#tbody_' + oSettings.oTable).find('tr').remove();        /*remover <tr> para nueva data*/
                
                _private.totalizerColumn = [];

                /*verificar si tiene data*/
                if (data.length > 0) {

                    $.each(data, function (index, value) {
                        let tr = $('<tr></tr>');        /*se crea el tr*/
                        tr.attr('id', 'tr_' + oSettings.oTable + '_' + index);

                        /*agregando numeracion*/
                        if (oSettings.tNumbers) {
                            let td = $('<td></td>');         /*se crea la columna*/
                            td.html('<b>' + (num++) + '</b>');
                            td.addClass('text-center');

                            tr.append(td);                   /*se agrega al <tr>*/
                        }

                        /*agregando acciones al inicio*/
                        if (_private.positionAxion.toLowerCase() === 'first' && (gBtn.length > 0 || bBtn.length > 0)) {
                            tr.append(_private.axionButtons(index, data, oSettings));
                        }
                        
                        /*agregando checkbox al inicio*/
                        if(oSettings.sCheckbox !== undefined && oSettings.sCheckbox instanceof Object){
                            let pos = (oSettings.sCheckbox.position !== undefined) ? oSettings.sCheckbox.position : 'first';
                            if(pos.toLowerCase() === 'first'){                        
                                tr.append(_private.createCheckbox(oSettings, data, index));        /*se agrega al <tr>*/
                                chkExist = 1;
                            }
                        }
                        
                        /*======================recorrido de columnas configuradas en js=========================*/
                        $.each(oSettings.tColumns,function(c,v) {
                            let td          = $('<td></td>');         /*se crea la columna*/
                            let width       = (v.width !== undefined) ? v.width + oSettings.tWidthFormat : '';
                            let valign      = (v.valign !== undefined && v.valign) ? oSettings.tColumns[c].valign : '';                    
                            let klass       = (v.class !== undefined) ? v.class : '';     /*clase css para <td>*/
                            let field       = (v.field !== undefined) ? data[index][v.field] : '[field] no definido.';
                            let kfield      = (v.field !== undefined) ? v.field : '[field] no definido.';
                            let fnReplace  = (v.fnReplace !== undefined) ? v.fnReplace : '';     /*closure css para <td>*/
                            let totalizer   = (v.totalizer !== undefined && v.totalizer) ? v.totalizer : false;
                            
                            /*parametros para ajax*/
                            let ajax        = (v.ajax !== undefined) ? v.ajax : '';       /*ajax para <td>*/
                            let fn          = '';
                            let flag        = '';
                            let clientParams= '';
                            let serverParams= '';
                            
                            if (ajax) {
                                fn          = (ajax.fn !== undefined) ? ajax.fn : '';                      /*funcion ajax*/
                                flag        = (ajax.flag !== undefined) ? ajax.flag : '';                  /*flag de la funcion*/
                                clientParams= (ajax.clientParams !== undefined) ? ajax.clientParams : '';  /*parametros desde el cliente*/
                                serverParams= (ajax.serverParams !== undefined) ? ajax.serverParams : '';  /*parametros desde el servidor*/
                            }
                            
                            let texto = field;
                          
                            /*verificar si columna tendra total*/
                            if(totalizer){
                                _private.isTotalizer = true;
                                if(_private.totalizerColumn[kfield] === undefined){
                                    /*si no existe el indice del campo a totalizar, se cre el indice con el primer valor*/
                                    _private.totalizerColumn[kfield] = parseFloat(field);
                                }else{  
                                    /*al existir en indice se suma*/
                                    _private.totalizerColumn[kfield] += parseFloat(field);
                                }
                            }
                            
                            /*agregando ajax*/
                            if (fn) {
                                var xparams = '';

                                /*validar flag para agregar como parametro*/
                                if (flag) {
                                    xparams = flag + ',';
                                }
                                /*parametros de servidor*/
                                xparams += _private.paramServer(serverParams, data[index]);
                                /*parametros de cliente*/
                                xparams += _private.paramClient(clientParams);

                                xparams = xparams.substring(0, xparams.length - 1);
                                fn = fn + '(this,' + xparams + ')';
                                texto = $('<a></a>');
                                texto.attr('href','javascript:;');
                                texto.html(field);
                                texto.attr('onclick',fn);
                            }
                            
                            td.html(texto);                         /*contenido original de <td>*/
                            td.attr('class', klass);                /*agregado class css*/
                            td.addClass(`col_${kfield}${oSettings.oTable}`);             /*para tShowHideColumn*/
                            
                            /*verificar si se ordena para marcar*/
                            let classort = _private.cebraCol(c, oSettings, oSettings.tColumns[c].field,index);
                            
                            td.addClass(classort);
                            td.attr({width:width});
                            td.css({'vertical-align':valign});
                            
                            /*verificar si tiene fnReplace configurado*/
                            if(fnReplace !== undefined && fnReplace instanceof Object){
                                var call = fnReplace(index,data[index]);       /*se ejecuta fnReplace*/
                                if(!call){
                                    //call es false, <td> sigue con su contenido original
                                }else{
                                    td.html(call);  /*se carga return de call*/
                                }
                            }
                            
                            tr.append(td);                          /*se agrega al <tr>*/
                        });
                        /*======================fin recorrido de columnas configuradas en js=========================*/

                        $('#tbody_' + oSettings.oTable).append(tr);
                    });

                } else {
                    let tr = $('<tr></tr>');        /*se crea el tr*/
                    let td = $('<td></td>');         /*se crea la columna*/
                    td.attr('colspan', _private.colspanRecords);
                    td.html('<div class="alert alert-info text-center"><i class="fa fa-info"></i> ' + oSettings.tMsnNoData + '<div>');

                    tr.html(td);                                    /*se agrega al <tr>*/
                    $('#tbody_' + oSettings.oTable).html(tr);
                }
                
                /*ejecutar totalizadores por columna*/
                if(_private.isTotalizer){
                    _private.exeTotalizer(oSettings);
                }
            };
            
            /*
             * Crea botones primero y anterior de paginacion
             * @param {type} oSettings
             * @param {type} pagActual
             * @returns {undefined}
             */
            _private.liFirstPrev = function(oSettings, pagActual) {
                
                /*se crea boton <li> ptimero*/
                let liFirst = $('<li></li>');

                if (pagActual > 1) {
                    liFirst.attr('class', 'paginate_button previous');
                } else {
                    liFirst.attr('class', 'paginate_button previous disabled');
                }

                /*se crea <a> primero*/
                let aFirst = $('<a></a>');
                aFirst.attr('href', 'javascript:;');
                aFirst.html(`<i class="${_private.btnFirst}"></i>`);
                if (pagActual > 1) {
                    aFirst.click(function() {
                        $(this).off('click');
                        oSettings.pDisplayStart = (_private.sgbd == 'sql')?1:0;
                        oSettings.pFilterCols = _private.prepareFilters(oSettings); 
                        _private.sendAjax(oSettings); 
                    });
                }
                $(liFirst).html(aFirst);                /*aFirst dentro de liFirst*/
                $(`#ul_pagin_${oSettings.oTable}`).append(liFirst);                  /*liFirst dentro de ul*/

                
                /*se crea boton <li> anterior*/
                let liPrev = $('<li></li>');
                if (pagActual > 1) {
                    liPrev.attr('class', 'paginate_button previous');
                } else {
                    liPrev.attr('class', 'paginate_button previous disabled');
                }

                /*se crea <a> anterior*/
                let aPrev = $('<a></a>');
                aPrev.attr('href', 'javascript:;');
                aPrev.html(`<i class="${_private.btnPrev}"></i>`);
                if (pagActual > 1) {
                    aPrev.click(function() {
                        $(this).off('click');
                        oSettings.pDisplayStart = (_private.sgbd == 'sql')?pagActual-1:pagActual-2;//mysql pagActual - 2
                        oSettings.pFilterCols = _private.prepareFilters(oSettings); 
                        _private.sendAjax(oSettings); 
                    });
                }
                $(liPrev).html(aPrev);                /*aPrev dentro de liPrev*/
                $(`#ul_pagin_${oSettings.oTable}`).append(liPrev);                  /*liPrev dentro de ul*/
            };
            
            /*
             * Crea botones ultimo y siguiente de paginacion
             * @param {type} oSettings
             * @param {type} pagActual
             * @param {type} numPaginas
             * @returns {undefined}
             */
            _private.liLastNext = function(oSettings, pagActual, numPaginas) {
                /*se crea boton <li> siguiente*/
                let liNext = $('<li></li>');
                if (numPaginas > 1 && pagActual !== numPaginas) {
                    liNext.attr('class', 'paginate_button next');
                } else {
                    liNext.attr('class', 'paginate_button next disabled');
                }

                /*se crea <a> next*/
                let aNext = $('<a></a>');
                aNext.attr('href', 'javascript:;');
                aNext.html(`<i class="${_private.btnNext}"></i>`);
                if (numPaginas > 1 && pagActual !== numPaginas) {
                    aNext.click(function() {
                        $(this).off('click');
                        oSettings.pDisplayStart = pagActual; //EN SQL SERVER SE DEBE CHEQUEAR ESTA LINEA, PORQUE AL PARECER ES + 1
                        oSettings.pFilterCols = _private.prepareFilters(oSettings); 
                        _private.sendAjax(oSettings); 
                    });
                }
                $(liNext).html(aNext);                /*aNext dentro de liNext*/
                $(`#ul_pagin_${oSettings.oTable}`).append(liNext);                  /*liNext dentro de ul*/

                if (numPaginas > 1 && pagActual !== numPaginas) {
                    oSettings.pDisplayStart = (_private.sgbd == 'sql')?numPaginas:numPaginas-1;     /*para boton ultimo*/                    
                }

                /*se crea boton <li> ultimo*/
                let liLast = $('<li></li>');

                if (numPaginas > 1 && pagActual !== numPaginas) {
                    liLast.attr('class', 'paginate_button next');
                } else {
                    liLast.attr('class', 'paginate_button next disabled');
                }

                /*se crea <a> ultimo*/
                let aLast = $('<a></a>');
                aLast.attr('href', 'javascript:;');
                aLast.html(`<i class="${_private.btnLast}"></i>`);
                if (numPaginas > 1 && pagActual !== numPaginas) {
                    aLast.click(function() {
                        $(this).off('click');
                        oSettings.pFilterCols = _private.prepareFilters(oSettings); 
                        _private.sendAjax(oSettings); 
                    });
                }
                $(liLast).html(aLast);                /*aLast dentro de liLast*/
                $(`#ul_pagin_${oSettings.oTable}`).append(liLast);                  /*liLast dentro de ul*/
            };
            
            /*
             * Crea la paginacion del dataGrid
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.paginate = function(oSettings){
                if(oSettings.sData.length === 0){ 
                    /*agregando evento a boton actualizar*/
                    $('#btnRefresh_' + oSettings.oTable).off('click');
                    $('#btnRefresh_' + oSettings.oTable).click(function() {
                        oSettings.pDisplayStart = (_private.sgbd == 'sql')?1:0;
                        //_private.executeFilter(oSettings); FALTA      /*al actuaizar debe mandar los filtros*/
                    });
                    return false; 
                }
                
                if(oSettings.sData[0].total === undefined){
                    alert('Campo [total] no está definido. Revise su QUERY. El paginador no se mostrará.');
                }
                
                let total  = oSettings.sData[0].total;
                let start  = oSettings.pDisplayStart;
                let length = oSettings.pDisplayLength;
                let data   = (oSettings.sData !== undefined)?oSettings.sData:[];
                
                /*verificar si paginate esta activo*/
                if(oSettings.pPaginate && total > 0){
                    $(`#ul_pagin_${oSettings.oTable}`).html('');
                    
                    let paginaActual = (_private.sgbd == 'sql')?start:start + 1; 
                    let numPaginas = Math.ceil(total / length);     /*determinando el numero de paginas*/
                    let itemPag = Math.ceil(oSettings.pItemPaginas / 2);
                 
                    let pagInicio = (paginaActual - itemPag);  
                    pagInicio = (pagInicio <= 0 ? 1 : pagInicio + 1); 
                    let pagFinal  = (pagInicio + (oSettings.pItemPaginas - 1));
                    let trIni     = ((paginaActual * length) - length) + 1;
                    let trFin     = (paginaActual * length);
                    
                    let cantRreg  = trFin - (trFin - data.length);
                    let trFinOk   = (cantRreg < length) ? (cantRreg === total) ? cantRreg : (parseInt(trFin) - (parseInt(length) - parseInt(cantRreg))) : trFin;
                    
                    /*actualizando info*/
                    _private.iniInfo   = trIni;
                    _private.finInfo   = trFinOk;
                    _private.totalInfo = total;
                    
                    $(`#info_${oSettings.oTable}`).find('div:eq(0)').html(_private.txtInfo);
                    
                    /*====================INI UL NUMERACION ==================*/
                    _private.liFirstPrev(oSettings, paginaActual);
                    let i;
                 
                    /*for para crear numero de paginas*/
                    for (i = pagInicio; i <= pagFinal; i++) {
                        if (i <= numPaginas) {
                            /*se crea <li> para numeros de paginas*/
                            let liNumero = $('<li></li>');
                            /*se crea <a> anterior*/
                            let aNumero = $('<a></a>');
                            aNumero.attr('href', 'javascript:;');
                            aNumero.html(i);

                            if (i === paginaActual) {
                                liNumero.attr('class', 'num paginate_button activefg');
                                aNumero.css({
                                    background:'#3276B1',
                                    color: '#ffffff',
                                    border: '1px solid #3276B1',
                                    cursor: 'default'
                                });
                            } else {
                                liNumero.attr('class', 'num paginate_button');
                            }

                            $(liNumero).html(aNumero);                /*aNumero dentro de liNumero*/
                            $(`#ul_pagin_${oSettings.oTable}`).append(liNumero);                  /*liNumero dentro de ul*/
                        } else {
                            break;
                        }
                    }
                    /*fin for*/
                    
                    _private.liLastNext(oSettings, paginaActual, numPaginas);
                    /*====================FIN UL NUMERACION ==================*/
                }
                
                if(!oSettings.pPaginate){
                    /*actualizando info*/
                    _private.iniInfo   = 1;
                    _private.finInfo   = total;
                    _private.totalInfo = total;
                    $(`#info_${oSettings.oTable}`).find('div:eq(0)').html(_private.txtInfo);
                }else{
                    /*agregando eventos para paginacion*/
                    $(`#ul_pagin_${oSettings.oTable}`).find('li').each(function() {
                        let n = $(this).is('.num');
                        /*solo los numeros de pagina*/
                        if (n) {
                            let activo = $(this).is('.activefg');     /*numero de pagina actual*/
                            let numero = parseInt($(this).find('a').html());

                            /*evento a numeros activos*/
                            if (!activo) {
                                $(this).find('a').click(function() {
                                    oSettings.pDisplayStart = (_private.sgbd == 'sql')?numero : numero - 1;
                                    oSettings.pFilterCols = _private.prepareFilters(oSettings); 
                                    _private.sendAjax(oSettings);
                                });
                            } else {
                                /*agregando evento a boton actualizar, enviando el nuemro activo de pagina*/
                                $(`#btnRefresh_${oSettings.oTable}`).off('click');
                                $(`#btnRefresh_${oSettings.oTable}`).click(function() {
                                    oSettings.pDisplayStart = (_private.sgbd == 'sql')?numero : numero - 1;  
                                    oSettings.pFilterCols = _private.prepareFilters(oSettings);
                                   _private.sendAjax(oSettings);
                                });
                            }
                        }
                    });
                }
            };
            
            /*
             * Ocultar eventos del grid
             * @returns {undefined}
             */
            _private.hideAttrGrid = function(oSettings){
                let collection = $(`#${oSettings.oTable}`).find("button, a, span, #"+oSettings.oTable+"_chkall_0 input:checkbox");
                $.each(collection, function () {
                    /*obtener evento*/
                    let onclick = $(this).attr('onclick');
                    /*asignar evento*/
                    $(this).click(function () {
                        eval(onclick);
                    });
                    $(this).attr('onclick', null);
                });
            };

            /*
             * Retorna data del server
             * @param {type} oSettings
             * @returns {undefined}
             */
            _private.sendAjax = function (oSettings) {
                /*inica efecto loading*/
                _private.iniLoading(oSettings);

                let limit0 = _private.limitInferior(oSettings);

                /*Verificamos si se enviara parametros al server*/
                if (oSettings.fnServerParams !== undefined && typeof oSettings.fnServerParams == 'function') {
                    oSettings.fnServerParams(_private.aData);
                }

                /*
                 * Estas lineas debenser descomentadas al integrar con encripacion AES
                 * 
                 *  let ax = new Ajax();
                 let filters = (oSettings.pFilterCols !== undefined)?ax.stringPost(oSettings.pFilterCols):'';
                 */

                let filters = oSettings.pFilterCols;

                /*Enviamos datos de paginacion*/
                _private.aData.push({name: 'pDisplayStart', value: limit0});
                _private.aData.push({name: 'pDisplayLength', value: oSettings.pDisplayLength});
                _private.aData.push({name: 'pOrder', value: oSettings.pOrderField});
                _private.aData.push({name: 'pFilterCols', value: filters});

                let params = _private.serialize();

                $.ajax({
                    type: "POST",
                    data: params,
                    url: oSettings.ajaxSource,
                    dataType: 'json',
                    success: function (data) {
                        /*validar error del SP*/
                        if (data.length > 0 || data.error !== undefined) {
                            /*no es un array, servidor devuelve cadena, y el unico q devuelve cadena es el ERROR del SP*/
                            if (data instanceof Object === false || data.error !== undefined) {
                                let msn = data;
                                if (data.error !== undefined) {
                                    msn = data.error;
                                }
                                alert(msn);
                            }
                        }

                        oSettings.pFilterCols = '';
                        oSettings.sData = (data.length > 0) ? data : [];

                        /*generar registros*/
                        _private.records(oSettings);
                        
                        /*generar paginacion*/ 
                        _private.paginate(oSettings);

                        /*finaliza efecto loading*/
                        _private.endLoading(oSettings);
                        
                        /*se ejecuta callback*/
                        if (oSettings.fnCallback !== undefined && typeof oSettings.fnCallback == 'function') {//si existe callback
                            var callback = oSettings.fnCallback;
                            callback(oSettings);
                        }
                        
                        /*oculto lo eventos de la grilla: button, a, chk_all, span*/
                        _private.hideAttrGrid(oSettings);
                        
                    }
                }).fail( function() {
                    //alert( 'Error!!' );
                });
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
                        _private.theader(oSettings); //aun falta programar

                        /*el body de la tabla*/
                        _private.tbody(oSettings);

                        /*el footer de la tabla*/
                        _private.tfoot(oSettings);

                        /*se valida se data sera via ajax*/
                        if (oSettings.ajaxSource) {
                            _private.sendAjax(oSettings);
                        }
                        
                        /*para ocultar filtros avanzados al dar click en document*/
                        if(_private.fieldsHide.length){
                            $(document).click(function(a) {
                                $.each(_private.fieldsHide,function(i,v){
                                    var filterParent = $(a.target).parent().attr('data-filter');    /*cuando es un date*/
                                    if(v !== $(a.target).attr('data-filter') && v !== filterParent && v){
                                        $(`#cont_filter_${oSettings.oTable}_${v}`).css({display: 'none'});
                                    }
                                });
                                
                                if($(a.target).attr('data-filter') !== 'hs_cols'){
                                    $('#contvo_'+oSettings.oTable).css({display: 'none'});
                                }
                            });
                        }
                    }

                };

                method.init();

            });

        }

    });

})(jQuery);