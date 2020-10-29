const {Schema,model} = require('mongoose');

const IIO = new Schema({
    id: {type: Number},
    area: {type: String},
    descriptiontxt: {type: String},
    createtime: {type: Date},
    disposetime: {type: Date},
    tematica: {type: String},
    subcategory: {type: String},
    category: {type: String},
    regionid: {type: String},
    name: {type: String},
    username: {type: String},
    nickname: {type: String},
    zodi_name: {type: String},
    adi_name: {type: String},
    parrish_name: {type: String},
    priorizado: {type: Boolean, default: false},
    confirmado: {type: Boolean, default: false},
    aprobado: {type: Boolean, default: false},
    allowtime: {type: Date},
    editmode: {type: Boolean, default: false},
    isimage: {type: Boolean, default: false}
}, {collection: 'iio'});

module.exports = {
    IIO: model('iio', IIO),
}