import m from "/vendor/mithril.js"; // https://mithril.js.org/
import b from "/vendor/bss.js"; // https://github.com/porsager/bss
import merge from "/vendor/mergerino.js"; // https://github.com/fuzetsu/mergerino


const { stringify, parse } = JSON; // comfort 
// initial declarations
var trails = []
var trailcontent = {}
let instaledtrails = {}
let promptEvent
let qrScanner
let trail;
let state;

// speicher update (runtime and persistent)
let update = (patch) => {
    let newState = merge(state, patch);
    localStorage.setItem(trail.trailid, stringify(newState));
    state = newState;
    m.redraw()   // mithril zwingen die seite neu zu zeichnen sollte helfen den state dump aktuell zu halten 
}





// Trail Renderer
const Trail = {
    oninit: async ({ attrs }) => { // attrs wird aus route parametern kreiert
        trail = await m.request({ url: "/api.php", params: { id: attrs.trailid } }) // trail laden
        try {
             if(parse(localStorage.getItem(trail.trailid)) == null){ // speicherstand aus Localstore lesen oder startzustand anwenden
                localStorage.setItem(trail.trailid, stringify(trail.initialState))
            }
            state = parse(localStorage.getItem(trail.trailid))
        } catch (e) { // solte nicht nötig sein trau mich jetzt aber nicht das zu entfernen
            state = trail.initialState;
			localStorage.setItem(trail.trailid, stringify(trail.initialState))
        }
    },
    view: ({ attrs }) => {
        return trail ? m(
            "div",
            m(
                "button" + b`float right`,
                { onclick: () => { // speicherstand zurücksetzen 
                    state = trail.initialState
                    localStorage.setItem(trail.trailid, stringify(trail.initialState))
                }},
                "reset"
            ),
            m("h1", trail.title),
            m("button", {onclick : ()=>{m.route.set('/') }}, "Home") // home button
            ,
            state?.board?.map((quest) => m(Quest, { attrs, quest })), // sub render der einzelnen Posten
            m("hr"),
            "State",
            dump(state)
        ) : 'loading ...' // loading ... falls 
    }
};

const Index = { // main page renderer
    oninit: async () => {
        window.addEventListener('beforeinstallprompt', function (e) { // event für das instalieren der PWA abfangen
            e.preventDefault();
            promptEvent = e;
        });
        await m.request({ url: "/api.php", method: "GET" }).then( (response) => (trails = response)).catch((e) => { // liste der trails laden 
            
            let instaled_trails = parse(localStorage.getItem("instaledtrails"))
            trails = [] // um stacking zu verhinder wenn man offline zur main page zurückkehrt
            for (let trailname in instaled_trails) {
                if (instaled_trails[trailname]) trails.push(trailname)
            }
        })
        
        for (let _trail of trails) { // trails laden um meta info zu extrahieren antwort vom server oder vom worker
            trailcontent[_trail] = await m.request({ url: "/api.php", params: { id: _trail } })
        }
    },

    view: () => {
        let localtrails = trailcontent
        let instaledtrails = parse(localStorage.getItem("instaledtrails"))

        return m("div", "Übersicht",
        //instalknopf
        m("button", {onclick : ()=>{
            try {
            promptEvent.prompt();  // gespeichertes installevent abspiellen
            }
            catch (error){
                // das ding funktioniert erst nachdem die seite ein 2. mahl geöffnet wurde um zu verhindern das webseiten nutzer mit popups belästigen
                alert("Failled to instal\nThis is most likely due to how the browser tries to protect users from anoying popups. Reopening the page in 5 to 10 min and pressing this button again should yield better results.")
                console.log(error)
            }
        }},"instal"),


            m(
                "ol",
                trails.map((_trail) => {
                    return [m(
                        m.route.Link, // leitet zu den seiten der spezifischen trails weiter
                        {
                            href: `/trail/`,
                            selector: "li",
                            params: { date: Date.now(), trailid: _trail },
                        },
                        localtrails[_trail]?.title ?? ""
                    ),

                    m("div", localtrails[_trail]?.lastedit),
                    m("button",{onclick: () =>  { // install / deinstall Knopf

                        if(instaledtrails?.[_trail]){
                            // sendet nachricht zum serviceWorker und editiert die liste der instalierten trails
                            navigator.serviceWorker.controller.postMessage({
                                type: "dodelete", trail : _trail
                              });
                              instaledtrails = parse(localStorage.getItem("instaledtrails")) ?? {}
                              instaledtrails[_trail] = false
                              localStorage.setItem("instaledtrails", stringify(instaledtrails))
                            }
                        else{
                        instaledtrails = parse(localStorage.getItem("instaledtrails")) ?? {}
                        instaledtrails[_trail] = true
                        localStorage.setItem("instaledtrails", stringify(instaledtrails))
                        navigator.serviceWorker.controller.postMessage({
                            type: "doinstal", trail : _trail
                          });
                        }
                    }},instaledtrails?.[_trail] ? "delete" : "instal")
                ]    
                })
            ),
        )
    }
};


// Quest Container Komponente
const Quest = {
    view: ({ attrs }) => {
        // parameter restruckturieren
        const id = attrs.quest;
        const trailid = attrs.attrs.trailid
        const { title, type } = trail.quests[id];
        return m(// box + title 
            "div" + b`border 1px solid silver; m 1ex; p 1ex`,
            `Quest ${id}: ${title}`,
            m("hr"),
            m(registery[type], { trailid, id, ...trail.quests[id] }) // typspezifischer render aufruffen
        );
    },
};


