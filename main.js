import m from "/vendor/mithril.js";
import b from "/vendor/bss.js";
import merge from "/vendor/mergerino.js";
//import QrScanner from '/vendor/qr-scanner.min.js';

const { stringify, parse } = JSON;
var trails = []
var trailcontent = {}
let instaledtrails = {}
let promptEvent
let qrScanner

// Statische Trail Beschreibung

/*
var trail = {
    title: "Solothurn",
    initialState: {
        board: ["a"],
        quests: {},
        keys: {}
    },
    quests: {
        a: {
            type: "intro",
            title: "Willkommen in Solothurn",
            content:
                "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ",
            onsubmit: [
                { resource: "board", subject: "a", verb: "remove" },
                { resource: "board", subject: "b", verb: "add" },
                { resource: "board", subject: "c", verb: "add" },
            ],
        },
        b: {
            type: "text",
            title: "Nutzlose Infos",
            content:
                "At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
        },
        c: {
            type: "multipleChoice",
            title: "Wichtige Frage",
            stem: "Was ist die Solothurner Zahl?",
            options: {
                a: {
                    content: "11",
                    onsubmit: [
                        { resource: "quests", subject: "c", verb: "disable" },
                        { resource: "board", subject: "d", verb: "add" },
                    ],
                },
                b: {
                    content: "s'isch immer so gsy",
                    onsubmit: [
                        { resource: "quests", subject: "c", verb: "disable" },
                        { resource: "board", subject: "e", verb: "add" },
                        { resource: "board", subject: "f", verb: "add" }
                ],
                },
                c: {
                    content: "frag der joggeli",
                    onsubmit: [
                        { resource: "quests", subject: "c", verb: "disable" },
                        { resource: "board", subject: "e", verb: "add" },
                        { resource: "board", subject: "f", verb: "add" }

                ],
                },
            },
        },
        d: {
            type: "text",
            title: "MC",
            content: "you win"
        },
        e: {
            type: "text",
            title: "Fail",
            content:"Sehr kreativ"
                
        },
        f: {
            type: "multipleChoice",
            title: "Mer versueches no einisch",
            stem: "Wieviele Brunen gibt es in Solothurn?",
            ontry: {
                15 : [{resource : "keys", subject: "ftries", verb : "set ", object: "15"}]
            },
            options: {
                a: {
                    content: "11",
                    onsubmit: [
                        { resource: "quests", subject: "f", verb: "disable" },
                        { resource: "board", subject: "d", verb: "add" },
                    ],
                },  
                b: {
                    content: "11 aber nur wenn man nur die richtigen Zählt",
                    onsubmit: [
                        { resource: "quests", subject: "f", verb: "disable" },
                        { resource: "board", subject: "d", verb: "add" }
                ],
                },
                c: {
                    content: "11 weil ich faul binn und diese Zahl immer wider vorkommt ",
                    onsubmit: [
                        { resource: "quests", subject: "f", verb: "disable" },
                        { resource: "board", subject: "d", verb: "add" }

                ],
                },
                d: {
                    content: "versuchdemo",
                    onsubmit: [
                        { resource: "board", subject: "d", verb: "add" },
                        { resource: "keys", subject: "test", verb: "set", object : false },
                    ],
                },
                e: {
                    content: "m3 demo",
                    onsubmit: [
                        { resource: "keys", subject: "test", verb: "set", object : true },
                    ],
                },
            },
        },
    },
    megaMatrix: [
        {condition : {type : "deq", key : "test", value: true}, 
        effects:    [{ resource: "quests", subject: "c", verb: "enable" },
                    { resource: "keys", subject: "esFunzt", verb: "set", object: "yaaa man" }]}
    ]
};*/

let trail;

// USER DATEN
let update = (patch) => {
    let newState = merge(state, patch);
    localStorage.setItem(trail.trailid, stringify(newState));
    console.log('update', {
        oldState: state, patch, newState
    })
    state = newState;
}

let state;



// Trail Komponente
const Trail = {
    oninit: async ({ attrs }) => {
        trail = await m.request({ url: "/api.php", params: { id: attrs.trailid } })
        try {
             if(parse(localStorage.getItem(trail.trailid)) == null){
                localStorage.setItem(trail.trailid, stringify(trail.initialState))
            }
            state = parse(localStorage.getItem(trail.trailid))
        } catch (e) {
			console.log("ffff")
            state = trail.initialState;
			localStorage.setItem(trail.trailid, stringify(trail.initialState))
        }
    },
    view: ({ attrs }) => {
        return trail ? m(
            "div",
            m(
                "button" + b`float right`,
                { onclick: () => {
                    //update( trail.initialState )
                    state = trail.initialState
                    localStorage.setItem(trail.trailid, stringify(trail.initialState))
                }},
                "reset"
            ),
            m("h1", trail.title),
            m("button", {onclick : ()=>{m.route.set('/') }}, "Home")
            ,
            state?.board?.map((quest) => m(Quest, { attrs, quest })),
            m("hr"),
            "State",
            dump(state)
        ) : 'loading ...'
    }
};

