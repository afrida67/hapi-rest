
'use strict';
const bcrypt = require('bcrypt');
const saltRounds = 10;
const joi = require('joi');
const internals = {
    uuid: 1             // Use seq instead of proper unique identifiers for demo only
};

const StudentModel = require('../models/studentSchema');

module.exports = [
    { 
        method: ['GET', 'POST'],
        path: '/login', 
        config: {
          handler: async (request, h) => {

                try {
                    if (request.auth.isAuthenticated) {
                        return h.redirect('/');
                    }
        
                    let message = 'Invalid username or password';
                    let account = null;
                
                    if (request.method === 'post') {
        
                            const username = request.payload.username;
                            const password = request.payload.password;
                            const users = await StudentModel.findOne({ username }).exec(); 
        
                            if(!users) {
                                return h.view('home', { message });
                            }
        
                            const isValid = await bcrypt.compareSync(password, users.password);
        
                           if (users && !isValid) {
                                return h.view('home', { message });
                            }
                            
                            console.log(`users:  ${users.username}`);
                 
                    }
                    if (request.method === 'get'){
                            return h.view('home');
                    }
                
                    const sid = String(++internals.uuid);
                
                    await request.server.app.cache.set(sid, { account }, 0);
                    request.cookieAuth.set({ sid });
                    return h.redirect('/');

                } catch(err){
                    return h.response(err).code(500);
                }
          },
           auth: { 
               mode: 'try'
             }, 
             plugins: { 
                 'hapi-auth-cookie':{ redirectTo: false }
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
                    request.server.app.cache.drop(request.state['sid-example'].sid);
                    request.cookieAuth.clear();
                    return h.redirect('/');

                } catch(err){
                    return h.response(err).code(500);
                }
            }
         }
    },
    //list page
    { 
        method: 'GET', 
        path: '/',
         config: 
         {
            handler: async (request, h) => {
              //  let name = request.auth.credentials.username;
              //  return h.view('welcome', {name}); 
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

                let user = new StudentModel(request.payload); //req body on hapi
                let result = await user.save();
                return h.response(result);
          } catch(err){
              return h.response(err).code(500);
          }
        }
     }
];