const {Schema,model} = require('mongoose');

const CENTRO_VOTACION = new Schema({
    codigo: {type: String},
    nombre: {type: String},
    direccion: {type: String},
    redi: {type: String},
    zodi: {type: String},
    estado: {type: String},
    municipio: {type: String},
    parroquia: {type: String},
    coordenadas: {type: {type: String, enum: ["Point"]}}
}, {collection: 'centro_votacion'});

module.exports = {
    centro_votacion: model('centro_votacion', CENTRO_VOTACION),
}