const puppeteer = require('puppeteer');

async function extractData(xpath, page, delay = 0, index = 0) {
    await page.waitFor(delay*1000);
    console.log(index);
    let dataSet = await page.$x(xpath);
    
    //console.log(index);
    var data = await page.evaluate((el) => {
        return el.innerText;
    }, dataSet[index]);
    return data
}


async function clickItem(xpath, page, delay = 0, isNewTab = false) {
    await page.waitFor(delay*1000);
    // console.log(`Timemout is ${timeout}`);
    // if (newTab) {
    //     var browser = await page.browser();
    //     var newPage = await browser.newPage();
    //     await newPage.goto(page.url(), {waitUntil: "networkidle2"});
    //     page = newPage;
    //     console.log("hey~!")
    // }
    // await page.waitForXPath(xpath);
    let link = await page.$x(xpath);
    //console.log(xpath);
    

    if (isNewTab) {
        
        let url = await page.evaluate((el) => {
            return el.getAttribute("href");
        }, link[index]);
    
        console.log(url);
    
        await page.goto(`${url}`, {waitUntil: "networkidle0"});

    } else {
        console.log("click!");
        await page.evaluate((el) => {
            el.click()
        }, link[0]);
    }

    // let link = await page.$x(xpath);

    
    // await page.waitForXPath(xpath);

    // let url = await page.evaluate((el) => {
    //     return el.getAttribute("href");
    // }, link[index]);

    // console.log(url);

    // await page.goto(`${url}`, {waitUntil: "networkidle0"});


    // await page.waitForNavigation({ waitUntil: 'networkidle0' });
    // return page
}

async function singleElLoop(xpath, actions, page, delay = 0, isItemsInLoop = false) {
    var haveItem = true;
    await page. waitFor(delay*1000);
    console.log("Start Single Element Looping")
    while (haveItem) {
        // try {
        //     let link = await page.$x(xpath);
        // } catch (err) {
        //     console.log("could not find the item");
        //     // throw err
        //     break;
        // }
        let link = await page.$x(xpath);
        
        

        let size = actions.length;
        // console.log(size);
        for (let i = 0; i < size; i++) {
            let current = actions[i];
            var xpathNext = current.settings.isItemsInLoop ? xpath : current.settings.xpath;

            switch (current.actionType) {
                case "ExtractData":
                    let data = await extractData(xpathNext, page, current.settings.delay, i);
                    console.log(data);
                    break;
                case "ClickItem" :
                    try {
                        
                        // actions2 is not working because of index provided

                        await clickItem(xpathNext, page, current.settings.delay, current.settings.isNewTab);
                    } catch (err) {
                        console.log(`Element does not exist`);
                        // throw err;
                        // console.log("hellooooo")
                        haveItem = false;
                        // console.log(haveItem);
                    }
                    break;
                case "LoopItem" :
                    switch (current.settings.loopMode) {
                        case "Single Element" :
                            await singleElLoop(xpathNext, current.actions, page, current.settings.delay, current.settings.isItemsInLoop);
                            break;
                        case "Fixed List" :
                            break;
                        case "Variable List" :
                            await varLoop(xpathNext, current.actions, page, current.settings.delay, current.settings.isItemsInLoop);
                            break;
                    }
                    break;
            }
        }
    }
    // console.log("outsidel while");

}


