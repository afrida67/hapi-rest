const hapi = require('hapi'); 
const path = require('path');
const vision = require('vision');
const handlebars = require('handlebars');
const mongoose = require('mongoose');
const joi = require('joi');

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

    await server.register(vision);

    server.views({
        engines: {
            html: handlebars
        },
        path: path.join(__dirname, 'views')
    });

    //home route
    server.route({
        path: '/',
        method: 'GET',
        handler: {
            view: 'index.html'
        }
    });
    // add student
    server.route({
        path: '/student',
        method: 'POST',
        handler: async (req, h) => {
            try {
                let student = new StudentModel(req.payload); //req body on hapi
                let result = await student.save();
                return h.response(result);
            } catch(err){
                return h.response(err).code(500);
            }
        }
    });

    await server.start();
    console.log('Server running at:', server.info.uri);
}

init();