const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('./'));

const posTagger = require( 'wink-pos-tagger' );
var tagger = posTagger();

let Parser = require('rss-parser');
let parser = new Parser();

app.get('/', async (req, res) => {
    let title = await getTitles();
    // let title = "Early Data Show Moderna’s Coronavirus Vaccine Is 94.5% Effective";
    title = title.replace(/[\u2018\u2019]/g, "'")   // smart single quotes
                   .replace(/[\u201C\u201D]/g, '"');  // smart double quotes
    res.send(html(htmlGenerator( puncher(title), title )));
})

app.get('/print/', async (req, res) => {
    let title = await getTitles();

    title = title.replace(/[\u2018\u2019]/g, "'")   // smart single quotes
                   .replace(/[\u201C\u201D]/g, '"');  // smart double quotes
    res.send(print(htmlGenerator( puncher(title), title )));
})

app.get('/api/', async (req, res) => {
    let title = await getTitles();

    title = title.replace(/[\u2018\u2019]/g, "'")   // smart single quotes
                   .replace(/[\u201C\u201D]/g, '"');  // smart double quotes

    res.send({punched: puncher(title), title: title});
})

app.listen(port, () => {
  console.log(`Madlib listening at http://localhost:${port}`);
})

const puncher = (s) => {
    let tagged = tagger.tagSentence( s.toLowerCase() );
    let words = tagged.filter(word => word.pos != "POS");
    let toPunch = Math.floor((probability(35,50)/100)*words.length);
    
    let tags = Array.from(tagged, x => x.pos.substring(0, 2));
    let types = ["JJ", "RB", "VB", "CD", "NN"];
    let punched = [];
    while (toPunch > 0){
        let chosen = probability(0,tagged.length-1);

        if(punched.filter(word => word.value === tagged[chosen].value).length == 0){
            if(tagged[chosen].tag !== "symbol" && tagged[chosen].pos !== "TO" && tagged[chosen].pos !== "SYM" && tagged[chosen].pos !== "LS" && tagged[chosen].pos !== "CC" && tagged[chosen].pos !== "DT" && tagged[chosen].pos !== "EX"){

                // const tagsfoundintypes = tags.some(r=> types.includes(r));
                const typesfoundintags = types.some(r=> tags.includes(r));

                // console.log("tags found in types: " + tagsfoundintypes);
                // console.log("types found in tags: " + typesfoundintags);

                // if (types.includes(tagged[chosen].pos.substring(0, 2)))  console.log("the selected tag is in types");
                // if (types.length == 0) console.log("all out of types");
                // if (typesfoundintags) console.log("There are still types in tags");
                // if (tagsfoundintypes) console.log("There are still tags in types");

                // WHAT TO DO WITH particle <----

                if( types.includes(tagged[chosen].pos.substring(0, 2)) || !typesfoundintags ){
                    // console.log("Is a new type. Type: " + tagged[chosen].pos);
                    // console.log("Left to punch: " + toPunch + " Types left: " + types.length); 
                    
                    types = types.filter(item => !tagged[chosen].pos.includes(item) );

                    if(tagged[chosen].pos === "POS"){
                        if( tagged[chosen-1] ){
                            punched.push(tagged[chosen-1]);
                            toPunch--;
                        }
                    }

                    punched.push(tagged[chosen]);

                    if(tagged[chosen+1]){
                        if(tagged[chosen+1].pos === "POS"){
                            punched.push(tagged[chosen+1]);
                            toPunch--;
                        }
                    }

                    toPunch--;
                }
            }
        }
    }

    return builder( punched );

    // let html = builder( punched );
    // let res = s.split(" ");

    // html.forEach((item) => { 
    //     const index = res.findIndex((el) => el.toLowerCase().includes( item.replace ) );
    //     res[index] = item.html; 
    // })

    // return res.join(' ');
}

