const hapi = require('hapi'); 
const path = require('path');
const vision = require('vision');
const handlebars = require('handlebars');
const mongoose = require('mongoose');
const joi = require('joi');
const auth = require('hapi-auth-basic');

//user authentication

const user = {
    name: 'aesha',
    password: '1234'
};

const validate = async (request, username, password, h) => {
    let isValid = username === user.name && password === user.password;

    return { isValid: isValid, credentials: {name: user.name} };
};

mongoose.connect('mongodb://localhost:27017/studentdb', { useNewUrlParser: true }, (err) => {
    if (!err) { console.log('MongoDB Connection Succeeded.') }
    else { console.log(`Error in DB connection : ${err}`)}
});

// student model
const StudentModel = mongoose.model('Student', {
    username: String,
    name: String,
    email: String
});

const server = hapi.server({
    host: 'localhost',
    port: Number(process.argv[2] || 3000)
});

const init = async () => {

    await server.register(auth);
    server.auth.strategy('simple', 'basic', {validate });
    server.auth.default('simple');
    
    server.route({
        method: 'GET',
        path: '/',
        handler: async (request, h) => {
            return h.view('index');
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
                    email: joi.string().email({ minDomainAtoms: 2 })
                },
                failAction: (request, h, err) => {
                    return err.isJoi ? h.response(err.details[0]).takeover() : h.response(err).takeover();
                }
            }
        },
        handler: async (request, h) => {
            try {
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
        path: '/list',
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

    await server.start();
    console.log('Server running at:', server.info.uri);
}

init();