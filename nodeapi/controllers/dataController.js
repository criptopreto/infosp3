const {centro_votacion} = require('../models/centro_votacion');

const manejador = {
    //CENTROS DE VOTACIÓN
    ver_centros: async (req, res)=>{
        var caracas = await centro_votacion.find().catch(err=>{return err})
        res.json({OK: caracas});
    },
    crear_centro: async (req, res)=>{
        var centro = new centro_votacion({
            codigo: "12345678",
            nombre: "Caracas",
            direccion: "Calle C2, Con cruce canaima a Maracay",
            redi: "Capital",
            zodi: "Distrito Capital",
            estado: "Distrito Capital"
        });
        centro.save().then(data=>{
            res.json({Ok: "YES"});
        }).catch(err=>{
            res.json({OK: err})
        })
    }
}

module.exports = manejador