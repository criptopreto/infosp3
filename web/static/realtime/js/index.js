var chart_map;
var buffer_iio = [];
var hoy = moment().format("L");
var is_realtime = true;
var iiodb = new Dexie("iio_database");
var nuevasiio = 0;
var noSleep = new NoSleep();
var LS = window.localStorage;
var socket;
var opcLoadIIO = {
    numActual: 0,
    limActual: 10,
    limAnterior: 0,
    numTotal: 0
}
var inicializado = false;
var range_hora_inicio = "";
var range_hora_final = "";

var filtrosZodi = [];
var filtroTematica = [];
var filtroModalidad = [];

var opcionActiva = 1;
var rangoActivo = [];
var tituloActivo;

var idAnterior = 0; //ID para evitar que una IIO se renderice 2 veces.

window.iioArray = [];

console.log("Caracas.")

var finCarga = false;

var zodi_tie = [
    {nombre: "Distrito Capital", codigo: "dc"},
    {nombre: "Miranda", codigo: "mi"},
    {nombre: "La Guaira", codigo: "lg"},
    {nombre: "Vargas", codigo: "lg"},
    {nombre: "Aragua", codigo: "ar"},
    {nombre: "Carabobo", codigo: "cb"},
    {nombre: "Yaracuy", codigo: "ya"},
    {nombre: "Anzoátegui", codigo: "an"},
    {nombre: "Monagas", codigo: "mo"},
    {nombre: "Sucre", codigo: "su"},
    {nombre: "Falcón", codigo: "fc"},
    {nombre: "Lara", codigo: "lr"},
    {nombre: "Zulia", codigo: "zl"},
    {nombre: "Amazonas", codigo: "am"},
    {nombre: "Bolívar", codigo: "bo"},
    {nombre: "Delta Amacuro", codigo: "da"},
    {nombre: "Apure", codigo: "ap"},
    {nombre: "Barinas", codigo: "ba"},
    {nombre: "Cojedes", codigo: "co"},
    {nombre: "Guárico", codigo: "gu"},
    {nombre: "Portuguesa", codigo: "pt"},
    {nombre: "Mérida", codigo: "md"},
    {nombre: "Táchira", codigo: "tc"},
    {nombre: "Trujillo", codigo: "tr"},
    {nombre: "Nueva Esparta", codigo: "ne"},
    {nombre: "Dependencias Federales", codigo: "df"},
]

var key_tie = {
    "aseguramiento del pdte de la rbv y c/j de la fanb, dirigentes y cuadros de direcc de la rbv y pio": {
        tie: "TIE 1",
        color: "#64000038",
    },
    "amenazas a la seguridad y defensa de la nación": {
        tie: "TIE 2",
        color: "#157B0038",
    },
    "aseguramiento de las empresas estratégicas vinculadas al sector energético nacional": {
        tie: "TIE 3",
        color: "#38467438",
    },
    "aseguramiento de las empresas e instituciones vinculadas al sistema productivo y financiero nacional": {
        tie: "TIE 4",
        color: "#B49C0038",
    },
    "aseguramiento de las empresas e instituciones vinculadas sistema productivo y financiero nacional": {
        tie: "TIE 4",
        color: "#B49C0038",
    },
    "otros factores que afectan el orden interno y desarrollo integral de la nación": {
        tie: "TIE 5",
        color: "#6B6B6B38",
    }
}

