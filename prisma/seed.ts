import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
const prisma = new PrismaClient();
async function main() {
  const password = randomBytes(10).toString('hex');
  const salt = bcrypt.genSaltSync(5);
  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: hashedPassword,
      },
      create: {
        username: 'admin',
        admin: true,
        password: hashedPassword,
      },
    });
    console.log('Admin created');
    console.log('Username: admin');
    console.log('Password: ' + password);
  } catch (e) {
    console.log('Cannot created admin user');
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
