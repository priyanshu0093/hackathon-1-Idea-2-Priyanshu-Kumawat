import { walletService } from './wallet.service.js';

export async function getWalletController(req, res, next) {
  try {
    const wallet = await walletService.getWallet(req.user.id);
    res.status(200).json({
      success: true,
      data: wallet,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveBalanceController(req, res, next) {
  try {
    const saved = await walletService.saveBalance(req.user.id, req.validatedBody || req.body);
    res.status(201).json({
      success: true,
      data: saved,
      message: 'Loyalty balance updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBalanceController(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await walletService.deleteBalance(req.user.id, id);
    res.status(200).json({
      success: true,
      data: deleted,
      message: 'Loyalty balance removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
