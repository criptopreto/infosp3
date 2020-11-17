const {Schema,model} = require('mongoose');

const LOG = new Schema({
    id: {type: Number},
    descripcion: {type: String},
    usuario: {type: String},
    creado_en: {type: Date, default: Date.now}
}, {collection: 'log'});

module.exports = {
    LOG: model('log', LOG),
}