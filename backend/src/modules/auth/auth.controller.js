import { authService } from './auth.service.js';

export async function signupController(req, res, next) {
  try {
    const { user, token } = await authService.signup(req.validatedBody || req.body);
    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const { user, token } = await authService.login(req.validatedBody || req.body);
    res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'Logged in successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMeController(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req, res) {
  // Stateless JWT tokens are cleared client-side
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
