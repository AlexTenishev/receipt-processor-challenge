const db = require('../../src/persistence');
const receiptProcess = require('../../src/routes/receiptProcess');
const {v4 : uuid} = require('uuid');
const util = require('../../src/util/util');
const constants = require('../../src/common/const');
// const receipt_id = util.generateUUID();
const receipt = {
    id: uuid(),
    retailer: constants.RETAILER_NON_ALPHANUMERIC,
    purchaseDate: constants.NON_BONUS_PURCHASE_DATE,
    purchaseTime: constants.NON_BONUS_PURCHASE_TIME,
    total: constants.NON_BONUS_TOTAL,
    items: [
        {shortDescription: constants.NON_BONUS_ITEM_DESC, price: "1.99"}
    ]
};

beforeEach(() => {
    jest.clearAllMocks();
});

jest.mock('uuid', () => ({ v4: jest.fn() }));

jest.mock('../../src/persistence', () => ({
    storeReceipt: jest.fn(),
    getReceipt: jest.fn(),
    updateReceiptPoints: jest.fn(),
}));

test('receipt-processor: stores item correctly', async () => {
    const req = { body: receipt };
    const res = { send: jest.fn() };
    await receiptProcess(req, res);
    expect(db.storeReceipt).toHaveBeenCalledTimes(1);

    const purchaseDate = util.parseAsISOLocal(receipt.purchaseDate, receipt.purchaseTime).toISOString();
    const expectedItem = {...receipt, purchaseDate: purchaseDate};
    delete expectedItem.purchaseTime;
    const storeReceiptCallArgItem = db.storeReceipt.mock.calls[0][0];
    expect(db.storeReceipt.mock.calls[0][0]).toEqual(expectedItem);// "purchaseDate": 2022-01-02T16:13:00.000Z,
    expect(res.send.mock.calls[0].length).toBe(1);
    const sendExpectedItem = { id: receipt.id };
    expect(sendExpectedItem).toEqual(res.send.mock.calls[0][0]);
});

test('bad request when data is invalid - empty body', async () => {
    const reqBody = null;
    const req = { body: reqBody };
    const res = { send: jest.fn() };
    await receiptProcess(req, res);    
    expect(db.storeReceipt.mock.calls.length).toBe(0);
    expect(res.send.mock.calls.length).toBe(1);
    const sendExpectedItem = [400,"The receipt is invalid."];
    expect(res.send.mock.calls[0]).toEqual(sendExpectedItem);
});

test('bad request when data is invalid - invalid body', async () => {
    const reqBody = "'some text': equality for all letters!";
    const req = { body: reqBody };
    const res = { send: jest.fn() };

    await receiptProcess(req, res);
    expect(res.send.mock.calls.length).toBe(1);
    const sendExpectedItem = [400,"The receipt is invalid."];
    expect(res.send.mock.calls[0]).toEqual(sendExpectedItem);
});
