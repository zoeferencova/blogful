const path = require('path');
const express = require('express');
const xss = require('xss');
const UsersService = require('./users-service')

const usersRouter = express.Router();
const jsonParser = express.json();

const serializeUser = user => ({
    id: user.id,
    fullname: xss(user.fullname),
    username: xss(user.username),
    nickname: xss(user.nickame),
    date_created: user.date_created,
});

usersRouter 
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                res.json(users.map(serializeUser))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { fullname, username, nickname, password } = req.body;
        const newUser = { fullname, username };

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        newUser.nickname = nickname;
        newUser.password = password;

        UsersService.insertUser(
            req.app.get('db'),
            newUser
        )
            .then(user => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${user.id}`))
                    .json(serializeUser(user))
            })
            .catch(next)
    })
