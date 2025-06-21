import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string(),
  lastName: z.string(),
});

export function registerAuthRoutes(app: Express) {
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // @ts-ignore
      req.session.userId = user.id;
      res.json({ message: "Logged in successfully", user });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = signupSchema.parse(req.body);
      let existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const newUser = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        role: email.endsWith('@admin.com') ? 'admin' : 'user',
      });

      res.status(201).json({ message: "User created successfully", user: newUser });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/logout', (req, res) => {
    // @ts-ignore
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
  });
}