
'use strict';
const bcrypt = require('bcrypt');
const saltRounds = 10;
const joi = require('joi');
const path = require('path');


const StudentModel = require('../models/studentSchema');

module.exports = [
    //public file routes
    {
        method: 'GET',
        path: '/public/{param*}',
        config : {
            auth : {
                strategy : 'session',
                mode     : 'optional'
            }
        },
        handler: {
            directory: {
                path: path.join(__dirname, '../public')
            }
        }
    },
    //home
    {
        method: 'GET',
        path: '/',
        options: {
            handler: (request, h) => {

                return h.view('home');
            }
        }
    },
    //login
    {
        method: 'GET',
        path: '/login',
        options: {
            auth: {
                mode: 'try'
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                }
            },
            handler: async (request, h) => {

                if (request.auth.isAuthenticated) {
                    return h.redirect('/');     
                }

                return h.view('home');
            }
        }
    },
    {
        method: 'POST',
        path: '/login',
        options: {
            auth: {
                mode: 'try'
            },
            handler: async (request, h) => {
                let message = 'Invalid username or password';

                const { username, password } = request.payload;
                if (!username || !password) {
                    return h.view('home', { message });
                }

                // Try to find user with given credentials
        
                let user = await StudentModel.findOne({
                  username
                });
               // console.log(user);
                let account = user && (await bcrypt.compareSync(password, user.password));

                if (!account) {
                    return h.view('home', { message });
                }

                request.cookieAuth.set({ id: account.id });

                let student = await StudentModel.find().exec();
                return h.view('welcome',{
                    student: student 
                });
            }
        }
    },
     //logout 
    { 
        method: 'GET', 
        path: '/logout', 
        config: { 
            handler: async (request, h) => {
                try {
                    request.cookieAuth.clear();
                    return h.view('home');

                } catch(err){
                    return h.response(err).code(500);
                }
            }
         }
    },
    //list page
    { 
        method: 'GET', 
        path: '/a',
         config: 
         {
            handler: async (request, h) => {
                    try {
                        let student = await StudentModel.find().exec();
                        return h.view('welcome',{
                            student: student 
                        });
                    } catch(err){
                        return h.response(err).code(500);
               }
           } 
        }
    }, 
    //student register page 
    { 
        method: 'GET', 
        path: '/register',
        config : {
            auth : {
                strategy : 'session',
                mode     : 'optional'
            }
        },
        handler: async (request, h) => {
            try {
                  return h.view('student');
            } catch(err){
                return h.response(err).code(500);
            }
        }
     }, 
     //add student
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
                }, 
            auth : {
                strategy : 'session',
                mode     : 'optional'
            },
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
     }
];