const builder = (arr) => {
    let r = [];

    const list = {
        "CD": 	"Number",
        "FW":	"Foreign Word",

        "IN":	"Preposition", 

        "JJ": 	"Adjective",
        "JJR":	"Comparative Adjective",
        "JJS":	"Superlative Adjective", 
        "NN": 	"Singular Noun",
        "NNS":	"Plural Noun",
        "NNP": 	"Singular Proper Noun",
        "NNPS":	"Plural Proper Noun",

        "PDT":	"Predeterminer",
        "PRP":	"Personal Pronoun",
        "PRP$":	"Possessive Pronoun",
        "RB":	"Adverb",
        "RBR": 	"Comparative Adverb", 
        "RBS": 	"Superlative Adverb",
        "UH":   "Interjection",
        "VB":	"Verb",
        "VBD":	"Verb (Past Tense)",
        "VBG":	"Gerund/Participle",
        "VBN":	"Past Participle (Verb)",
        "VBP":	"Verb",
        "VBZ":	"Verb (Third-Person Singular)",
        "WDT": 	"'Wh' Questions",
        "WP": 	"'Wh' Questions",
        "WP$": 	"'Wh' Questions",
        "WRB": 	"'Wh' Questions"
    }
    
    const pos = {
        "NN": 	"Possessive Singular Noun",
        "NNS":	"Possessive Plural Noun",
        "NNP": 	"Possessive Singular Proper Noun",
        "NNPS":	"Possessive Plural Proper Noun",
    }

    arr.forEach((item,index) => {
        let label, replace;

        // DEAL WITH COMMAS ETC IN THE STRING

        if( item.pos != "TO" && item.pos != "SYM" && item.pos != "LS" && item.pos != "CC" && item.pos != "DT" && item.pos != "EX"){
            if(item.pos == "POS" || (arr[index+1] && arr[index+1].pos == "POS")){
                if(item.pos == "POS"){
                    replace = arr[index-1].value + item.value;
                    label = pos[arr[index-1].pos];
                }
            }else{
                replace = item.value;
                label = list[item.pos];
            }    
        }

        if(replace && label){
            let id = 'word_' + index;
            let html = `<form><label for="${id}">${label}</label><input type="text" id="${id}" name="${id}"><span></span></form>`

            r.push({
                replace: replace,
                label: label,
                html: html
            })
        }
    })

    return r;
}

const probability = (l,h) => Math.floor(Math.random() * ((Math.floor(h) + 1) - Math.ceil(l)) + Math.ceil(l));

const getTitles = async () => {
    let feed = "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml";
    let doc = await parser.parseURL(feed);

    var titles = doc.items.map((item) => item.title );
    var ran = probability(0, titles.length);
    return titles[ran];
}

const htmlGenerator = ( arr, s) => {
    let html = arr;
    let res = s.split(" ");

    html.forEach((item) => { 
        const index = res.findIndex((el) => el.toLowerCase().includes( item.replace ) );
        let regEx = new RegExp(item.replace, "ig");
        res[index] = res[index].replace(regEx, item.html); 
    })

    return res.join(' ');
}

const html = (content) =>{
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Madlib (2020) - Anthony Warnick</title>
            <!-- 
			Title: Madlib
			Artist: Anthony Warnick
			Date: November 30, 2020
            -->
            <link rel="preconnect" href="https://fonts.gstatic.com">
            <link href="https://fonts.googleapis.com/css2?family=Yatra+One&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="css/style.css">
        </head>
        <body class="">
            <div class="madlib">
                ${content}
            </div>
            <script src="js/script.js"></script>
        </body>
        </html>`
}

const print = (content) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Madlib (2020) - Anthony Warnick</title>
            <!-- 
			Title: Madlib
			Artist: Anthony Warnick
			Date: November 30, 2020
            -->

            <!--
            <link rel="preconnect" href="https://fonts.gstatic.com">
            <link href="https://fonts.googleapis.com/css2?family=Yatra+One&display=swap" rel="stylesheet">
            -->
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body class="print">
            <div class="madlib">
                ${content}
            </div>
            <script src="/js/script.js"></script>
        </body>
        </html>`
}