var key_redi = {
    "distrito capital": "CAPITAL",
    "miranda": "CAPITAL",
    "la guaira": "CAPITAL",
    "vargas": "CAPITAL",

    "aragua": "CENTRAL",
    "carabobo": "CENTRAL",
    "yaracuy": "CENTRAL",

    "anzoátegui": "ORIENTAL",
    "monagas": "ORIENTAL",
    "sucre": "ORIENTAL",

    "falcón": "OCCIDENTAL",
    "lara": "OCCIDENTAL",
    "zulia": "OCCIDENTAL",

    "amazonas": "GUAYANA",
    "bolívar": "GUAYANA",
    "delta amacuro": "GUAYANA",

    "apure": "LOS LLANOS",
    "barinas": "LOS LLANOS",
    "cojedes": "LOS LLANOS",
    "guárico": "LOS LLANOS",
    "portuguesa": "LOS LLANOS",

    "mérida": "LOS ANDES",
    "táchira": "LOS ANDES",
    "trujillo": "LOS ANDES",

    "nueva esparta": "MAIN",
    "dependencias federales": "MAIN",
    "zee": "MAIN",
}

//Funciones Útiles
var vaciarIIOS = ()=>{
    $("#iios-content").empty();
    $('.placeholder-iio-wrapper').removeClass("oculto");
}

iiodb.version(1).stores({
    iio: '&id,area,createtime,disposetime,tematica,subcategory,category,regionid,name,username,nickname,zodi_name,adi_name,parrish_name,priorizado,confirmado,aprobado,allowtime,editmode,isimage'
});

function addinfo(id){
    $("#dataM").html(id);
    $("#dataAP").html(id);
    LS.setItem("id_iio_delete", id);
};

async function deleteiio(){
    var idIIO = LS.getItem('id_iio_delete');
    $("#modalDelete").modal("hide");
    $.ajax({
        url: `${window.servidorNodeapi}/iio/${idIIO}`,
        type: "DELETE",
        success: function(resp){
            if(!resp.error){
                if(resp.data.n === 0){
                    console.log("¡El elemento no existe!");
                }else{
                    console.log("IIO Eliminada con éxito");
                    socket.emit("delete_iio", idIIO);
                }
            }else{
                console.log("Error al intentar eliminar la IIO");
            }
        },
        error: function(err){
            console.log("Error al intentar eliminar la IIO");
        }
    });
};

async function aprobariio(){
    var idIIO = LS.getItem('id_iio_delete');
     $.ajax({
         url: `${window.servidorNodeapi}/aprobar/${idIIO}`,
         type: "GET",
         success: (resp)=>{
             if(!resp.error){
                 if(resp.data.n === 0){
                     console.error("El elemento no existe");
                 }else{
                    $(`#ap-iio-${idIIO}`).removeClass("text-danger");
                    $(`#ap-iio-${idIIO}`).removeClass("fa-times-circle");
                    $(`#ap-iio-${idIIO}`).addClass("fa-check-circle");
                    $(`#ap-iio-${idIIO}`).addClass("text-success");
                    $(`#btn-ap-${idIIO}`).hide();
                    console.log("IIO Aprobada con exito");
                 }
             }else{
                 console.error("Error al intentar aprobar la IIO", resp);
             }
         },
         error: (err)=>{
             console.error("Error al intentar aprobar la IIO: ", err);
         }
     });
}

async function setRangoFecha(){
    var fechaInicio = LS.getItem("rango_fecha_inicio");
    var fechaFinal = LS.getItem("rango_fecha_final");
    var horaInicio = LS.getItem("rango_hora_inicio");
    var horaFinal = LS.getItem("rango_hora_final");
    if(!fechaInicio || !fechaFinal || !horaInicio || !horaFinal){
        alert("Debes llenar todos los campos.");
    }else{
        // Rango Personalizado
        window.iioArray = null;
        rangoActivo = [];
        opcionActiva = 5;
        rangoActivo.push(moment(new Date(fechaInicio + " " + horaInicio)).add(4, 'hour').format("YYYY-MM-DDTHH:mm:ss.000Z"));
        rangoActivo.push(moment(new Date(fechaFinal + " " + horaFinal)).add(4, 'hour').format("YYYY-MM-DDTHH:mm:ss.000Z"));

        console.log(rangoActivo);
        aplicarOpcion(rangoActivo, fechaInicio + " " + horaInicio + " - " + fechaFinal + " " + horaFinal);
        $('#modalRangoFecha').modal('hide');
    }
}

