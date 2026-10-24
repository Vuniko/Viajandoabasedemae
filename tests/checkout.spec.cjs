const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
 await page.route('**/rest/v1/mate_products?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:1,name:'Playadito tradicional',category:'Yerbas',price:39,description:'Yerba para compartir',image_url:null,active:true},{id:2,name:'Bombilla acero M730',category:'Bombillas',price:49,description:'Accesorio matero',image_url:null,active:true}])}));
 await page.goto('http://127.0.0.1:4173/');
 await expect(page.locator('#products .product')).toHaveCount(2);
});
test('buscar, filtrar y recuperar resultados',async({page})=>{
 await page.locator('#search').fill('inexistente');
 await expect(page.locator('.catalog-empty')).toBeVisible();
 await page.locator('#clearCatalogSearch').click();
 await expect(page.locator('#products .product')).toHaveCount(2);
 await page.locator('#filters [data-cat="Bombillas"]').click();
 await expect(page.locator('#products .product')).toHaveCount(1);
});
test('ficha, cantidad y subtotal del carrito',async({page})=>{
 await page.locator('[data-detail="1"]').click();
 await expect(page.locator('#detailName')).toHaveText('Playadito tradicional');
 await page.locator('#qtyPlus').click();
 await page.locator('#detailAdd').click();
 await expect(page.locator('#total')).toContainText('78.00');
 await page.locator('[data-minus="1"]').click();
 await expect(page.locator('#total')).toContainText('39.00');
 await page.locator('[data-minus="1"]').click();
 await expect(page.locator('#checkout')).toBeDisabled();
});
test('carrito se conserva tras recargar',async({page})=>{
 await page.locator('[data-add="1"]').click();
 await page.reload();
 await expect(page.locator('#count')).toHaveText('1');
});
test('WhatsApp prepara consulta sin enviarla',async({page})=>{
 await page.locator('[data-add="1"]').click();
 await page.locator('#openCart').click();
 await page.locator('#buyerName').fill('Cliente Prueba');
 await page.locator('#buyerPhone').fill('999888777');
 await page.locator('#buyerCity').fill('Lima, Surco');
 await page.route('https://wa.me/**',route=>route.abort());
 const requestPromise=page.waitForRequest(req=>req.url().startsWith('https://wa.me/51920731674?text='));
 await page.locator('#checkout').click();
 const request=await requestPromise;
 const url=new URL(request.url());
 const msg=url.searchParams.get('text');
 expect(msg).toContain('Cliente Prueba');
 expect(msg).toContain('Playadito tradicional');
 expect(msg).toContain('39.00');
});
test('catálogo malicioso no ejecuta HTML',async({page})=>{
 await page.route('**/rest/v1/mate_products?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:9,name:'<img src=x onerror=alert(1)>',category:'Yerbas',price:20,active:true}])}));
 await page.reload();
 await expect(page.locator('#products .product')).toHaveCount(1);
 await expect(page.locator('#products .details h3')).toContainText('<img src=x');
 await expect(page.locator('#products .details h3 img')).toHaveCount(0);
});
test('navegación móvil y carrito',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.locator('#mobileMenuToggle').click();
 await expect(page.locator('#mobileNav')).toBeVisible();
 await page.locator('#mobileNav a[href="#catalogo"]').click();
 await expect(page.locator('#mobileNav')).toBeHidden();
 await page.locator('#floatCart').click();
 await expect(page.locator('#drawer')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#drawer')).toBeHidden();
});
