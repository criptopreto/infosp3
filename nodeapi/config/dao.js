const oracledb = require('oracledb');
const moment = require("moment");

moment.locale("es-ve");

var cns = {
    user: "sep",
    password: "smart",
    connectString: "10.51.3.53/sep"
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

//CERRAR LA CONEXIÓN
function close(conexion){
    conexion.release(
        function(err){
            if(err){console.error(err.message)}
        }
    )
}

//ABRIR LA CONEXIÓN
function consultarAgent(sql, binds, dml, tipo){
    oracledb.getConnection(cns, function(err, cn){
        if(error(err, cn)==-1){return}
        else{
            cn.execute(sql, binds, {autoCommit: dml}, async function(err, result){
                if(error(err, cn)==-1){return} //Verificar si hay algun error en la consulta
                else{
                    close(cn) //Cerrar la conexión
                    var codRegistro = []; //Se utilizará para guardar temporalmente los ID de los registros
                    var k = 0;
                    if(tipo===1){k=8}
                    else if(tipo===2){k===0}
                    await result.rows.map(registro=>{
                        if(registro[k]){
                            codRegistro.push(registro[0].toString());
                        }
                    });
                    console.log(codRegistro);
                }
            })
        }
    })
}

exports.consulta = consultarAgent;