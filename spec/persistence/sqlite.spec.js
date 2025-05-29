const db = require('../../src/persistence/sqlite');
const util = require('../../src/util/util');

const ITEM = {
    "id": util.generateUUID(),
    "retailer": "Walgreens",
    "purchaseDate": "2022-01-02",
    "purchaseTime": "08:13",
    "total": "2.65",
    "items": [
        {"shortDescription": "Pepsi - 12-oz", "price": "1.25"},
        {"shortDescription": "Dasani", "price": "1.40"}
    ]
};

beforeEach(() => {
    jest.restoreAllMocks();
});

test('it initializes correctly', async () => {
    await db.init();
});

test('it can store and retrieve items', async () => {
    await db.init();

    const purchaseDate = util.parseAsISOLocal(ITEM.purchaseDate, ITEM.purchaseTime).toISOString();
    const expectedItem = Object.assign({}, ITEM, {points: null});
    
    const newItem = Object.assign({}, ITEM, {purchaseDate: purchaseDate});
    delete newItem['purchaseTime'];
    
    const receipt = await db.storeReceipt(newItem);

    const receivedReceipt = await db.getReceipt(receipt.id);
    delete receivedReceipt['items_count'];
    
    expect(receivedReceipt).toEqual(expectedItem);
});

test('it can update an existing item', async () => {
    await db.init();

    const points = 123;
    const expectedItem = Object.assign({}, ITEM, {points});

    const purchaseDate = util.parseAsISOLocal(ITEM.purchaseDate, ITEM.purchaseTime).toISOString();
    const newItem = Object.assign({}, ITEM, {purchaseDate: purchaseDate});
    delete newItem['purchaseTime'];

    const recept = await db.storeReceipt(newItem);
    await db.updateReceiptPoints(recept.id, points);

    const receiptRead = await db.getReceipt(recept.id);
    delete receiptRead['items_count'];

    expect(receiptRead).toEqual(expectedItem);
});
