const Discord = require('discord.js');
const client = new Discord.Client();
const sqlite = require('sqlite3').verbose();
const prefix = "!";
const app = require('express')();
const db = new sqlite.Database("./licenses.sqlite");
const bodyParser = require('body-parser');
const config = require('./configuration/config.json');
var obj = {
  "arr": []
};

setInterval(function(){
 obj.arr = [];
}, 70000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(config.serverPORT);
app.get('/verification', function(req, res){
    if (!req.query.token) return res.json({err: true, msg: "TOKEN no especificado"});
    else {
        db.get(`SELECT * FROM licenses WHERE token = '${req.query.token}'`, (err, filas) => {
        if (err) return res.json({err: true, msg: "Ha ocurrido un error, intenta más tarde."});
        else if (obj.arr.includes(req.query.token)) return res.json({err: true, msg: "Ya hay alguien conectado al servidor con ese TOKEN."});
        else if (!filas) return res.json({err: true, msg: "Ese TOKEN no existe."}); 
        else {
          res.json({err: false, msg: "Se ha verificado correctamente."});
          obj.arr.push(req.query.token);
        };
        });
    };
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  db.run("CREATE TABLE IF NOT EXISTS licenses (token TEXT, creationDate TEXT, createdBy TEXT)", function(err) {
    if (err) return console.log(err);
});
});

client.on('message', message => {
var args = message.content.slice(prefix.length).trim().split(/ +/g);
const command = args.shift().toLowerCase();

if (command == "add") {
args = args.slice(0).join();
if (!args) return message.channel.send("Formato: `!add <TOKEN>`");
db.get(`SELECT * FROM licenses WHERE token = '${args}'`, (err, filas) => {
    if (err) return message.channel.send("Ha ocurrido un error.");
    if (filas) return message.channel.send("Ese TOKEN ya existe.");
    db.run(`INSERT INTO licenses(token, creationDate, createdBy) VALUES('${args}', '${new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear()}', '${message.author.id}')`, function(err) {
        if (err) return message.channel.send("Ha ocurrido un error.");
        var embed = new Discord.MessageEmbed();
        embed.setTitle("CREATED TOKEN");
        embed.addField("TOKEN KEY", args);
        embed.addField("CREATION DATE", new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear());
        embed.addField("CREATED BY", message.author);
        message.channel.send(embed);
    });
});
};

if (command == "list") {
    db.all(`SELECT * FROM licenses`, async function(err, filas) {
        if (err) return message.channel.send("Ha ocurrido un error.");
        if (!filas.length) return message.channel.send("No hay TOKENS en la base de datos.");
        var arr = [];
        var i = 0;
    for await(var key of filas) {
    arr.push(["**#" + parseInt(i+1) + "** " + key.token + " | " + key.creationDate + " | <@!" + key.createdBy + ">"]);
    i+=1;
    };
    var embed = new Discord.MessageEmbed();
    embed.setTitle("TOKENS LIST")
    embed.setDescription(arr.join("\n"));
    message.channel.send(embed);
    });
};

if (command == "check") {
    args = args.slice(0).join();
    if (!args) return message.channel.send("Formato: `!check <TOKEN>`");
    db.get(`SELECT * FROM licenses WHERE token = '${args}'`, (err, filas) => {
        if (err) return message.channel.send("Ha ocurrido un error.");
        if (!filas) return message.channel.send("Ese TOKEN no existe.");
            var embed = new Discord.MessageEmbed();
            embed.setTitle("TOKEN INFORMATION");
            embed.addField("TOKEN KEY", args);
            embed.addField("CREATION DATE", filas.creationDate);
            embed.addField("CREATED BY", "<@!" + filas.createdBy + ">");
            message.channel.send(embed);
    });
    };

if (command == "remove") {
    args = args.slice(0).join();
    if (!args) return message.channel.send("Formato: `!delete <TOKEN>`");
    db.get(`SELECT * FROM licenses WHERE token = '${args}'`, (err, filas) => {
        if (err) return message.channel.send("Ha ocurrido un error.");
        if (!filas) return message.channel.send("Ese TOKEN no existe.");
        db.run(`DELETE FROM licenses WHERE token = '${args}'`, function(err) {
            if (err) return message.channel.send("Ha ocurrido un error.");
            var embed = new Discord.MessageEmbed();
            embed.setTitle("DELETED TOKEN");
            embed.addField("TOKEN KEY", args);
            embed.addField("DELETION DATE", new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear());
            embed.addField("DELETED BY", message.author);
            message.channel.send(embed);
        });
    });
};
});
client.login(config.TOKEN);