const {Schema,model} = require('mongoose');

const CapacidadOperativa = new Schema({
    id_onfalo: {type: Number},
    localizacion: {
        type: {type: String, default: "Point"},
        coordinates: {type: [Number], index: "2dsphere"}
    },
}, {collection: 'capacidadOperativa'});

module.exports = {
    capacidadOperativa: model('capacidadOperativa', CapacidadOperativa),
}