var renderIIO = (arrIIO, isRT=false)=>{
    if (inicializado) {
        if (arrIIO && arrIIO.length < 1){
            $('.placeholder-iio-wrapper').addClass("oculto");
            var alert = `<div class="alert alert-warning text-center alert-iio">No hay ningún reporte en la fecha seleccionada.</div>`;
            $("#iios-content").html(alert)
            $("#loader").addClass("oculto");
        }else{
            $(".alert-iio").addClass("oculto");
        }
        try{
            var finJornada = false;
            arrIIO.map((iio, key)=>{
                if(key < opcLoadIIO.limActual && key >= opcLoadIIO.numActual && finJornada === false && !finCarga && idAnterior !== iio.id){
                    idAnterior = iio.id;
                    /*var log = {
                        limiteActual: opcLoadIIO.limActual,
                        numeroActual: opcLoadIIO.numActual,
                        finJornada: finJornada,
                        finCarga: finCarga,
                        id: iio.id
                    }
                    console.table(log)*/
                    var gfh = tiempo => {
                        fecha = moment(tiempo).format("L");
                        hora = moment(tiempo).format("LT");
                        return fecha + " " + hora
                    }
                    opcLoadIIO.numActual = key;
                    cfg_tie = key_tie[iio.tematica];
                    
                    var iio_html = `
                    <div id="iio-${iio.id}" class="iio iioelement">
                        <div class="wrap-content">
                            <div class="iio-header" style="border-bottom: 3px dashed ${cfg_tie.color};">${window.is_supervisor ? iio.aprobado ? '<i class="fas fa-check-circle text-success"></i>': `<i class="fas fa-times-circle text-danger" id="ap-iio-${iio.id}"></i>` : ''} ${iio.priorizado ? '<i class="fas fa-exclamation-triangle text-danger"></i>': ''} <span class="${iio.priorizado ? 'title-iio-alert':'title-iio'}">${cfg_tie.tie + " - " + iio.subcategory.toUpperCase()}</span> ${window.is_supervisor ? `<span onclick='javascript:addinfo(${iio.id})'><i class="fas fa-cog float-right mr-3 icon-select" data-toggle="modal" data-target="#modalOpcionesIIO"></i>${!iio.aprobado ? `<i onclick="javascript:addinfo(${iio.id})" class="fas fa-check-square float-right mr-2 icon-select text-success" data-toggle="modal" data-target="#modalAprobar" id="btn-ap-${iio.id}"></i>` : ''}</span>` : ""} </div>
                            <div class="row">
                                <div class="${iio.isimage ? 'col-8' : "col-12"}">
                                    <div class="texto-iio"><span>${iio.descriptiontxt}</span></div>
                                </div>
                            </div>
                            <div class="iio-footer" style="background-color: ${cfg_tie.color} !important">
                                <div class="tag-ubicacion">REDI ${key_redi[iio.zodi_name.toLowerCase()] + " - " + iio.zodi_name.toUpperCase() + " - " + iio.adi_name.toUpperCase()} <span class="float-right tag-tiempo">${gfh(iio.disposetime)}</span> ${window.is_supervisor ? `<span class="float-right">${"#" + iio.id + " - " + iio.nickname.toUpperCase() + "&nbsp&nbsp-&nbsp&nbsp"}</span>` : ""}</div>
                            </div>
                        </div>
                    </div>
                    `
                    if (isRT){
                        if(iio.priorizado){
                            alerta.play();
                        }else{
                            audio.play();
                        }
                        if($(window).scrollTop() > 500){
                            buffer_iio.push(iio_html);
                            updateNotifyIIO(buffer_iio.length);
                        }else{
                            $("#iios-content").prepend(iio_html)
                            $('[data-toggle="tooltip"]').tooltip();
                        }
                    }else{
                        $("#iios-content").append(iio_html)
                        $('.placeholder-iio-wrapper').addClass("oculto");
                    }                            
                }else if(key === opcLoadIIO.limActual && finJornada === false){
                    finJornada = true;
                    opcLoadIIO.limActual += 10;
                }else if(opcLoadIIO.numActual === opcLoadIIO.numTotal - 1 && !finCarga){
                    finCarga = true;
                    $("#loader").addClass("oculto");
                }
        });
        }catch(err){
            console.log("Error:", err);
        }
    }
}

