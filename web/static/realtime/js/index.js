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

window.iioArray = [];

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
    "aseguramiento de los principales dirigentes de la revolución y c/r": {
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

iiodb.version(1).stores({
    iio: '&id,area,descriptiontxt,createtime,disposetime,tematica,subcategory,category,regionid,name,username,nickname,zodi_name,adi_name,parrish_name,priorizado,confirmado,aprobado,allowtime,editmode,isimage'
});

function addinfo(id){
    $("#dataM").html(id);
    LS.setItem("id_iio_delete", id);
};

function deleteiio(){
    var idIIO = LS.getItem('id_iio_delete');
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

var controller = new ScrollMagic.Controller();

var scene = new ScrollMagic.Scene({
    triggerElement: "#loader",
    triggerHook: "onEnter"
})
.addTo(controller)
.on("enter", function(e){
    if (!$("#loader").hasClass("active")){
        $("#loader").addClass("active");
        renderIIO(window.iioArray);
    }
});

var renderIIO = (arrIIO, isRT=false)=>{
    if (inicializado) {
        if (arrIIO && arrIIO.length < 1){
            $('.placeholder-iio-wrapper').addClass("oculto");
            var alert = `<div class="alert alert-warning text-center alert-iio">No hay ningún reporte en la fecha seleccionada.</div>`;
            $("#iios-content").prepend(alert)
        }else{
            $(".alert-iio").addClass("oculto");
        }
        var gfh = tiempo => {
            fecha = moment(tiempo).format("L");
            hora = moment(tiempo).format("LT");
            return fecha + " " + hora
        }
        try{
            var finJornada = false;
            arrIIO.map((iio, key)=>{
                if(key < opcLoadIIO.limActual && key >= opcLoadIIO.numActual && finJornada === false){
                    opcLoadIIO.numActual = key;
                    cfg_tie = key_tie[iio.tematica];
                    var iio_html = `
                    <div class="iio iioelement">
                        <div class="wrap-content">
                            <div class="iio-header" style="border-bottom: 3px dashed ${cfg_tie.color};">${iio.priorizado ? '<i class="fas fa-exclamation-triangle text-danger"></i>': ''} <span class="${iio.priorizado ? 'title-iio-alert':'title-iio'}">${cfg_tie.tie + " - " + iio.subcategory.toUpperCase()}</span> ${window.is_supervisor ? `<i class="fas fa-cog float-right mr-3 icon-select" data-toggle="modal" data-target="#modalOpcionesIIO"></i>` : ""} </div>
                            <div class="row">
                                <div class="${iio.isimage ? 'col-8' : "col-12"}">
                                    <div class="texto-iio"><span>${iio.descriptiontxt}</span></div>
                                </div>
                            </div>
                            <div class="iio-footer" style="background-color: ${cfg_tie.color} !important">
                                <div class="tag-ubicacion">REDI ${key_redi[iio.zodi_name.toLowerCase()] + " - " + iio.zodi_name.toUpperCase() + " - " + iio.adi_name.toUpperCase()} <span class="float-right tag-tiempo">${gfh(iio.disposetime)}</span> ${window.is_supervisor ? `<span class="float-right">${iio.nickname.toUpperCase() + "&nbsp&nbsp-&nbsp&nbsp"}</span>` : ""}</div>
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
                }else if(key === opcLoadIIO.limActual && finJornada === false){
                    finJornada = true;
                    opcLoadIIO.limActual += 10;
                }else if(opcLoadIIO.numActual === opcLoadIIO.numTotal - 1){
                    console.log("Fin")
                    $("#loader").addClass("oculto");
                }
            });
        }catch(err){
            console.log("Error:", err);
        }
        scene.update();
        $("#loader").removeClass("active");
    }
}

$(document).ready(function () {
    // Enable wake lock.
    // (must be wrapped in a user input event handler e.g. a mouse or touch handler)
    socket = io(`${window.servidorNodeapi}`);
    document.addEventListener('click', function enableNoSleep() {
    document.removeEventListener('click', enableNoSleep, false);
        noSleep.enable();
    }, false);

    $('[data-toggle="datepicker"]').datepicker({
        autoHide: true,
        zIndex: 2048,
        inline: true,
        language: 'es-VE'
    });

    //Appending HTML5 Audio Tag in HTML Body
    var audio = new Audio(window.audioPop);
    var alerta = new Audio(window.audioAlerta);
    socket.on("connect", ()=>{
        console.log("Conectados al Servidor Realtime...")
        socket.emit("get_iio_init");
    });

    //Funciones Útiles
    var vaciarIIOS = ()=>{
        $("#iios-content").html("");
        $('.placeholder-iio-wrapper').removeClass("oculto");
    }

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
                    <div class="iio iioelement">
                        <div class="wrap-content">
                            <div class="iio-header" style="border-bottom: 3px dashed ${cfg_tie.color};">${iio.priorizado ? '<i class="fas fa-exclamation-triangle text-danger"></i>': ''} <span class="${iio.priorizado ? 'title-iio-alert':'title-iio'}">${cfg_tie.tie + " - " + iio.subcategory.toUpperCase()}</span> ${window.is_supervisor ? `<i class="fas fa-cog float-right mr-3 icon-select" data-toggle="modal" data-target="#modalOpcionesIIO"></i>` : ""} </div>
                            <div class="row">
                                <div class="${iio.isimage ? 'col-8' : "col-12"}">
                                    <div class="texto-iio"><span>${iio.descriptiontxt}</span></div>
                                </div>
                            </div>
                            <div class="iio-footer" style="background-color: ${cfg_tie.color} !important">
                                <div class="tag-ubicacion">REDI ${key_redi[iio.zodi_name.toLowerCase()] + " - " + iio.zodi_name.toUpperCase() + " - " + iio.adi_name.toUpperCase()} <span class="float-right tag-tiempo">${gfh(iio.disposetime)}</span> ${window.is_supervisor ? `<span class="float-right">${iio.nickname.toUpperCase() + "&nbsp&nbsp-&nbsp&nbsp"}</span>` : ""}</div>
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

    var cargarIIO = (arrIIO, opciones={titulo_map:hoy})=>{
        arrIIO.reverse()
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
                        color: '#5dade2'
                    }, {
                        from: 10,
                        to: 20,
                        name: '10-20 | Regular',
                        color: '#f4d03f'
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

    $('#acciones input').on('change', async function() {
        var opcion = $('input[name=options]:checked', '#acciones').val();
        window.iioArray = null;
        $("#loader").removeClass("oculto");
        switch (opcion){
            case 'realtime':
                is_realtime = true;
                nuevasiio = 0;
                vaciarIIOS();
                // Hoy
                var m_hoy = moment(new Date()).format("YYYY-MM-DD");
                var iio_realtime = await iiodb.iio.where('disposetime').above(m_hoy).toArray();
                opcLoadIIO.limActual = 10;
                opcLoadIIO.numActual = 0;
                cargarIIO(iio_realtime);
                break;
            case 'ayer':
                is_realtime = false;
                vaciarIIOS();
                // Ayer
                var today = new Date();
                var hace1dia = new Date(today.getTime());
                hace1dia.setDate(today.getDate() - 1);
                hace1 = new Date(hace1dia.getFullYear(), hace1dia.getMonth(), hace1dia.getDate());
                var unDiaFormat = moment(hace1).format("YYYY-MM-DD");
                // Hoy
                var m_hoy = moment(new Date()).format("YYYY-MM-DD");
                var iio_ayer = await iiodb.iio.where('disposetime').between(unDiaFormat, m_hoy).toArray();
                opcLoadIIO.limActual = 10;
                opcLoadIIO.numActual = 0;
                cargarIIO(iio_ayer, {titulo_map: moment(hace1).format("L")});
                break;
            case 'semana':
                is_realtime = false;
                vaciarIIOS();
                // 1 Semana
                var today = new Date();
                var hace7dia = new Date(today.getTime());
                hace7dia.setDate(today.getDate() - 7);
                hace7 = new Date(hace7dia.getFullYear(), hace7dia.getMonth(), hace7dia.getDate());
                var unaSemanaFormat = moment(hace7).format("YYYY-MM-DD");
                // Mañana
                var tomorrow = new Date(today.getTime());
                tomorrow.setDate(today.getDate() + 1);
                toMorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                var tomorrowF = moment(toMorrow).format("YYYY-MM-DD");
                var iio_semana = await iiodb.iio.where('disposetime').between(unaSemanaFormat, tomorrowF).toArray();
                opcLoadIIO.limActual = 10;
                opcLoadIIO.numActual = 0;
                cargarIIO(iio_semana, {titulo_map: moment(hace7).format("L") + " - " + moment(new Date).format("L")});
                break;
            case 'mes':
                is_realtime = false;
                vaciarIIOS();
                // 1 Mes
                var today = new Date();
                var hace31dia = new Date(today.getTime());
                hace31dia.setDate(today.getDate() - 31);
                hace31 = new Date(hace31dia.getFullYear(), hace31dia.getMonth(), hace31dia.getDate());
                var unMesFormat = moment(hace31).format("YYYY-MM-DD");
                // Mañana
                var tomorrow = new Date(today.getTime());
                tomorrow.setDate(today.getDate() + 1);
                toMorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                var tomorrowF = moment(toMorrow).format("YYYY-MM-DD");
                var iio_mes = await iiodb.iio.where('disposetime').between(unMesFormat, tomorrowF).toArray();
                opcLoadIIO.limActual = 10;
                opcLoadIIO.numActual = 0;
                cargarIIO(iio_mes, {titulo_map: moment(hace31).format("L") + " - " + moment(new Date).format("L")});
                break;
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
            return iiodb.iio.bulkPut(arr_iio).then(()=>{
                    return iiodb.iio.where('disposetime').above(m_hoy);
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
            iio.toArray(riio=>{
                opcLoadIIO.limActual = 10;
                cargarIIO(riio);
            })
        }
    });
    socket.on("c_iio", (data)=>{
    });

    socket.on("s_delete_iio", (sidIIO)=>{
        console.log("Orden de eliminar la IIO", sidIIO);
    });

    socket.on("n_iio", (data)=>{
        console.log("Nueva IIO")
        if(is_realtime){
            iiodb.iio.bulkPut(data).then(()=>{
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
    })
});
