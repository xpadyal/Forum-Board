import * as userService from '../service/user.service.js';

export const register = async (req, res, next) => {
    try {
      const { username, email, password, confirmPassword } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ 
          message: 'All fields are required' 
        });
      }
      
      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({ 
          message: 'Passwords do not match' 
        });
      }
      
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Password must be at least 6 characters long' 
        });
      }
      
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