const Index = {
    oninit: async () => {
        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            promptEvent = e;
        });
        //trails = await m.request({ url: "/api.php", method: "GET" });
        await m.request({ url: "/api.php", method: "GET" }).then( (f) => (trails = f)).catch((e) => {
            let a = parse(localStorage.getItem("instaledtrails"))
            for (let e in a) {
                //console.log(e)
                if (a[e]) trails.push(e)
            }
            //  console.log(a)
        })
        

        //console.log(trails ?? "reeeeeee")
        for (let t of trails) {
            trailcontent[t] = await m.request({ url: "/api.php", params: { id: t } })
        }
    },
    view: () => {
        let localtrails = trailcontent
        let a = parse(localStorage.getItem("instaledtrails"))
        return m("div", "Übersicht",m("button", {onclick : ()=>{
            try {
            promptEvent.prompt();  // Wait for the user to respond to the prompt
            }
            catch (error){
                alert("Failled to instal\nThis is most likely due to how the browser tries to protect users from anoying popups. Reopening the page in 5 to 10 min and pressing this button again should yield better results.")
                console.log(error)
            }
            promptEvent.userChoice
            .then(choice => {
                if (choice.outcome === 'accepted') {
                    console.log('User accepted');
                } else {
                    console.log('User dismissed');
                }
            })
        }},"instal"),
            m(
                "ol",
                trails.map((t) => {
                    return [m(
                        m.route.Link,
                        {
                            href: `/trail/`,
                            selector: "li",
                            params: { date: Date.now(), trailid: t },
                        },
                        localtrails[t]?.title ?? ""
                    ),
                    m("div", localtrails[t]?.lastedit),
                    m("button",{onclick: () =>  {
                        if(a?.[t]){
                            //console.log(123312)
                            //console.log(navigator.serviceWorker)
                            //console.log(navigator.serviceWorker.getRegistrations())

                           // navigator.serviceWorker.getRegistrations().then( (sw) => {
                             //   console.log(sw)
                           // })

                            navigator.serviceWorker.controller.postMessage({
                                type: "dodelete", trail : t
                              });
                              instaledtrails = parse(localStorage.getItem("instaledtrails")) ?? {}
                              instaledtrails[t] = false
                              localStorage.setItem("instaledtrails", stringify(instaledtrails))
                            }
                        else{
                        //console.log(navigator.serviceWorker.controller)
                        instaledtrails = parse(localStorage.getItem("instaledtrails")) ?? {}
                        instaledtrails[t] = true
                        localStorage.setItem("instaledtrails", stringify(instaledtrails))
                        navigator.serviceWorker.controller.postMessage({
                            type: "doinstal", trail : t
                          });
                        }
                    }},a?.[t] ? "delete" : "instal")
                ]    
                })
            ),
        )
    }
};


// Quest Container Komponente
const Quest = {
    view: ({ attrs }) => {
        const id = attrs.quest;
        const trailid = attrs.attrs.trailid
        const { title, type } = trail.quests[id];
        return m(
            "div" + b`border 1px solid silver; m 1ex; p 1ex`,
            `Quest ${id}: ${title}`,
            m("hr"),
            m(registery[type], { trailid, id, ...trail.quests[id] })
        );
    },
};

// Quest Typen

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
                        //console.log(adress)
                        execute({
                            resource: "keys",
                            subject: adress,
                            verb: "set",
                            object: result.data
                        })
                    }
                    //console.log(attrs)
                },
                { /* your options or returnDetailedScanResult: true if you're not specifying any other options */ },
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
                            //console.log(attrs.id,"mama", name)
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
                        update({
                                quests: { [attrs.id]: { tries: (x) => typeof x == "number" ? x + 1 : 1 } },
                        })
                        attrs.options[selected].onsubmit.forEach((x) => execute(x));
                        if (attrs?.ontry?.[state?.quests?.[attrs.id]?.tries] != undefined) {
                            //console.log(attrs?.ontry?.[state?.quests?.[attrs.id]?.tries], "mfmfm")
                            attrs?.ontry?.[state?.quests?.[attrs.id]?.tries].forEach(execute)
                        }
                    },
                },
                "Prüfen"
            )
        ),
};


// Engine
const execute = (cmd) => {
    //console.log(cmd)
    if (cmd.resource === "board") {
        const { subject, verb } = cmd;
        if (verb == "add" && !state.board.includes(subject)) {
            update({ board: (list) => [...list, subject] } );
        } else if (verb == "remove") {
            update({ board: (list) => list.filter((x) => x != subject) } );
        }
    }
    if (cmd.resource === "quests") {
        const { subject, verb } = cmd;
        if (verb == "disable") {
            update({ quests: { [subject]: { disabled: true } } } );
        }
        if (verb == "enable") {
            update({ quests: { [subject]: { disabled: false } } } );
        }
    }
    if (cmd.resource === "keys") {
        //console.log(cmd)
        var oldState = state
        const { subject, verb, object } = cmd;
        if (verb == "set") {
            update({ keys: { [subject]: object } } )
        }
        if (stringify(oldState) != stringify(state)) {
            m3()
            //console.log("fff")
        }

    }
    m.redraw()
};

const m3 = () => {
    trail.megaMatrix.forEach(p => {
        if (conditionTest(p.condition)) {
            p.effects.forEach((x) => execute(x))
        }
    })
}

const conditionTest = (condition) => {
    //console.log(condition,"aaa")
    if (condition.type == "deq") {
        return state.keys[condition.key] === condition.value
    }
	else if(condition.type == "aeqb"){
        return state.keys[condition.key1] === state.keys[condition.key0]
    }
    else if(condition.type == "not"){
        return !conditionTest(condition.condition)
    }
    else if (condition.type == "all"){
        //console.log(condition)
        //console.log(condition.s.reduce((a,b) => (a + conditionTest(b) ? 1 : 0 ),0) )
        return (condition.s.reduce((a,b) => {return a + (conditionTest(b) ? 1:0)},0) == condition.s.length)
    }
}


// Helper
const dump = (data) => m("pre", JSON.stringify(data, null, "  "));

// Run it ...
//m.mount(document.body, Trail);

m.route(document.body, "/", {
    "/": Index,
    "/trail/": Trail,
});
