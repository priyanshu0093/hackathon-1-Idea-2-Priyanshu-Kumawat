import { cardsService } from './cards.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export async function getCatalogController(req, res, next) {
  try {
    const catalog = cardsService.getCatalog();
    return successResponse(res, catalog, {}, 200);
  } catch (err) {
    next(err);
  }
}

export async function getCardsController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await cardsService.getCards(userId);
    return successResponse(res, result, {}, 200);
  } catch (err) {
    next(err);
  }
}

export async function getCardByIdController(req, res, next) {
  try {
    const userId = req.user.id;
    const cardId = req.params.id;
    const card = await cardsService.getCardById(userId, cardId);
    return successResponse(res, card, {}, 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode, null, err.code || 'CARD_ERROR');
    }
    next(err);
  }
}

export async function addCardController(req, res, next) {
  try {
    const userId = req.user.id;
    const newCard = await cardsService.addCard(userId, req.body);
    return successResponse(res, newCard, {}, 201);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode, null, err.code || 'CARD_ERROR');
    }
    next(err);
  }
}

export async function updateCardController(req, res, next) {
  try {
    const userId = req.user.id;
    const cardId = req.params.id;
    const updated = await cardsService.updateCard(userId, cardId, req.body);
    return successResponse(res, updated, {}, 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode, null, err.code || 'CARD_ERROR');
    }
    next(err);
  }
}

export async function deleteCardController(req, res, next) {
  try {
    const userId = req.user.id;
    const cardId = req.params.id;
    const deleted = await cardsService.deleteCard(userId, cardId);
    return successResponse(res, { message: 'Card removed successfully from your wallet', id: deleted.id }, {}, 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(res, err.message, err.statusCode, null, err.code || 'CARD_ERROR');
    }
    next(err);
  }
}

export async function getCardForecastController(req, res, next) {
  try {
    const userId = req.user.id;
    const forecast = await cardsService.getCardForecast(userId);
    return successResponse(res, forecast, {}, 200);
  } catch (err) {
    next(err);
  }
}

export async function syncCardsToWalletController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await cardsService.syncCardsToWallet(userId);
    return successResponse(res, {
      message: `Successfully saved ${result.totalPointsSynced} points to your flight redemption wallet across ${result.syncedPrograms} programs!`,
      ...result,
    }, {}, 200);
  } catch (err) {
    next(err);
  }
}
