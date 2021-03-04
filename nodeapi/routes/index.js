var express = require('express');
var router = express.Router();
var handler = require("../controllers/dataController");
var expHandler = require("../controllers/exploradoresController");
var moment = require("moment");
const oracledb = require('oracledb');
const { json } = require('express');
const iio = require("../models/iio_sgi");
moment.locale("es-ve");

var cns = {
    user: "sep",
    password: "smart",
    connectString: "10.51.3.53/sep"
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//CERRAR LA CONEXIÓN
function close(conexion){
  conexion.release(
      function(err){
          if(err){console.error(err.message)}
      }
  )
}

//FUNCIÓN QUE MANEJARÁ LOS ERRORES DE LA BD
function error(err, cn){
  if(err){
      console.error(err.message)
      if(cn!=null) close(cn);
      return -1;
  }
  else return 0;
}

router.get("/exploradores", async (req, res)=>{
  var agentes = await oracledb.getConnection(cns, async (err, cn)=>{
    if(error(err, cn)==-1){return}
    else{
      return await cn.execute("SELECT * FROM EXPLORADORES_SEP_SP3", [], {autoCommit: false}, async (err, result)=>{
        if(error(err, cn)==-1){return}
        else{
          close(cn);
          var exploradores = [];
          await result.rows.map(registro=>{
            var explorador = {};
            explorador.id = registro[0];
            explorador.phone = registro[1];
            explorador.name = registro[2];
            explorador.sex = registro[3];
            // explorador.birthday = registro[4];
/*             explorador.createtime = registro[5];
            explorador.lasttime = registro[6];
            explorador.disposeid = registro[7];
            explorador.redi = registro[10];
            explorador.zodi = registro[11];
            explorador.adi = registro[12];
            explorador.parrish = registro[13];
            explorador.idcard = registro[14];
            explorador.accuracy = registro[15];
            explorador.position = registro[16];
            explorador.regionid = registro[17];
            explorador.description = registro[18];
            explorador.nicname = registro[19];
            explorador.profession = registro[20];
            explorador.label = registro[21];
            explorador.surname = registro[22];
            explorador.professionname = registro[23];
            explorador.labelname = registro[24];
            explorador.nickname = registro[25];
            explorador.criminalrecord = registro[26];
            explorador.password = registro[27];
            explorador.errornum = registro[28];
            explorador.errortime = registro[29]; */
            exploradores.push(explorador);
          });
          res.json({data:exploradores});
        }
      })
    }
  })
});

router.get("/region_id", async(req, res)=>{
  var id = req.query.id;
  console.log(id);

  oracledb.getConnection(cns, async (err, cn)=>{
    if(error(err, cn)==-1){res.json({data: []})}
    else{
      await cn.execute("SELECT * FROM REGION WHERE PARENTID=" + id, [], {autoCommit: false}, async (err, result)=>{
        if(error(err, cn)==-1){res.json({data: []})}
        else{
          close(cn);
          var regiones = [];
          var data = "";
          var dato = {};
          console.log(result.rows)
          await result.rows.map(registro=>{
            var region = {};
            region.id = registro[0];
            region.parentid = registro[1];
            region.regionname = registro[2];
            regiones.push(region);
          })
          res.json({data: regiones});
        }
      })
      
    }
  })
})

router.get("/iio_import", async(req, res)=>{
  var agentes = await oracledb.getConnection(cns, async (err, cn)=>{
    if(error(err, cn)==-1){return}
    else{
      var today = new Date();
      var hace400dias = new Date(today.getTime());
      hace400dias.setDate(today.getDate() - 500);
      hace400 = new Date(hace400dias.getFullYear(), hace400dias.getMonth(), hace400dias.getDate());
      var hoy = moment().format("YYYY-MM-DD HH:mm:ss");
      var hace400format = moment(hace400).format("YYYY-MM-DD HH:mm:ss");
      console.log(today.toLocaleString(), "Buscando Nuevos en BD Oracle entre", hace400format, "y", hoy);
      return await cn.execute(`SELECT * FROM V_SI2_SGI_IIO WHERE DISPOSETIME BETWEEN TO_DATE('${hace400format}', 'yyyy-mm-dd hh24:mi:ss') and TO_DATE('${hoy}', 'yyyy-mm-dd hh24:mi:ss')`, [], {autoCommit: false}, async (err, result)=>{
        if(error(err, cn)==-1){return}
        else{
          close(cn);
          var codMensaje = []; //Se utilizará para guardar temporalmente los ID de los reportes.
          result.rows.map((mensaje, key)=>{
            if(mensaje[2]){ //Guardamos el código solo si el mensaje tiene algún contenido.
                codMensaje.push(parseInt(mensaje[0].toString())); //Guardamos solo el código del mensaje en el array.
            }
          });
          var codMensajesGuardados = []; //Aquí verificaremos cuales códigos ya están guardados en Mongodb.
          await iio.IIO.find({id: {$in: codMensaje}}).then(resM=>{
              if(resM){
                  resM.map((codigoSMS, key)=>{
                      codMensajesGuardados.push(parseInt(codigoSMS.codigo));
                  })
              }
          });
          var mensajesNuevos = 0;
          await result.rows.map(registro=>{
            if(codMensajesGuardados.indexOf(parseInt(registro[0])) === -1){
              var chars={"á":"a", "é":"e", "í":"i", "ó":"o", "ú":"u",
              "à":"a", "è":"e", "ì":"i", "ò":"o", "ù":"u", "ñ":"n",
              "Á":"A", "É":"E", "Í":"I", "Ó":"O", "Ú":"U",
              "À":"A", "È":"E", "Ì":"I", "Ò":"O", "Ù":"U", "Ñ":"N"};
              var expr=/[áàéèíìóòúùñ]/ig;
              var expr2=/[\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u001b]/gu;
              try {
                var myiio = {};
                myiio.id = registro[0];
                myiio.area = registro[1];
                myiio.descriptiontxt = registro[2].replace("·", "").trim();
                myiio.createtime = moment(registro[3]).add(30, "minutes").format('YYYY-MM-DD HH:mm');
                myiio.disposetime = moment(registro[4]).add(30, "minutes").format('YYYY-MM-DD HH:mm');
                myiio.tematica = registro[5].toLowerCase();;
                myiio.subcategory = registro[6];
                myiio.category = registro[7];
                myiio.regionid = registro[8];
                myiio.name = registro[9];
                myiio.username = registro[10];
                myiio.nickname = registro[11];
                myiio.zodi_name = registro[12];
                myiio.adi_name = registro[13];
                myiio.parrish_name = registro[14];
                var newSMS = new iio.IIO(myiio);
                mensajesNuevos += 1;
                newSMS.save();
              } catch (error) {
                console.log("Error: ", error);
              }
            }
          });
          res.json({data: mensajesNuevos});
        }
      })
    }
  });
});

router.get("/iio_import_dias/:id", async(req, res)=>{
  var dias_get = req.params.id;
  await oracledb.getConnection(cns, async (err, cn)=>{
    if(error(err, cn)==-1){return}
    else{
      var today = new Date();
      var hace400dias = new Date(today.getTime());
      hace400dias.setDate(today.getDate() - dias_get);
      hace400 = new Date(hace400dias.getFullYear(), hace400dias.getMonth(), hace400dias.getDate());
      var hoy = moment().format("YYYY-MM-DD HH:mm:ss");
      var hace400format = moment(hace400).format("YYYY-MM-DD HH:mm:ss");
      console.log(today.toLocaleString(), "Buscando Nuevos en BD Oracle entre", hace400format, "y", hoy);
      return await cn.execute(`SELECT * FROM V_SI2_SGI_IIO WHERE DISPOSETIME BETWEEN TO_DATE('${hace400format}', 'yyyy-mm-dd hh24:mi:ss') and TO_DATE('${hoy}', 'yyyy-mm-dd hh24:mi:ss')`, [], {autoCommit: false}, async (err, result)=>{
        if(error(err, cn)==-1){return}
        else{
          close(cn);
          var codMensaje = []; //Se utilizará para guardar temporalmente los ID de los reportes.
          result.rows.map((mensaje, key)=>{
            if(mensaje[2]){ //Guardamos el código solo si el mensaje tiene algún contenido.
                codMensaje.push(parseInt(mensaje[0].toString())); //Guardamos solo el código del mensaje en el array.
            }
          });
          var codMensajesGuardados = []; //Aquí verificaremos cuales códigos ya están guardados en Mongodb.
          await iio.IIO.find({id: {$in: codMensaje}}).then(resM=>{
              if(resM){
                  resM.map((codigoSMS, key)=>{
                      codMensajesGuardados.push(parseInt(codigoSMS.codigo));
                  })
              }
          });
          console.log(result.rows[0])
          var mensajesNuevos = 0;
          await result.rows.map(registro=>{
            if(codMensajesGuardados.indexOf(parseInt(registro[0])) === -1){
              try {
                var myiio = {};
                myiio.id = registro[0];
                myiio.area = registro[1];
                myiio.descriptiontxt = registro[2].replace("·", "").trim();
                myiio.createtime = moment(registro[3]).add(30, "minutes").format('YYYY-MM-DD HH:mm');
                myiio.disposetime = moment(registro[4]).add(30, "minutes").format('YYYY-MM-DD HH:mm');
                myiio.tematica = registro[5].toLowerCase();;
                myiio.subcategory = registro[6];
                myiio.category = registro[7];
                myiio.regionid = registro[8];
                myiio.name = registro[9];
                myiio.username = registro[10];
                myiio.nickname = registro[11];
                myiio.redi_name = registro[12];
                myiio.zodi_name = registro[13];
                myiio.adi_name = registro[14];
                myiio.parrish_name = registro[15];
          
                var newSMS = new iio.IIO(myiio);
                mensajesNuevos += 1;
                newSMS.save();
              } catch (error) {
                console.log("Error: ", error);
              }
            }
          });
          res.json({data: mensajesNuevos});
        }
      })
    }
  });
})

router.get("/iio_tabla_rango", async (req, res)=>{
  await oracledb.getConnection(cns, async (err, cn)=>{
    var finicio_iio = req.query.finicio;
    var ffinal_iio = req.query.ffinal;
    console.log(finicio_iio);
    console.log(ffinal_iio);
    if(error(err, cn)==-1){return}
    else{
      var today = new Date();
      var hace7dias = new Date(today.getTime());
      hace7dias.setDate(today.getDate() - 7);
      hace7 = new Date(hace7dias.getFullYear(), hace7dias.getMonth(), hace7dias.getDate());
      var hoy = moment().format("YYYY-MM-DD HH:mm:ss");
      var unaSemanaFormat = moment(hace7).format("YYYY-MM-DD HH:mm:ss");
      console.log(today.toLocaleString(), "Buscando Nuevos en BD Oracle entre", unaSemanaFormat, "y", hoy);
      return await cn.execute(`SELECT * FROM V_SI2_SGI_IIO WHERE DISPOSETIME BETWEEN TO_DATE('${finicio_iio}', 'yyyy-mm-dd') and TO_DATE('${ffinal_iio}', 'yyyy-mm-dd')+1`, [], {autoCommit: false}, async (err, result)=>{
        if(error(err, cn)==-1){return}
        else{
          close(cn);
          var iios = [];
          await result.rows.map(registro=>{
            var iio = {};
            iio.id = registro[0];
            iio.area = registro[12];
            iio.descriptiontxt = registro[2];
            iio.createtime = moment(registro[3]).format('MM-DD-YYYY HH:mm');
            iio.disposetime = moment(registro[4]).format('MM-DD-YYYY HH:mm');
            iio.tematica = registro[5];
            iio.subcategory = registro[6];
            iio.category = registro[7];
            iio.nickname = registro[11];

            iios.push(iio);
          });
          res.json({data:iios});
        }
      })
    }
  })
});

router.get("/iio_tabla", async (req, res)=>{
  var agentes = await oracledb.getConnection(cns, async (err, cn)=>{
    if(error(err, cn)==-1){return}
    else{
      var today = new Date();
      var hace7dias = new Date(today.getTime());
      hace7dias.setDate(today.getDate() - 3);
      hace7 = new Date(hace7dias.getFullYear(), hace7dias.getMonth(), hace7dias.getDate());
      var hoy = moment().format("YYYY-MM-DD HH:mm:ss");
      var unaSemanaFormat = moment(hace7).format("YYYY-MM-DD HH:mm:ss");
      console.log(today.toLocaleString(), "Buscando Nuevos en BD Oracle entre", unaSemanaFormat, "y", hoy);
      return await cn.execute(`SELECT * FROM V_SI2_SGI_IIO WHERE DISPOSETIME BETWEEN TO_DATE('${unaSemanaFormat}', 'yyyy-mm-dd hh24:mi:ss') and TO_DATE('${hoy}', 'yyyy-mm-dd hh24:mi:ss')`, [], {autoCommit: false}, async (err, result)=>{
        if(error(err, cn)==-1){return}
        else{
          close(cn);
          var iios = [];
          await result.rows.map(registro=>{
            var iio = {};
            iio.id = registro[0];
            iio.area = registro[12];
            iio.descriptiontxt = registro[2];
            iio.createtime = moment(registro[3]).format('MM-DD-YYYY HH:mm');
            iio.disposetime = moment(registro[4]).format('MM-DD-YYYY HH:mm');
            iio.tematica = registro[5];
            iio.subcategory = registro[6];
            iio.category = registro[7];
            //iio.nickname = registro[11];

            iios.push(iio);
          });
          res.json({data:iios});
        }
      })
    }
  })
});

router.delete("/iio/:id", async(req, res)=>{
  var idIIO = parseInt(req.params.id);
  iio.IIO.deleteOne({
    id: idIIO
  }).then(async msg=>{
    await oracledb.getConnection(cns, async (err, cn)=>{
      if(error(err, cn)==-1){return}
      else{
        return await cn.execute(`DELETE FROM MESSAGE WHERE ID = :idIIO`, { idIIO:  idIIO}, {autoCommit: true}, async (err, result)=>{
          if(error(err, cn)==-1){return}
          else{
            close(cn);
          }
        })
      }
    });
    res.json({error: false, data: msg});
  }).catch(err=>{
    res.json({error: true, data: err});
  })
});

router.get("/aprobar/:id", async(req, res)=>{
  var idIIO = parseInt(req.params.id);
  iio.IIO.findOneAndUpdate({id: idIIO}, {aprobado: true, aprobadotime: new Date()}).then(async msg=>{
    res.json({error: false, data: msg});
  }).catch(err=>{
    res.json({error: true, data: err});
  });
});

router.get("/aprobarall", async(req, res)=>{
  iio.IIO.updateMany({disposetime: {$gte: '2021-01-19'}},{aprobado: false}).then(iios=>{
    res.json({error: false, cantidad: iios});
  }).catch(err=>{
    res.json({error: true, error: err});
  });
});

router.get("/exploradores_tabla", async (req, res)=>{
  var agentes = await oracledb.getConnection(cns, async (err, cn)=>{
    if(error(err, cn)==-1){return}
    else{
      return await cn.execute("SELECT * FROM EXPLORADORES_SEP_SP3", [], {autoCommit: false}, async (err, result)=>{
        if(error(err, cn)==-1){return}
        else{
          close(cn);
          var exploradores = [];
          await result.rows.map(registro=>{
            var explorador = {};
            explorador.id = registro[0];
            explorador.idcard = registro[14];
            explorador.phone = registro[1];
            explorador.nicname = registro[19];
            explorador.name = registro[2];
            explorador.surname = registro[22];
            explorador.sex = registro[3] === 1 ? "Masculino": "Femenino";
            // explorador.birthday = registro[4];
            // explorador.createtime = registro[5];
            // explorador.lasttime = registro[6];
            // explorador.disposeid = registro[7];
            explorador.redi = registro[10];
            explorador.zodi = registro[11];
            explorador.adi = registro[12];
            explorador.parrish = registro[13];
            // explorador.accuracy = registro[15];
            // explorador.position = registro[16];
            // explorador.regionid = registro[17];
            // explorador.description = registro[18];
            // explorador.profession = registro[20];
            // explorador.label = registro[21];
            // explorador.professionname = registro[23];
            // explorador.labelname = registro[24];
            // explorador.nickname = registro[25];
            // explorador.criminalrecord = registro[26];
            // explorador.password = registro[27];
            // explorador.errornum = registro[28];
            // explorador.errortime = registro[29];
            exploradores.push(explorador);
          });
          res.json({data:exploradores}); 
        }
      })
    }
  })
})

router.get("/test", function(req, res){
  var today = new Date();
  var hace8dias = new Date(today.getTime());
  hace8dias.setDate(today.getDate() - 365);
  hace8 = new Date(hace8dias.getFullYear(), hace8dias.getMonth(), hace8dias.getDate());
  var hoy = moment().format("YYYY-MM-DD HH:mm:ss");
  var unanoFormat = moment(hace8).format("YYYY-MM-DD HH:mm:ss");
  console.log(today.toLocaleString(), "Buscando Nuevos en BD Oracle entre", unanoFormat, "y", hoy);
  sql = `SELECT * FROM INFOWORK_IIO WHERE CREATETIME BETWEEN TO_DATE('${unanoFormat}', 'yyyy-mm-dd hh24:mi:ss') and TO_DATE('${hoy}', 'yyyy-mm-dd hh24:mi:ss')+1`;
  oracle.consulta(sql, [], false, 1);
  res.json({OK: "FIN"})
})


//EXPLORADORES

router.get("/ver_exploradores", expHandler.verExploradores)
router.get("/crear_explorador", expHandler.crearExplorador)

router.get("/centro_votacion", handler.ver_centros);

router.get("/crear", handler.crear_centro);

module.exports = router;
