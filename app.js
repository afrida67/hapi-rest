'use strict';

const hapi = require('hapi'); 
const path = require('path');
const vision = require('vision');
const handlebars = require('handlebars');
const mongoose = require('mongoose');
const auth = require('hapi-auth-basic');
const bcrypt = require('bcrypt');

const StudentModel = require('./models/studentSchema');
const routes = require('./routes/student');

//coonnect to db
mongoose.connect('mongodb://localhost:27017/studentdb', { useNewUrlParser: true }, (err) => {
    if (!err) { console.log('MongoDB Connection Succeeded.') }
    else { console.log(`Error in DB connection : ${err}`)}
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
    port: Number(process.argv[2] || 3002)
});

const init = async () => {

try {

    server.route(routes);
    await server.register(auth);
    await server.register(vision);

    server.auth.strategy('simple', 'basic', {validate});
    server.auth.default('simple');

    server.views({
        engines: {
            html: handlebars
        },
        path: path.join(__dirname, 'views')
    });

    await server.start();
    console.log('Server running at:', server.info.uri);
    } catch (err) {
        console.log(err);
    }
};

init();