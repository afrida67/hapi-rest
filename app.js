'use strict';

const hapi = require('hapi'); 
const path = require('path');
const vision = require('vision');
const handlebars = require('handlebars');
const mongoose = require('mongoose');
const joi = require('joi');
const auth = require('hapi-auth-basic');
const bcrypt = require('bcrypt');
const saltRounds = 10;

//coonnect to db
mongoose.connect('mongodb://localhost:27017/studentdb', { useNewUrlParser: true }, (err) => {
    if (!err) { console.log('MongoDB Connection Succeeded.') }
    else { console.log(`Error in DB connection : ${err}`)}
});

// student model
const StudentModel = mongoose.model('Student', {
    username: String,
    name: String,
    email: String,
    password: String
});

//user authentication
const validate = async (request, username, password, h) => {

    const user = await StudentModel.findOne({ username }).exec(); 
    if(!user) return { isValid: false };

    const isValid = await bcrypt.compareSync(password, user.password);
    const credentials = { name: user.name };
 
    return { isValid, credentials };
};

const server = hapi.server({
    host: 'localhost',
    port: Number(process.argv[2] || 3000)
});

const init = async () => {

try {
    await server.register(auth);
    server.auth.strategy('simple', 'basic', {validate});
    server.auth.default('simple');
    
    server.route({
        method: 'GET',
        path: '/',
        handler: async (request, h) => {
            try {
                return h.view('index');
            } catch (err) {
                return h.response(err).code(500);
            }
        }
    });

    await server.register(vision);

    server.views({
        engines: {
            html: handlebars
        },
        path: path.join(__dirname, 'views')
    });

    //home route
    server.route({
        method: 'GET',
        path: '/logged',
        handler: {
            view: 'index.html'
        }
    });
    // add student
    server.route({
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
    });

    //list
    server.route({
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
    });

    //logout
    server.route({
        method: 'GET',
        path: '/logout',
        handler: async (request, h) => {
            try {
                return h.view('test');
            } catch (error) {
                return h.response(error).code(500);
            }
        }
    });

    await server.start();
    console.log('Server running at:', server.info.uri);
    } catch (err) {
        console.log(err);
    }
};

init();