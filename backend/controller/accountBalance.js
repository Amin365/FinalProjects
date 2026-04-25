
import axios from "axios";
// import { generateAccessToken } from "./mpesaAuthcontroller.js";


import { getAccessToken } from "./mpesaAuthHelper.js";

export const accountBalance = async (req, res) => {
  try {
    const token = await getAccessToken(); // ✅ now token is string

    const payload = {
      Initiator: process.env.MPESA_INITIATOR,
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: "AccountBalance",
      PartyA: process.env.MPESA_SHORTCODE,
      IdentifierType: "4",
      Remarks: "Account balance query",
      QueueTimeOutURL: "https://subocularly-stringent-keeley.ngrok-free.dev/timeout",
      ResultURL: "https://subocularly-stringent-keeley.ngrok-free.dev/result",
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Account balance request sent",
      data: response.data,
    });
  } catch (error) {
    console.error("MPESA ACCOUNT BALANCE ERROR:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: "Failed to query account balance",
        data: error.response.data,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to query account balance",
        data: error.message,
      });
    }
  }
};




export const mpesaResult = (req, res) => {
  console.log("MPESA BALANCE RESULT 🔔");
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).send("OK");
};

export const mpesaTimeout = (req, res) => {
  console.log("MPESA TIMEOUT ⏱️");
  console.log(req.body);
  res.status(200).send("OK");
};

