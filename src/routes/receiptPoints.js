const db = require('../persistence');
const processor = require('../points/pointsCalculation');
const util = require('../util/util');

module.exports = async (req, res) => {
    if( util.isString(req.params.id) ) {
        const id = req.params.id;
        const receipt = await db.getReceipt(id);
        if( receipt == null ) {
            sendBadRequest(res);
        } else {
            if( receipt.points == null ) {
                const points = await processor.calculatePoints(receipt);
                await db.updateReceiptPoints(id, points);
                res.send({points});
            } else {
                res.send({points: receipt.points});
            }
        }
    } else {
        sendBadRequest(res);
    }
};

function sendBadRequest(res) {
    res.send(400, 'No receipt found for that ID.');
}
