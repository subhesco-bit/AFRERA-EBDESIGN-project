/**
 * Real backend routes for WalletPage.jsx and BankPassportPage.jsx, backed
 * by services/walletService.js.
 *
 * The page operates in terms of "my wallet"/"the recipient", but the real
 * service's addFunds/deductFunds/transferFunds/getTransactionHistory take a
 * wallet_id, a separate DB id from user_id. getBalance(userId) resolves
 * (and auto-creates) that wallet, so every route here resolves the
 * relevant wallet_id via getBalance before calling the real operation -
 * composing two real calls, not inventing new service behavior.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/walletService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/wallet', wrap((req) => svc.getBalance(req.user.id)));

router.post('/wallet/deposit', wrap(async (req) => {
  const wallet = await svc.getBalance(req.user.id);
  return svc.addFunds(wallet.wallet_id, { amount: req.body.amount, source: req.body.paymentMethod, description: 'Deposit' });
}));

router.post('/wallet/withdraw', wrap(async (req) => {
  const wallet = await svc.getBalance(req.user.id);
  return svc.deductFunds(wallet.wallet_id, req.body.amount, req.body.bankAccount ? `Withdrawal to ${req.body.bankAccount}` : 'Withdrawal');
}));

router.post('/wallet/transfer', wrap(async (req) => {
  const fromWallet = await svc.getBalance(req.user.id);
  const toWallet = await svc.getBalance(req.body.recipientId);
  return svc.transferFunds(fromWallet.wallet_id, toWallet.wallet_id, req.body.amount, req.body.description);
}));

router.get('/wallet/transactions', wrap(async (req) => {
  const wallet = await svc.getBalance(req.user.id);
  return svc.getTransactionHistory(wallet.wallet_id, req.query);
}));

module.exports = router;
