'use strict';
const hapi = require('hapi');
const path = require('path');
const vision = require('vision');
const handlebars = require('handlebars');
const cookieAuth = require('hapi-auth-cookie');
const mongoose = require('mongoose');
const inert = require('inert');  

const routes = require('./routes/student');
const User = require('./models/studentSchema');

const server = hapi.server({
    host: 'localhost',
    port: Number(process.argv[2] || 3000),
});

mongoose.connect('mongodb://localhost:27017/studentdb', { useNewUrlParser: true }, (err) => {
    if (!err) { console.log('MongoDB Connection Succeeded.') }
    else { console.log(`Error in DB connection : ${err}`)}
});

const init = async () => {

    try {
        await server.register(require('hapi-auth-cookie'));
        await server.register(vision);
        await server.register(inert);
    

        server.auth.strategy('session', 'cookie', {

            cookie: {
                name: 'sid-example',
                password: 'password1should2beZ32Wcharacters',
                isSecure: false
            },

            redirectTo: '/login',
    
            validateFunc: async (request, session) => {
                const account = await User.find({ _id: session.id });
                console.log(`acdount: ${account}`);
    
                if (!account) {
                    // Must return { valid: false } for invalid cookies
                    return { valid: false };
                }
                return { valid: true, credentials: account };
            }
        });
    
        server.auth.default('session');
      
        server.views({
            engines: {
                html: handlebars
            },
            path: path.join(__dirname, 'views')

        });
        server.route(routes);
        await server.start();
    
        console.log(`Server started at: ${server.info.uri}`);
        } catch (err) {
            console.error(err.stack);
            process.exit(1);
        }
    };
    
init();

