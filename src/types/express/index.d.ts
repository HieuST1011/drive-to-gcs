import express from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      displayName: string;
      accessToken: string;
      refreshToken: string;
    }

    interface Request {
      user?: User; // Use the User interface here
    }
  }
}
