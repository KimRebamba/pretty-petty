async function findRecord(Model, id, options = {}) {
    return Model.findByPk(id, { ...options, paranoid: false });
}

module.exports = { findRecord };