async function varLoop(xpath, actions, page, delay = 0, isItemsInLoop = false) {
    await page.waitFor(delay);
    var browser = await page.browser();
    let pages_len = (await browser.pages()).length;
    console.log(pages_len);
    
    console.log("Start Variable List Looping")
    //let xpath = settings.xpath;

    // if (counts < 0) {
    // await page.waitForXPath(xpath);
   
    // console.log(`${await page.url()}`);
    let counts = (await page.$x(xpath)).length;
    console.log(`Loop ${counts} times`);
    // }
    // console.log(xpath + "ehhhhh");
    let size = actions.length;
    //let hasOpenNewPage = false;

    for (var i = 0; i < counts; i++) {
        for (var j = 0; j < size; j++) {
            let current = actions[j];
            var xpathNext = await current.settings.isItemsInLoop ? xpath : current.settings.xpath;

            // console.log(`nextPath is : ${xpathNext}`);

            switch (current.actionType) {
                case "ExtractData":
                    let data = await extractData(xpathNext, page, current.settings.delay, i);
                    console.log(data);
                    break;
                case "ClickItem" :
                    try {
                        // actions2 is not working because of index provided
                        // page = await clickItem(xpathNext, page, current.settings.timeout, i, current.settings.newTab);
                        if (current.settings.isNewTab) {
                            console.log("Open New Tab");
                            var newPage = await browser.newPage();
                            console.log(xpathNext + "   1");
                            let link = await page.$x(xpathNext);
                            console.log(xpathNext + "   2");
                            let url = await page.evaluate((el) => {
                                return el.getAttribute("href");
                            }, link[0]);

                            await newPage.goto(`${url}`, {waitUntil: "networkidle0"});
                            page = newPage;
                            hasOpenNewPage = true;
                        } else {
                            await clickItem(xpathNext, page, current.settings.delay, current.settings.isNewTab);
                        }
                    } catch (err) {
                        console.log("Variable List Loop Error");
                        // console.log(`Loading ${i} times has got all products`);
                        throw err;
                        counts = i;
                    }
                    break;
                case "LoopItem" :
                    switch (current.settings.loopMode) {
                        case "Single Element" :
                            page = await singleElLoop(xpathNext, current.actions, page, current.settings.delay, current.settings.isItemsInLoop);
                            break;
                        case "Fixed List" :
                            break;
                        case "Variable List" :
                            page = await varLoop(xpathNext, current.actions, page, current.settings.delay, current.settings.isItemsInLoop);
                            break;
                    }
                    break;
            }
        }

    }
    // for actions, should not have the following
    // try {
    //     await page.goBack();
    // } catch (err) {
    //     console.log("All done");
    // }
    if (pages_len > 2) {
        console.log("Page close")
        await page.close();
        console.log((await browser.pages()).length)
        page = await browser.pages()[1];
        // console.log(await browser.pages())
        // bringToFront() of undefined
        await page.bringToFront();

    }
    
    return page

    
}

// loopCounts: negative 
// click : open a new tab or not

