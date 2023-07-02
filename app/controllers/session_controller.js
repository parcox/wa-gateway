const { config } = require("dotenv");
const { toDataURL } = require("qrcode");
const whatsapp = require("wa-multi-session");
const ValidationError = require("../../utils/error");
const {
  responseSuccessWithMessage,
  responseSuccessWithData,
} = require("../../utils/response");

config();

const MODIFY_SESSION_KEY = process.env.MODIFY_SESSION_KEY;

exports.createSession = async (req, res, next) => {
  try {
    const scan = req.query.scan;
    const sessionName =
      req.body.session || req.query.session || req.headers.session;
    if (!sessionName) {
      throw new Error("Bad Request");
    }
    const key = req.body.key || req.query.key || req.headers.key;
    if (!key || key != MODIFY_SESSION_KEY) {
      throw new ValidationError("Invalid key");
    }
    whatsapp.onQRUpdated(async (data) => {
      if (res && !res.headersSent) {
        const qr = await toDataURL(data.qr);
        if (scan && data.sessionId == sessionName) {
          res.render("scan", { qr: qr });
        } else {
          res.status(200).json(
            responseSuccessWithData({
              qr: qr,
            })
          );
        }
      }
    });
    await whatsapp.startSession(sessionName, { printQR: true });
  } catch (error) {
    next(error);
  }
};
exports.deleteSession = async (req, res, next) => {
  try {
    const sessionName =
      req.body.session || req.query.session || req.headers.session;
    if (!sessionName) {
      throw new ValidationError("session Required");
    }
    const key = req.body.key || req.query.key || req.headers.key;
    if (!key || key != MODIFY_SESSION_KEY) {
      throw new ValidationError("Invalid key");
    }
    whatsapp.deleteSession(sessionName);
    res
      .status(200)
      .json(responseSuccessWithMessage("Success Deleted " + sessionName));
  } catch (error) {
    next(error);
  }
};
