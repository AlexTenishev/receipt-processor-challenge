const db = require('../../src/persistence');
const receiptPoints = require('../../src/routes/receiptPoints');
const {v4 : uuid} = require('uuid');
const util = require('../../src/util/util');
const constants = require('../../src/common/const');
const processor = require('../../src/points/pointsCalculation');

beforeEach(() => {
    jest.clearAllMocks();
});

jest.mock('uuid', () => ({ v4: jest.fn() }));
const ITEM = {
    id: "1ec13216-feef-4a13-803d-b95a64931eb4",
    retailer: '   ',
    purchaseDate: '2022-01-02',
    purchaseTime: '08:13',
    total: '1.23',
    items: [
        { shortDescription: 'GE', price: "1.99" }
    ]
};
const ZERO_POINTS = {points: 0};
const BONUS_RETAILER = 'Abc';

jest.mock('../../src/persistence', () => ({
    // storeReceipt: jest.fn(),
    getReceipt: jest.fn(() => {
        return ITEM;
    }),
    updateReceiptPoints: jest.fn(),
}));
jest.mock('../../src/points/pointsCalculation', () => ({
    calculatePoints: jest.fn(() => {
        return {points: 0};
    })
}));

test('receipt-points: calculate points success', async () => {
    const req = {
        params: { id: ITEM.id },
        body: {},
    };
    const res = { send: jest.fn() };
    db.getReceipt.mockReturnValue(Promise.resolve(ITEM));
    processor.calculatePoints.mockReturnValue(0);
    await receiptPoints(req, res);

    expect(db.getReceipt).toHaveBeenCalledTimes(1);
    expect(db.updateReceiptPoints).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual(ZERO_POINTS);
});

test('bad request when id is invalid', async () => {
    const req = {
        params: { id: "willworkforfunand"},
        body: {}
    };
    const res = { send: jest.fn() };
    db.getReceipt.mockReturnValue(Promise.resolve(null));
    processor.calculatePoints.mockReturnValue({points: 0});
    const sendExpectedItem = [400,"The receipt is invalid."];
});

test('receipt-points: returns bad request if receipt id is invalid', async () => {
    const req = {
        params: { id: "bogus" },
        body: {},
    };
    const res = { send: jest.fn() };
    db.getReceipt.mockReturnValue(Promise.resolve(null));
    await receiptPoints(req, res);

    expect(db.getReceipt).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual(400);
});

test('receipt-points: bad request when path is empty', async () => {
    const req = {
        params: {},
        body: {},
    };
    const res = { send: jest.fn() };
    db.getReceipt.mockReturnValue(Promise.resolve(null));
    await receiptPoints(req, res);
    expect(db.getReceipt).toHaveBeenCalledTimes(0);
    expect(res.send.mock.calls[0][0]).toEqual(400);
});

test('receipt-points: bad request when path is invalid', async () => {
    const req = {
        params: { dir: "FindMe" },
        body: { variable: "value" },
    };
    const res = { send: jest.fn() };
    db.getReceipt.mockReturnValue(Promise.resolve(null));
    await receiptPoints(req, res);
    expect(db.getReceipt).toHaveBeenCalledTimes(0);
    expect(res.send.mock.calls[0][0]).toEqual(400);
});

test('receipt-points: bad request when path is looks like guid but is invalid', async () => {
    const req = {
        params: { id: ITEM.id+"-e34" },
        body: { variable: "value" },
    };
    const res = { send: jest.fn() };
    db.getReceipt.mockReturnValue(Promise.resolve(null));
    await receiptPoints(req, res);
    expect(db.getReceipt).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toEqual(400);
});