// container für typspezifische Rnderer 
const registery = {};

registery["intro"] = {
    view: ({ attrs }) => {
        return m(
            "div",
            attrs.content,
            m(
                "button",
                { onclick: () => { attrs.onsubmit.forEach((x) => execute(x)) } },
                "Trail Starten"
            )
        )
    }
};

registery["qrscan"] = {
    oninit: ({attrs}) => {
        import('/vendor/qr-scanner.min.js').then((module) => { 
            const QrScanner = module.default;
            qrScanner = new QrScanner(
                vidbox,
                result => {
                    console.log('decoded qr code:', result)
                    qrScanner.stop()
                    for (let adress of attrs.addresses){
                        execute({ // Befehle können auch so verwendet werden anstat nur fordefiniert
                            resource: "keys",
                            subject: adress,
                            verb: "set",
                            object: result.data
                        })
                    }
                },
                {}, // parameter der scanlibrary 
            );
        });
    },  
    view: ({ attrs }) => {
        return m(
            "div",
            m(
                "video",{disabled: state?.quests?.[attrs.id]?.disabled ,id : "vidbox"}
            ),
            m(
                "button",
                { disabled: state?.quests?.[attrs.id]?.disabled ,
                    onclick: () => {
                    qrScanner.start();
                } },
                "scan"
            )
        )
    }
};


registery["output"] = {
    view: ({ attrs }) => {
        return m(
            "div"+ b`border 1px solid silver; m 1ex; p 1ex`,
            `${attrs.content}: ${state.keys[attrs.address]}`,
        )
    }
};


registery["text"] = {
    view: ({ attrs }) => m("div", attrs.content),
};

registery["multipleChoice"] = {
    view: ({ attrs }) =>
        m(
            "div" + b`d flex; fd column`,
            attrs.stem, `   Tries : ${state.quests?.[attrs.id]?.tries ?? 0}`,
            Object.entries(attrs.options).map(([name, opt]) =>
                m(
                    "label",
                    m("input", {
                        type: "radio",
                        disabled: state?.quests?.[attrs.id]?.disabled,
                        checked: state?.quests?.[attrs.id]?.selected === name,
                        onclick: () => {
                            update({
                                    quests: { [attrs.id]: { selected: name } },
                                }
                            )
                        },
                    }),
                    opt.content
                )
            ),
            !state?.quests?.[attrs.id]?.disabled &&
            m(
                "button",
                {
                    disabled: !state?.quests?.[attrs.id]?.selected,
                    onclick: () => {
                        const selected = state.quests[attrs.id].selected;
                        // anzahl versuche erhöhen
                        update({
                                quests: { [attrs.id]: { tries: (x) => typeof x == "number" ? x + 1 : 1 } },
                        })
                        attrs.options[selected].onsubmit.forEach((x) => execute(x));
                        if (attrs?.ontry?.[state?.quests?.[attrs.id]?.tries] != undefined) {
                            attrs?.ontry?.[state?.quests?.[attrs.id]?.tries].forEach(execute)
                        }
                    },
                },
                "Prüfen"
            )
        ),
};

// befehl ausführen 
const execute = (cmd) => {
    if (cmd.resource === "board") {
        // posten hinzufügen oder entfernen
        const { subject, verb } = cmd;
        if (verb == "add" && !state.board.includes(subject)) {
            update({ board: (list) => [...list, subject] } );
        } else if (verb == "remove") {
            update({ board: (list) => list.filter((x) => x != subject) } );
        }
    }
    if (cmd.resource === "quests") {
        // posten aktivieren oder deaktivieren
        const { subject, verb } = cmd;
        if (verb == "disable") {
            update({ quests: { [subject]: { disabled: true } } } );
        }
        if (verb == "enable") {
            update({ quests: { [subject]: { disabled: false } } } );
        }
    }
    if (cmd.resource === "keys") {
        // posten unspezifische variabeln umschreiben
        var oldState = state
        const { subject, verb, object } = cmd;
        if (verb == "set") {
            update({ keys: { [subject]: object } } )
        }
        if (stringify(oldState) != stringify(state)) {
            runLogic()
        }

    }
    m.redraw()  // mithril zwingen die seite neu zu zeichnen sollte helfen den state dump aktuell zu halten 
};

const runLogic = () => { // 
    trail.logicInstructions.forEach(p => {
        if (conditionTest(p.condition)) {
            p.effects.forEach((x) => execute(x))
        }
    })
}

const conditionTest = (condition) => { // giebt für eine Bedingung den Wahrheitswert zurück
    if (condition.type == "deq") {  // deq für deep equal werd ich jetzt nicht ändern weill dan alle config dateien nicht funktionieren würden
        return state.keys[condition.key] === condition.value
    }
	else if(condition.type == "aeqb"){ // a equalls b 
        return state.keys[condition.key1] === state.keys[condition.key0]
    }
    else if(condition.type == "not"){ // !
        return !conditionTest(condition.condition)
    }
    else if (condition.type == "all"){ // alle müssen erfült sein
        return (condition.s.reduce((a,b) => {return a + (conditionTest(b) ? 1:0)},0) == condition.s.length)
    }
}


// JSON to Readable 
const dump = (data) => m("pre", JSON.stringify(data, null, "  "));

// Run it ...

m.route(document.body, "/", {
    "/": Index,
    "/trail/": Trail,
});
