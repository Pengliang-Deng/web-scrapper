const puppeteer = require('puppeteer');
const fs = require('fs');


async function retrieveProductDetail(page) {

            const x_color = `//div[@class="product-group product-group--color-swatch"]/a/@data-ng-mouseenter`;
            const x_size = '//div[contains(@class, "row collapse")]/@data-sizes';
            

            let colors = await page.$x(x_color);
            let sizes = await page.$x(x_size);
            let num_colors = colors.length;
        
            let size = await page.evaluate((el) => {
                return el.value;
            }, sizes[0]);

            await fs.appendFile('./products.txt', `${size}\n`, err => {
                if (err) {
                    throw err
                };
            });
        
            for(let i = 0; i < num_colors; i++) {
                let color = await page.evaluate((el) => {
                    return el.value;
                }, colors[i])

                await fs.appendFile('./products.txt', `${color}\n`, err => {
                    if (err) {
                        throw err
                    };
                });
            }
}

(async () => {
    let urlCurrent = `https://www.theiconic.com.au/kids-baby-shoes/`;
    // let url = `https://www.theiconic.com.au/womens-shoes-flats/`;
    // let url = `https://www.theiconic.com.au/kids-baby-shoes/?page=3`;

    let browser = await puppeteer.launch({headless: true});
    let page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0);
 
    await page.goto(urlCurrent, {waitUntil: "networkidle2"});

    while (true) {
        const x_brand = `//span[@class="brand"]`;
        const x_name = `//figcaption/a/span[@class="name"]`;
        const x_price = `//span[@class="price"]`;
        const x_productDetail = `//a[@class="product-details"]`
     
        let names = [];
        let num_products = (await page.$x(x_name)).length;
        
        for (var i = 0; i < num_products; i++) {

            let product_name = (await page.$x(x_name))[i];
            let product_brand = (await page.$x(x_brand))[i];
            let product_price = (await page.$x(x_price))[i];
    
            let name = await page.evaluate((el) => {
                return el.innerText;
            }, product_name);
    
            let brand = await page.evaluate((el) => {
                return el.innerText;
            }, product_brand);
    
            let price = await page.evaluate((el) => {
                return el.innerText;
            }, product_price);
    
            await fs.appendFile('./products.txt', `Product:${name}, Brand:${brand}, Price:${price}\n`, err => {
                if (err) {
                    throw err
                };
            });

            let product = await page.$x(x_productDetail);

            await page.evaluate((el) => {
                return el.click()
            }, product[i]);
    
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            await retrieveProductDetail(page);
    
            await page.goto(urlCurrent, {waitUntil: "networkidle2"});

        }

        try {
            let x_next = `//ul[@class="pagination"]/li[@class="arrow"]/a[@title="Next"]`;
            let next = await page.$x(x_next);
    
            let nextUrl = await page.evaluate((el) => {
                return el.href
            }, next[0]);
    
            console.log(`${nextUrl} GET`);

            urlCurrent = nextUrl;
    
            await page.goto(nextUrl, {waitUntil: "networkidle2"});       

        } catch (error) {
            console.log("No Next Page");
            break;
        }
        
    }
    await browser.close();

})();