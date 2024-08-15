const express = require("express");
const router = express.Router();
const BuyOnEmi = require("../models/BuyOnEmi");

// Calculate EMI details
router.post("/calculate-emi", async (req, res) => {
  const {
    productId,
    price,
    downPayment,
    loanTerm,
    annualInterestRate,
    processingFee,
    gstPercentage,
    refurbished,
  } = req.body;

  try {
    const loanAmount = price - downPayment;
    const loanAmountWithFees = loanAmount + processingFee;
    const gstAmount = (loanAmountWithFees * gstPercentage) / 100;
    const totalLoanAmount = loanAmountWithFees + gstAmount;
    const monthlyInterestRate = annualInterestRate / 12 / 100;
    const numberOfMonths = loanTerm;

    const emi =
      (totalLoanAmount *
        monthlyInterestRate *
        Math.pow(1 + monthlyInterestRate, numberOfMonths)) /
      (Math.pow(1 + monthlyInterestRate, numberOfMonths) - 1);

    const emiDetails = [];
    for (let i = 1; i <= numberOfMonths; i++) {
      emiDetails.push({
        amount: emi.toFixed(2),
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + i)),
        status: "unpaid",
      });
    }

    const refurbishedLaptopCharge = refurbished ? (price * 18) / 100 : 0;

    res.json({
      emi: emi.toFixed(2),
      totalPayment: (emi * numberOfMonths + parseInt(downPayment)).toFixed(2),
      refurbishedLaptopCharge,
      emiDetails,
    });
  } catch (error) {
    res.status(500).json({ error: "Error calculating EMI" });
  }
});

// Get active EMIs for a user
router.get("/active/:userId", async (req, res) => {
  try {
    const buyOnEmiRecords = await BuyOnEmi.find({
      userId: req.params.userId,
      "emiDetails.status": "unpaid",
    }).populate("productId");

    const activeEmis = buyOnEmiRecords.reduce((acc, record) => {
      const pendingEmis = record.emiDetails.filter(
        (emi) => emi.status === "unpaid"
      );
      pendingEmis.forEach((emi) => {
        acc.push({
          ...emi._doc,
          product: record.productId,
        });
      });
      return acc;
    }, []);

    res.json(activeEmis);
  } catch (error) {
    res.status(500).json({ error: "Error fetching active EMIs" });
  }
});

// Get paid EMIs for a user
router.get("/paid/:userId", async (req, res) => {
  try {
    const buyOnEmiRecords = await BuyOnEmi.find({
      userId: req.params.userId,
      "emiDetails.status": "paid",
    }).populate("productId");

    const paidEmis = buyOnEmiRecords.reduce((acc, record) => {
      const completedEmis = record.emiDetails.filter(
        (emi) => emi.status === "paid"
      );
      completedEmis.forEach((emi) => {
        acc.push({
          ...emi._doc,
          product: record.productId,
        });
      });
      return acc;
    }, []);

    res.json(paidEmis);
  } catch (error) {
    res.status(500).json({ error: "Error fetching paid EMIs" });
  }
});
// router.post("/pay-emi", async (req, res) => {
//   const { userId, emiId } = req.body;

//   try {
//     const buyOnEmiRecord = await BuyOnEmi.findOne({
//       userId,
//       "emiDetails._id": emiId,
//     });
//     if (buyOnEmiRecord) {
//       const emiDetail = buyOnEmiRecord.emiDetails.id(emiId);
//       if (emiDetail.status === "unpaid") {
//         emiDetail.status = "paid";
//         await buyOnEmiRecord.save();
//         return res.json({ success: true, message: "EMI paid successfully" });
//       } else {
//         return res
//           .status(400)
//           .json({ success: false, message: "EMI already paid" });
//       }
//     } else {
//       return res.status(404).json({ success: false, message: "EMI not found" });
//     }
//   } catch (error) {
//     res.status(500).json({ error: "Error updating EMI payment status" });
//   }
// });

router.post("/pay-emi", async (req, res) => {
    const { userId, emiId } = req.body;
  
    try {
      // Find the BuyOnEmi record with the specific userId and emiId
      const buyOnEmiRecord = await BuyOnEmi.findOne({
        userId,
        "emiDetails._id": emiId,
      });
  
      if (buyOnEmiRecord) {
        const emiDetail = buyOnEmiRecord.emiDetails.id(emiId);
        if (emiDetail.status === "unpaid") {
          emiDetail.status = "paid";
  
          // Check if all EMIs are paid
          const allEmisPaid = buyOnEmiRecord.emiDetails.every(
            (emi) => emi.status === "paid"
          );
  
          // If all EMIs are paid, update the overall status to "completed"
          if (allEmisPaid) {
            buyOnEmiRecord.status = "completed";
          }
  
          await buyOnEmiRecord.save();
          return res.json({ success: true, message: "EMI paid successfully" });
        } else {
          return res
            .status(400)
            .json({ success: false, message: "EMI already paid" });
        }
      } else {
        return res.status(404).json({ success: false, message: "EMI not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error updating EMI payment status" });
    }
  });
  

router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch all EMI records for the given user
    const emiRecords = await BuyOnEmi.find({ userId }).populate("productId");

    // Prepare the response structure
    const allEmis = emiRecords.map((record) => {
      return {
        ...record._doc,
        product: record.productId,
      };
    });

    res.json(allEmis);
  } catch (error) {
    console.error("Error fetching all EMIs:", error);
    res.status(500).json({ error: "Error fetching all EMIs" });
  }
});

//   router.get('/:userId', async (req, res) => {
//     try {
//       // Fetch all BuyOnEmi records for the user
//       const buyOnEmiRecords = await BuyOnEmi.find({
//         userId: req.params.userId,
//         status: 'pending', // Only fetch records with status 'pending'
//       }).populate('productId');

//       // Separate active (unpaid) and paid EMIs
//       const allEmis = {
//         activeEmis: [],
//         paidEmis: []
//       };

//       buyOnEmiRecords.forEach(record => {
//         record.emiDetails.forEach(emi => {
//           const emiData = {
//             ...emi._doc,
//             product: record.productId,
//             totalLoanAmount: record.totalLoanAmount,
//             loanTerm: record.loanTerm,
//             annualInterestRate: record.annualInterestRate,
//             downPayment: record.downPayment,
//             processingFee: record.processingFee,
//             gstPercentage: record.gstPercentage
//           };

//           if (emi.status === 'unpaid') {
//             allEmis.activeEmis.push(emiData);
//           } else if (emi.status === 'paid') {
//             allEmis.paidEmis.push(emiData);
//           }
//         });
//       });

//       res.json(allEmis);
//     } catch (error) {
//       res.status(500).json({ error: 'Error fetching all EMIs' });
//     }
//   });

module.exports = router;
