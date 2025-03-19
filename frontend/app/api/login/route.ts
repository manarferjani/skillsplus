import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User'; 
import { connectDB } from '@/lib/'; 

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Validation des entrées
  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Générer un token JWT
    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET!, // Assurez-vous que JWT_SECRET est défini dans .env.local
      { expiresIn: '1h' }
    );

    // Renvoyer le token dans un cookie sécurisé
    const response = NextResponse.json(
      { message: 'Login successful' },
      { status: 200 }
    );
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Cookie sécurisé en production
      sameSite: 'strict',
      maxAge: 3600, // 1 heure
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}