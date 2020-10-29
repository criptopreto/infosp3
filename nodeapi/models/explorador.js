const {Schema,model} = require('mongoose');

const Explorador = new Schema({
    id: {type: String},
    cedula: {type: String},
    nombres: {type: String},
    apellidos: {type: String},
    telefonos: [{type: String}],
    alias: {type: String},
    direccion_domicilio: {
        redi: {type: String},
        zodi: {type: String},
        adi: {type: String},
        parroquia: {type: String},
        direccion: {type: String},
        localizacion: {
            type: {type: String, default: "Point"},
            coordinates: {type: [Number], index: "2dsphere"}
        }
    },
    direccion_trabajo: {
        redi: {type: String},
        zodi: {type: String},
        adi: {type: String},
        parroquia: {type: String},
        direccion: {type: String},
        localizacion: {
            type: {type: String, default: "Point"},
            coordinates: {type: [Number], index: "2dsphere"}
        }
    },
    observaciones: {type: String}
}, {collection: 'explorador'});

module.exports = {
    explorador: model('explorador', Explorador),
}