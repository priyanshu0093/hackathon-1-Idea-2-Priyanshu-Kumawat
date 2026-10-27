import { forecastService } from './forecast.service.js';

export async function calculateForecastController(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const forecast = await forecastService.calculate(req.validatedBody || req.body, userId);
    res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveForecastController(req, res, next) {
  try {
    const saved = await forecastService.saveUserForecast(req.user.id, req.validatedBody || req.body);
    res.status(201).json({
      success: true,
      data: saved,
      message: 'Points forecast saved to user profile',
    });
  } catch (error) {
    next(error);
  }
}

export async function getSavedForecastController(req, res, next) {
  try {
    const saved = await forecastService.getSavedForecast(req.user.id);
    res.status(200).json({
      success: true,
      data: saved,
    });
  } catch (error) {
    next(error);
  }
}
