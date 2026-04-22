import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password, username } = req.body;
    console.error('the email received is: ' + email);

    // Check if email or password is missing
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: email },
      });

      if (user) {
        return res.status(409).json({ message: 'User Account Exists' });
      }

      // compare the elements.
      const newUser = await prisma.user.create({
        data: {
        email: email,
        name: username,
        password: password, // Store the hashed password
        },
      });
      // return
      return res.status(200).json({
      message: 'Login successful',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          notes: newUser.notes,
        },
      });
    } catch (error) {
      console.log("Error:", error.stack);
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}