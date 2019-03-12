const StudentModel = require('../models/studentSchema');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const joi = require('joi');

module.exports = [
    {
        method: 'GET',
        path: '/',
        handler: async (request, h) => {
            try {
                return h.view('index');
            } catch (err) {
                return h.response(err).code(500);
            }
        }
    },
    {
        method: 'POST',
        path: '/student',
        options: {
            validate: {
                payload: {
                    username: joi.string().alphanum().min(3).max(7).required(),
                    name: joi.string().required(),
                    email: joi.string().email({ minDomainAtoms: 2 }),
                    password: joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
                },
                failAction: (request, h, err) => {
                    return err.isJoi ? h.response(err.details[0]).takeover() : h.response(err).takeover();
                }
            }
        },
        handler: async (request, h) => {
            try {
                  let salt = bcrypt.genSaltSync(saltRounds);
                  request.payload.password = bcrypt.hashSync(request.payload.password, salt);

                  let student = new StudentModel(request.payload); //req body on hapi
                  let result = await student.save();
                  return h.response(result);
            } catch(err){
                return h.response(err).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/stuList',
        handler: async (request, h) => {
            try {
                let student = await StudentModel.find().exec();
                return h.view('list',{
                    student: student 
                });
            } catch (error) {
                return h.response(error).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/logout',
        handler: async (request, h) => {
            try {
                return h.view('test');
            } catch (error) {
                return h.response(error).code(500);
            }
        }
    }
];

