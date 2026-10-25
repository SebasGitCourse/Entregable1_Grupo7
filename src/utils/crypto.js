import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');

    const hash = await scryptAsync(password, salt, 64);

    return `${salt}:${hash.toString('hex')}`;
}
