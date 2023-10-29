// utils/responseHandler.js

const sendResponse = (res, statusCode, data = null, error = null) => {
    if (data && error) {
        console.error("Response utility shouldn't be used with both data and error. Choose one.");
        return res.status(500).json({ error: "Internal Server Error" });
    }

    if (data) {
        return res.status(statusCode).json({ data });
    }

    if (error) {
        return res.status(statusCode).json({ error });
    }

    return res.status(statusCode).send();
};

module.exports = sendResponse;
