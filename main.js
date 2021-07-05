const back = require('androidjs').back;
const fetch = require('node-fetch');
const fs = require("fs");
back.on("input", async function (gebruikersnaam, wachtwoord, cijferInput1, weging1, vak1, leerjaar1, schoolInput, path) {
    
    var cijferInput = parseFloat(cijferInput1);
    var weging = parseFloat(weging1);
    var leerjaar = parseFloat(leerjaar1);
    if (schoolInput == undefined || schoolInput == "" || schoolInput == null ) {
        back.send("error", "Invalid School")
        return
    }
    if (gebruikersnaam == undefined || wachtwoord == undefined || gebruikersnaam == null || wachtwoord == null || gebruikersnaam == "" || wachtwoord == "") {
        back.send("error", "Invalid Username or Password")
        return

    }
    async function scool() {
        const schhool = await fetch('https://servers.somtoday.nl/organisaties.json', {
            method: 'GET', headers: {
                "accept": "application/json", "Content-Type": "application/json"
            }
        });
        var json = await (schhool.json())

        var results = [];
        var objects = json[0].instellingen
        var toSearch = schoolInput;

        for (var i = 0; i < objects.length; i++) {
            for (key in objects[i]) {
                if (objects[i][key].indexOf(toSearch) != -1) {
                    results.push(objects[i]);
                }
            }
        }
        return (results)
    }
    var school = await scool()
    console.log(school)
    back.send("school", school[0].naam)
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', school[0].uuid + '\\' + gebruikersnaam);
    params.append('password', wachtwoord);
    params.append('scope', 'openid');
    params.append('client_id', 'D50E0C06-32D1-4B41-A137-A9A850C892C2');

    async function cijfer() {
        const response = await fetch('https://somtoday.nl/oauth2/token', {
            method: 'POST', body: params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const school1 = await response.json();
        if (school1.error == "invalid_grant") {
            return 403;
        }
        const leerlingen = await fetch(school1.somtoday_api_url + '/rest/v1/leerlingen/',
            { method: 'GET', headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${school1.access_token}`, } }
        );
        const leerling1 = await leerlingen.text();

        var school = await JSON.parse(leerling1);


        var id = school.items[0].links[0].id;
        var url = school1.somtoday_api_url + '/rest/v1/resultaten/huidigVoorLeerling/' + id
        const leerlingen1 = await fetch(url, { method: 'GET', headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${school1.access_token}`, "Range": "items=" + 0 + "-" + 99, additional: "cijferkolomId" } });
        var cijfers1 = await leerlingen1.text();
        var cijfers0_99 = await JSON.parse(cijfers1);

        const leerlingen2 = await fetch(url, { method: 'GET', headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${school1.access_token}`, "Range": "items=" + 100 + "-" + 199, additional: "cijferkolomId" } });
        var cijfers2 = await leerlingen2.text();
        var cijfers100_199 = await JSON.parse(cijfers2);

        const leerlingen3 = await fetch(url, { method: 'GET', headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${school1.access_token}`, "Range": "items=" + 200 + "-" + 299, additional: "cijferkolomId" } });
        var cijfers3 = await leerlingen3.text();
        var cijfers200_299 = await JSON.parse(cijfers3);

        const leerlingen4 = await fetch(url, { method: 'GET', headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": `Bearer ${school1.access_token}`, "Range": "items=" + 300 + "-" + 399, additional: "cijferkolomId" } });
        var cijfers4 = await leerlingen4.text();
        var cijfers300_399 = await JSON.parse(cijfers4);

        var object = Object.assign(cijfers0_99.items, cijfers100_199.items, cijfers200_299.items, cijfers300_399.items);
        var array = object;
        
        bruikbareCijfers = [];
        if (leerjaar1 != parseInt(leerjaar1, 10)) {
            return 402
        }
        array.forEach(async (cijfer) => {







            if (cijfer.resultaat == undefined || cijfer.weging == undefined) {
                return
            }
            else if (cijfer.leerjaar != leerjaar) {
                console.log("------\n")
                console.log(cijfer.periode)
                console.log(cijfer.vak.afkorting)
                console.log(cijfer.resultaat)
                console.log(cijfer.weging)
                console.log(cijfer.leerjaar)
                console.log("------\n")

            }
            else if (cijfer.resultaat != undefined || cijfer.weging != undefined) {
                await bruikbareCijfers.push(cijfer)

            };



        });



        function sorted(a, b) {
            if (a.vak.afkorting < b.vak.afkorting) {
                return -1
            }
            if (a.vak.afkorting > b.vak.afkorting) {
                return 1

            }
            if (a.vak.afkorting == b.vak.afkorting) {
                if (a.volgnummer < b.volgnummer) {
                    return -1;

                }
                if (a.volgnummer > b.volgnummer) {
                    return 1;

                }
                return 0



            }

        };
        
        await bruikbareCijfers.sort(sorted);
        return bruikbareCijfers;

    };
    const cijfers = await cijfer();
    console.log(cijfers.length)
    if (cijfers == 403) {
        back.send("error", "Invalid Username or Password");
    }
    if (cijfers == 402) {
        back.send("error", "Invalid Leerjaar");

    }
    var vakken = [];

    for (i = 0; i < cijfers.length; i++) {
        if (cijfers[i].vak.afkorting != "in") {
            eval("var " + cijfers[i].vak.afkorting + " = [];");
            vakken.push(cijfers[i].vak.afkorting)
        }

        else {
            eval("var informatica = [];");
            vakken.push("informatica")

        }
    }

    cijfers.forEach(cijfer => {

        if (cijfer.vak.afkorting != "in") {
            eval(cijfer.vak.afkorting).push({ "resultaat": cijfer.resultaat, "weging": cijfer.weging })
        }
        else {
            eval("informatica").push({ "resultaat": cijfer.resultaat, "weging": cijfer.weging })

        }


    })

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    // usage example:

    var unique = vakken.filter(onlyUnique);



    
    console.log(unique);
    async function bereken() {
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toLowerCase() + string.slice(1);
        }
        var vak2 = await capitalizeFirstLetter(vak1)
        try {
            if (vak2 != "in") {

                var vak = eval(vak2)

            }
            else {

                var vak = eval("informatica")



            }
        } catch (e) {
            back.send("error", "Invalid vak")
        }
        
        console.log(vak)
        if (vak == undefined) {
            back.send("error", "Invalid vak")
            return
        }
        var inputCijfer = cijferInput;
        var inputWeging = weging
        var totaalBehaald = 0;
        var wegingTotaal = 0;
        for (i = 0; i < vak.length; i++) {

            totaalBehaald = totaalBehaald + (parseFloat((vak[i].resultaat)) * parseFloat((vak[i].weging)))
            wegingTotaal = wegingTotaal + vak[i].weging

        }

        var wegingInclusiefInput = inputWeging + wegingTotaal
        var totaalWillenHalen = inputCijfer * wegingInclusiefInput
        
        var cijferTeBehalen = (totaalWillenHalen - totaalBehaald) / inputWeging
        console.log(cijferTeBehalen)
        back.send("output", Math.ceil(cijferTeBehalen * 10) / 10);
    }
    await bereken();

    console.log(path)
    const data = (gebruikersnaam + "\n" + wachtwoord + "\n" + leerjaar + "\n" + school[0].naam)
    fs.writeFile(path + 'UserData.txt', data, function (err) {
        if (err) {
            console.warn(err)
        }
        console.log('Saved!');
    });

});
back.on("delete", async function (path) {
    

    fs.unlink(path + "UserData.txt", (err) => {
        if (err) {
            console.error(err)
            
        }
        console.log("file removed")
        //file removed
        back.send("deleted")
    })


})
back.on("load", async function (path) {

    
    fs.readFile(path + 'UserData.txt', 'utf8', (err, data) => {
        if (err) {
            console.error(err)
        }
        back.send("boot up", data)
    })

})