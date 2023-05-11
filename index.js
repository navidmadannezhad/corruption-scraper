const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs").promises

const SCRAP_URL = "https://en.wikipedia.org/wiki/Corruption_Perceptions_Index";
const OUTPUT_PATH = "./txt.json";
const result = [];
const years = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]

const getWebPageData = (url) => {
    return axios({
        url: url,
        method: "GET",
    })
}

const writeToFile = async (obj) => {
    let jsonObj = JSON.stringify(obj);
    try{
        await fs.writeFile(OUTPUT_PATH, jsonObj, {flag: "w"});
        console.log("Results writtern successfull!")
    }catch(err){
        console.log("Some kind of error happened")
        console.log(err)
    }
}

const trHasNull = (tr) => {
    for(let i=0; i<tr.children.length; i++){
        if(tr.children[i].attribs["class"] === "table-na"){
            return true;
        }
    }
}

const getRate = (table, country_name, rate_index) => {
    let tbody = table.children[0]
    let trList = tbody.children.slice(2);

    for(let i=0; i<trList.length; i++){
        let c_name = trList[i].children[1].children[1].children[0].data;
        if(!trHasNull(trList[i]) && trList[i].children[rate_index].children[0] && c_name === country_name){
            return trList[i].children[rate_index].children[0].children[1].children[0].data;
        }
    }
}

const fillTheResult = async (data) => {
    const $ = cheerio.load(data.replace(/\n/g,''));
    const $mainTable = $("table")[4]
    const $secondaryTable = $("table")[5]
    const tbody = $mainTable.children[0]

    tbody.children.slice(2).forEach((tr ,i) => {
        let rank = tr.children[0].children[0].data;
        let country_name = tr.children[1].children[1].children[0].data;
        let flag_url = tr.children[1].children[0].children[0].attribs.src.slice(2);

        let scores = [
            getRate($secondaryTable, country_name, 16),
            getRate($secondaryTable, country_name, 14),
            getRate($secondaryTable, country_name, 12),
            getRate($secondaryTable, country_name, 10),
            getRate($secondaryTable, country_name, 8),
            getRate($secondaryTable, country_name, 6),
            getRate($secondaryTable, country_name, 4),
            getRate($secondaryTable, country_name, 2),
            getRate($mainTable, country_name, 6),
            getRate($mainTable, country_name, 4),
            getRate($mainTable, country_name, 2),
        ]

        result.push({
            rank: rank,
            country_name: country_name,
            flag_url: flag_url,
            corruption_data: {
                years: years,
                scores: scores
            }
        })
    })

    await writeToFile(result);
}

getWebPageData(SCRAP_URL).then(res => {
    fillTheResult(res.data)
})