var cargarIIO = (arrIIO, opciones={titulo_map:hoy})=>{
    arrIIO.reverse();

    //QUITAR LAS NO APROBADAS
    /*
    if (!window.is_supervisor){
        arrIIO = arrIIO.filter(IIO=>IIO.aprobado);
    }
    */
    //APLICAR FILTROS
    if (filtrosZodi.length > 0){
        arrIIO = arrIIO.filter(IIO=>filtrosZodi.includes(IIO.zodi_name));
    }

    //APLICAR FILTRO MILICIA
    if (window.is_milicia) {
        arrIIO = arrIIO.filter(IIO=>IIO.redi_name === 'MILICIA');
    }
    
    //Agrupar las IIO del día hoy por zodi
    iiogZodi = _.groupBy(arrIIO, "zodi_name");
    iiogTematica = _.groupBy(arrIIO, "tematica");

    st_data = [];

    zodi_tie.forEach(iZodi=>{
        if (iiogZodi[iZodi.nombre]){
            temp = [];
            temp.push(iZodi.codigo);
            temp.push(iiogZodi[iZodi.nombre].length);
            st_data.push(temp)
        }
    });

    Highcharts.getJSON(window.mapVenezuela, function (geojson) {
        // Initiate the chart
        chart_map = new Highcharts.mapChart('container', {
            chart: {
                map: geojson
            },
            title: {
                text: 'IIO ' + opciones.titulo_map
            },
            mapNavigation: {
                enabled: true,
            },
            colorAxis: {
                labels: {
                    format: '{value}°C'
                },
                dataClasses: [{
                    to: 10,
                    name: '<10 | Deficiente',
                    color: '#7552f4'
                }, {
                    from: 10,
                    to: 20,
                    name: '10-20 | Regular',
                    color: '#f2b305'
                }, {
                    from: 20,
                    to: 30,
                    name: '20-30 | Bueno',
                    color: '#2ecc71'
                }, {
                    from: 30,
                    to: 50,
                    name: '30-50 | Eficiente',
                    color: '#e67e22'
                }, {
                    from: 50,
                    name: '>50 | Excelente',
                    color: '#c60202'
                }]
            },
            legend: {
                title: {
                    text: 'Informaciones Procesadas',
                    style: {
                        color: ( // theme
                            Highcharts.defaultOptions &&
                            Highcharts.defaultOptions.legend &&
                            Highcharts.defaultOptions.legend.title &&
                            Highcharts.defaultOptions.legend.title.style &&
                            Highcharts.defaultOptions.legend.title.style.color
                        ) || 'black'
                    }
                },
                floating: true,
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'bottom',
                valueDecimals: 0,
                backgroundColor: ( // theme
                    Highcharts.defaultOptions &&
                    Highcharts.defaultOptions.legend &&
                    Highcharts.defaultOptions.legend.backgroundColor
                ) || 'rgba(255, 255, 255, 0.85)',
            },
            series: [{
                data: st_data,
                keys: ['id', 'value'],
                joinBy: 'id',
                name: 'Reportes',
                states: {
                    hover: {
                        color: '#672421'
                    }
                },
                dataLabels: {
                    enabled: true,
                    format: '{point.properties.postal}',
                },
                enableMouseTracking: true
            }]
        });
    });

    //Array por IIO
    tem_data = [];
    for (gp in iiogTematica){
        var objTemp = {};
        var kTie = key_tie[gp];
        objTemp.tie = kTie.tie;
        objTemp.cant = iiogTematica[gp].length;
        tem_data.push(objTemp);
    }

    // Themes begin
    am4core.useTheme(am4themes_animated);
    am4core.useTheme(am4themes_moonrisekingdom);
    // Themes end

    var chart = am4core.create("st_top_tie", am4charts.XYChart);
    chart.padding(10, 20, 10, 10);

    var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.dataFields.category = "tie";
    categoryAxis.renderer.minGridDistance = 1;
    categoryAxis.renderer.inversed = true;
    categoryAxis.renderer.grid.template.disabled = true;

    var valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;

    var series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.categoryY = "tie";
    series.dataFields.valueX = "cant";
    series.tooltipText = "{valueX.value}"
    series.columns.template.strokeOpacity = 0;
    series.columns.template.column.cornerRadiusBottomRight = 5;
    series.columns.template.column.cornerRadiusTopRight = 5;

    var labelBullet = series.bullets.push(new am4charts.LabelBullet())
    labelBullet.label.horizontalCenter = "left";
    labelBullet.label.dx = 10;
    labelBullet.label.text = "{values.valueX.workingValue.formatNumber('#as')}";
    labelBullet.locationX = 0;

    // as by default columns of the same series are of the same color, we add adapter which takes colors from chart.colors color set
    series.columns.template.adapter.add("fill", function(fill, target){
        return chart.colors.getIndex(target.dataItem.index);
    });

    categoryAxis.sortBySeries = series;

    chart.data = tem_data;
    window.iioArray = arrIIO;
    opcLoadIIO.numTotal = arrIIO.length;
    renderIIO(arrIIO);
}

