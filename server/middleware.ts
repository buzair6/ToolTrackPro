import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    // @ts-ignore
    if (req.session && req.session.userId) {
        return next();
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
}