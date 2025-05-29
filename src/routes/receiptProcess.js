const db = require('../persistence');
const {v4 : uuid, validate} = require('uuid');
const util = require('../util/util');

module.exports = async (req, res) => {
    const reqBody = req.body;
    if(reqBody === null || isEmptyObject(reqBody)) {
        sendBadRequest(res);
        return;
    }
    const validators = [
        {'name': 'retailer', 'validator': validateRetailer}, 
        {'name': 'purchaseDate', 'validator': validatePurchaseDate}, 
        {'name': 'purchaseTime', 'validator': validatePurchaseTime}, 
        {'name': 'items', 'validator': validateItems}, 
        {'name': 'total', 'validator': validateTotal}
    ];
    for( const validator of validators ) {
        if(!reqBody.hasOwnProperty(validator.name)) {
            sendBadRequest(res);
            return;
        }
        if( !validator.validator(reqBody[validator.name]) ) {
            sendBadRequest(res);
            return;
        }
    }
    const purchaseDate = util.parseAsISOLocal(reqBody.purchaseDate, reqBody.purchaseTime).toISOString();
    const item = {
        id: uuid(),
        retailer: reqBody.retailer,
        purchaseDate: purchaseDate,
        items: reqBody.items,
        total: reqBody.total
    };

    await db.storeReceipt(item);
    const responseBody = {
        id: item.id
    }
    res.send(responseBody);
};
const timeRegex = /^([0,1]\d|2[0-3]):([0-5]\d)$/;
const priceRegex = /^\d+\.\d{2}$/;
const retailerRegex = /^[\w\s\-&]+$/;
const dateRegex = /^\d{4}-(0\d|1[0-2])-([0-2]\d|31)$/;

function sendBadRequest(res) {
    res.send(400, 'The receipt is invalid.');
}

function isEmptyObject(obj) {
    for (const prop in obj) {
        if( !Object.hasOwn(obj, prop) ) {
            return true;
        }
    }
    return false;
}

function validateRequiredFields(required, data) {
    for (const key in required) {
        const prop = required[key];
        if(!Object.hasOwn(data, prop)) {
            return false;
        }
    }
    return true;
}

function validateRetailer(retailer) {
    if( !util.isString(retailer) ) {
        return false;
    }
    if( !retailerRegex.test(retailer) ) {
        return false;
    }
    return true;
}
function validatePurchaseDate(purchaseDate) {
    if( !util.isString(purchaseDate) ) {
        return false;
    }
    // validate date format
    if( !dateRegex.test(purchaseDate) ) {
        return false;
    }
    return true;
}

function validatePurchaseTime(purchaseTime) {
    if( !util.isString(purchaseTime) ) {
        return false;
    }
    // validate time format
    if( !timeRegex.test(purchaseTime) ) {
        return false;
    }
    return true;
}

function validateItems(items) {
    if( !Array.isArray(items) || items.length === 0 ) {
        return false;
    }

    for( const item of items ) {
        if( !validateRequiredFields(['shortDescription', 'price'], item) ) {
            return false;
        }
        const shortDescriptionRegex = /^[\w\s\-]+$/;
        if( !shortDescriptionRegex.test(item.shortDescription) ) {
            return false;
        }
        if( !priceRegex.test(item.price) ) {
            return false;
        }
    }
    return true;
}

function validateTotal(total) {
    if( !priceRegex.test(total) ) {
        return false;
    }
    return true;
}