function limpiarStorage() {
    LS.removeItem("rango_hora_inicio");
    LS.removeItem("range_hora_final");
    LS.removeItem("rango_fecha_inicio");
    LS.removeItem("range_fecha_final");
}

async function aplicarOpcion(rangoTiempo=[], titulo_map, opcionActiva) {
    vaciarIIOS();
    finCarga = false;
    opcLoadIIO.limActual = 10;
    opcLoadIIO.numActual = 0;
    var iio_rango;
    

    if(rangoTiempo.length < 2){
        iio_rango = await iiodb.iio.where('disposetime').above(rangoTiempo[0]).toArray();
    }else{
        iio_rango = await iiodb.iio.where('disposetime').between(rangoTiempo[0], rangoTiempo[1]).toArray();
    }

    if(opcionActiva === 1){
        is_realtime = true;
    }else{
        is_realtime = false;
    }
    cargarIIO(iio_rango, {titulo_map: titulo_map});
}

function aplicarFiltro() {
    filtrosZodi.length = 0;
    $("#fzodi").find(":selected").each((key, element)=>{
        filtrosZodi.push(element.value);
    });
    switch (opcionActiva) {
        case 1:
            $("#realtime").click();
            break;
        case 2:
            $("#ayer").click();
        default:
            break;
    }

    aplicarOpcion(rangoActivo, tituloActivo);
}

