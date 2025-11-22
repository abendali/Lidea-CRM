import { hashPassword } from '../server/auth.js';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function createUsers() {
  try {
    console.log('Updating user 1: Alaaeddine...');
    const user1Password = await hashPassword('hitman47');
    const updated1 = await db.update(users)
      .set({
        password: user1Password,
        role: 'Admin' as const,
      })
      .where(eq(users.username, 'Alaa'))
      .returning();
    console.log('Updated user 1:', updated1[0]);

    console.log('\nCreating user 2: Youcef...');
    const user2 = {
      username: 'lideadz',
      email: 'lidea.dz@gmail.com',
      password: await hashPassword('Lidea@@2025'),
      name: 'Youcef',
      role: 'Store Manager' as const,
      profilePicture: null,
    };

    const result2 = await db.insert(users).values(user2).returning();
    console.log('Created user 2:', result2[0]);

    console.log('\nUsers processed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error processing users:', error.message);
    process.exit(1);
  }
}

createUsers();
