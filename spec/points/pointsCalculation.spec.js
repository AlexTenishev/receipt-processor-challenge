const processor = require('../../src/points/pointsCalculation');
const util = require('../../src/util/util');
const constants = require('../../src/common/const');

beforeEach(() => {
    jest.restoreAllMocks();
});
// * One point for every alphanumeric character in the retailer name.
test('calculate points - retailer', async() => {
    const receipt = {
        retailer: constants.RETAILER_ALPHANUMERIC,
        purchaseDate: constants.NON_BONUS_PURCHASE_DATE,
        purchaseTime: constants.NON_BONUS_PURCHASE_TIME,
        total: constants.NON_BONUS_TOTAL,
        items: [
            {shortDescription: constants.NON_BONUS_ITEM_DESC, "price": "1.99"}
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    expect(pointsAwarded).toEqual(receipt.retailer.length);
});

// * 50 points if the total is a round dollar amount with no cents.
// * 25 points if the total is a multiple of `0.25`.
test('calculate points - total', async() => {
    const receipt = {
        "retailer": constants.RETAILER_NON_ALPHANUMERIC,
        "purchaseDate": constants.NON_BONUS_PURCHASE_DATE,
        "purchaseTime": constants.NON_BONUS_PURCHASE_TIME,
        "total": constants.BONUS_TOTAL,
        "items": [
            {"shortDescription": constants.NON_BONUS_ITEM_DESC, "price": "1.99"}
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    expect(pointsAwarded).toEqual(constants.AWARD_POINTS_TOTAL_ROUND+constants.AWARD_POINTS_TOTAL_MULTIPLE);
});

// * 5 points for every two items on the receipt.
test('calculate points - every two items', async() => {
    const receipt = {
        retailer: constants.RETAILER_NON_ALPHANUMERIC,
        purchaseDate: constants.NON_BONUS_PURCHASE_DATE,
        purchaseTime: constants.NON_BONUS_PURCHASE_TIME,
        total: constants.NON_BONUS_TOTAL,
        items: [
            {"shortDescription": constants.NON_BONUS_ITEM_DESC, "price": "1.99"},
            {"shortDescription": constants.NON_BONUS_ITEM_DESC, "price": "2.99"}
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    expect(pointsAwarded).toEqual(constants.AWARD_POINTS_FOR_EVERY_TWO_ITEMS);
});
// * If the trimmed length of the item description is a multiple of 3, multiply the price by `0.2` and round up to the nearest integer. The result is the number of points earned.
test('calculate points - items trimmed length', async() => {
    const receipt = {
        "retailer": constants.RETAILER_NON_ALPHANUMERIC,
        "purchaseDate": constants.NON_BONUS_PURCHASE_DATE,
        "purchaseTime": constants.NON_BONUS_PURCHASE_TIME,
        "total": constants.NON_BONUS_TOTAL,
        "items": [
            {"shortDescription": constants.BONUS_ITEM_DESC, "price": "1.99"},
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    expect(pointsAwarded).toEqual(Math.ceil(receipt.items[0].price * 0.2));
});

// * 6 points if the day in the purchase date is odd.
test('calculate points - purchase date', async() => {
    const receipt = {
        "retailer": constants.RETAILER_NON_ALPHANUMERIC,
        "purchaseDate": constants.BONUS_PURCHASE_DATE,
        "purchaseTime": constants.NON_BONUS_PURCHASE_TIME,
        "total": constants.NON_BONUS_TOTAL,
        "items": [
            {"shortDescription": constants.NON_BONUS_ITEM_DESC, "price": "1.99"}
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    expect(constants.AWARD_POINTS_FOR_PURCHASE_DATE).toEqual(pointsAwarded);
});

// * 10 points if the time of purchase is after 2:00pm and before 4:00pm.
test('calculate points - purchase time', async() => {
    const receipt = {
        "retailer": constants.RETAILER_NON_ALPHANUMERIC,
        "purchaseDate": constants.NON_BONUS_PURCHASE_DATE,
        "purchaseTime": constants.BONUS_PURCHASE_TIME,
        "total": constants.NON_BONUS_TOTAL,
        "items": [
            {"shortDescription": constants.NON_BONUS_ITEM_DESC, "price": "1.99"}
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    expect(pointsAwarded).toEqual(constants.AWARD_POINTS_FOR_TIME_RANGE);
});


test('calculate points - morning receipt ', async() => {
    const receipt = {
        "retailer": "Walgreens",
        "purchaseDate": "2022-01-02",
        "purchaseTime": "08:13",
        "total": "2.65",
        "items": [
            {"shortDescription": "Pepsi - 12-oz", "price": "1.25"},
            {"shortDescription": "Dasani", "price": "1.40"}
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    const expected = 15; // 9 alphanum + 5 + (1.40 * 0.2 = 0.28 ~ 1) = 15
    expect(pointsAwarded).toEqual(expected);
});

test ('calculate points - simple receipt ', async() => {
    const receipt = {
        "retailer": "Target",
        "purchaseDate": "2022-01-02",
        "purchaseTime": "13:13",
        "total": "1.25",
        "items": [
            {"shortDescription": "Pepsi - 12-oz", "price": "1.25"}
        ]
    }

    const pointsAwarded = await processor.calculatePoints(receipt);
    const expected = 31; // 6 alphanum + 25 [tot/0.25] = 31
    expect(pointsAwarded).toEqual(expected);
});

test ('calc points with the example from README.md', async() => {
    const receipt = {
        "retailer": "Target",
        "purchaseDate": "2022-01-01",
        "purchaseTime": "13:01",
        "items": [
            {
                "shortDescription": "Mountain Dew 12PK",
                "price": "6.49"
            },{
                "shortDescription": "Emils Cheese Pizza",
                "price": "12.25"
            },{
                "shortDescription": "Knorr Creamy Chicken",
                "price": "1.26"
            },{
                "shortDescription": "Doritos Nacho Cheese",
                "price": "3.35"
            },{
                "shortDescription": "   Klarbrunn 12-PK 12 FL OZ  ",
                "price": "12.00"
            }
        ],
        "total": "35.35"
    };
    const pointsAwarded = await processor.calculatePoints(receipt);
    const expected = 28;
    expect(pointsAwarded).toEqual(expected);   
});