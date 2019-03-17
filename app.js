'use strict';
const hapi = require('hapi');
const path = require('path');
const vision = require('vision');
const handlebars = require('handlebars');
const cookieAuth = require('hapi-auth-cookie');
const mongoose = require('mongoose');
const inert = require('inert');  

const routes = require('./routes/student');

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
        await server.register(cookieAuth);
        await server.register(vision);
        await server.register(inert);
    
        const cache = server.cache({ segment: 'sessions', expiresIn: 3 * 24 * 60 * 60 * 1000 });
        server.app.cache = cache;
    
        server.auth.strategy('session', 'cookie', {
            password: 'password-should-be-32-characters',
            cookie: 'sid-example',
            redirectTo: '/login',
            isSecure: false,
            validateFunc: async (request, session) => {
    
                const cached = await cache.get(session.sid);
                const out = {
                    valid: !!cached
                };
    
                if (out.valid) {
                    out.credentials = cached.account;
                }
    
                return out;
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

