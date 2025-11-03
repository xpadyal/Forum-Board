import * as userService from '../service/user.service.js';

export const register = async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const user = await userService.registerUser(username, email, password);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  export const login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const data = await userService.loginUser(email, password);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };