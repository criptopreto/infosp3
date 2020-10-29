const {explorador} = require('../models/explorador');

const handlerExploradores = {
    //CENTROS DE VOTACIÓN
    verExploradores: async (req, res)=>{
        var exploradores = await explorador.find().catch(err=>{return err})
        res.json(exploradores);
    },
    crearExplorador: async (req, res)=>{
        var newExplorador = new explorador({
            id: 1,
            cedula: "20995685",
            nombres: "ROSMER JESUS",
            apellidos: "CAMPOS PEROZA",
            telefonos: ["04125532688"],
            alias: "ISRAEL",
            direccion_domicilio: {
                redi: "CAPITAL",
                zodi: "DISTRITO CAPITAL",
                adi: "SAN JUAN",
                parroquia: "SAN BENARDINO",
                direccion: "AV. URDANETA, EDIF. CONFINANZAS, SP3",
                localizacion: {
                    type: "Point",
                    coordinates: [-66.906023, 10.506492]
                }
            },
            direccion_trabajo: {
                redi: "CAPITAL",
                zodi: "DISTRITO CAPITAL",
                adi: "SANTA ROSALÍA",
                parroquia: "CANDELARIA",
                direccion: "AV. ANDRES BELLO, CONTRALORÍA GENERAL DE LA REPÚBLICA.",
                localizacion: {
                    type: "Point",
                    coordinates: [-66.896937, 10.504872]
                }
            },
            observaciones: "MILITAR"
        });
        /* var newExplorador = new explorador({
            id: req.body.id,
            cedula: req.body.cedula,
            nombres: req.body.nombres,
            apellidos: req.body.apellidos,
            telefonos: req.body.telefonos,
            alias: req.body.alias,
            direccion_domicilio: {
                redi: req.body.domicilio_redi,
                zodi: req.body.domicilio_zodi,
                adi: req.body.domicilio_adi,
                parroquia: req.body.domicilio_parroquia,
                direccion: req.body.domicilio_direccion,
                coordenadas: req.body.domicilio_coordenadas
            },
            direccion_trabajo: {
                redi: req.body.trabajo_redi,
                zodi: req.body.trabajo_zodi,
                adi: req.body.trabajo_adi,
                parroquia: req.body.trabajo_parroquia,
                direccion: req.body.trabajo_direccion,
                coordenadas: req.body.trabajo_coordenadas
            },
            observaciones: req.body.observaciones
        }); */

        newExplorador.save().then(data=>{
            res.json({error: false, success: true, mensaje: "Explorador Registrado"});
        }).catch(err=>{
            res.json({error: true, success: false, mensaje: err})
        });
    }
}

module.exports = handlerExploradores