(async () => {
    // myActions is testing scraping all products from multiple pages
    myActions = [
        {
            "id" : 1,
            "name" : "LoopItem",
            "actionType" : "LoopItem",
            "settings" : {delay: 3, xpath: `//*[@id="catalog-images-wrapper"]/div/div/figure`, loopMode: "Variable List"},
            "actions" : [{
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//span[@class="brand"]`, delay: 0, isItemsInLoop : false},
                "actions" : []
            }, {
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//figcaption/a/span[@class="name"]`, delay: 0, isItemsInLoop : false},
                "actions" : []
            }, {
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//span[contains(@class,"price")]`, delay: 0.5, isItemsInLoop : false},
                "actions" : []
            }]
        },
        {
            "id" : 2,
            "name" : "ClickItem",
            "actionType" : "ClickItem",
            "settings" : {xpath:`//ul[@class="pagination"]/li[@class="arrow"]/a[@title="Next"]`, delay: 0},
            "actions" : []
        },
        {
            "id" : 1,
            "name" : "LoopItem",
            "actionType" : "LoopItem",
            "settings" : {delay: 0, xpath: `//*[@id="catalog-images-wrapper"]/div/div`, loopMode: "Variable List"},
            "actions" : [{
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//span[@class="brand"]`, delay: 0, isItemsInLoop : false},
                "actions" : []
            }, {
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//figcaption/a/span[@class="name"]`, delay: 0, isItemsInLoop : false},
                "actions" : []
            }, {
                "id" : 3,
                "name" : "ExtractData",
                "actionType" : "ExtractData",
                "settings" : {xpath:`//span[contains(@class, "price")]`, delay: 0.5, isItemsInLoop : false},
                "actions" : []
            }]
        },
    ]

    // myActions2 is testing david-jones-like pages should load more products and then scrape products' info
    myActions2 = [
        {
            "id": 1,
            "name": "LoopItem",
            "actionType": "LoopItem",
            "settings": {loopCounts: -1, delay: 0,  loopMode: "Single Element"},
            "actions":[
                {
                    "id": 1,
                    "name": "ClickItem",
                    "actionType": "ClickItem",
                    "settings": {delay: 3, xpath: `//a[@class="btn load-products loading-button externalLink"]`},
                    "actions": []
                }
            ]
        },
        {
            "id": 2,
            "name": "LoopItem",
            "actionType": "LoopItem",
            
            "settings": {delay: 0, xpath: `//div[@class="item-brand"]`, loopMode : "Variable List"},
            "actions": [
                {
                    "id": 2,
                    "name": "ExtractBrand",
                    "actionType": "ExtractData",
                    "settings": {xpath: `//div[@class="item-brand"]`, delay: 0, isItemsInLoop : true},
                    "actions": []
                },
                {
                    "id": 3,
                    "name": "ExtractName",
                    "actionType": "ExtractData",
                    "settings": {xpath: `//div[contains(@class, "item-detail")]/h4/a`, delay: 0, isItemsInLoop : false},
                    "actions": []
                },
                {
                    "id": 4,
                    "name": "ExtractPrice",
                    "actionType": "ExtractData",
                    "settings": {xpath: `//div[@class="pricing"]/p/span[@class="price-display"]`, delay: 0, isItemsInLoop : false},
                    "actions": []
                }
            ]
        }

    ]

    // myActions3 is testing scraping more specific contents by openning a new page
    myActions3 = [
        {
            "id": 1,
            "name": "LoopItem",
            "actionType": "LoopItem",
            "settings": {delay: 0, xpath: `//div[@class="item-brand"]`, loopMode: "Variable List"},
            
            "actions": [
                {
                    "id" : 2,
                    "name" : "ClickItem",
                    "actionType" : "ClickItem",
                    "settings" : {xpath: `//div[contains(@class, "item-detail")]/h4/a`, delay: 0, isNewTab: true},
                    "actions" : []
                },
                {
                    "id": 3,
                    "name" : "LoopItem",
                    "actionType" : "LoopItem",
                    "settings": {delay: 0, xpath: `//div[@class="form-item size"]/div/ul/li`, loopMode:"Variable List"},
                    "actions": [
                        {
                            "id": 4,
                            "name": "ExtractSize",
                            "actionType": "ExtractData",
                            "settings": {xpath: `//div[@class="form-item size"]/div/ul/li/label/span`, delay: 0, isItemsInLoop:false},
                            "actions": []
                        }
                    ]
                }
                        ]
        },
    ]

    // let urlCurrent = `https://www.theiconic.com.au/kids-baby-shoes/`;
    let urlCurrent = `https://www.davidjones.com/women/best-sellers`;

    let browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0);
 
    await page.goto(urlCurrent, {waitUntil: "networkidle0"});

    let numActions = myActions3.length;

    for (var i = 0; i < numActions; i++) {

        let currentAction = myActions3[i];

        switch (currentAction.actionType) {
            case "LoopItem" :
                switch (currentAction.settings.loopMode) {
                    case "Single Element" :
                        page = await singleElLoop(currentAction.settings.xpath, currentAction.actions, page, currentAction.settings.delay);
                        break;
                    case "Fixed List" :
                        break;
                    case "Variable List" :
                        console.log(currentAction.settings.xpath);
                        page = await varLoop(currentAction.settings.xpath, currentAction.actions, page, currentAction.settings.delay);
                        break;
                }
                break;
            case "ClickItem" :
                await clickItem(currentAction.settings.xpath, page, currentAction.settings.delay, currentAction.settings.isNewTab);
                break;
            case "ExtractData":
                let data = await extractData(currentAction.settings.xpath, page, currentAction.settings.delay);
                console.log(data);
                break;
        }
    }
    // browser.close();

})();