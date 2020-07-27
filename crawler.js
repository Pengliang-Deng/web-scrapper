const puppeteer = require('puppeteer');

async function extractData(xpath, page, index = 0) {
    let dataSet = await page.$x(xpath);
    console.log(index);
    let data = await page.evaluate((el) => {
        return el.innerText;
    }, dataSet[index]);
    return data
}


async function clickItem(xpath, page, index = 0) {
    let link = await page.$x(xpath);

    await page.evaluate((el) => {
        el.click()
    }, link[index]);

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
}


async function loop(settings, actions, page) {

    let counts = settings[0];
    let size = actions.length;
    for (var i = 0; i < counts; i++) {
        for (var j = 0; j < size; j++) {
            switch (actions[j]) {
                case "ExtractData":
                    let data = await extractData(settings[j + 1], page, i);
                    console.log(data);
                    break;
                case "ClickItem" :
                    await clickItem(settings[j + 1], page);
                    break;
                case "LoopItem" :
                    await loop(settings[j + 1].settings, settings[j + 1].actions, page);
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
            "settings" : [10, `//span[@class="brand"]`, `//figcaption/a/span[@class="name"]`, `//span[@class="price"]`],
            "actions" : ["ExtractData", "ExtractData", "ExtractData"]
        },
        {
            "id" : 2,
            "name" : "ClickItem",
            "actionType" : "ClickItem",
            "settings" : [`//ul[@class="pagination"]/li[@class="arrow"]/a[@title="Next"]`],
            "actions" : []
        },
        {
            "id" : 3,
            "name" : "ExtractData",
            "actionType" : "ExtractData",
            "settings" : [`//span[@class="brand"]`],
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
                await clickItem(myActions[i].settings[0], page);
                break;
            case "ExtractData":
                let data = await extractData(myActions[i].settings[0], page);
                console.log(data);
                break;
        }
    }
    browser.close();

})();