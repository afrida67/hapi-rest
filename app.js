const hapi = require('hapi');
const mysql = require('mysql');

const server = hapi.server({
    host: 'localhost',
    port: Number(process.argv[2] || 3000)
});

//config db
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "sys"
});

connection.connect();

server.route({
    path: '/hello',
    method: 'GET',
    handler: (request, h) => {
        return 'Hello hapi';
    }
});

server.route({
    path: '/students',
    method: 'GET',
    handler: function(request, h) {

        connection.query('Select * from students', function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            h(results);
        });
    }
});

const init = async () => {

    await server.start();
    console.log('Server running at:', server.info.uri);

}

init();