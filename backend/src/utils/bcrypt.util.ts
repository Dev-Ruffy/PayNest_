import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const hashValue = (value: string) => bcrypt.hash(value, SALT_ROUNDS);
export const compareValue = (value: string, hash: string) => bcrypt.compare(value, hash);
