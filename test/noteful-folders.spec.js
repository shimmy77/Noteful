const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { createFoldersArray } = require('./folders.fixtures')

describe('Noteful Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })
    
    after('disconnect from db', () => db.destory())

    before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes, RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    describe(`Folder Endpoints`, () => {
        describe(`GET /api/folders`, () => {
            context(`Given no folders`, () => {
                it(`responds with 200 and an empty list`, () => {
                    return supertest(app)
                        .get('/api/folders')
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(200, [])
                })
            })

            context('Given there are folders in the database', () => {
                const testFolders = createFoldersArray();

                beforeEach('insert folders', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                })

                it('responds with 200 and all of the folders', () => {
                    return supertest(app)
                        .get('/api/folders')
                        .expect(200, testFolders)
                })
            })
            context(`Given an XSS attack folder`, () => {
                const testFolders = createFoldersArray();
                const { maliciousFolder, expectedFolder } = createMaliciousFolder()

                this.beforeEach('insert malicious folder', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                        .then(() => {
                            return db
                                .into('noteful_folders')
                                .insert([ maliciousFolder ])
                        })
                })
            })
            
        })
        describe(`GET /api/folders/:folder_id`, () => {
            context(`Given no folders`, () => {
                it(`responds with 404`, () => {
                    const folderId = 123456
                    return supertest(app)
                        .get(`/api/folders/${folderId}`)
                        .expect(404, { error: { message: `Folder does not exist`}})
                })
            })
            context(`Given there are folders in the database`, () => {
                const testFolders = createFoldersArray()
                
                beforeEach('insert folders', () => {
                    return db
                        .into('noteful_folders')
                        .insert(testFolders)
                })
                it(`GET /api/folders/:folder_id responds with 200 and with request folder`, () => {
                    const folderId = 2
                    const expectedFolder = testFolders[folderId -1]
                    return supertest(app)
                        .get(`/api/folders/${folderId}`)
                        .expect(200, expectedFolder)
                })
            })
        })
        describe(`POST /api/folders`, () => {
            it(`creates a folder, responding with 201 and the new folder`, function() {
                const newFolder = {
                    name: 'New Folder'
                }
                return supertest(app)
                    .post('/api/folders')
                    .send(newFolder)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.name).to.eql(newFolder.name)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/foldres/${res.body.id}`)
                    })
                    .then(postRes =>
                        supertest(app)
                            .get(`/api/folders/${postRes.body.id}`)
                            .expect(postRes.body)
                            )
                
            })
        })
        describe(`DELETE /api/folders/:folder_id`, () => {
            context(`Given no folders`, () => {
                it(`responds with 404`, () => {
                    const folderId = 123456
                    return supertest(app)
                        .delete(`/api/folders${folderId}`)
                        .expect(404, { error: { message: `Folder does not exist`}})
                })
            })
            context(`Given there are folders in the database`, () => {
                it(`deletes a folder and removes the folder`, () => {
                    const testFolders = createFoldersArray();
                    this.beforeEach('insert folder', () => {
                        return db
                            .into('noteful_folders')
                            .insert(testFolders)
                    })
                    it('responds with 204 and removes the folder', () => {
                        const deleteId = 2
                        const expectedFolder = testFolders.filter(folder => folder.id !== deleteId)
                        return supertest(app)
                            .delete(`/api/folders/${deleteId}`)
                            .expect(204)
                            .then(res => 
                                supertest(app)
                                    .get(`/api/folders`)
                                    .expect(expectedFolder)
                                    )
                    })
                })
            })
        })
    })
    describe(`Note Endpoints`, () => {
        describe(`GET /api/notes`)
    })


})