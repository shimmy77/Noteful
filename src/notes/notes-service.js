const NotesService = {
    getAllNotes(knex) {
        return knex.select('*').from('noteful_notes')
    },
    insertFolder(knex, newNote) {
        return knex
            .insert(newNote)
            .into('noteful_notes')
            .returning('*')
            .then(rows => {
                return rows [0]
            })
    },
    getById(knex, id) {
        return knex
            .from('noteful_notes')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteFolder(knex, id) {
        return knex('noteful_notes')
            .where({ id })
            .delete()
    },
    updateUser(knex, id, newNoteFields) {
        return knex('noteful_notes')
            .where({ id })
            .update(newNoteFields)
    },
}

module.exports = NotesService