const express = require('express')
const path = require('path')
const xss = require('xss')
const FoldersService = require('./folders-services')

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
    
})

foldersRouter
    .route('/')
    .get ((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersService.getAllFolders(knexInstance)
        .then(folders => {
            res.json(folders)
        })
        .catch(next)
    })

    .post(jsonParser, (req, res, next) => {
        const { name } = req.body
        const newFolder = { name }

        if(newFolder.name == null) {
            return res.status(400).json({
                error: { message: `Missing a name`}
            })
        }
        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
        .then(folder => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                .json(serializeFolder(folder))
        })
        .catch(next)
    })

    foldersRouter
        .route('/:folder_id')
        .all((req, res, next) => {
            FoldersService.getFolderById (
                req.app.get('db'),
                req.params.folder_id
            )
            .then(folder => {
                if(!folder) {
                    return res.status(404).json({
                        error: { message: `Folder does not exist`}
                    })
                }
                req.folder = folder
                next()
            })
            .catch(next)
        })
        .get((req, res, next) => {
            res.json(res.folder)
        })
        .delete((req, res, next) => {
            FoldersService.deleteFolder (
                req.app.get('db'),
                req.params.folder_id
            )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
        })

        module.exports = foldersRouter