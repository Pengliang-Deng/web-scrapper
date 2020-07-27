const puppeteer = require('puppeteer');

async function extractData(xpath, page, index = 0, timeout = 0) {
    await page.waitFor(timeout);
    let dataSet = await page.$x(xpath);
    
    //console.log(index);
    let data = await page.evaluate((el) => {
        return el.innerText;
    }, dataSet[index]);
    return data
}


async function clickItem(xpath, page, index = 0, timeout = 0) {
    await page.waitFor(timeout);
    let link = await page.$x(xpath);

    await page.evaluate((el) => {
        el.click()
    }, link[index]);

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
}


async function loop(settings, actions, page) {
    let timeout = settings.timeout;
    let counts = settings.loopCounts;
    let size = actions.length;
    await page.waitFor(timeout);

    for (var i = 0; i < counts; i++) {
        for (var j = 0; j < size; j++) {
            switch (actions[j].actionType) {
                case "ExtractData":
                    let data = await extractData(actions[j].settings.xpath, page, i, actions[j].settings.timeout);
                    console.log(data);
                    break;
                case "ClickItem" :
                    await clickItem(actions[j].settings.xpath, page, 0, actions[j].settings.timeout);
                    break;
                case "LoopItem" :
                    await loop(actions[j].settings, actions[j].actions, page);
                    break;
            }
        }
    }
}


(async () => {
    myActions = [
        {
            "id" : 1,
            "name" : "LoopItem",
            "actionType" : "LoopItem",
            "settings" : {loopCounts: 10, timeout: 0},
            "actions" : [{
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//span[@class="brand"]`, index: 0, timeout: 0},
                "actions" : []
            }, {
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//figcaption/a/span[@class="name"]`, index: 0, timeout: 0},
                "actions" : []
            }, {
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//span[@class="price"]`, index: 0, timeout: 0},
                "actions" : []
            }]
        },
        {
            "id" : 2,
            "name" : "ClickItem",
            "actionType" : "ClickItem",
            "settings" : {xpath:`//ul[@class="pagination"]/li[@class="arrow"]/a[@title="Next"]`, index: 0, timeout: 0},
            "actions" : []
        },
        {
            "id" : 3,
            "name" : "ExtractData",
            "actionType" : "ExtractData",
            "settings" : {xpath:`//span[@class="brand"]`, index: 0, timeout: 0},
            "actions" : []
        }
    ]

    let urlCurrent = `https://www.theiconic.com.au/kids-baby-shoes/`;
    // let url = `https://www.theiconic.com.au/womens-shoes-flats/`;
    // let url = `https://www.theiconic.com.au/kids-baby-shoes/?page=3`;

    let browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0);
 
    await page.goto(urlCurrent, {waitUntil: "networkidle2"});

    let numActions = myActions.length;

    for (var i = 0; i < numActions; i++) {
        switch (myActions[i].name) {
            case "LoopItem" :
                await loop(myActions[i].settings, myActions[i].actions, page);
                break;
            case "ClickItem" :
                await clickItem(myActions[i].settings.xpath, page, myActions[i].settings.index, myActions[i].settings.timeout);
                break;
            case "ExtractData":
                let data = await extractData(myActions[i].settings.xpath, page, myActions[i].settings.index, myActions[i].settings.timeout);
                console.log(data);
                break;
        }
    }
    browser.close();

})();