$(document).ready(function () {
    $('#modalRangoFecha').on('show.bs.modal', function (event) {
        $("#dateTo").val("");
        $("#dateFrom").val("");
        $("#timeTo").val("");
        $("#timeFrom").val("");
    });

    $('#fzodi').select2({
        placeholder: 'ZODI',
    });

    $('#ftematica').select2({
        placeholder: 'TEMÁTICA',
    });

    $('#fmodalidad').select2({
        placeholder: 'MODALIDAD',
    });

    limpiarStorage();

    socket = io(`${window.servidorNodeapi}`);
    document.addEventListener('click', function enableNoSleep() {
    document.removeEventListener('click', enableNoSleep, false);
        noSleep.enable();
    }, false);

    $('#timeFrom').mdtimepicker({
        theme: 'red',
        timeFormat: 'hh:mm', 
        format: 'h:mm tt'
    });

    $('#timeTo').mdtimepicker({
        theme: 'red',
        timeFormat: 'hh:mm',
        format: 'h:mm tt',
    });

    $("#timeFrom").mdtimepicker().on("timechanged", e=>{
        LS.setItem("rango_hora_inicio", e.time);
    });

    $("#timeTo").mdtimepicker().on("timechanged", e=>{
        LS.setItem("rango_hora_final", e.time);
    });

    $("#dateFrom").on("pick.datepicker", e=>{
        LS.setItem("rango_fecha_inicio", moment(e.date).format("YYYY-MM-DD"));
    });

    $("#dateTo").on("pick.datepicker", e=>{
        LS.setItem("rango_fecha_final", moment(e.date).format("YYYY-MM-DD"));
    });

    $('#dateFrom').datepicker({
        autoHide: true,
        zIndex: 2048,
        language: 'es-ES',
        endDate: new Date
    });

    $('#dateTo').datepicker({
        autoHide: true,
        zIndex: 2048,
        language: 'es-ES',
        endDate: new Date
    });

    //Appending HTML5 Audio Tag in HTML Body
    var audio = new Audio(window.audioPop);
    var alerta = new Audio(window.audioAlerta);
    socket.on("connect", ()=>{
        console.log("Conectados al Servidor Realtime...")
        socket.emit("get_iio_init");
    });

    var updateNotifyIIO = u_cant_iio=>{
        $("#numiio").html(u_cant_iio);
    }

    var renderizarIIO = (arrIIO, isRT=false)=>{
        if (arrIIO.length < 1){
            $('.placeholder-iio-wrapper').addClass("oculto");
            var alert = `<div class="alert alert-warning text-center">No hay ningún reporte en la fecha seleccionada.</div>`;
            $("#iios-content").prepend(alert)
        }
        var gfh = tiempo => {
            fecha = moment(tiempo).format("L");
            hora = moment(tiempo).format("LT");
            return fecha + " " + hora
        }

        try{
            arrIIO.map((iio, key)=>{
                if(key<500){
                    cfg_tie = key_tie[iio.tematica];
                    var iio_html = `
                    <div id="iio-${iio.id}" class="iio iioelement">
                        <div class="wrap-content">
                            <div class="iio-header" style="border-bottom: 3px dashed ${cfg_tie.color};">${window.is_supervisor ? iio.aprobado ? '<i class="fas fa-check-circle text-success"></i>': '<i class="fas fa-times-circle text-danger"></i>' : ''} ${iio.priorizado ? '<i class="fas fa-exclamation-triangle text-danger"></i>': ''} <span class="${iio.priorizado ? 'title-iio-alert':'title-iio'}">${cfg_tie.tie + " - " + iio.subcategory.toUpperCase()}</span> ${window.is_supervisor ? `<span onclick='javascript:addinfo(${iio.id})'><i class="fas fa-cog float-right mr-3 icon-select" data-toggle="modal" data-target="#modalOpcionesIIO"></i>${!iio.aprobado ? `<i onclick="javascript:addinfo(${iio.id})" class="fas fa-check-square float-right mr-2 icon-select text-success" data-toggle="modal" data-target="#modalAprobar"></i>` : ''}</span>` : ""} </div>
                            <div class="row">
                                <div class="${iio.isimage ? 'col-8' : "col-12"}">
                                    <div class="texto-iio"><span>${iio.descriptiontxt}</span></div>
                                </div>
                            </div>
                            <div class="iio-footer" style="background-color: ${cfg_tie.color} !important">
                                <div class="tag-ubicacion">REDI ${key_redi[iio.zodi_name.toLowerCase()] + " - " + iio.zodi_name.toUpperCase() + " - " + iio.adi_name.toUpperCase()} <span class="float-right tag-tiempo">${gfh(iio.disposetime)}</span> ${window.is_supervisor ? `<span>${iio.id}</span> <span class="float-right">${iio.nickname.toUpperCase() + "&nbsp&nbsp-&nbsp&nbsp"}</span>` : ""}</div>
                            </div>
                        </div>
                    </div>
                    `
                    if (isRT){
                        if(iio.priorizado){
                            alerta.play();
                        }else{
                            audio.play();
                        }
                        if($(window).scrollTop() > 500){
                            buffer_iio.push(iio_html);
                            updateNotifyIIO(buffer_iio.length);
                        }else{
                            $("#iios-content").prepend(iio_html)
                        }
                    }else{
                        $("#iios-content").append(iio_html)
                        $('.placeholder-iio-wrapper').addClass("oculto");
                    }                            
                }
            });
        }catch(err){
            console.log("Error:", err);
        }
    }
    
    $('#acciones input').on('change', async function() {
        var opcion = $('input[name=options]:checked', '#acciones').val();
        window.iioArray = null;
        if (opcion === 'rango'){

        }else{
            $("#loader").removeClass("oculto");
            rangoActivo = [];
            tituloActivo = "";
            switch (opcion){
                case 'realtime':
                    opcionActiva = 1;
                    nuevasiio = 0;
                    var today = new Date();
                    var hace1dia = new Date(today.getTime());
                    hace1dia.setDate(today.getDate() - 1);
                    
                    hace1 = new Date(hace1dia.getFullYear(), hace1dia.getMonth(), hace1dia.getDate(), 21);
                    // Hoy
                    rangoActivo.push(moment(hace1).format("YYYY-MM-DDTHH:mm:ss.000"));
                    rangoActivo.push(moment(new Date()).add(4, "h").format("YYYY-MM-DDTHH:mm:ss.000"));
                    tituloActivo = moment(new Date()).format("YYYY-MM-DD");
                    break;
                case 'ayer':
                    opcionActiva = 2;
                    // Ayer
                    var today = new Date();
                    var hace1dia = new Date(today.getTime());
                    hace1dia.setDate(today.getDate() - 1);
                    hace1 = new Date(hace1dia.getFullYear(), hace1dia.getMonth(), hace1dia.getDate());

                    rangoActivo.push(moment(hace1).format("YYYY-MM-DD"));
                    rangoActivo.push(moment(new Date()).format("YYYY-MM-DD"));
                    tituloActivo = moment(new Date()).format("YYYY-MM-DD") + " - " + moment(new Date()).format("YYYY-MM-DD");
                    break;
                case 'semana':
                    opcionActiva = 3;
                    // 1 Semana
                    var today = new Date();
                    var hace7dia = new Date(today.getTime());
                    hace7dia.setDate(today.getDate() - 7);
                    hace7 = new Date(hace7dia.getFullYear(), hace7dia.getMonth(), hace7dia.getDate());
                    rangoActivo.push(moment(hace7).format("YYYY-MM-DD"));
                    // Mañana
                    var tomorrow = new Date(today.getTime());
                    tomorrow.setDate(today.getDate() + 1);
                    toMorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                    rangoActivo.push(moment(toMorrow).format("YYYY-MM-DD"));
                    tituloActivo = moment(hace7).format("YYYY-MM-DD") + " - " + moment(toMorrow).format("YYYY-MM-DD");
                    break;
                case 'mes':
                    opcionActiva = 4;
                    // 1 Mes
                    var today = new Date();
                    var hace31dia = new Date(today.getTime());
                    hace31dia.setDate(today.getDate() - 31);
                    hace31 = new Date(hace31dia.getFullYear(), hace31dia.getMonth(), hace31dia.getDate());
                    rangoActivo.push(moment(hace31).format("YYYY-MM-DD"));
                    // Mañana
                    var tomorrow = new Date(today.getTime());
                    tomorrow.setDate(today.getDate() + 1);
                    toMorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                    rangoActivo.push(moment(toMorrow).format("YYYY-MM-DD"));
                    tituloActivo = moment(hace31).format("YYYY-MM-DD") + " - " + moment(toMorrow).format("YYYY-MM-DD");
                    break;
            }
            aplicarOpcion(rangoActivo, tituloActivo, opcionActiva);
        }
    });

    var guardar_iio = arr_iio=>{
        try{
            arr_iio = arr_iio.filter(item=>{
                if (item.subcategory){
                    return item.subcategory.toLowerCase() !== "no-usar modalidad temporal no-usar";
                }
            });
            m_hoy = moment(new Date()).format("YYYY-MM-DD");
            var today = new Date();
            var hace1dia = new Date(today.getTime());
            hace1dia.setDate(today.getDate() - 1);
            
            hace1 = new Date(hace1dia.getFullYear(), hace1dia.getMonth(), hace1dia.getDate(), 21);
            return iiodb.iio.bulkPut(arr_iio).then(()=>{
                    return iiodb.iio.where('disposetime').between(moment(hace1).format("YYYY-MM-DDTHH:mm:ss.000"), moment(new Date()).add(4, "h").format("YYYY-MM-DDTHH:mm:ss.000"));
                }).then(iios=>{
                    return iios;
                }).catch(err=>{
                    console.log("Error", err);
                });
        }catch(err){
            console.log("error: ", err);
        }
    }
    
    socket.on("r_init_iio", async (data)=>{
        if(data.data_mes){
            //Guardamos las iio en la base de datos
            inicializado = true;
            var iio = await guardar_iio(data.data_mes);
            opcionActiva = 1;
            nuevasiio = 0;
            // Hoy
            var today = new Date();
            var hace1dia = new Date(today.getTime());
            hace1dia.setDate(today.getDate() - 1);
            
            hace1 = new Date(hace1dia.getFullYear(), hace1dia.getMonth(), hace1dia.getDate(), 21);
            rangoActivo.push(moment(hace1).format("YYYY-MM-DDTHH:mm:ss.000"));
            rangoActivo.push(moment(new Date()).add(4, "h").format("YYYY-MM-DDTHH:mm:ss.000"));
            tituloActivo = moment(new Date()).format("YYYY-MM-DD");
            iio.toArray(riio=>{
                cargarIIO(riio);
            })
        }
    });
    socket.on("c_iio", (data)=>{
    });

    socket.on("s_delete_iio", async sidIIO=>{
        console.log("Orden de eliminar la IIO", sidIIO);
        $("#iio-" + sidIIO).remove();
        $("#modalOpcionesIIO").modal("hide");
        await iiodb.iio.delete(parseInt(sidIIO), result=>{
            console.log(result);
        }).then(()=>{
            console.log("Eliminado con exito");
        }).catch(err=>{
            console.error("Error: ", err);
        });
    });

    socket.on("n_iio", (data)=>{
        if(is_realtime){
            iiodb.iio.bulkPut(data).then(()=>{
                /*
                if (!window.is_supervisor){
                    data = data.filter(IIO=>IIO.aprobado);
                }
                */
                renderizarIIO(data, true);
            }).catch(err=>{
                console.log("ERROR NUEVA IIO", err);
            });
        } else {
            iiodb.iio.bulkPut(data).then(()=>{
                nuevasiio++;
                updateNotifyIIO(nuevasiio);
            })
        }
    });

    $(window).scroll(e=>{
        if ($(window).scrollTop() < 100){
            if (buffer_iio.length > 0){
                buffer_iio.map(iio_html=>{
                    $("#iios-content").prepend(iio_html);
                    buffer_iio = [];
                    updateNotifyIIO(buffer_iio.length);
                })
            }
        }
        if ($(window).scrollTop() >= $(document).height() - $(window).height() - 500 && !finCarga){
            renderIIO(window.iioArray);
        }
    })
});
